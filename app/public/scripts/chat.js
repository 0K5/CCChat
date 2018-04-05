//let me = {};
//me.avatar = "https://lh6.googleusercontent.com/-lr2nyjhhjXw/AAAAAAAAAAI/AAAAAAAARmE/MdtfUmC0M4s/photo.jpg?sz=48";
//
//let you = {};
//you.avatar = "https://a11.t26.net/taringa/avatares/9/1/2/F/7/8/Demon_King1/48x48_5C5.jpg";

//-- No use time. It is a javaScript effect.
let baseUrl = window.location.protocol + '//' + window.location.host + '/';
let socket = io.connect(baseUrl);

function appendMessage(message){
	let text = message.text || null, 
		media = message.media || null,
		date = message.date || null,
		user = message.user || null;
    let content = '<li style="width:100%;">';
    content += user ? '<div class="msj macro">':'<div class="msj-rta macro">';
	content += user ?  '<div class="text text-l">' : '<div class="text text-r"';
	content += text ? '<p class="msgText">' + text + '</p>'  : '';
	content += media ? '<div class="msgPic" ><img class="img-thumbnail" style="width:100%;" src="'+media+'" /></div>' : '';
	content += user ? '<p class="msgUser"><small>' + user + '</small></p>' : '';
	content += '<p class="msgDate"><small>' + date + '</small></p>';
	content += '</div></div></li>';
    $("#msgs").append(content).scrollTop($("#msgs").prop('scrollHeight'));
}

function appendChat(chat){
	let contact = chat.contact || null,
		group = chat.group || null;
    let content = '<li style="width:100%">' +
        '<div class="msj macro"';
	content += contact ? 'onclick="openChat(\''+contact+'\')">' : 'onclick="openChat(\''+group+'\')">'; 
    content += '<div class="text text-l';
	content += contact ? '<p class="cntName">' + contact + '</p>' : '';
	content += group ? '<p class="grpName">' + group + '</p>' : '';
	content += '</div></div></li>';
    $("#chats").append(content).scrollTop($("#chats").prop('scrollHeight'));
}

function appendContact(contact){
	let name = contact.name || null,
		lastOnline = contact.lastOnline || null;
    let content = '<li style="width:100%">' +
        '<div class="msj macro"';
	content += 'onclick="openChat(\''+name+'\')">';
    content += '<div class="text text-l';
	content += name ? '<p class="cntName">' + name + '</p>' : '';
	content += lastOnline ? '<p class="lastOnline"><small>' + lastOnline + '</small></p>' : '' ;
	content += '</div></div></li>';
    $("#contacts").append(content).scrollTop($("#contacts").prop('scrollHeight'));
}

function openChat(name){
	socket.emit('openChat', {chat: name});
}

socket.on('message', function(data){
	appendMessage(msg);
});

socket.on('loadChat', function(data){
	let messages = data.messages;
	messages.forEach((msg) => {
		appendMessage(msg);
	});
});

socket.on('allChats', function(data){
	let chats = data.chats;
	console.log(JSON.stringify(chats));
	chats.forEach((chat) => {
		appendChat(chat);
	});
});

socket.on('allContacts', function(data){
	let contacts = data.contacts;
	contacts.forEach((contact) => {
		appendContact(contact);
	});
});

function sendMsg(){
    let text = $('#msgInput').val();
    if (text) {
		appendMessage({text: text, date: new Date()});
		socket.emit('message', {text: text, date: new Date()});
        $('#msgInput').val('');
    }
}

$(document).on('click', '#sendMsg', function(e) {
	sendMsg();
});

$('#msgInput').keyup((event) => {
	if(event.keyCode === 13){
		sendMsg();
	}
});

$(document).on('click', '#sendMedia', function(e) {
	window.dialog.openFileDialog(function(res){
		appendMessage({media: res, date: new Date(), user: 'Oli'});
		socket.emit('file', res);
	});
});

