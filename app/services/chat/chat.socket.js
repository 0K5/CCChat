let sockets = require('../../helpers/sockets.js');
let logger = require('../../helpers/logger.js');

function setOns(sessionId, io, socket) {
    socket.on('init', () => {
        logger.logDeb('User with sessionId ' + sessionId + 'initialises chat');
        require('./initchat.js').exec(sessionId);
    });
    socket.on('openChat', (data) => {
        logger.logDeb('User with sessionId ' + sessionId + 'opens chat');
        require('./openchat.js').exec(sessionId, data);
    });
	socket.on('group', (data) => {
		logger.logDeb('User with sessionId ' + sessionId + 'added a new group');
		require('./openchat.js').exec(sessionId,data);
	});
	socket.on('message', (data) => {
		logger.logDeb('User wirh sessionId ' + sessionId + 'sends message');
		require('./messagechat.js').exec(sessionId, data);
	});
}


module.exports = {
	init : setOns
}
