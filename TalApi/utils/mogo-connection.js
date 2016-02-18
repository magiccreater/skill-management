var mongoose = require('mongoose');
var config = require('../config');
var conn = mongoose.createConnection(config.get('mongodb.url') + config.get('mongodb.defaultCollection'));

var getConnection = function() {
	return conn;
};