/*
 * Route when <<baseUrl>>/ is called
 */
let express = require('express');
let router = express.Router();
let logger = require('../../modules/logger.js');
let db = require('../../modules/database.js');

/*Verifies the session, if the session is an active user it redirects to <<baseUrl>>/chat*/
function VerifySession(req, res, next) {
    this.callback = function(user) {
        if (user && user.loggedIn === 1) {
            res.render('chat.view.hbs', {
                title: 'CCChat'
            });
        } else {
            res.redirect('https://' + req.get('host') + '/login');
        }
    };
}

router.get('/', (req, res, next) => {
    db.read('users', {
        sid: req.session.id
    }, new VerifySession(req, res, next).callback);
});

module.exports = router;
