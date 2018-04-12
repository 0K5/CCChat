/*
 * Called when a file is send to chat.
 */
let logger = require('../../../modules/logger.js');
let db = require('../../../modules/database.js');
let sockets = require('../../../modules/sockets.js');
let ss = require('socket.io-stream');
let moment = require('moment');
moment.locale('de');

/*Creates a unique token for the stream transmission.<br>
 * Emits the stream to a participant of the chat.<br>
 * @param user Object user that send the file
 * @param stream Object stream from the user
 * @param data Object information send with the file
 * @param participantName name of the receiving participant of the chat*/
function participantLoaded(user, stream, data, participantName) {
    this.callback = function(participant) {
        if (participant) {
            if (participant.sid !== user.sid) {
                require('crypto').randomBytes(48, function(err, buffer) {
                    let token = buffer.toString('hex');
                    data.stid = token;
                    data.timestamp = moment().format('LLLL');
                    sockets.emitStream(participant.sid, 'openStream', stream, data);
                });
            }
        } else {
            logger.logErr('Sendmedia: Read participant with username ' + participantName + ' failed');
        }
    };
}

/*Iterates over all participants of the chat to transmit the file.<br>
 * @param user Object user that send the file
 * @param stream Object stream from user
 * @param data Object information send with the file */
function chatLoaded(user, stream, data) {
    this.callback = function(chat) {
        if (chat) {
            let participants = chat.participants;
            data.origin = user.username;
            //TODO: Replace with socket rooms
            participants.forEach((p) => {
                db.read('users', {
                    username: p
                }, new participantLoaded(user, stream, data, p).callback);
            });
        } else {
            logger.logErr('Sendmedia: Read chat with token ' + data.token + ' failed');
        }
    };
}

/*If the user is valid tries to read the chat by the given token from database.<br>
 * @param sessionId String sessionId of the user who send the file
 * @param stream Object stream from user
 * @param data Object information send with the file*/
function userLoaded(sessionId, stream, data) {
    this.callback = function(user) {
        if (user) {
            db.read('chats', {
                token: data.token
            }, new chatLoaded(user, stream, data).callback);
        } else {
            logger.logErr('Sendmedia: Read user with sessionId ' + sessionId + ' failed');
        }
    };
}

function exec(sessionId, stream, data) {
    logger.logDeb("User with sessionId " + sessionId + "loads chat");
    db.read('users', {
        sid: sessionId
    }, new userLoaded(sessionId, stream, data).callback);
}

module.exports = {
    exec: exec
}
