/* 
 * Module for logging any sort of data<br>
 * All logs are also saved in ./tmp/logs/<br>
 * usage let logger = require('./modules/logger.js);<br>
 * logger.logInfo(message)
 * */
let fs = require('fs-extra');
let path = require('path');
let isDebug = true;

/*Creates logger by given and supported loglevel and returns a function that can be called with a log-message.<br>
 * Logs will also be stored within ./tmp/logs/ folder<br>
 * @param logLevel String loglevel of upcoming log*/
let log = (logLevel) => {
    let winston = require('winston');
    let dir = path.resolve(__dirname, '../tmp/logs/');
    if (!fs.existsSync(dir)) {
        fs.ensureDirSync(dir);
    }
    let logger = new winston.Logger({
        transports: [
            new winston.transports.File({
                level: 'info',
                filename: typeof global.it === 'function' ? dir + '/test.log' : dir + '/all.log',
                handleExceptions: true,
                json: true,
                maxsize: 5242880,
                maxFiles: 5,
                colorize: false
            }),
            new winston.transports.Console({
                level: 'debug',
                handleExceptions: true,
                json: false,
                colorize: true
            })
        ],
        exitOnError: false
    });
    /*Function for logging on given logLevel
     * @param message String to be logged on console and in ./tmp/logs/foo.log file*/
    return (message) => {
        if (logLevel === 'debug' && !isDebug) {
            return false;
        } else {
            logger.log(logLevel, message);
        }
    }
};

module.exports = {
    logInfo: log('info'),
    logWarn: log('warn'),
    logErr: log('error'),
    logVerb: log('verbose'),
    logDeb: log('debug'),
    logSill: log('silly')
};
