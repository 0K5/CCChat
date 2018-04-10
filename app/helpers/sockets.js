let logger = require('./logger.js');
let ss = require('socket.io-stream');
let fs = require('fs-extra');
let path = require('path');
let onConnectActions = {};
let sockets = {};
let io = undefined; 

let getServiceFiles = (fileExtension) => {
    let allFiles = fs.readdirSync(path.resolve(__dirname, '../services'));
    allFiles = allFiles.filter((dir) => fs.statSync(path.resolve(__dirname, '../services/' + dir)).isDirectory());
    allFiles = allFiles.filter((dir) => {
		try{
			fs.readFileSync(path.resolve(__dirname, '../services/'+dir+'/'+dir+fileExtension));
			return true;
		}catch(err){
			return false;
		}
	});
    allFiles = allFiles.map((dir) => './../services/' + dir + '/' + dir + fileExtension);
	return allFiles;

};
let setUpSockets = (app, server, session, sessionStore, next) => {
    logger.logInfo('Setting up sockets');
    io = require('socket.io')(server);
	let sharedsession = require("express-socket.io-session");
	let cookieParser = require('cookie-parser')('14gty8i9oph1q45o;pgh3p0[987oui2dh3q2l4iugfrh');
	io.set('authorization', function(handshake, callback) {
		if (handshake.headers.cookie) {
		  cookieParser(handshake, null, function(err) {
    	    // Use depends on whether you have signed cookies
    	    // handshake.sessionID = handshake.cookies[session_key];
    	    handshake.sessionID = handshake.signedCookies['CCChat2017'];
    	    sessionStore.get(handshake.sessionID, function(err, session) {
    	      if (err || !session) {
    	        callback('Error or no session.', false);
    	      } else {
    	        handshake.session = session;
    	        callback(null, true);
    	      }
    	    });
    	  });
    	} else {
    	  callback('No session cookie found.', false);
    	}
  });
	io.use(sharedsession(session, cookieParser));
	let onsPaths = getServiceFiles('.socket.js');
	io.on('connection', function(socket){
		let sessionId = socket.handshake.signedCookies['CCChat2017'];
		for(op in onsPaths){
			require(onsPaths[op]).init(sessionId, io, socket);
		}
		sockets[sessionId] = socket;
	});
	io.on('disconnect', function(socket){
		let sessionId = socket.handshake.signedCookies['CCChat2017'];
		delete sockets[sessionId];
	});
    return next(app, server);
};

let emit = (sessionId, eventName, data) => {
	if(sessionId in sockets){
		sockets[sessionId].emit(eventName, data);
	}
};

let broadcast = (sessionId, eventName, data) => {
	if(sessionId in sockets){
		sockets[sessionId].broadcast.emit(eventName, data);
	}
};

let emitRoom = (sessionId, roomId, eventName, data) => {
	if(sessionId in sockets){
		sockets[sessionId].broadcast.to(roomId).emit(eventName, data);
	}
};

let emitStream = (sessionId, eventName, inStream, data) => {
	if(sessionId in sockets){
		let outStream = ss.createStream();
		ss(sockets[sessionId]).emit('openStream', outStream, data);
		inStream.pipe(outStream);
	}
};

let join = (sessionId, roomId) => {
	if(sessionId in sockets){
		sockets[sessionId].join(roomId, function(){
			logger.logDeb(sessionId + ' joined rooms ' + JSON.stringify(sockets[sessionId].rooms));
		});
	}
};

module.exports = {
    init : setUpSockets,
	emit: emit,
	broadcast: broadcast,
	emitRoom: emitRoom,
	emitStream: emitStream,
	join: join
};
