let server = undefined;
let logger = require('./logger.js');

let initServers = (app, next) => {
    logger.logInfo('Setting up Server');
    let certificates = require('./certificates.js');
    let http = require('http');
    let https = require('https');
	let port = 3000;
	let key = certificates.key;
	let cert = certificates.cert;
	let ca = certificates.ca;
    if (key && cert) {
        let forceSsl = require('express-force-ssl');
        app.use(forceSsl);
        let options = {
            key: key,
            cert: cert,
            ca: ca
        };
        server = https.createServer(options, app).listen(port);
    }else{
		server = http.createServer(app).listen(port);
	}
	return next(app, server);
};

module.exports = {
	init : server || initServers
}
