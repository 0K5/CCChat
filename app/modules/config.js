/*
 * Returns all files in ./services by given file extension
 * */
let logger = require('./logger.js');
let fs = require('fs-extra');
let path = require('path');
let SecureConf = require('secure-conf');
let pw = require("pw");
let config = undefined;

/*Calls the callback with the decrypted and JSON formatted config file, that contains usernames and pw for databases<br>
 * @param callback Function passes content of config file*/
let decryptConfFile = (app, next) => {
	let ef = path.resolve(__dirname, "../config.json.enc");
	let sconf = new SecureConf();
	sconf.decryptFile(ef, function(err, file, content) {
	        if (err) {
	            logger.logInfo('Wrong password unable to retrieve the configuration contents');
	        } else {
	            config = JSON.parse(content);
	            next(app, config);
	        }
	});
};

let encryptConfFile = () => {
	let sconf = new SecureConf();
	pw(function(password){
	    sconf.encryptFile(
	        path.resolve(__dirname, "../../config.json"),
	        path.resolve(__dirname, "../config.json.enc"),
	        function(err, f, ef, ec) {
	            if (err) {
	                console.log("failed to encrypt %s, error is %s", f, err);
	            } else {
	                console.log("encrypt %s to %s complete.", f, ef);
	                console.log("encrypted contents are %s", ec);
	            }
	        }
	    );
	})
};

let getConfig = (callback) => {
	if(!config){
		decryptConfFile(callback);
	}else{
		callback(config);
	}
};

module.exports = {
    init: decryptConfFile,
	get: getConfig,
	enc: encryptConfFile
}
