(() => {
    let logger = require('./helpers/logger.js');
    let server = undefined;
    let express = require('express')
    let app = express();

    logger.logInfo('Setting up App');
    let fs = require('fs-extra');
    let path = require('path');
    let bodyParser = require('body-parser');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    let mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpg": "image/jpeg",
        ".fx": "application/fx",
        ".babylon": "application/babylon",
        ".babylonmeshdata": "application/babylonmeshdata"
    };
    express.static.mime.define(mimeTypes);
    let setUpExpress = (app, server) => {
        logger.logInfo('Initializing express application');
        app.use(express.static(path.join(__dirname, '/public')));
        app.use('/', require('./services/index/index.route.js'));
    };

    let setUpHandlebars = (app, server) => {
        logger.logInfo('Setting up handlebars');
        let handlebars = require('express-handlebars');
        let allViews = fs.readdirSync('./services');
        allViews = allViews.filter((dir) => fs.statSync('./services/' + dir).isDirectory());
        allViews = allViews.filter((dir) => {
			try{
				fs.readFileSync('./services/'+dir+'/'+dir+'.view.hbs');
				return true;
			}catch(err){
				logger.logErr('No view in service "./services/'+dir+'/"');
				return false;
			}
		});
        allViews = allViews.map((dir) => './services/' + dir + '/' +dir+'.view.hbs');
        let copyCount = allViews.length;
        let setViewsToTmp = () => {
            allViews = allViews.map((dir) => path.join(__dirname + 'services/' + dir));
            app.engine('hbs', handlebars({
                extname: 'hbs',
                defaultLayout: 'main',
                layoutsDir: __dirname + '/layouts/'
            }));
            app.set('views', path.join(__dirname + '/tmp/views/'));
            app.set('view engine', '.hbs');
            setUpExpress(app, server);
        };
        allViews.forEach((dir) => {
            if (dir.endsWith('.view.hbs')) {
                fs.copy(dir, './tmp/views/' + dir.substring(dir.lastIndexOf('/')), (err) => {
                    if (err) {
                        logger.logErr(err);
                    }
                    copyCount--;
                    if (copyCount === 0) {
                        setViewsToTmp(app, server);
                    }
                })
            }
        });
    };

	let setUpDatabase = (app, server) => {
		require('./helpers/database.js').init(app,server, setUpHandlebars);
	};

    let setUpSockets = (app, server) => {
        require('./helpers/sockets.js').init(app, server, setUpDatabase);
    };

    let setUpSessions = (app, server) => {
        require('./helpers/sessions.js').init(app, server, setUpSockets);
    };

    require('./helpers/server.js').init(app, setUpSessions);
})();
