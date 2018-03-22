let express = require('express');
let router = express.Router();
let logger = require('../../helpers/logger.js');

//let Renderer = require('../../helpers/modulefactory.js').get('Renderer.js');

router.get('/', (req, res, next) => {
	logger.logDeb('SessionId: ' + req.session.id);
    res.render('empty.view.hbs', {
    title: 'RPSGame'
	});
});

module.exports = router;
