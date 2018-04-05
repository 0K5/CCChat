let logger = require('./logger.js');
let onConnectActions = {};
let sockets = {};
let io = undefined; 

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
    return next(app, server);
};

let getIo = () => {
	return io;
}

module.exports = {
    init : setUpSockets,
	io : getIo 
};
