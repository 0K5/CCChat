let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

function informParticipants(user, chat, participantName){
	this.callback = function(participant){
		if(participant){
			adaptChatToReceiver(participant, chat, (user, chat) => {
				sockets.emit(participant.sid, 'newChat', {chat: chat});
				logger.logDeb('Chat ' + chat.name + ' sent to participant ' + participant.username);
			});
		} else {
			logger.logErr('Participant ' + participantName + ' not in databast');
		}
	}
};

function emitNewChat(user, participants){
	this.callback = function(chat){
		sockets.emit(user.sid, 'loadChat',{chat: chat});
		for(pi in participants){
			db.read('users', {username: participants[pi]}, new informParticipants(user, chat, participants[pi]).callback);
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
			logger.logDeb("Sorted users" + participants + " " + c.participants.sort())
			allStoredChats.forEach((c) => {
				if(JSON.stringify(participants) === JSON.stringify(c.participants.sort())){
					logger.logDeb("Chat found and loaded");
					adaptChatToReceiver(user, c, (user, chat) => {
						sockets.emit(user.sid, 'loadChat',{chat: chat});
						logger.logDeb('All messages in loaded chat ' + JSON.stringify(c.messages));
					});
					chatFound = true;
				}
			});
			//Otherwise create a new chat and save it in the database
			if(!chatFound){
				require('crypto').randomBytes(48, function(err, buffer) {
					let token = buffer.toString('hex');
					logger.logDeb("New chat with users " + chat.participants);
					db.create('chats',{id: token}, {
						token: token, 
						name: participants.length > 2 && chat.name ? chat.name : '', 
						isGroup: participants.length > 2,
						isNotification: participants.length < 2,
						isPrivate: participants.length === 2,
						participants: participants, 
						messages: []
					}, new emitNewChat(user, participants).callback);
				});
			}
		} else {
			logger.logErr('No chats stored with ' + chat.token);
		}
	};
}

function adaptChatToReceiver(user, chat, callback){
	if(chat.isPrivate){
		chat.name = chat.participants[0] === user.username ? chat.participants[1] : chat.participants[0];
	}
	chat.messages.forEach((m) => {
		if(m.origin !== user.username){
			m.isReceiver = true;
		}else{
			m.isReceiver = false;
		}
	});
	callback(user, chat);
};

function chatLoaded(user, clientChat){
	this.callback = function(storedChat){
		if(storedChat){
			adaptChatToReceiver(user, storedChat, (user, chat) => {
				sockets.emit(user.sid, 'loadChat',{chat: chat});	
			});
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
