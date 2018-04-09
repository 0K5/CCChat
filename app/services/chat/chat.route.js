let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');
let express = require('express');
let router = express.Router();

function loadedChatMessaging(sessionId, data){
	this.callback = function(chat){
		if(chat){
				
		} else {
			logger.logDeb("Chat for messaging couldn't be loaded");
		}
	};
}


function VerifySession (req, res, next){
	this.callback = function(user){
		if(user && user.loggedIn === 1){
			logger.logDeb("User : " + user.username + " tries to access the chat");
			res.render('chat.view.hbs', {
				title: 'CCChat',
			});
		}else{
			res.redirect('https://' + req.get('host') + '/login');
		}
	};
}

router.get('/', (req, res, next) => {
	db.read('users', {sid : req.session.id}, new VerifySession(req, res).callback);
});

router.use('/messages', require('../messages/messages.route.js'));

router.use('/contacts', require('../contacts/contacts.route.js'));

module.exports = router;
