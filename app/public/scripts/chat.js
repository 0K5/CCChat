//let me = {};
//me.avatar = "https://lh6.googleusercontent.com/-lr2nyjhhjXw/AAAAAAAAAAI/AAAAAAAARmE/MdtfUmC0M4s/photo.jpg?sz=48";
//
//let you = {};
//you.avatar = "https://a11.t26.net/taringa/avatares/9/1/2/F/7/8/Demon_King1/48x48_5C5.jpg";

$(document).ready(function(){
    let baseUrl = window.location.protocol + '//' + window.location.host + '/';
    let socket = io.connect(baseUrl,{transports: ['websocket'], upgrade: false});
	let actUser = undefined;

    function appendMessage(message) {
        let text = message.text || '',
            media = message.media || '',
            timestamp = message.timestamp || '',
            origin = message.origin || '',
			isReceiver = message.isReceiver || '';
        let content = '<li style="width:100%;">';
        content += isReceiver ? '<div class="msj macro">' : '<div class="msj-rta macro">';
        content += isReceiver ? '<div class="text text-l">' : '<div class="text text-r"';
        content += text ? '<p class="msgText">' + text + '</p>' : '';
        content += media ? '<div class="msgPic" ><img class="img-thumbnail" style="width:100%;" src="' + media + '" /></div>' : '';
        content += isReceiver ? '<p class="msgUser"><small>' + origin + '</small></p>' : '';
        content += '<p class="msgDate"><small>' + timestamp + '</small></p>';
        content += '</div></div></li>';
        $("#msgs").append(content).scrollTop($("#msgs").prop('scrollHeight'));
    }

    function appendChat(chat) {
        let name = chat.name || '',
			token = chat.token || '',
			notification = chat.notification || '';
        let content = '<li style="width:100%">' +
            '<div class="msj macro chat" ';
        content += token ? 'id="' + token + '">' : '>';
        content += '<div class="text text-l';
        content += name ? '<p class="cntName">' + name + '</p>' : '';
        content += '<p class="notification"><small>' + notification + '</small></p>';
        content += '</div></div></li>';
        $("#chats").append(content).scrollTop($("#chats").prop('scrollHeight'));
    }

    function appendContact(contact) {
        let name = contact.name || '',
            lastOnline = contact.lastOnline || '';
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
		$('#contacts').find('#'+data.token).find('.notification').val('');
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
		appendContact(data);
	});

	socket.on('newChat', function(data) {
		appendChat(data.chat);
	});
	
	function messageNotification(token){
		let notification = $('#contacts').find('#'+token).find('.notification');
		let current = parseInt((notification.val()||'0'));
		notification.val(++current);
	}
	
    socket.on('message', function(chat) {
		console.log(JSON.stringify(chat));
		if($('#tokenChat').val() === chat.token){
			appendMessage(chat);
		}else{
			messageNotification(chat.token);
		}
    });

    $(document).on('click', '#sendMsg', function(e) {
        let text = $('#msgInput').val(),
			token = $('#tokenChat').val();
        if (text) {
            socket.emit('message', {
				token: token,
                text: text
            });
            $('#msgInput').val('');
		}
    });

    $('#msgInput').keyup((event) => {
        if (event.keyCode === 13) {
            sendMsg();
        }
    });

	$(document).on('click', '.chat', function(e) {
		let token = e.target.closest(".chat").id
        socket.emit('openChat', {
			token : token 
        });
	});

	$(document).on('click', '.contact', function(e) {
		let contact = e.target.closest(".contact").id
        socket.emit('openChat', {
			contact : contact 
        });
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
