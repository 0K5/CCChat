/*Sets up server on start*/
let server = undefined;
let logger = require('./logger.js');
let https = true;

/*Initializes https server. If the cert file isn't available it falls back to http.
 * @param app Object application created in ./app.js
 * @param next Function to be called on success*/
let initServers = (app, next) => {
    logger.logInfo('Setting up Server');
    let certificates = require('./certificates.js');
    let http = require('http');
    let https = require('https');
    let port = 3000;
    let key = certificates.key;
    let cert = certificates.cert;
    let ca = certificates.ca;
    if (key && cert && https) {
        logger.logInfo('Using https');
        let forceSsl = require('express-force-ssl');
        app.use(forceSsl);
        let options = {
            key: key,
            cert: cert,
            ca: ca
        };
        server = https.createServer(options, app).listen(port);
    } else {
        logger.logInfo('Using http');
        server = http.createServer(app).listen(port);
    }
    return next(app, server);
};

module.exports = {
    init: server || initServers
}
