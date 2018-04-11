/*Initalizes chats for the chat list on client side.*/
let logger = require('../../../modules/logger.js');
let db = require('../../../modules/database.js');
let sockets = require('../../../modules/sockets.js');

/*As soon as the users that participate on the new chat are loaded we emit the information about the new chat, so it can be added to the chats list*/
function usersLoaded(user) {
    this.callback = function(users) {
        if (users && Object.keys(users).length !== 0) {
            let contacts = [];
            for (ui in users) {
                if (users[ui].sid !== user.sid) {
                    contacts.push({
                        name: users[ui].username,
                        lastLogin: users[ui].lastLogin
                    });
                }
            }
            sockets.emit(user.sid, 'allContacts', {
                contacts: contacts
            });
            logger.logDeb("Contacts loaded and emitted " + JSON.stringify(contacts));
        } else {
            logger.logDeb("No contacts to load and emit");
        }
    }
}

/*Chats get filtered. User only receives chats when he is a participant.*/
function chatsLoaded(user) {
    this.callback = function(chats) {
        if (chats) {
            let filteredChats = []
            for (ki in chats) {
                let participants = chats[ki].participants;
                participants.forEach((p) => {
                    if (p === user.username) {
                        filteredChats.push(chats[ki]);
                        let fc = filteredChats[filteredChats.length - 1];
                        //If there are only two users within the chat. The chat name becomes the name of the other party.
                        if (fc.participants.length === 2) {
                            fc.name = fc.participants[0] === user.username ? fc.participants[1] : fc.participants[0];
                        }
                    }
                });
            }
            sockets.emit(user.sid, 'allChats', {
                chats: filteredChats
            });
            logger.logDeb("Chats loaded and emitted " + JSON.stringify(filteredChats));
        } else {
            logger.logDeb("No chats to load and emit");
        }
        db.readAll('users', new usersLoaded(user).callback);
    }
}

/*If the user read from the database by the given sessionId is successful, continue initializing chat*/
let initAllChats = (user) => {
    if (!user) {
        logger.logErr("New user in chat not in database");
    } else {
        logger.logDeb("New User in chat");
        db.readAll('chats', new chatsLoaded(user).callback);
    }
};

let exec = (sessionId) => {
    db.read('users', {
        sid: sessionId
    }, initAllChats);
};

module.exports = {
    exec: exec
}
