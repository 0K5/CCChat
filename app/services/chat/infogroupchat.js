let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

function chatLoaded(sessionId, sendChat){
	this.callback = function(storedChat){
		if(storedChat){
			let info = '';
			storedChat.participants.forEach((p) => {
				info += p + '<br>'
			});
			info += 'Creator: ' + storedChat.origin;
			sockets.emit(sessionId, 'infoGroup', {
				name: storedChat.name,
				info: info
			});
		} else {
			logger.logErr('Chat with name ' + sendChat.name + ' not in database');
		}
	};
}

function exec(sessionId, chat){
	logger.logDeb("User with sessionId " + sessionId + "loads chat");
	db.read('chats', {token: chat.token}, new chatLoaded(sessionId, chat).callback);
}

module.exports = {
	exec : exec
}
