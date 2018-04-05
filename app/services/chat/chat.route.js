let logger = require('../../helpers/logger.js');
let sockets = require('../../helpers/sockets.js');
let express = require('express');
let router = express.Router();
let db = require('../../helpers/database.js');


function usersLoaded(sessionId, socket){
	this.callback = function(users){
		if(users && Object.keys(users).length !== 0){
			let contacts = [];
			for(ui in users){
				if(users[ui].id !== sessionId){	
					contacts.push({
						name: users[ui].username,
						lastOnline: users[ui].lastOnline
					});
				}
			}
			socket.emit('allContacts', {contacts: contacts});
			logger.logDeb("Contacts loaded and emitted");
		} else {
			logger.logDeb("No contacts to load and emit");
		}
	}
}

function chatsLoaded(sessionId, socket){
	this.callback = function(chats){
		if(chats && Object.keys(chats).length !== 0){
			socket.emit('allChats', {chats: chats});
			logger.logDeb("Chats loaded and emitted");
		} else {
			logger.logDeb("No chats to load and emit");
		}
		db.readAll('users', new usersLoaded(sessionId, socket).callback);
	}
}

function loadChats(sessionId, socket){
	if(!socket){
		logger.logErr("Chat socket not defined");
	} else {
		logger.logDeb("Chat socket initialized");
		db.read('chats', {id: sessionId}, new chatsLoaded(sessionId, socket).callback);
	}
}

let initIo = () => {
	let io = sockets.io();
	if(io){
		io.on('connection', (socket) => {
			let sessionId = socket.handshake.signedCookies['CCChat2017'];
			logger.logDeb('Socket connected with id ' + sessionId)
			loadChats(sessionId, socket);
		});
		io.sockets.on('disconnect', function (socket) {
			let sessionId = socket.handshake.signedCookies['CCChat2017'];
		});
	}else{
		logger.logErr('Socket is undefined');
	}
};

function VerifySession (req, res, next){
	this.callback = function(user){
		if(user && user.loggedIn === 1){
			logger.logDeb("User : " + user.username + " tries to access the chat");
			res.render('chat.view.hbs', {
				title: 'CCChat',
			});
			initIo();
		}else{
			res.redirect('https://' + req.get('host') + '/login');
		}
	};
}


router.get('/', (req, res, next) => {
	db.read('users', {id : req.session.id}, new VerifySession(req, res).callback);
});

router.use('/messages', require('../messages/messages.route.js'));

router.use('/contacts', require('../contacts/contacts.route.js'));

module.exports = router;
