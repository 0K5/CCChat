let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

function informParticipants(chat){
	this.callback = function(participant){
		if(participant){
			if(chat.name === 'PrivateChat'){
				chat.name = (chat.participants[0] === participant.username ? chat.participants[1] : chat.participants[0]);
			}
			sockets.emit(participant.sid, 'newChat', {chat: chat});
		}
	}
}
function emitNewChat(user, participants){
	this.callback = function(chat){
		sockets.emit(user.sid, 'loadChat',{chat: chat});
		for(pi in participants){
			db.read('users', {username: participants[pi]}, new informParticipants(chat).callback);
		}
	}
};

function chatsByContactsLoaded(user, chat){
	this.callback = function(allStoredChats){
		if(allStoredChats){
			let chatFound = false;
			let participants = [];
			if(chat.contact){
				participants = [chat.contact, user.username];
			}else if(chat.participants){
				participants = chat.participants;
				participants.push(user.username);
			}
			participants.sort();
			//Search for chat, if it already exists emit to user
			allStoredChats.forEach((c) => {
				logger.logDeb("Sorted users" + participants + " " + c.participants.sort())
				if(JSON.stringify(participants) === JSON.stringify(c.participants.sort())){
					logger.logDeb("Chat found and loaded");
					if(c.participants.length === 2){
						c.name = c.participants[0] === user.username ? c.participants[1] : c.participants[0];
					}
					sockets.emit(user.sid, 'loadChat',{chat: c});
					chatFound = true;
				}
			});
			//Otherwise create a new chat and save it in the database
			if(!chatFound){
				require('crypto').randomBytes(48, function(err, buffer) {
					let token = buffer.toString('hex');
					logger.logDeb("New chat with users " + chat.contact);
					sockets.join(user.sid, token);
					db.create('chats',{id: token}, {
						token: token, 
						name: participants.length === 2 ? 'PrivateChat' : 'GroupChat', 
						participants: participants, 
						messages: []
					}, new emitNewChat(user, participants).callback);
				});
			}
		}
	};
}

function chatLoaded(user, clientChat){
	this.callback = function(storedChat){
		if(storedChat){
			if(storedChat.participants.length === 2){
				storedChat.name = storedChat.participants[0] === user.username ? storedChat.participants[1] : storedChat.participants[0];
			}
			sockets.emit(user.sid, 'loadChat',{chat: storedChat});	
		}else{
			logger.logErr("Chat with token " + clientChat.token + " couldn't be loaded");
		}
	};
}

function userLoadedChat(chat){
	this.callback = function(user){
		if(user){
			logger.logDeb("Loading chat by chatid " + chat.token);
			if(chat.token){
				db.read('chats', {token: chat.token},new chatLoaded(user, chat).callback);
			}else{
				db.readAll('chats', new chatsByContactsLoaded(user, chat).callback);
			}
		} else {
			logger.logErr('User for chat creation not found');
		}
	};
}

function exec(sessionId, chat){
	logger.logDeb("User with sessionId " + sessionId + "loads chat");
	db.read('users', {sid: sessionId}, new userLoadedChat(chat).callback);
}

module.exports = {
	exec : exec
}
