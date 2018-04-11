let logger = require('../../modules/logger.js');
let db = require('../../modules/database.js');
let express = require('express');
let router = express.Router();

function VerifySession (req, res, next){
	this.callback = function(user){
		if(user && user.loggedIn === 1){
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
