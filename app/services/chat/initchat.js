let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

function usersLoaded(user){
	this.callback = function(users){
		if(users && Object.keys(users).length !== 0){
			let contacts = [];
			for(ui in users){
				if(users[ui].sid !== user.sid){	
					contacts.push({
						name: users[ui].username,
						lastLogin: users[ui].lastLogin
					});
				}
			}
			sockets.emit(user.sid, 'allContacts', {contacts: contacts});
			logger.logDeb("Contacts loaded and emitted " + JSON.stringify(contacts));
		} else {
			logger.logDeb("No contacts to load and emit");
		}
	}
}

function chatsLoaded(user){
	this.callback = function(chats){
		if(chats){
			let filteredChats = []
			for(ki in chats){
				let participants = chats[ki].participants;
				participants.forEach((p) => {
					if(p === user.username){
						filteredChats.push(chats[ki]);
						sockets.join(user.sid, chats[ki].token);
						let fc = filteredChats[filteredChats.length-1];
						if(fc.participants.length === 2){
							fc.name = fc.participants[0] === user.username ? fc.participants[1] : fc.participants[0];
						}
					}
				});
			}
			sockets.emit(user.sid, 'allChats', {chats: filteredChats});
			logger.logDeb("Chats loaded and emitted " + JSON.stringify(filteredChats));
		} else {
			logger.logDeb("No chats to load and emit");
		}
		db.readAll('users', new usersLoaded(user).callback);
	}
}

let initAllChats = (user) => {
		if(!user){
			logger.logErr("New user in chat not in database");
		} else {
			logger.logDeb("New User in chat");
			sockets.broadcast(user.sid, 'online',{name: user.username});
			db.readAll('chats', new chatsLoaded(user).callback);
		}
};

let exec = (sessionId) => {
	db.read('users', {sid: sessionId}, initAllChats);
};

module.exports = {
	exec : exec
}
