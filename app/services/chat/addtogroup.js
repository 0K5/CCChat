<<<<<<< HEAD
/* Functionality to add a contact to a chat group*/
let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let sockets = require('../../helpers/sockets.js');
let moment = require('moment');
moment.locale('de');

/* Emits the information, that a new contact is added to the group 
 * @param msg Object the message that will be added to the chat with the contact thats added to the group
 */
function emitGroupAdd(chat, msg, p){
	this.callback = function(user){
		if(user){
			logger.logDeb('Emitting message ' + JSON.stringify(msg) + ' to user ' + user.username);
			sockets.emit(user.sid, 'addToGrp', {msg: msg, chat: chat});	
		} else {
			logger.logErr('Add contact to chat loading user ' + p + ' failed');
		}
	};
}

/*On successul updated chat get the last message (where the information of the add-new-contact action is saved) and read all participants from chat by name to get sessionId for emit-Action
	* @param addCnt Number number of new contact(s) added to the chat
	* @param chat the chat where the contact(s) are added*/
function chatUpdated(user, addCnt, chat){
	this.callback = function(c){
		if(c){
			for(let i=(chat.messages.length-addCnt); i<chat.messages.length; i++){
				let msg = chat.messages[i];
				chat.participants.forEach((p) => {
					logger.logDeb('Add contact to chat emitting msg to ' + p);
					db.read('users',{username: p}, new emitGroupAdd(chat, msg, p).callback);
				});
			}
		} else {
			logger.logErr('Add contact on chat ' + chatName + ' failed on chat update');
		}
	};
}

/*If the chat is successfully loaded from the database ŒŒ*/
function chatLoaded(user, sendChat){
	this.callback = function(storedChat){
		if(storedChat){
			let addCnt = 0;
			sendChat.participants.forEach((p) => {
				let isInChat = false;
				storedChat.participants.forEach((sp) =>{
					if(p === sp){
						isInChat = true;
					}
				});
				if(!isInChat){
					addCnt++;
					storedChat.participants.push(p);
					storedChat.messages.push({
						token: storedChat.token,
						text: p + ' added to chat by ' + user.username,
						timestamp: moment().format('LLLL'),
					});
				}
			});
			if(addCnt > 0){
				logger.logDeb('Add contact to chat update on chat ' + storedChat.name);
				db.update('chats',{token: storedChat.token}, storedChat, new chatUpdated(user, addCnt, storedChat).callback);
			}
		} else {
			logger.logErr('Chat with name ' + sendChat.name + ' not in database');
		}
	};
}

function userLoaded(sessionId, chat){
	this.callback = function(user){
		if(user){
			db.read('chats', {token: chat.token}, new chatLoaded(user, chat).callback);
		} else {
			logger.logErr('User with sessionId ' + sessionId + ' not in database');
		}
	};
}

function exec(sessionId, chat){
	logger.logDeb("User with sessionId " + sessionId + "loads chat");
	db.read('users', {sid: sessionId}, new userLoaded(sessionId, chat).callback);
}

module.exports = {
	exec : exec
}
