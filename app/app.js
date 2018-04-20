(() => {
    let logger = require('./modules/logger.js');
    let servicefiles = require('./modules/servicefiles.js');
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
        ".fx": "application/fx"
    };
    express.static.mime.define(mimeTypes);

    /*Set up express an routes, so that f.e. https://localhost:3000/login is called the route will be in 
     * ./services/login/login.route.js*/
    let setUpExpress = (app, server) => {
        logger.logInfo('Initializing express application');
        app.use(express.static(path.join(__dirname, '/public')));
        app.use('/', require('./services/index/index.route.js'));
        servicefiles.get('.route.js', (allRoutes) => {
            allRoutes.forEach((routeFile) => {
                let route = routeFile.substring(routeFile.lastIndexOf('/'));
                route = route.substring(0, route.indexOf('.'));
                app.use(route, require(routeFile));
            });
        });
		logger.logInfo('Server started and ready');
    };

    /*Set up handlebars, all handlebar files need to be in one folder... this corrupts the service folder structure
     * so the .views.hbs files for handlebars are copied to ./tmp/views on start*/
    let setUpHandlebars = (app, server) => {
        logger.logInfo('Setting up handlebars');
        let handlebars = require('express-handlebars');
        servicefiles.get('.view.hbs', (allViews) => {
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
            let tmpViews = path.resolve(__dirname + '/tmp/views');
            if (!fs.existsSync(tmpViews)) {
                fs.ensureDirSync(tmpViews);
            }
            //Copies files from services folder to ./tmp/views/
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
        });
    };

    let setUpDatabase = (app, server) => {
        require('./modules/database.js').init(app, server, setUpHandlebars);
    };

    let setUpSockets = (app, server, session, storage) => {
        require('./modules/sockets.js').init(app, server, session, storage, setUpDatabase);
    };

    let setUpSessions = (app, server) => {
        require('./modules/sessions.js').init(app, server, setUpSockets);
    };
	
	let setUpServer = (app) => {
		require('./modules/server.js').init(app, setUpSessions);
	};

	require('./modules/config.js').init(app, setUpServer);
})();
