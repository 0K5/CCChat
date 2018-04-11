let logger = require('../../modules/logger.js');
let db = require('../../modules/database.js');
let sockets = require('../../modules/sockets.js');
let moment = require('moment');
moment.locale('de');

function emitGroupAdd(msg, p){
	this.callback = function(user){
		if(user){
			logger.logDeb('Emitting message ' + JSON.stringify(msg) + ' to user ' + user.username);
			sockets.emit(user.sid, 'addToGrp', {msg: msg});	
		} else {
			logger.logErr('Remove contact to chat. Loading user ' + p + ' failed');
		}
	};
}

function chatUpdated(chat){
	this.callback = function(c){
		if(c){
			let msg = chat.messages[chat.messages.length-1];
				chat.participants.forEach((p) => {
					logger.logDeb('Remove contact from chat emitting msg to ' + p);
					db.read('users',{username: p}, new emitGroupAdd(msg, p).callback);
				});
		} else {
			logger.logErr('Remove contact on chat ' + chatName + ' failed on chat update');
		}
	};
}

function chatLoaded(user, sendChat){
	this.callback = function(storedChat){
		if(storedChat){
			let tmpParticipants = [];
			delete storedChat.participants[storedChat.participants.indexOf(user.username)];
			logger.logDeb('Remove contact from group chat participants after remove ' + storedChat.participants);
			storedChat.participants.forEach((p) => {
				if(p){
					tmpParticipants.push(p);
					storedChat.messages.push({
						token: storedChat.token,
						text: user.username + ' left chat',
						timestamp: moment().format('LLLL')
					});
				}
			});
			storedChat.participants = tmpParticipants;
			logger.logDeb('Remove contact to chat update on chat ' + storedChat.name);
			db.update('chats',{token: storedChat.token}, storedChat, new chatUpdated(storedChat).callback);
		} else {
			logger.logErr('Chat with name ' + sendChat.name + ' not in database');
		}
	};
}

function userLoaded(sessionId, chat){
	this.callback = function(user){
		if(user){
			db.read('chats', {token: chat.token}, new chatLoaded(user, chat).callback);
		} else {
			logger.logErr('User with sessionId ' + sessionId + ' not in database');
		}
	};
}

function exec(sessionId, chat){
	logger.logDeb("User with sessionId " + sessionId + "loads chat");
	db.read('users', {sid: sessionId}, new userLoaded(sessionId, chat).callback);
}

module.exports = {
	exec : exec
}
