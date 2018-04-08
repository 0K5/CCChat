let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

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
			sockets.socket(sessionId).emit('allContacts', {contacts: contacts});
			logger.logDeb("Contacts loaded and emitted");
		} else {
			logger.logDeb("No contacts to load and emit");
		}
	}
}

function chatsLoaded(sessionId, socket, user){
	this.callback = function(chats){
		if(chats){
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
			sockets.socket(sessionId).emit('allChats', {chats: filteredChats});
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
			sockets.io().emit('newContact',{name: user.username});
			db.readAll('chats', new chatsLoaded(sessionId, socket, user).callback);
		}
	};
}

function exec(sessionId, io, socket){
	db.read('users', {id: sessionId}, new initAllChats(sessionId, io, socket).callback);
}

module.exports = {
	exec : exec
}
