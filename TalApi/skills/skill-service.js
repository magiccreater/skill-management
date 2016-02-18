var util = require('util');
var _ = require('lodash');
var logger = require('../utils/logger');
var schemas = require('../models/schemas');
var skill = require('./skill-model');
var constants = require('../utils/constants');
var common = require('../utils/common');

var associateNewSkillInfo = function(req, res) {
	var data = common.sanitize(req.body, schemas.associateNewSkillRequest);
	logger.info('Validating schema for associateNewSkill Request');
	if (schemas.validate(data, schemas.associateNewSkillRequest)) {
		data.UserId = req.user.userId;
		// Find user detail
		skill.associateNewSkillInfo(data).then(function(status) {
			return res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : {}
			});
		}, function(error) {
			if (error.code === 4014) {
				return res.status(401).send({
					code : 4014,
					messageKey : constants.messageKeys.code_4014,
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

var getAssociatedSkillInfo = function(req, res) {
	logger.info(util.format('Req %j', req.body));
	// Find user detail
	skill.getAssociatedSkillInfo(req.user.userId, req.body.skillId, req.body.skillName).then(function(data) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : data
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

// To get associated skills
var getAssociatedSkills = function(req, res) {
	logger.info(util.format('Req %j', req.body));
	// Find user detail
	skill.getAssociatedSkills(req.user.userId, req.body.skillId).then(function(data) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : data
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

var updateRating = function(req, res) {
	var data = req.body;
	data.userId = req.user.userId;
	// Update rating
	skill.updateRating(data).then(function(data) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : data
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

// To search skills
var search = function(req, res) {
	var data = req.body;
	// Search skills
	skill.search(data).then(function(data) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : data
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
	associateNewSkillInfo : associateNewSkillInfo,
	getAssociatedSkillInfo : getAssociatedSkillInfo,
	getAssociatedSkills : getAssociatedSkills,
	updateRating : updateRating,
	search : search
};