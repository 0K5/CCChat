/*
 * Called when a member of a group decides to leave the group
 */
let logger = require('../../../modules/logger.js');
let db = require('../../../modules/database.js');
let sockets = require('../../../modules/sockets.js');
let moment = require('moment');
moment.locale('de');

/*Emits a msg that the user left to one participants of the group.<br>
 * @param msg Object message created in function below @chatLoaded
 * @param participantName String name of participant to be informed*/
function emitGroupLeave(msg, participantName) {
    this.callback = function(user) {
        if (user) {
            logger.logDeb('Emitting message ' + JSON.stringify(msg) + ' to user ' + user.username);
            sockets.emit(user.sid, 'leaveGrp', {
                msg: msg
            });
        } else {
            logger.logErr('Remove contact to chat. Loading user ' + participantName + ' failed');
        }
    };
}

/*Gets the last message created below in @chatLoaded that states that the user left the chat.<br>
 * Iterates over all participants to emit that a user left<br>
 * @param chat Object chat that contains participants that will receive the leave message from the user*/
function chatUpdated(chat) {
    this.callback = function(c) {
        if (c) {
            let msg = chat.messages[chat.messages.length - 1];
            //TODO: Replace with socket rooms
            chat.participants.forEach((p) => {
                logger.logDeb('Remove contact from chat emitting msg to ' + p);
                db.read('users', {
                    username: p
                }, new emitGroupLeave(msg, p).callback);
            });
        } else {
            logger.logErr('Remove contact on chat ' + chatName + ' failed on chat update');
        }
    };
}

/*Deletes the user from the chat.participants array.<br>
 * Adds a leave message to chat.messages.<br>
 * @param user Object user that tries to leave the group chat
 * @param sendChat Object chat sent by client*/
function chatLoaded(user, sendChat) {
    this.callback = function(storedChat) {
        if (storedChat) {
            let tmpParticipants = [];
            delete storedChat.participants[storedChat.participants.indexOf(user.username)];
            logger.logDeb('Remove contact from group chat participants after remove ' + storedChat.participants);
            //Clean empty indexes in array
            storedChat.participants.forEach((p) => {
                if (p) {
                    tmpParticipants.push(p);
                }
            });
            storedChat.messages.push({
                token: storedChat.token,
                text: user.username + ' left chat',
                timestamp: moment().format('LLLL')
            });
            storedChat.participants = tmpParticipants;
            logger.logDeb('Remove contact to chat update on chat ' + storedChat.name);
            db.update('chats', {
                token: storedChat.token
            }, storedChat, new chatUpdated(storedChat).callback);
        } else {
            logger.logErr('Chat with name ' + sendChat.name + ' not in database');
        }
    };
}

/*Loads a chat if the user that wants to leave the chat is a valid user*/
function userLoaded(sessionId, chat) {
    this.callback = function(user) {
        if (user) {
            db.read('chats', {
                token: chat.token
            }, new chatLoaded(user, chat).callback);
        } else {
            logger.logErr('User with sessionId ' + sessionId + ' not in database');
        }
    };
}

function exec(sessionId, chat) {
    logger.logDeb("User with sessionId " + sessionId + "leaves group chat");
    db.read('users', {
        sid: sessionId
    }, new userLoaded(sessionId, chat).callback);
}

module.exports = {
    exec: exec
}
