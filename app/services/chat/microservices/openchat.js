/*
 * Called when a user opens or creates a new chat by click on contact in contactlist or chat in chatlist
 */
let logger = require('../../../modules/logger.js');
let db = require('../../../modules/database.js');
let sockets = require('../../../modules/sockets.js');

/*Called on creation of new chat. Informs one participant about the new chat.<br>
 * @param user Object user that created the new chat
 * @param chat Object the chat created by the user
 * @param participantName String name of the participant to be informed*/
function informParticipants(user, chat, participantName) {
    this.callback = function(participant) {
        if (participant) {
            adaptChatToReceiver(participant, chat, (user, chat) => {
                sockets.emit(participant.sid, 'newChat', {
                    chat: chat
                });
                logger.logDeb('Chat ' + chat.name + ' sent to participant ' + participant.username);
            });
        } else {
            logger.logErr('Participant ' + participantName + ' not in databast');
        }
    }
};

/*Emits a loadChat to the creator of the new chat on success.<br>
	*Informs all participants of the created chat to add the chat to the chatlist.<br>
	@param user Object user that created the new chat
	@param participants Array all participant names of the new chat*/
function emitNewChat(user, participants) {
    this.callback = function(chat) {
        sockets.emit(user.sid, 'loadChat', {
            chat: chat
        });
        //TODO: Replace with socket rooms
        for (pi in participants) {
            db.read('users', {
                username: participants[pi]
            }, new informParticipants(user, chat, participants[pi]).callback);
        }
    }
};

/*Checks wheter the chat already exists or must be created before loadChat emit to user and newChat emit to participants.<br>
 *User can't create a group with the same name and the same participants right now.<br>
 *@param user Object user that wants to load or create a chat
 *@param chat Object chat that was send by the user as a creation or load request
 */
function chatsByContactsLoaded(user, chat) {
    this.callback = function(allStoredChats) {
        let chatFound = false;
        let participants = [];
        if (chat.contact) {
            participants = [chat.contact, user.username];
        } else if (chat.participants) {
            participants = chat.participants;
            participants.push(user.username);
        }
        if (allStoredChats && allStoredChats.length > 0) {
            participants.sort();
            //Search for chat, if it already exists emit to user
            allStoredChats.forEach((c) => {
                if (!c.isGroup && JSON.stringify(participants) === JSON.stringify(c.participants.sort())) {
                    logger.logDeb("Chat found and loaded");
                    adaptChatToReceiver(user, c, (user, chat) => {
                        sockets.emit(user.sid, 'loadChat', {
                            chat: chat
                        });
                        logger.logDeb('All messages in loaded chat ' + JSON.stringify(c.messages));
                    });
                    chatFound = true;
                }
            });
            //Otherwise create a new chat, save it in the database and emit the newChat to all participants
        }
        if (!chatFound) {
            require('crypto').randomBytes(48, function(err, buffer) {
                let token = buffer.toString('hex');
                logger.logDeb("New chat with users " + chat.participants);
                db.create('chats', {
                    token: token
                }, {
                    token: token,
                    name: participants.length > 2 && chat.name ? chat.name : '',
                    isGroup: participants.length > 2,
                    isPrivate: participants.length === 2,
                    participants: participants,
                    origin: user.username,
                    messages: []
                }, new emitNewChat(user, participants).callback);
            });
        }
    };
}

/*Adapts the chat to the receiver by changing the chats name in private chat to the name of the other user participating.<br>
 * Iterates over all messages to set whether he was receiver or sender of a message.<br>
 * @param user Object user that is sender of new or loaded chat
 * @param chat Object chat that will be emitted to participants
 * @param callback Function emits user and chat on call*/
function adaptChatToReceiver(user, chat, callback) {
    logger.logDeb('Openchat adapting chat to receiver ' + JSON.stringify(chat));
    if (chat.isPrivate) {
        chat.name = chat.participants[0] === user.username ? chat.participants[1] : chat.participants[0];
    }
    chat.messages.forEach((m) => {
        if (m.origin !== user.username) {
            m.isReceiver = true;
        } else {
            m.isReceiver = false;
        }
    });
    callback(user, chat);
};

/*If the chat already existed and is loaded from db it's just send to the user with a loadChat event.<br>
 * @param user Object user that wanted to load the chat
 * @param clientChat Object chat that was send by the client */
function chatLoaded(user, clientChat) {
    this.callback = function(storedChat) {
        if (storedChat) {
            logger.logDeb('Openchat loading stored chat' + clientChat.name);
            adaptChatToReceiver(user, storedChat, (user, chat) => {
                sockets.emit(user.sid, 'loadChat', {
                    chat: chat
                });
            });
        } else {
            logger.logErr("Chat with token " + clientChat.token + " couldn't be loaded");
        }
    };
}

/*If token on chat exists the chat exists and needs to be read from the database,<br>
 * otherwise it will be created as a new chat.<br>
 * @param chat Object chat information send by the client for chat load or creation*/
function userLoadedChat(chat) {
    this.callback = function(user) {
        if (user) {
            logger.logDeb("Loading chat by chatid " + chat.token);
            if (chat.token) {
                logger.logDeb('Openchat chat exists and is loaded');
                db.read('chats', {
                    token: chat.token
                }, new chatLoaded(user, chat).callback);
            } else {
                logger.logDeb('Openchat chat will be created');
                db.readAll('chats', new chatsByContactsLoaded(user, chat).callback);
            }
        } else {
            logger.logErr('User for chat creation not found');
        }
    };
}

function exec(sessionId, chat) {
    logger.logDeb("User with sessionId " + sessionId + "loads chat");
    db.read('users', {
        sid: sessionId
    }, new userLoadedChat(chat).callback);
}

module.exports = {
    exec: exec
}
