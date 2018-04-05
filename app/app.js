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

	let getServiceFiles = (fileExtension) => {
        let allFiles = fs.readdirSync('./services');
        allFiles = allFiles.filter((dir) => fs.statSync('./services/' + dir).isDirectory());
        allFiles = allFiles.filter((dir) => {
			try{
				fs.readFileSync('./services/'+dir+'/'+dir+fileExtension);
				return true;
			}catch(err){
				logger.logErr('No '+fileExtension+' in service "./services/'+dir+'/"');
				return false;
			}
		});
        allFiles = allFiles.map((dir) => './services/' + dir + '/' +dir+fileExtension);
		return allFiles;
	};

    let setUpExpress = (app, server) => {
        logger.logInfo('Initializing express application');
        app.use(express.static(path.join(__dirname, '/public')));
        app.use('/', require('./services/index/index.route.js'));
		let allRoutes = getServiceFiles('.route.js');
		allRoutes.forEach((routeFile) => {
			let route = routeFile.substring(routeFile.lastIndexOf('/'));
			route = route.substring(0, route.indexOf('.'));
			app.use(route, require(routeFile));
		});
    };

    let setUpHandlebars = (app, server) => {
        logger.logInfo('Setting up handlebars');
        let handlebars = require('express-handlebars');
		let allViews = getServiceFiles('.view.hbs');
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

    let setUpSockets = (app, server, session, storage) => {
        require('./helpers/sockets.js').init(app, server, session, storage, setUpDatabase);
    };

    let setUpSessions = (app, server) => {
        require('./helpers/sessions.js').init(app, server, setUpSockets);
    };

    require('./helpers/server.js').init(app, setUpSessions);
})();

