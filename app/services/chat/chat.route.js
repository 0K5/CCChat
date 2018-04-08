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

function chatLoaded(socket, clientChat, user){
	this.callback = function(chat){
		if(chat){
			socket.emit('loadChat', {chat: chat});
		} else {
			require('crypto').randomBytes(48, function(err, buffer) {
				let token = buffer.toString('hex');
				db.create('chats',{id: token}, {
					token: token, 
					name: clientChat.users.length === 2 ? clientChat.users[0] : 'GroupChat', 
					users: clientChat.users, 
					messages: []
				}, new emitNewChat(socket).callback);
			});
		}
	};
}

function userLoadedChat(socket, chat){
	this.callback = function(user){
		if(user){
			if(Array.isArray(chat.users)){
				chat.users.push(user.username);
				db.read('chats', {users:chat.users}, new chatLoaded(socket, chat, user).callback);
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
