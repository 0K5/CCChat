let logger = require('../../modules/logger.js');
let db = require('../../modules/database.js');
let sockets = require('../../modules/sockets.js');
let moment = require('moment');

function participantLoaded(user, msg, participantName){
	this.callback = function(participant){
		if(participant){
			if(participant.username !== user.username){
				msg.isReceiver = true;
			}else{
				msg.isReceiver = false;
			}
			logger.logDeb('Message send to participant ' + participant.username + ' from ' + user.username);
			if(user.sid !== participant.sid){
				sockets.emit(participant.sid, 'message', msg);
			}
		} else {
			logger.logErr('Participant ' + participantName + ' not in databast');
		}
	};
}

function updatedChat(user, msg){
	this.callback = function(chat){
		if(chat){
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
			moment.locale('de');
			msg.timestamp = moment().format('LLLL');
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
