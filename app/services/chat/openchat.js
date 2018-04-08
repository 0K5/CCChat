let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

function emitNewChat(sessionId){
	this.callback = function(chat){
		sockets.socket(sessionId).emit('loadChat',{chat: chat});
		sockets.socket(sessionId).emit('newChat', {chat: chat});
	}
};

function chatsByContactsLoaded(sessionId, clientChat, user){
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
				if(JSON.stringify(users) === JSON.stringify(c.users.sort())){
					logger.logDeb("Chat found and loaded");
					if(c.users.length === 2){
						c.name = c.users[0] === user.username ? c.users[1] : c.users[0];
					}
					sockets.socket(sessionId).emit('loadChat',{chat: c});
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
					}, new emitNewChat(sessionId).callback);
				});
			}
		}
	};
}

function chatLoaded(sessionId, clientChat, user){
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

function userLoadedChat(sessionId, chat){
	this.callback = function(user){
		if(user){
			logger.logDeb("Loading chat by chatid " + chat.token);
			if(chat.token){
				db.read('chats', {token: chat.token},new chatLoaded(sessionId, chat, user).callback);
			}else{
				db.readAll('chats', new chatsByContactsLoaded(sessionId, chat, user).callback);
			}
		} else {
			logger.logErr('User for chat creation not found');
		}
	};
}

function exec(sessionId, chat){
	logger.logDeb("User with sessionId " + sessionId + "loads chat");
	db.read('users', {id: sessionId}, new userLoadedChat(sessionId, chat).callback);
}

module.exports = {
	exec : exec
}
