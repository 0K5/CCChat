//let me = {};
//me.avatar = "https://lh6.googleusercontent.com/-lr2nyjhhjXw/AAAAAAAAAAI/AAAAAAAARmE/MdtfUmC0M4s/photo.jpg?sz=48";
//
//let you = {};
//you.avatar = "https://a11.t26.net/taringa/avatares/9/1/2/F/7/8/Demon_King1/48x48_5C5.jpg";

$(document).ready(function() {
    let baseUrl = window.location.protocol + '//' + window.location.host + '/';
    let socket = io.connect(baseUrl, {
        transports: ['websocket'],
        upgrade: false
    });
	let chat = [];
	let contacts = [];
	let dateOptions = {
		weekday: 'long', 
		year: 'numeric', 
		month: 'numeric', 
		day: 'numeric',
		hour12: false,
		hour: 'numeric',
		minute: 'numeric'
	}

    function appendMessage(message) {
        let text = message.text || '',
            media = message.media || '',
            timestamp = message.timestamp || '',
            origin = message.origin || '',
            isReceiver = message.isReceiver || '';
        let content = '<li style="width:100%;">';
		if(message.origin){
			content += isReceiver ? '<div class="msj macro">' : '<div class="msj-rta macro">';
			content += isReceiver ? '<div class="text text-l">' : '<div class="text text-r"';
        	content += text ? '<p class="msgText">' + text + '</p>' : '';
        	content += media ? '<div class="msgPic" ><img class="img-thumbnail" style="width:100%;" src="' + media + '" /></div>' : '';
        	content += isReceiver ? '<p class="msgUser"><small>' + origin + '</small></p>' : '';
        	content += '<p class="msgDate"><small>' + timestamp + '</small></p>';
		}else{
			content += '<div class="ntf macro">';
			content += '<div class="text text-m">';
			content += '<p class="ntfText"><small>' + text + '</small></p>';
        	content += '<p class="msgDate"><small>' + timestamp + '</small></p>';
		}
        content += '</div></div></li>';
        $("#msgs").append(content).scrollTop($("#msgs").prop('scrollHeight'));
    }

    function appendChat(chat) {
        let name = chat.name || '',
            token = chat.token || '',
            notification = chat.notification || '';
        if (token && name) {
            let content = '<li style="width:100%">' +
                '<div class="msj macro chat" ';
            content += 'id="' + token + '">';
            content += '<div class="text text-l';
            content += '<p class="cntName">' + name + '</p>';
            content += '<p class="notification"><small>' + notification + '</small></p>';
            content += '</div></div></li>';
            $("#chats").append(content).scrollTop($("#chats").prop('scrollHeight'));
        }
    }

    function appendContact(contact, containerId, withCheckbox) {
        let name = contact.name || '',
            lastLogin = contact.lastLogin || '';
        if (name) {
            let content = '<li style="width:100%">' +
                '<div class="msj macro contact" ';
            content += 'id="' + name + '">';
            content += '<div class="text text-l';
            content += '<p class="cntName">' + name + '</p>';
            content += lastLogin ? '<p class="lastOnline"><small>' + lastLogin + '</small></p>' : '';
            content += '</div>';
			if(withCheckbox){
				content += '<div class="groupAdd cccButton">';
				content += '<input type="checkbox" class="form-check-input groupAddCheckbox" id="' + name + '"></div>';
			}
            content += '</li>';
            $("#"+containerId).append(content).scrollTop($("#"+containerId).prop('scrollHeight'));
        }
    }

    socket.on('loadChat', function(data) {
        $('#msgs').empty();
        let chat = data.chat;
        $('#contacts').find('#' + data.token).find('.notification').val('');
        $('#chatName').text(chat.name);
        $('#tokenChat').val(chat.token);
		$("#msgInput").show();
		$("#sendMedia").show();
		$("#sendMsg").show();
		if(chat.isGroup){
			$("#addToGrp").show();
			$("#infoGrp").show();
		}else{
			$("#addToGrp").hide();
			$("#infoGrp").hide();
		}
		if (chat.messages) {
            chat.messages.forEach((msg) => {
                appendMessage(msg);
            });
        }
    });

    socket.on('allChats', function(data) {
        $('#chats').empty();
        chats = data.chats;
        chats.forEach((chat) => {
            appendChat(chat);
        });
    });

    socket.on('allContacts', function(data) {
        $('#contacts').empty();
        contacts = data.contacts;
        contacts.forEach((contact) => {
            appendContact(contact, 'contacts', false);
        });
    });

    socket.on('newContact', function(data) {
		contacts.push(data.contact);
        appendContact(data.contact, 'contacts', false);
    });

    socket.on('newChat', function(data) {
		chats.push(data.chat);
        appendChat(data.chat);
    });

	function infoModal(title, message){
		$('#modalInfo-title').html(title);
		$('#modalInfo-message').html(message);
		$('#infoModal').modal('show');
	}


    function messageNotification(token) {
        let notification = $('#contacts').find('#' + token).find('.notification');
        let current = parseInt((notification.val() || '0'));
        notification.val(++current);
    }

    socket.on('message', function(chat) {
        if ($('#tokenChat').val() === chat.token) {
            appendMessage(chat);
        } else {
            messageNotification(chat.token);
        }
    });

	function sendMsg(){
        let text = $('#msgInput').val(),
            token = $('#tokenChat').val();
        appendMessage({
			text: text,
			timestamp: (new Date()).toLocaleString('de-DE', dateOptions),
			origin: true
		});
        if (text) {
            socket.emit('message', {
                token: token,
                text: text
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

    $(document).on('click', '.chat', function(e) {
        let token = e.target.closest(".chat").id
        socket.emit('openChat', {
            token: token
        });
    });

    $(document).on('click', '.contact', function(e) {
        let contact = e.target.closest(".contact").id
		if(e.target.class !== 'groupAdd' && !e.target.closest(".groupAdd")){
			socket.emit('openChat', {
        	    contact: contact
        	});
		}
    });

    $(document).on('click', '#sendMedia', function(e) {
        window.dialog.openFileDialog(function(res) {
            socket.emit('file', res);
        });
    });

	socket.on('addToGrp', function(data) {
		appendMessage(data.msg);
	});

	socket.on('infoGroup', function(data) {
		infoModal('Groupmembers of Groupchat ' + data.name, data.info);
	});

	$(document).on('click', '#createGrp', function(e) {
		if(!$('#addGrpInput').val()){
			infoModal('Information','Groupname cannot be empty, please type in a group name');
		}else{
			$('#modalList').empty();
			$('#modalHidden').val('createGrp');
			for(ci in contacts){
				appendContact(contacts[ci], 'modalList', true);
			}
			$('#chatModal').modal('show');
		}
	});

	$(document).on('click', '#infoGrp', function(e) {
		socket.emit('infoGroup',{
			token: $('#tokenChat').val()
		});
	});

	$(document).on('click', '#addToGrp', function(e) {
		$('#modalList').empty();
		$('#modalHidden').val('addToGrp');
		for(ci in contacts){
			appendContact(contacts[ci], 'modalList', true);
		}
		$('#chatModal').modal('show');
	});

	function groupAdd(emitEvent){
		let allCheckboxes = $('#modalList').find('.groupAddCheckbox');
		let grpContacts = [];
		for(c in allCheckboxes){
			if(allCheckboxes[c].checked){
				grpContacts.push(allCheckboxes[c].id);
			}
		}
		socket.emit(emitEvent, {
			name: emitEvent === 'group' ? $('#addGrpInput').val() : '',
			token: emitEvent === 'addToGrp' ? $('#tokenChat').val() : '',
			participants: grpContacts
		});
		$('#chatModal').modal('hide');
		$('#modalList').empty();
		$('#addGrpInput').val('');
	}

	$(document).on('click', '#modal-save', function(e) {
		if($('#modalHidden').val() === 'createGrp'){
			groupAdd('group');
		}else if($('#modalHidden').val() === 'addToGrp'){
			groupAdd('addToGrp');
		}
	});

    socket.on('logout', function() {
		window.location = baseUrl + 'login';
    });
	
	$(document).on('click', '#logout', function(e) {
		socket.emit('logout');
	});

    socket.on('connect', function() {
        socket.emit('init');
        socket.on('disconnect', function() {
			window.location = baseUrl + 'login';
        });
    });

	$("#msgGroupActions").addClass('hidden');
});
