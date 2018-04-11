let logger = require('../../modules/logger.js');
let db = require('../../modules/database.js');
let sockets = require('../../modules/sockets.js');

/*Emit successful logout back to user*/
function userLoaded(sessionId) {
    this.callback = function(user) {
        if (user) {
            sockets.emit(sessionId, 'logout', {});
        } else {
            logger.logErr('Logout from user with sessionId ' + sessionId + ' failed on database read');
        }
    };
}

/*sid (sessionId) is resetted, so that the user won't be recognized anymore and will be redirected to /login page*/
function exec(sessionId, chat) {
    logger.logDeb("User with sessionId " + sessionId + "logs out");
    db.update('users', {
        sid: sessionId
    }, {
        sid: '',
        loggedIn: 0
    }, new userLoaded(sessionId).callback);
}

module.exports = {
    exec: exec
}
