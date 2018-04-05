let logger = require('../../helpers/logger.js');
let express = require('express');
let router = express.Router();
let db = require('../../helpers/database.js');

function VerifySession (req, res, next){
	this.callback = function(user){
		if(user){
			res.send('chat');
		}else{
			res.redirect('https://' + req.get('host') + '/login');
		}
	};
}

router.get('/', (req, res, next) => {
	db.read('users', req.session.id, new VerifySession(req,res,next).callback);
});

module.exports = router;
