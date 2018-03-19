(() => {
	let logger = require('./helpers/logger.js');
    let path = require('path');
    let hostname = 'localhost';
    let sPort = 3000;
    let port = 4000;
    let handlebars = require('express-handlebars');
    logger.logInfo('Setting up App');
    let express = require('express')
    let app = express();
    let fs = require('fs');
    let forceSsl = require('express-force-ssl');
    app.use(forceSsl);
    app.use(express.json());

    logger.logInfo('Setting up Server');
    let https = require('https');
    let key = fs.readFileSync('ssl/client-key.pem');
    let cert = fs.readFileSync('ssl/client-cert.pem');
    let options = {
        key: key,
        cert: cert
    };

    let httpsServ = https.createServer(options, app).listen(sPort);
    let http = require('http');
    let httpServ = http.createServer(app).listen(port);

    logger.logInfo('Setting up redisstore');
    let session = require('express-session');
    let redisStore = require('connect-redis')(session);
    let redis = require('redis');
    let tls = require('tls');
    let ssl = {
        key: key,
        cert: cert
    };
    let client = redis.createClient(sPort, hostname, {
        tls: ssl
    });
    app.use(session({
        secret: '14gty8i9oph1q45o;pgh3p0[987oui2dh3q2l4iugfrh',
        store: new redisStore({
            host: 'localhost',
            port: 6479,
            client,
            ttl: 260
        }),
        saveUninitialized: false,
        resave: false
    }));
	
    logger.logInfo('Setting up routes');

    logger.logInfo('Setting up sockets');
    let io = require('socket.io')(httpsServ);
    io.on('connection', (socket) => {
        console.log(socket.handshake.cookies);
    });

    logger.logInfo('Setting up handlebars');
    app.engine('hbs', handlebars({
        extname: 'hbs',
        defaultLayout: 'main',
        layoutsDir: __dirname + '/views/layouts/'
    }));
    app.set('views', path.join(__dirname, 'views/'));
    app.set('view engine', 'hbs');

    logger.logInfo('Initializing express application');
    app.use(express.static(path.join(__dirname, '/public')));
    app.get('/', function(req, res, next) {
		logger.logDeb('Session: ' + req.session);
        res.render('index.hbs', {
            title: 'RPSGame'
        });
    });
})();
