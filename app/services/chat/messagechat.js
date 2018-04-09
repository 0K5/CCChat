let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');
let dateOptions = {
	weekday: 'long', 
	year: 'numeric', 
	month: 'numeric', 
	day: 'numeric',
	hour12: false,
	hour: 'numeric',
	minute: 'numeric'
}

function participantLoaded(user, msg, participantName){
	this.callback = function(participant){
		if(participant){
			if(participant.username !== user.username){
				msg.isReceiver = true;
			}else{
				msg.isReceiver = false;
			}
			logger.logDeb('Message send to participant ' + participant.username + ' from ' + user.username);
			sockets.emit(participant.sid, 'message', msg);
		} else {
			logger.logErr('Participant ' + participantName + ' not in databast');
		}
	};
}

function updatedChat(user, msg){
	this.callback = function(chat){
		if(chat){
			console.log('CHAT ' + JSON.stringify(chat));
			chat.participants.forEach((p) => {
				db.read('users', {username: p}, new participantLoaded(user, msg, p ).callback);
			});
		} else {
			logger.logErr('Chat with token ' + msg.token + " couldn't be updated");
		}
	};
}

function chatLoaded(user, msg){
	this.callback = function(chat){
		if(chat){
			msg.timestamp = (new Date()).toLocaleString('de-DE', dateOptions);
			let messages = chat.messages;
			messages.push(msg);
			db.update('chats', {token: chat.token},{messages: messages}, new updatedChat(user, msg).callback);
		} else {
			logger.logErr('Chat with token ' + msg.token + ' not in database');
		}
	};
}

function userLoaded(sessionId, msg){
	this.callback = function(user){
		if(user){
			msg.origin = user.username;
			db.read('chats', {token: msg.token}, new chatLoaded(user, msg).callback);
		} else {
			logger.logErr('User with sessionId ' + sessionId + ' not in database');
		}
	};
}

let exec = (sessionId, msg) => {
	db.read('users', {sid : sessionId}, new userLoaded(sessionId, msg).callback);
}

module.exports = {
	exec : exec
}
