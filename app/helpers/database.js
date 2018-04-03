let logger = require('./logger.js');
let fs = require('fs');
let mongoose = require('mongoose');
let mongodb = require('mongodb').MongoClient;
let localstorage = require('node-localstorage').LocalStorage;
let database = undefined;
let localdicts = {};

let initDatabase = (app, server, next) => {
	mongoose.Promise = global.Promise;
    if (mongoose.connection.readyState == 0) {
        mongoose
                .connect('mongodb://feEIRHHR34943fojwlscnlkwKNMCKSP3eio24890u38xlm:ojrKJSCMsekowkcE4038ruiefkmCLfmo5u494u2jdoijcr@ds131989.mlab.com:31989/ccchat');
        let mdb = mongoose.connection;
        mdb.on("error", function(){
			logger.logWarn("Couldn't connect to mlab.com. Fallback to local mongodb");
			mongodb.connect('mongodb://localhost:27017/', function(err, db){
				if(err){
					logger.logWarn("Couldn't connect to local mongodb. Fallback to local filestore");
					next(app, server);
				}else{
					logger.logInfo("Connection to local mongodb succeeded");
					database = db.db('ccchat');
					next(app,server);
				}
			});
		});
        mdb.once("open", function (callback) {
            logger.logInfo("Connection to mlab database succeeded");
			database = mdb;
			next(app,server);
        });
    }
}

let getLocal = (dict) => {
	if(dict in Object.keys(localdicts)){
		return localdicts.dict;
	}else{
		let dir = './tmp/database/';
		if(!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
		let localdb = new localstorage(dir + dict);
		localdicts[dict] = localdb; 
		return localdb;
	}
}

let create = (dict, id, data, callback) => {
	if(database === undefined){
		db = getLocal(dict);
		try{
			db.setItem(id, JSON.stringify(data));
			logger.logDeb("Collection "+dict+" created");
			callback(true);
		}catch(err){
			logger.logWarn("Collection "+dict+" couldn't be created");
			logger.logErr(err);
			callback(false);
		}
	}else{
		let insertData = () =>{
		let insData = data;
		insData['_id'] = id;
			database.collection(dict).insertOne(insData, function(err, res){
				if(err){
					update(dict, id, data, callback);
				}else{
					logger.logDeb("Document with id "+id+" created");
					callback(res);
				}
			});
		};
		if(!database.collection(dict)){
			database.createCollection(dict, function(err, res) {
				if(err){
					logger.logWarn("Collection "+dict+" couldn't be created");
					logger.logErr(err);
				}else{
					logger.logDeb("Collection "+dict+" created");
					insertData();
				}
			});
		}else{
			insertData();
		}
	}
};

let read = (dict, id, callback) => {
	if(database === undefined){
		db = getLocal(dict);	
		try{
			logger.logDeb("Document with id "+id+" read");
			let ret = JSON.parse(db.getItem(id));
			callback(ret);
		}catch(err){
			logger.logWarn("Document with id "+id+" couldn't be read");
			logger.logErr(err);
			callback(false);
		}
	}else{
		database.collection(dict).findOne({},function(err, res){
			if(err){
				logger.logWarn("Document with id "+id+" couldn't be read");
				logger.logErr(err);
				callback(false);
			}else{
				logger.logDeb("Document with id "+id+" read");
				callback(res);
			}
		});
	}
};

let update = (dict, id, data, callback) => {
	if(database === undefined){
		db = getLocal(dict);	
		try{
			db.setItem(id, JSON.stringify(data))
			let ret = JSON.parse(db.getItem(id));
			logger.logDeb("Document with id "+id+" updated");
			callback(ret);
		}catch(err){
			logger.logWarn("Document with id "+id+" couldn't be updated");
			logger.logErr(err);
			callback(false);
		}
	}else{
		database.collection(dict).updateOne({'_id':id},{ $set: data},function(err, res){
			if(err){
				logger.logWarn("Document with id "+id+" couldn't be updated");
				logger.logErr(err);
				callback(false);
			}else{
				logger.logDeb("Document with id "+id+" updated");
				callback(res);
			}
		});
	}
};
let remove = (dict, id, callback) => {
	if(database === undefined){
		db = getLocal(dict);	
		try{
			db.removeItem(id);
			logger.logDeb("Document with id "+id+" deleted");
			callback(true);
		}catch(err){
			logger.logWarn("Document with id "+id+" couldn't be deleted");
			logger.logErr(err);
			callback(false);
		}
	}else{
		database.collection(dict).removeOne({'_id':id},function(err,obj){
			if(err){
				logger.logWarn("Document with id "+id+" couldn't be deleted");
				logger.logErr(err);
				callback(false);
			}else{
				logger.logDeb("Document with id "+id+" deleted");
				callback(res);
			}
		});
	}
};

module.exports = {
	init: initDatabase,
	create : create,
	read : read,
	update: update,
	delete : remove
};
