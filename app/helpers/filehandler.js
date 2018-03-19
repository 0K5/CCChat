let readFile = () => {
    let fs = require('fs');
    let logger = require('./logger.js');
    return (path, callback) => {
		logger.logInfo('Startet read file operation');
        fs.readFile(path, (err, data) => {
            logger.logInfo('Open file at ' + path + ' for read operation');
            if (err) {
                logger.logErr('Failed to open file at ' + path + ' for read operation');
                throw "No readable file";
            }
            logger.logInfo('Successfully read ' + path);
            return callback(data);
        });
    };
};

let writeFile = () => {
    let fs = require('fs');
    let logger = require('./logger.js');
    return (path, content, callback) => {
		logger.logInfo('Startet write file operation');
        fs.writeFile(path, content, (err, data) => {
            logger.logInfo('Open file at ' + path + ' for write operation');
            if (err) {
                logger.logErr('Failed to open file at ' + path + ' for write operation');
                throw "No readable file";
            }
            logger.logInfo('Successfully wrote content to ' + path);
            return callback();
        });
    };
};

module.exports = {
	read : readFile(),
	write : writeFile()
};
