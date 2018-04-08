let logger = require('../../helpers/logger.js');

function setOns(sessionId, io, socket) {
    socket.on('init', function() {
        logger.logDeb('User with sessionId ' + sessionId + 'initialises chat');
        require('./initchat.js').exec(sessionId, io, socket);
    });
    socket.on('openChat', function(data) {
        logger.logDeb('User with sessionId ' + sessionId + 'opens chat');
        require('./openchat.js').exec(sessionId, socket, data);
    });
}



module.exports = {
	init : setOns
}
