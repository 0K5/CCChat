/*
 * Called when a user logs out of the chat.
 */
let logger = require('../../../modules/logger.js');
let db = require('../../../modules/database.js');
let sockets = require('../../../modules/sockets.js');

/*Emit successful logout back to user
 * @param sessionId String sessionId of the user that wants to logout*/
function userLoaded(sessionId, data) {
    this.callback = function(user) {
        if (user) {
			sockets.broadcast(sessionId, 'statusContact',{name:user.username,loggedIn:0});
			if(data && data.isLogout){
				sockets.emit(sessionId, 'logout', {});
			}
        } else {
			logger.logErr('Logout user with sessionId '+sessionId+' failed on database update.');
        }
    };
}

/*sid (sessionId) is resetted, so that the user won't be recognized anymore and will be redirected to /login page<br>
 * @param sessionId String sessionId of the user that tries to logout*/
function exec(sessionId, data) {
    logger.logDeb("User with sessionId " + sessionId + "logs out");
    db.update('users', {
        sid: sessionId
    }, {
		sid: '',
		loggedIn: data && data.isLogout ? 0 : 1,
    }, new userLoaded(sessionId, data).callback);
}

module.exports = {
    exec: exec
}
