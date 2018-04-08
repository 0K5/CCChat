let logger = require('./logger.js');
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

let getIo = () => {
    return io;
};

let getSocket = (sessionId) => {
	return sockets[sessionId];
}

module.exports = {
    init : setUpSockets,
	io : getIo,
	socket: getSocket
};
