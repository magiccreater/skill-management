var util = require('util');
var _ = require('lodash');
var q = require('q');
var uuid = require('node-uuid');

/**
 * Generates new UUID each time
 */
var _getNextKey = function() {
	return uuid.v4();
};

module.exports = {
	getNextKey : _getNextKey
};