/*
 * Initializes sessions for application
 * */
let logger = require('./logger.js');
let certificates = require('./certificates.js');
let session = require('express-session');
let redisStore = require('connect-redis')(session);
let redis = require('redis');
let FileStore = require('session-file-store')(session);
let storage = new FileStore({
    path: './tmp/sessions/',
    useAsync: 6479,
    reapInterval: 5000,
    maxAge: 10000
});
let tls = require('tls');
let ssl = {
    key: certificates.key,
    cert: certificates.cert,
    ca: certificates.ca
};
let options = {};
let client = undefined;

/*Sets up the session<br>
 * @param storage Object the storage used to save the session
 * @param session Object the session 
 * @param app Object the application
 * @param server Object the server
 * @param next Function passes app, server, session and storage
 * */
let setUpSession = (storage, session, app, server, next) => {
    let sess = session({
        key: 'CCChat2017',
        secret: '14gty8i9oph1q45o;pgh3p0[987oui2dh3q2l4iugfrh',
        store: storage,
        saveUninitialized: true,
        resave: true,
        cookie: {
            path: '/',
            httpOnly: false,
            secure: true,
            maxAge: 365 * 24 * 60 * 60 * 1000
        }
    });
    app.use(sess);
    next(app, server, sess, storage);
}

/*Sets up the session storage to store sessions
 * @param app Object application
 * @param server Object the server
 * @param next Function passes app, server, session, storage
 * */
let setUpSessionStorage = (app, server, next) => {
    logger.logInfo('Setting up storage for sessions');
    if (ssl.key && ssl.cert && ssl.ca) {
        options = {
            tls: ssl
        };
    } else {
        options = {
            no_ready_check: true
        };
    }
    client = redis.createClient(11379,
        'redis-11379.c11.us-east-1-2.ec2.cloud.redislabs.com',
        options);
    client.auth('UUJKCfW3vEClG6Zh6dvE9FfggYtBcYvi', function(err) {
        if (err) {
            logger.logWarn("Connection to redislab couldn't be established");
        }
    });
    client.on('error', function(e) {
        logger.logWarn("Connection to redislabs could'nt be established");
        logger.logWarn(e);
        client.end(true);
        client = redis.createClient({
            host: 'localhost',
            port: 6379
        });
        client.on('error', function(e) {
            logger.logWarn("Connection to locale redis database couldn't be established");
            logger.logWarn(e);
            client.end(true);
            setUpSession(storage, session, app, server, next);
        });
        client.on('connect', function() {
            storage = new redisStore({
                host: 'localhost',
                port: 6479,
                client
            });
            setUpSession(storage, session, app, server, next);
        });
    });
    client.on('connect', function() {
        storage = new redisStore({
            host: 'localhost',
            port: 6479,
            client,
            ttl: 260
        });
        setUpSession(storage, session, app, server, next);
    });
};

module.exports = {
    init: setUpSessionStorage
};
