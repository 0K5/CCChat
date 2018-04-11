let sockets = require('../../modules/sockets.js');
let logger = require('../../modules/logger.js');
let ss = require('socket.io-stream');
let fs = require('fs-extra');
let path = require('path');

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
	socket.on('addToGrp', (data) => {
		logger.logDeb('User with sessionId ' + sessionId + 'adds user to existing group');
		require('./addtogroupchat.js').exec(sessionId,data);
	});
	socket.on('infoGroup', (data) =>{
		logger.logDeb('User with sessionId ' + sessionId + 'requests info of group');
		require('./infogroupchat.js').exec(sessionId,data);
	});	
	socket.on('message', (data) => {
		logger.logDeb('User with sessionId ' + sessionId + 'sends message');
		require('./messagechat.js').exec(sessionId, data);
	});
	socket.on('logout',() => {
		logger.logDeb('User with sessionId ' + sessionId + 'loggout requested');
		require('./logoutchat.js').exec(sessionId);
	});
	ss(socket).on('sendMedia', function(stream, data) {
		logger.logDeb('User with sessionId ' + sessionId + 'sends media');
		require('./sendmediachat.js').exec(sessionId, stream, data);
	});
}


module.exports = {
	init : setOns
}
