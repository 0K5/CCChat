let io = undefined;
let logger = require('./logger.js');

let setUpSockets = (app, server, next) => {
    logger.logInfo('Setting up sockets');
    let io = require('socket.io')(server);
    io.on('connection', (socket) => {
        logger.logInfo('Socket connected with id ' + socket.id)
    });
    return next(app, server);
};

module.exports = {
    init: setUpSockets,
    io: io
};
