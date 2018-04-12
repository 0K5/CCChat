/*
 * Called when a message needs to delivered to a chat.
 */
let logger = require('../../../modules/logger.js');
let db = require('../../../modules/database.js');
let sockets = require('../../../modules/sockets.js');
let moment = require('moment');

/*Adapts the message to receiver or user if its a private chat (so the chat gets the correct username as title)<br>
 * Sends the new message to the participant.<br>
 * @param user Object user that send the message
 * @param msg Object message that will be emitted to the receiver
 * @param participantName String name of the participant to receive the message*/
function participantLoaded(user, msg, participantName) {
    this.callback = function(participant) {
        if (participant) {
            if (participant.username !== user.username) {
                msg.isReceiver = true;
            } else {
                msg.isReceiver = false;
            }
            logger.logDeb('Message send to participant ' + participant.username + ' from ' + user.username);
            if (user.sid !== participant.sid) {
                sockets.emit(participant.sid, 'message', msg);
            }
        } else {
            logger.logErr('Participant ' + participantName + ' not in databast');
        }
    };
}

/*Iterates over all participants of chat to emit the message send by user.<br>
 * @param user Object user that send the message
 * @param msg Object message that will be send to participants of chat*/
function updatedChat(user, msg) {
    this.callback = function(chat) {
        if (chat) {
            //TODO: Replace with socket rooms
			if(chat.participants){
				chat.participants.forEach((p) => {
				    db.read('users', {
				        username: p
					}, new participantLoaded(user, msg, p).callback);
            });
			}
        } else {
            logger.logErr('Chat with token ' + msg.token + " couldn't be updated");
        }
    };
}

/*Sets timestamp to the message and updated the chat by pushing the message to the chat.messages array.<br>
 * @param user Object user that send the message
 * @param msg message that will be send to participants of chat*/
function chatLoaded(user, msg) {
    this.callback = function(chat) {
        if (chat) {
            moment.locale('de');
            msg.timestamp = moment().format('LLLL');
            let messages = chat.messages;
            messages.push(msg);
            db.update('chats', {
                token: chat.token
            }, {
                messages: messages
            }, new updatedChat(user, msg).callback);
        } else {
            logger.logErr('Chat with token ' + msg.token + ' not in database');
        }
    };
}

/*Sets the origin of the message to the user.username and reads the chat by the given token.<br>
 * @param sessionId String sessionId of the user who send the message
 * @param msg Object message that will be sind to participants of chat*/
function userLoaded(sessionId, msg) {
    this.callback = function(user) {
        if (user) {
            msg.origin = user.username;
            db.read('chats', {
                token: msg.token
            }, new chatLoaded(user, msg).callback);
        } else {
            logger.logErr('User with sessionId ' + sessionId + ' not in database');
        }
    };
}

let exec = (sessionId, msg) => {
    db.read('users', {
        sid: sessionId
    }, new userLoaded(sessionId, msg).callback);
}

module.exports = {
    exec: exec
}
