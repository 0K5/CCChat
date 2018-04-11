/*Returns all files in ./services by given file extension*/
let logger = require('./logger.js');
let fs = require('fs-extra');
let path = require('path');

/*Returns all files in ./services by given file extension
 * @param fileExtension String file extension to search for f.e. ".route.js"
 * @param callback Function passes array of found files*/
let getServiceFiles = (fileExtension, callback) => {
    let allFiles = fs.readdirSync(path.resolve(__dirname, '../services'));
    allFiles = allFiles.filter((dir) => fs.statSync(path.resolve(__dirname, '../services/' + dir)).isDirectory());
    allFiles = allFiles.filter((dir) => {
        try {
            fs.readFileSync(path.resolve(__dirname, '../services/' + dir + '/' + dir + fileExtension));
            return true;
        } catch (err) {
            return false;
        }
    });
    allFiles = allFiles.map((dir) => path.join(__dirname, '../services/' + dir + '/' + dir + fileExtension));
    logger.logDeb('servicefiles get allFiles returned ' + JSON.stringify(allFiles));
    return callback(allFiles);
};

module.exports = {
    get: getServiceFiles
}
