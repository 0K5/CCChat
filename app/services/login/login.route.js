/*
 * Route for <<baseUrl>>/login 
 * */
let logger = require('../../modules/logger.js');
let db = require('../../modules/database.js');
let sockets = require('../../modules/sockets.js');
let express = require('express');
let bcrypt = require('bcrypt');
let router = express.Router();
let ExpressBrute = require('express-brute');
let MemCacheStore = require('express-brute-memcached');
let moment = require('moment');
let store = new ExpressBrute.MemoryStore();
moment.locale('de');

/*Callback on to much dismissed login attempts to prevent bruteforce attacks<br>
 * @param nextPossibleLoginTime Object date when the next login is possible*/
let failCallback = function(req, res, next, nextPossibleLoginTime) {
    res.send({
        err: "Too many failed attempts in a short period of time, please try again " + moment(nextPossibleLoginTime).fromNow()
    });
};

/* Bruteforce prevention will start slowing down requests after 5 failed attempts */
let userBruteforce = new ExpressBrute(store, {
    freeRetries: 5,
    minWait: 5 * 60 * 1000, // 5 minutes
    maxWait: 60 * 60 * 1000, // 1 hour,
    failCallback: failCallback
});

router.get('/', (req, res, next) => {
    db.read('users', {
        sid: req.session.id
    }, function(user) {
        if (user) {
            res.redirect('chat');
        } else {
            res.render('login.view.hbs', {
                title: 'CCChat Login'
            });
        }
    });
});

/*On Login attempt bcrypt modules compares saved passwords.<br>
 * Then the users sessionId is updated and the user is logs in with redirect to <<baseUrl>>/chat */
function loginAttempt(req, res, next) {
    this.callback = function(user) {
        if (user) {
            bcrypt.compare(req.body.password, user.password, function(err, ret) {
                if (ret) {
                    req.brute.reset(() => {
                        db.update('users', {
                            username: req.body.username
                        }, {
                            sid: req.session.id,
                            loggedIn: 1,
                            lastLogin: moment().format('LLLL')
                        }, (user) => {
                            if (user) {
                                logger.logDeb("Login successful redirect to chat");
                                res.send({
                                    url: 'chat'
                                });
                            } else {
                                logger.logErr("User Login failed on user update");
                            }
                        });
                    });
                } else {
                    res.send({
                        err: 'The password is wrong. Please try again'
                    });
                }
            });
        } else {
            res.send({
                err: 'The username is not known. Please register as a new User'
            });
        }
    };
}

router.post('/attempt',
    userBruteforce.getMiddleware({
        key: function(req, res, next) {
            next(req.body.username);
        }
    }),
    function(req, res, next) {
        db.read('users', {
            username: req.body.username
        }, new loginAttempt(req, res, next).callback);
    }
);

/*Called when a new user tries to register. <br>
 * Checks for equality of password and password repitition.<br>
 * Creates bcrypt hashed password to save in database.<br>
 * Saves user to database, logs in user by redirect to <<baseurl>>/chat<br> 
 * and informs everyone that a new contact exists*/
function registerAttempt(req, res, next) {
    this.callback = function(user) {
		var passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        if (user) {
            res.send({
                err: 'The email is already registered'
            });
        } else if (req.body.password !== req.body.passwordrep) {
            res.send({
                err: 'The passwords do not match'
            });
		} else if (!passwordRegex.test(req.body.password)){
            res.send({
                err: 'The password is not strong enough. It has to contain a small and a large letter.<br> At least one number, one special character (!,@,#,\$,%,\^,&,\*) and has to be 8 characters long.'
            });
        } else {
            logger.logDeb("Creating hash from password");
            bcrypt.hash(req.body.password, 10, function(err, hash) {
                if (err) {
                    logger.logErr('Error on password hash creation ' + err);
                } else {
                    logger.logDeb('Register create new user');
                    db.create('users', {
                        sid: req.session.id,
                    }, {
                        sid: req.session.id,
                        username: req.body.username,
                        password: hash,
                        loggedIn: 1,
                        lastLogin: moment().format('LLLL')
                    }, (user) => {
                        if (user) {
                            logger.logDeb("Register successful redirect to chat");
                            res.send({
                                url: 'chat'
                            });
                            sockets.broadcast(user.sid, 'newContact', {
                                contact: {
                                    name: user.username,
                                    lastLogin: user.lastLogin
                                }
                            });
                        } else {
                            logger.logErr("User Register failed on user creation");
                        }
                    });
                }
            });
        }
    };
}

router.post('/register', (req, res, next) => {
    db.read('users', {
        username: req.body.username
    }, new registerAttempt(req, res, next).callback);
});

module.exports = router;
