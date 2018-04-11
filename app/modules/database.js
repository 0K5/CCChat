/*
 *	All interactions with mongodb database
 * */
let logger = require('./logger.js');
let fs = require('fs');
let mongoose = require('mongoose');
let mongodb = require('mongodb').MongoClient;
let localstorage = require('node-localstorage').LocalStorage;
let database = undefined;

/*
 * Initializes the database. If the connection to mlab can't be established it falls back to the local mongodb.
 * */
let initDatabase = (app, server, callback) => {
    mongoose.Promise = global.Promise;
    if (mongoose.connection.readyState == 0) {
        mongoose
            .connect('mongodb://feEIRHHR34943fojwlscnlkwKNMCKSP3eio24890u38xlm:ojrKJSCMsekowkcE4038ruiefkmCLfmo5u494u2jdoijcr@ds131989.mlab.com:31989/ccchat');
        let mdb = mongoose.connection;
        mdb.on("error", function() {
            logger.logWarn("Couldn't connect to mlab.com. Fallback to local mongodb");
            mongodb.connect('mongodb://localhost:27017/', function(err, db) {
                if (err) {
                    logger.logErr("Couldn't connect to local mongodb. Fallback to local filestore");
                } else {
                    logger.logInfo("Connection to local mongodb succeeded");
                    database = db.db('ccchat');
                    return callback(app, server);
                }
            });
        });
        mdb.once("open", function(callback) {
            logger.logInfo("Connection to mlab database succeeded");
            database = mdb;
            return callback(app, server);
        });
    }
}

/*
 * Creates an object to the database. <br>
 * If the collection doesn't exists it will be created first.<br>
 * If creation throws an error update is called as a last try.<br>
 * @param coll String name of the collection where the new item will be created 
 * @param id Object to identify the item
 * @param data Object which contains data to be saved
 * @return callback Function passes false on fail : passes created item on success*/
let create = (coll, id, data, callback) => {
    if (coll, id, data, database) {
        let insertData = () => {
            let insData = data;
            database.collection(coll).insertOne(insData, function(err, res) {
                if (err) {
                    return update(coll, id, data, callback);
                } else {
                    logger.logDeb("Document with id " + JSON.stringify(id) + " created");
                    return callback(res);
                }
            });
        };
        if (!database.collection(coll)) {
            database.createCollection(coll, function(err, res) {
                if (err) {
                    logger.logWarn("Collection " + JSON.stringify(id) + " couldn't be created");
                    logger.logErr(err);
                } else {
                    logger.logDeb("Collection " + JSON.stringify(id) + " created");
                    insertData();
                }
            });
        } else {
            insertData();
        }
    } else {
        logger.logErr('Database creation failed on missing param ' + coll ? id ? data ? callback ? database ? '' : 'database' : 'callback' : 'data' : 'id' : 'coll')
    }
};

/*
 * Reads a item by id from the database
 * @param coll String name of the collection where to read the item 
 * @param id Object to identify the item
 * @return callback Function passes false on fail : passes read item on success*/
let read = (coll, id, callback) => {
    if (coll, id, callback, database) {
        database.collection(coll).findOne(id, function(err, res) {
            if (err) {
                logger.logWarn("Document with id " + JSON.stringify(id) + " couldn't be read");
                logger.logErr(err);
                return callback(false);
            } else {
                logger.logDeb("Document with id " + JSON.stringify(id) + " read");
                return callback(res);
            }
        });
    } else {
        logger.logErr('Database read failed on missing param ' + coll ? id ? callback ? database ? '' : 'database' : 'callback' : 'id' : 'coll');
    }
};

/* Updates data on a item in a collection by the given id
 * @param coll String name of the collection where the new item will be updated 
 * @param id Object to identify the item
 * @param data Object contains data for update
 * @return callback Function passes false on fail : passes updated item on success*/
let update = (coll, id, data, callback) => {
    if (coll, id, data, callback, database) {
        database.collection(coll).findOneAndUpdate(id, {
            $set: data
        }, {
            new: true
        }, function(err, res) {
            if (err) {
                logger.logWarn("Document with id " + JSON.stringify(id) + " couldn't be updated");
                logger.logErr(err);
                return callback(false);
            } else {
                logger.logDeb("Document with id " + JSON.stringify(id) + " updated");
                return callback(res.value);
            }
        });
    } else {
        logger.logErr('Database update failed on missing param ' + coll ? id ? data ? callback ? database ? '' : 'database' : 'callback' : 'data' : 'id' : 'coll')
    }
};
/* Removes an item by the given it from the given collection
 *@param coll String name of the collection where the new item will be deleted 
 * @param id Object to identify the item
 * @return callback Function passes false on fail : passes true on success*/
let remove = (coll, id, callback) => {
    if (coll, id, callback, database) {
        database.collection(coll).removeOne({
            '_id': id
        }, function(err, obj) {
            if (err) {
                logger.logWarn("Document with id " + JSON.parse(id) + " couldn't be deleted");
                logger.logErr(err);
                return callback(false);
            } else {
                logger.logDeb("Document with id " + JSON.parse(id) + " deleted");
                return callback(res);
            }
        });
    } else {
        logger.logErr('Database update failed on missing param ' + coll ? id ? callback ? database ? '' : 'database' : 'callback' : 'id' : 'coll')
    }
};

/* Reads all items from collection
 * @param coll String name of the collection to read all items
 * @param callback Function false on fail : Array of items on success */
let readAll = (coll, callback) => {
    if (coll, callback, database) {
        database.collection(coll).find({}).toArray(function(err, res) {
            if (err) {
                logger.logWarn("Data in " + JSON.stringify(coll) + " couldn't be read");
                logger.logErr(err);
                return callback(false);
            } else {
                logger.logDeb("Data in " + JSON.stringify(coll) + " read");
                return callback(res);
            }
        });
    } else {
        logger.logErr('Database update failed on missing param ' + coll ? id ? callback ? database ? '' : 'database' : 'callback' : 'id' : 'coll')
    }
};

module.exports = {
    init: initDatabase,
    create: create,
    read: read,
    update: update,
    delete: remove,
    readAll: readAll,
};
