/*
 * Initializes route for <<baseUrl>>/chat
 */
let logger = require('../../modules/logger.js');
let db = require('../../modules/database.js');
let express = require('express');
let router = express.Router();

/*Verfies user and loggedIn status. If user is invalid or logged out redirect to <<baseUrl>>/login*/
function VerifySession (req, res, next){
	this.callback = function(user){
		if(user){
			logger.logDeb("User : " + user.username + " tries to access the chat");
			res.render('chat.view.hbs', {
				title: 'CCChat',
				user: user.username
			});
		}else{
			res.redirect('https://' + req.get('host') + '/login');
		}
	};
}

router.get('/', (req, res, next) => {
	db.read('users', {sid : req.session.id}, new VerifySession(req, res).callback);
});

module.exports = router;
