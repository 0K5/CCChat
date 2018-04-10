let sockets = require('../../helpers/sockets.js');
let logger = require('../../helpers/logger.js');
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
		logger.logDeb('With data ' + JSON.stringify(data));
		let filename = path.resolve(__dirname + '../../../tmp/' + data.token);
		let tmpViews = path.resolve(__dirname + '../../../tmp/streams');
		if(!fs.existsSync(tmpViews)){
			fs.mkdirSync(tmpViews);
		}
		let streamFunction = function(token){
			let size = 0;
			this.on = function(info){
				logger.logDeb('On stream send ' + info);
			};
			this.once = function(info){
				logger.logDeb('Once stream send ' + info);
			};
			this.write = function(chunk){
				size += chunk.length;
				logger.logDeb('Stream send is currently at ' +Math.floor(size/ data.size*100)+ '%');
			};
			this.end = function(){
				logger.logDeb('Stream is fully transfered to server ');
			};
			this.emit = function(info){
				logger.logDeb('Emit stream send ' + info);
			};
		}
		stream.pipe(new streamFunction(data.token));
		
	});
}


module.exports = {
	init : setOns
}
