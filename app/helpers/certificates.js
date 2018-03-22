let logger = require('./logger.js');
let fs = require('fs-extra');
let key = undefined;
let cert = undefined;
let ca = undefined;

if (fs.existsSync('./certs/client-key.pem')){
	key = fs.readFileSync('./certs/client-key.pem');
}
if (fs.existsSync('./certs/client-cert.pem')){
	cert = fs.readFileSync('./certs/client-cert.pem');
}
if (fs.existsSync('./certs/client-ca.pem')){
	ca = fs.readFileSync('./certs/client-ca.pem') || null;
}
if (!key){
	logger.logWarn('Certificates key-file not loaded');
}
if (!cert){
	logger.logWarn('Certificates cert-file not loaded');
}
if (!ca){
	logger.logWarn('Certificates ca-file not loaded');
}
module.exports = {
	key : key,
	cert : cert,
	ca : ca
};
    
    
    
    
    
    
    
    
    
    
    
    
    
   
    
    
    
    
    
    
    
    
    
    
    
    
    
    

