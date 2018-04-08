let logger = require('../../helpers/logger.js');
let sockets = require('../../helpers/sockets.js');
let express = require('express');
let router = express.Router();
let db = require('../../helpers/database.js');
let allSockets = {};

function usersLoaded(sessionId, socket){
	this.callback = function(users){
		if(users && Object.keys(users).length !== 0){
			let contacts = [];
			for(ui in users){
				if(users[ui].id !== sessionId){	
					contacts.push({
						name: users[ui].username,
						lastOnline: users[ui].lastOnline
					});
				}
			}
			socket.emit('allContacts', {contacts: contacts});
			logger.logDeb("Contacts loaded and emitted");
		} else {
			logger.logDeb("No contacts to load and emit");
		}
	}
}

function chatsLoaded(sessionId, socket, user){
	this.callback = function(chats){
		if(chats && Object.keys(chats).length !== 0){
			let filteredChats = []
			for(ki in chats){
				let users = chats[ki].users;
				users.forEach((u) => {
					if(u === user.username){
						filteredChats.push(chats[ki]);
						let fc = filteredChats[filteredChats.length-1];
						if(fc.users.length === 2){
							fc.name = fc.users[0] === user.username ? fc.users[1] : fc.users[0];
						}
					}
				});
			}
			socket.emit('allChats', {chats: filteredChats});
			logger.logDeb("Chats loaded and emitted");
		} else {
			logger.logDeb("No chats to load and emit");
		}
		db.readAll('users', new usersLoaded(sessionId, socket).callback);
	}
}

function initAllChats(sessionId, socket, io){
	this.callback = function(user){
		if(!user){
			logger.logErr("New user in chat not in database");
		} else {
			logger.logDeb("New User in chat");
			io.emit('newUser',{name: user.username});
			db.readAll('chats', new chatsLoaded(sessionId, socket, user).callback);
		}
	};
}

function emitNewChat(socket){
	this.callback = function(chat){
		socket.emit('loadChat',{chat: chat});
		socket.emit('newChat', {chat: chat});
	}
};

function chatsByContactsLoaded(socket, clientChat, user){
	this.callback = function(chats){
		if(chats){
			let chatFound = false;
			let users = [];
			if(clientChat.contact){
				users = [clientChat.contact,user.username];
			}else if(clientChat.contacts){
				users = clientChat.contacts;
				users.push(user.username);
			}
			users.sort();
			chats.forEach((c) => {
				logger.logDeb("Sorted users" + users + " " + c.users.sort())
				if(users === c.users.sort()){
					logger.logDeb("Chat found and loaded");
					if(c.users.length === 2){
						c.name = c.users[0] === user.username ? c.users[1] : c.users[0];
					}
					socket.emit('loadChat',{chat: c});
					chatFound = true;
				}
			});
			if(!chatFound){
				require('crypto').randomBytes(48, function(err, buffer) {
					let token = buffer.toString('hex');
					logger.logDeb("New chat with users " + clientChat.contact);
					db.create('chats',{id: token}, {
						token: token, 
						name: users.length === 2 ? 
							(users[0] === user.username ? users[1] : users[0]) : 'GroupChat', 
						users: users, 
						messages: []
					}, new emitNewChat(socket).callback);
				});
			}
		}
	};
}

function chatLoaded(socket, clientChat, user){
	this.callback = function(chat){
		if(chat){
			if(chat.users.length === 2){
				chat.name = chat.users[0] === user.username ? chat.users[1] : chat.users[0];
			}
			socket.emit('loadChat',{chat: chat});	
		}else{
			logger.logErr("Chat with token " + clientChat + " couldn't be loaded");
		}
	};
}

function userLoadedChat(socket, chat){
	this.callback = function(user){
		if(user){
			logger.logDeb("Loading chat by chatid " + chat.id);
			if(chat.token){
				db.read('chats', {token: chat.token},new chatLoaded(socket, chat, user).callback);
			}else{
				db.readAll('chats', new chatsByContactsLoaded(socket, chat, user).callback);
			}
		} else {
			logger.logErr('User for chat creation not found');
		}
	};
}

function logOut(sessionId){
	this.callback = function() {
		//DO SOMETHING ON LOGOUT
	};
}

let initIo = () => {
	let io = sockets.io();
	if(io){
		io.on('connection', (socket) => {
			let sessionId = socket.handshake.signedCookies['CCChat2017'];
			logger.logDeb('Socket connected with id ' + sessionId)
			socket.on('init', function() {
				db.read('users', {id: sessionId}, new initAllChats(sessionId, io, socket).callback);
			});
			socket.on('openChat',function(data){
				let chat = data;
				logger.logDeb("User with sessionId " + sessionId + "loads chat");
				db.read('users', {id: sessionId}, new userLoadedChat(socket, chat).callback);
			});
			socket.on('disconnect', function (socket) {
			//	db.update('users', {id: sessionId},{loggedIn: 0},new logOut(sessionId).callback);
			});
		});
	}else{
		logger.logErr('Io is undefined');
	}
};

function VerifySession (req, res, next){
	this.callback = function(user){
		if(user && user.loggedIn === 1){
			logger.logDeb("User : " + user.username + " tries to access the chat");
			res.render('chat.view.hbs', {
				title: 'CCChat',
			});
			initIo();
		}else{
			res.redirect('https://' + req.get('host') + '/login');
		}
	};
}


router.get('/', (req, res, next) => {
	db.read('users', {id : req.session.id}, new VerifySession(req, res).callback);
});

router.use('/messages', require('../messages/messages.route.js'));

router.use('/contacts', require('../contacts/contacts.route.js'));

module.exports = router;
