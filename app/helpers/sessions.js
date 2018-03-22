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

let setUpSession = (storage, session, app, server, next) => {
    app.use(session({
        secret: '14gty8i9oph1q45o;pgh3p0[987oui2dh3q2l4iugfrh',
        store: storage,
        saveUninitialized: false,
        resave: false
    }));
	next(app, server);
}

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
    client.on('error', function() {
        logger.logWarn("Connection to redislabs could'nt be established");
        client.end(true);
        client = redis.createClient();
        client.on('error', function() {
            logger.logWarn("Connection to locale redis database couldn't be established");
            client.end(true);
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