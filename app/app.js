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
    let fs = require('fs-extra');
    let forceSsl = require('express-force-ssl');
    let bodyParser = require('body-parser');
    app.use(forceSsl);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));


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

	let setUpSessionStorage = () => {
    logger.logInfo('Setting up storage for sessions');
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
    //TODO: With valid ssl certificate comment in
    //let tls = require('tls');
    //let ssl = {
    //    key: key,
    //    cert: cert
    //};
    let client = redis.createClient(11379,
        'redis-11379.c11.us-east-1-2.ec2.cloud.redislabs.com', {
            no_ready_check: true
            //TODO: With valid ssl certificate replace upper line with:
            //tls: ssl
        });
    client.auth('UUJKCfW3vEClG6Zh6dvE9FfggYtBcYvi', function(err) {
        if (err){
			logger.logWarn("Connection to redislab couldn't be established"); 
		}
    });
	client.on('error', function() {
		logger.logWarn("Connection to redislabs could'nt be established");
		client.end(true);
			client = redis.createClient();
			client.on('error', function(){
				logger.logWarn("Connection to locale redis database couldn't be established");
				client.end(true);
				setUpSession(storage,session);
			});
	});
    client.on('connect', function() {
		storage = new redisStore({
                host: 'localhost',
                port: 6479,
                client,
                ttl: 260
            });
		setUpSession(storage,session);
	});
	};
	setUpSessionStorage();
	let setUpSession = (storage, session) => {
		app.use(session({
            secret: '14gty8i9oph1q45o;pgh3p0[987oui2dh3q2l4iugfrh',
            store: storage,
            saveUninitialized: false,
            resave: false
        }));
        logger.logInfo('Sessions handled over redis storage');
		setUpSockets();
	};
	let setUpSockets = () => {
		logger.logInfo('Setting up sockets');
    	let io = require('socket.io')(httpsServ);
    	io.on('connection', (socket) => {
			logger.logInfo('Socket connected with id '+socket.id)
    	});
		setUpHandlebars();
	};
	let setUpHandlebars = () => {
    	logger.logInfo('Setting up handlebars');
		let allViews = fs.readdirSync('./services');
		allViews = allViews.filter((dir) => fs.statSync('./services/' + dir).isDirectory());
		allViews = allViews.map((dir) => './services/' + dir + '/' + fs.readdirSync('./services/' + dir));
		allViews = allViews.filter((dir) => dir.endsWith('.view.hbs'));
		console.log(allViews);
		let copyCount = allViews.length;
		allViews.forEach((dir) => {
			if(dir.endsWith('.view.hbs')){
				fs.copy(dir, './tmp/views/' + dir.substring(dir.lastIndexOf('/')), (err) => {
					if (err) {
		    		    console.log(err);
		    		}
		    		copyCount--;
		    		if (copyCount === 0) {
		    		    setViewsToTmp();
		    		}
				})
			}
		});
		let setViewsToTmp = () => {
			allViews = allViews.map((dir) => path.join(__dirname + 'services/' + dir));
    		app.engine('hbs', handlebars({
    		    extname: 'hbs',
    		    defaultLayout: 'main',
    		    layoutsDir: __dirname + '/layouts/'
    		}));
    		app.set('views', path.join(__dirname + '/tmp/views/'));
    		app.set('view engine', '.hbs');
			setUpExpress();
		};
	};
	let setUpExpress = () => { 
    	logger.logInfo('Initializing express application');
    	app.use(express.static(path.join(__dirname, '/public')));
    	app.get('/', function(req, res, next) {
    	    logger.logDeb('SessionId: ' + req.session.id);
    	    res.render('empty.view.hbs', {
    	        title: 'RPSGame'
    	    });
    	});
	};
})();
