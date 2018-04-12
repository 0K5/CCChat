/*
 * Module to initialize and handle sockets<br>
 * all sockets are saved on connection with the given sessionId<br>
 * all modules within ./services with the file extension .sockets.js will be loaded as available functions on sockets<br>
 * */
let io = undefined;
let logger = require('./logger.js');
let servicefiles = require('./servicefiles.js');
let ss = require('socket.io-stream');
let sockets = {};

let setUpSockets = (app, server, session, sessionStore, next) => {
    logger.logInfo('Setting up sockets');
    io = require('socket.io')(server);
    let sharedsession = require("express-socket.io-session");
    let cookieParser = require('cookie-parser')('14gty8i9oph1q45o;pgh3p0[987oui2dh3q2l4iugfrh');
    io.set('authorization', function(handshake, callback) {
        if (handshake.headers.cookie) {
            cookieParser(handshake, null, function(err) {
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
    servicefiles.get('.socket.js', (onsPaths) => {
        io.on('connection', function(socket) {
            let sessionId = socket.handshake.signedCookies['CCChat2017'];
            for (op in onsPaths) {
                require(onsPaths[op]).init(sessionId, io, socket);
            }
            sockets[sessionId] = socket;
        });
        io.on('disconnect', function(socket) {
            let sessionId = socket.handshake.signedCookies['CCChat2017'];
            delete sockets[sessionId];
        });
        return next(app, server);
    });
};

let emit = (sessionId, eventName, data) => {
    if (sessionId in sockets) {
        sockets[sessionId].emit(eventName, data);
    }
};

let broadcast = (sessionId, eventName, data) => {
    if (sessionId in sockets) {
        sockets[sessionId].broadcast.emit(eventName, data);
    }
};

let emitRoom = (sessionId, roomId, eventName, data) => {
    if (sessionId in sockets) {
        sockets[sessionId].broadcast.to(roomId).emit(eventName, data);
    }
};

let emitStream = (sessionId, eventName, inStream, data) => {
    if (sessionId in sockets) {
        let outStream = ss.createStream();
        ss(sockets[sessionId]).emit('openStream', outStream, data);
        inStream.pipe(outStream);
    }
};

let join = (sessionId, roomId) => {
    if (sessionId in sockets) {
        sockets[sessionId].join(roomId, function() {
            logger.logDeb(sessionId + ' joined rooms ' + JSON.stringify(sockets[sessionId].rooms));
        });
    }
};

module.exports = {
    init: setUpSockets,
    emit: emit,
    broadcast: broadcast,
    emitRoom: emitRoom,
    emitStream: emitStream,
    join: join
};
