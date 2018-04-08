let express = require('express');
let router = express.Router();
let logger = require('../../helpers/logger.js');
let db = require('../../helpers/database.js');

//let Renderer = require('../../helpers/modulefactory.js').get('Renderer.js');

function VerifySession (req, res, next){
	this.callback = function(user){
		if(user){
			res.render('chat.view.hbs', {
				title: 'CCChat'
			});
		}else{
			res.redirect('https://' + req.get('host') + '/login');
		}
	};
}

router.get('/', (req, res, next) => {
	db.read('users', {id: req.session.id}, new VerifySession(req,res,next).callback);
});

module.exports = router;
