let log = (logLevel) => {
    let winston = require('winston');
    let logger = new winston.Logger({
        transports: [
            new winston.transports.File({
                level: 'info',
                filename: typeof global.it === 'function' ? './logs/test.log' : './logs/all.log',
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
    return (message) => {
        logger.log(logLevel, message);
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
