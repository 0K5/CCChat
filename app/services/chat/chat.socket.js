/*
 * Maintains all socket.on functions for chat. Automatically loaded into ./modules/sockets.js when a new socket connects.
 * */
let sockets = require('../../modules/sockets.js');
let logger = require('../../modules/logger.js');
let ss = require('socket.io-stream');
let fs = require('fs-extra');
let path = require('path');

/*all socket.on functions for chat<br>
	* @param sessionId String sessionId of the socket client*/
function setOns(sessionId, io, socket) {
    socket.on('init', () => {
        logger.logDeb('User with sessionId ' + sessionId + 'initialises chat');
        require('./microservices/init.js').exec(sessionId);
    });
    socket.on('openChat', (data) => {
        logger.logDeb('User with sessionId ' + sessionId + 'opens chat');
        require('./microservices/openchat.js').exec(sessionId, data);
    });
	socket.on('group', (data) => {
		logger.logDeb('User with sessionId ' + sessionId + 'added a new group');
		require('./microservices/openchat.js').exec(sessionId,data);
	});
	socket.on('addToGrp', (data) => {
		logger.logDeb('User with sessionId ' + sessionId + 'adds user to existing group');
		require('./microservices/addtogroup.js').exec(sessionId,data);
	});
	socket.on('leaveGrp', (data) => {
		logger.logDeb('User with sessionId ' + sessionId + 'remove user to existing group');
		require('./microservices/leavegroup.js').exec(sessionId,data);
	});
	socket.on('infoGroup', (data) =>{
		logger.logDeb('User with sessionId ' + sessionId + 'requests info of group');
		require('./microservices/infogroup.js').exec(sessionId,data);
	});	
	socket.on('message', (data) => {
		logger.logDeb('User with sessionId ' + sessionId + 'sends message');
		require('./microservices/message.js').exec(sessionId, data);
	});
	socket.on('logout',() => {
		logger.logDeb('User with sessionId ' + sessionId + 'loggout requested');
		require('./microservices/logout.js').exec(sessionId);
	});
	ss(socket).on('sendMedia', function(stream, data) {
		logger.logDeb('User with sessionId ' + sessionId + 'sends media');
		require('./microservices/sendmedia.js').exec(sessionId, stream, data);
	});
}


module.exports = {
	init : setOns
}
