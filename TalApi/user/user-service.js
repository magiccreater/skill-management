var util = require('util');
var _ = require('lodash');
var logger = require('../utils/logger');
var schemas = require('../models/schemas');
var user = require('../models/user');
var constants = require('../utils/constants');
var common = require('../utils/common');

var getTitles = function(req, res) {
	user.getTitles().then(function(titles) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : titles
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

var getSkills = function(req, res) {
	user.getSkills(req.query.title).then(function(skills) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : skills
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

var saveSkills = function(req, res) {
	user.saveSkills(req.session.passport.user, req.body).then(function(status) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : {}
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

var getJoblist = function(req, res) {
	// logger.info(util.format('%j', req.body));
	var data = common.sanitize(req.body, schemas.getJobListRequest);
	// logger.info(util.format('%j', data));
	logger.info('Validating schema for get joblist request');
	if (schemas.validate(data, schemas.getJobListRequest)) {
		user.getJoblist(data).then(function(result) {
			return res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : result
			});
		}, function(error) {
			if (error.code === 4002) {
				return res.status(401).send({
					code : 4002,
					messageKey : constants.messageKeys.code_4002,
					data : {}
				});
			} else {
				return res.status(500).send({
					code : 5002,
					messageKey : constants.messageKeys.code_5002,
					data : {}
				});
			}
		});
	} else {
		// Incomplete data
		return res.status(401).send({
			code : 4002,
			messageKey : constants.messageKeys.code_4002,
			data : {},
		});
	}
};

var getJobTitles = function(req, res) {
	user.getJobTitles(req.body, req.session.passport.user).then(function(jobtitle) {
		// user.getJobTitles('hhh@hhh.hhh').then(function(jobtitle) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : jobtitle
		});
	}, function(error) {
		if (error.code === constants.messageKeys.code_4001) {
			return res.status(400).send({
				code : 4001,
				messageKey : constants.messageKeys.code_4001,
				data : {}
			});
		} else if (error.code === constants.messageKeys.code_4013) {
			return res.status(400).send({
				code : 4013,
				messageKey : constants.messageKeys.code_4013,
				data : {}
			});
		} else {
			return res.status(500).send({
				code : 5002,
				messageKey : constants.messageKeys.code_5002,
				data : {}
			});
		}
	});
};

// To get user skills
var getUserSkills = function(req, res) {
	if (req.body.selectedSkillId === undefined || req.body.selectedSkillId === '') {
		req.body.selectedSkillId = '';
	}
	user.getUserSkills(req.session.passport.user, req.body.searchText, req.body.selectedSkillId).then(function(result) {
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

var findSkills = function(req, res) {
	user.findSkills(req.body.searchText).then(function(result) {
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

var getScore = function(req, res) {
	return res.status(200).send({
		code : 2000,
		messageKey : constants.messageKeys.code_2000,
		data : req.user.score
	});

};

module.exports = {
	getTitles : getTitles,
	getSkills : getSkills,
	saveSkills : saveSkills,
	getJoblist : getJoblist,
	getJobTitles : getJobTitles,
	getUserSkills : getUserSkills,
	findSkills : findSkills,
	getScore : getScore
};