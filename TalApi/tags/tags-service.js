var util = require('util');
var _ = require('lodash');
var logger = require('../utils/logger');
var schemas = require('../models/schemas');
var tags = require('./tags-model');
var constants = require('../utils/constants');
var common = require('../utils/common');

var search = function(req, res) {
	// To search tag
	tags.search(req.body.searchText).then(function(result) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : result
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

module.exports = {
	search : search
};