let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

function exec(sessionId, chat){
	logger.logDeb("User with sessionId " + sessionId + "loads chat");
	db.read('users', {sid: sessionId}, new userLoadedChat(chat).callback);
}

module.exports = {
	exec : exec
