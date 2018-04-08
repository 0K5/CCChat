//let me = {};
//me.avatar = "https://lh6.googleusercontent.com/-lr2nyjhhjXw/AAAAAAAAAAI/AAAAAAAARmE/MdtfUmC0M4s/photo.jpg?sz=48";
//
//let you = {};
//you.avatar = "https://a11.t26.net/taringa/avatares/9/1/2/F/7/8/Demon_King1/48x48_5C5.jpg";

$(document).ready(function(){
    let baseUrl = window.location.protocol + '//' + window.location.host + '/';
    let socket = io.connect(baseUrl,{transports: ['websocket'], upgrade: false});

    function appendMessage(message) {
        let text = message.text || null,
            media = message.media || null,
            date = message.date || null,
            user = message.user || null;
        let content = '<li style="width:100%;">';
        content += user ? '<div class="msj macro">' : '<div class="msj-rta macro">';
        content += user ? '<div class="text text-l">' : '<div class="text text-r"';
        content += text ? '<p class="msgText">' + text + '</p>' : '';
        content += media ? '<div class="msgPic" ><img class="img-thumbnail" style="width:100%;" src="' + media + '" /></div>' : '';
        content += user ? '<p class="msgUser"><small>' + user + '</small></p>' : '';
        content += '<p class="msgDate"><small>' + date + '</small></p>';
        content += '</div></div></li>';
        $("#msgs").append(content).scrollTop($("#msgs").prop('scrollHeight'));
    }

    function appendChat(chat) {
        let name = chat.name || null,
			token = chat.token || null;
        let content = '<li style="width:100%">' +
            '<div class="msj macro chat" ';
        content += token ? 'id="' + token + '">' : '>';
        content += '<div class="text text-l';
        content += name ? '<p class="cntName">' + name + '</p>' : '';
        content += '</div></div></li>';
        $("#chats").append(content).scrollTop($("#chats").prop('scrollHeight'));
    }

    function appendContact(contact) {
        let name = contact.name || null,
            lastOnline = contact.lastOnline || null;
        let content = '<li style="width:100%">' +
            '<div class="msj macro contact" ';
        content += 'id="' + name + '">';
        content += '<div class="text text-l';
        content += name ? '<p class="cntName">' + name + '</p>' : '';
        content += lastOnline ? '<p class="lastOnline"><small>' + lastOnline + '</small></p>' : '';
        content += '</div></div></li>';
        $("#contacts").append(content).scrollTop($("#contacts").prop('scrollHeight'));
    }


    socket.on('loadChat', function(data) {
		$('#msgs').empty();
		let chat = data.chat;
		$('#chatName').text(chat.name);
		$('#tokenChat').val(chat.token);
		if(chat.messages){
			chat.messages.forEach((msg) => {
        	    appendMessage(msg);
        	});
		}
    });

    socket.on('allChats', function(data) {
		$('#chats').empty();
        let chats = data.chats;
        console.log(JSON.stringify(chats));
        chats.forEach((chat) => {
            appendChat(chat);
        });
    });

    socket.on('allContacts', function(data) {
		$('#contacts').empty();
        let contacts = data.contacts;
        contacts.forEach((contact) => {
            appendContact(contact);
        });
    });

	socket.on('newContact', function(data) {
		appendContact(data.contact);
	});

	socket.on('newChat', function(data) {
		appendChat(data.chat);
	});

    socket.on('message', function(data) {
		if(isActiveChat(data.chat)){
			appendMessage(msg);
		}else{
			messageNotification(data);
		}
    });
	

    function sendMsg() {
        let text = $('#msgInput').val();
        if (text) {
            socket.emit('message', {
                text: text,
                date: new Date()
            });
            $('#msgInput').val('');
        }
    }

    $(document).on('click', '#sendMsg', function(e) {
        sendMsg();
    });

    $('#msgInput').keyup((event) => {
        if (event.keyCode === 13) {
            sendMsg();
        }
    });

    function openChat(contacts) {
        socket.emit('openChat', {
            users: contacts
        });
    }

	$(document).on('click', '.chat', function(e) {
		openChat(e.target.id);
	});

	$(document).on('click', '.contact', function(e) {
		let c = [];
		let contact = e.target.closest(".contact").id
		console.log(contact);
		c.push(contact);
		openChat(c);
	});

    $(document).on('click', '#sendMedia', function(e) {
        window.dialog.openFileDialog(function(res) {
            socket.emit('file', res);
        });
    });

	socket.on('connect', function(){
		socket.emit('init');
		socket.on('disconnect',function(){
			setTimeout(function(){
				window.location = baseUrl + 'login';
			},10000);
		});
	});
});
