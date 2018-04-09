let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');

function userLoaded(sessionId){
	this.callback = function(user){
		if(user){
			sockets.emit(sessionId, 'logout', {});
		} else {
			logger.logErr('Logout from user with sessionId ' + sessionId + ' failed on database read');
		}
	};
}

function exec(sessionId, chat){
	logger.logDeb("User with sessionId " + sessionId + "logs out");
	db.update('users', {sid: sessionId}, {sid: ''}, new userLoaded(sessionId).callback);
}

module.exports = {
	exec : exec
}
