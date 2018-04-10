let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');
let ss = require('socket.io-stream');

function participantLoaded(user, stream, data, pName){
	this.callback = function(participant){
		if(participant){
			if(participant.sid !== user.sid){
				require('crypto').randomBytes(48, function(err, buffer) {
					let token = buffer.toString('hex');
					data.stid = token;
					sockets.emitStream(participant.sid, 'openStream', stream, data);
				});
			}
		} else {
			logger.logErr('Sendmedia: Read participant with username ' + pName + ' failed');
		}
	};
}

function chatLoaded(user, stream, data){
	this.callback = function(chat){
		if(chat){
			let participants = chat.participants;
			data.origin = user.username;
			participants.forEach((p) => {
				db.read('users',{username: p}, new participantLoaded(user, stream, data, p).callback);
			});
		} else {
			logger.logErr('Sendmedia: Read chat with token ' + data.token + ' failed');
		}
	};
}

function userLoaded(sessionId, stream, data){
	this.callback = function(user){
		if(user){
			db.read('chats',{token: data.token}, new chatLoaded(user, stream, data).callback);
		}else{
			logger.logErr('Sendmedia: Read user with sessionId ' + sessionId + ' failed');
		}
	};
}

function exec(sessionId, stream, data){
	logger.logDeb("User with sessionId " + sessionId + "loads chat");
	db.read('users', {sid: sessionId}, new userLoaded(sessionId, stream, data).callback);
}

module.exports = {
	exec : exec
}
