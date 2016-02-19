var mongoose = require('mongoose');
var config = require('../config');
var conn = mongoose.createConnection(config.get('mongodb.url') + config.get('mongodb.defaultCollection'));
var q = require('q');
var util = require('util');
var logger = require('../utils/logger');
var moment = require('moment');
var common = require('../utils/common');
var _ = require('lodash');
var user = require('../models/user');
var constants = require('../utils/constants');

var Skill = conn.model('drv_skillCountsCollection', {
	skill : String
});

var userSkillInfo = conn.model('userskillinfo', {
	userId : String,
	skillId : String,
	skillName : String,
	associatedSkills : Array
});

var skillModel = function() {
};

/**
 * To associate new skill information with skill
 * 
 * @param data
 *            contains the data
 * @param email
 *            contains the email
 * 
 */
skillModel.associateNewSkillInfo = function(data) {
	var deffered = q.defer();
	userSkillInfo.find({
		skillId : data.skillId,
		userId : data.UserId
	}, function(error, auser) {
		if (error === null) {
			if (auser === null || auser.length === 0) {
				// New skill is associated
				var associatedSkills = [ {
					skillId : data.associatedSkillId,
					skillName : data.associatedSkillName,
					weight : data.associatedSkillWeight
				} ];
				var doc = new userSkillInfo({
					userId : data.UserId,
					skillId : data.skillId,
					skillName : data.skillName,
					associatedSkills : associatedSkills
				});
				doc.save(function(err) {
					if (err) {
						logger.info(util.format('Error occured while creating user skill info error %j', err));
						deffered.reject(error);
					} else {
						// Add new skill detail in user skills
						user.addNewSkill(data.UserId, data).then(function(status) {
							user.updateScore(data.UserId, 10).then(function(status) {
								logger.info(util.format('User score updated successfully'));
							}, function(error) {
								logger.error(util.format('User score update error %j', error));
							});
							logger.info(util.format('User skill info successfully saved'));
							deffered.resolve(true);
						}, function(error) {
							logger.info(util.format('Error occured while creating user skill info error %j', err));
							deffered.reject(error);
						});
					}
				});
			} else {
				// Check for duplicate entry
				var skillDetails = _.where(auser[0].associatedSkills, {
					skillId : data.associatedSkillId
				});
				if (skillDetails.length === 0) {
					var associatedSkills = auser[0].associatedSkills;
					var obj = {
						skillId : data.associatedSkillId,
						skillName : data.associatedSkillName,
						weight : data.associatedSkillWeight
					};
					associatedSkills.push(obj);
					auser[0].associatedSkills = associatedSkills;
					// Update user skill info
					userSkillInfo.update({
						skillId : data.skillId,
						userId : data.UserId
					}, auser[0], function(err, numberAffected, rawResponse) {
						if (err) {
							deffered.reject(error);
							logger.error(util.format('Error occured while updating user skill info details %j', err));
						} else {
							user.updateScore(data.UserId, 10).then(function(status) {
								logger.info(util.format('User score updated successfully'));
							}, function(error) {
								logger.error(util.format('User score update error %j', error));
							});
							deffered.resolve(true);
							logger.info(util.format('User skill related infor successfully saved -> %s', data.ID));
						}
					});
				} else {
					// Skill already associated
					var error = new Error(constants.messageKeys.code_4014);
					error.code = 4014;
					deffered.reject(error);
				}
			}
		} else {
			logger.error(util.format('Error occurred %j', error));
			deffered.reject(error);
		}
	});
	return deffered.promise;
};

/**
 * To get user associated skill info
 * 
 * @param userId
 *            id of user
 */
skillModel.getAssociatedSkillInfo = function(userId, skillId, skillName) {
	var deffered = q.defer();
	logger.info(userId + ' :: ' + skillId);
	userSkillInfo.findOne({
		skillId : skillId,
		userId : userId
	}).then(function(skillInfo) {
		if (skillInfo !== null) {
			deffered.resolve({
				skillId : skillInfo.skillId,
				skillName : skillInfo.skillName,
				associatedSkills : skillInfo.associatedSkills
			});
		} else {
			deffered.resolve({
				skillId : skillId,
				skillName : skillName,
				associatedSkills : []
			});
		}
	}, function(error) {
		logger.error(util.format('User does not exists %j', auser));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * To get user associated skills
 * 
 * @param userId
 *            id of user
 */
skillModel.getAssociatedSkills = function(userId, skillId, skillName) {
	var deffered = q.defer();
	logger.info(userId + ' :: ' + skillId);
	userSkillInfo.findOne({
		skillId : skillId,
		userId : userId
	}).then(function(skillInfo) {
		if (skillInfo !== null) {
			deffered.resolve(skillInfo.associatedSkills);
		} else {
			deffered.resolve([]);
		}
	}, function(error) {
		logger.error(util.format('User does not exists %j', auser));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * Update the rating
 * 
 * @param data
 *            contains the skill id to update
 */
skillModel.updateRating = function(data) {
	var deffered = q.defer();
	logger.info(util.format('Data %j', data));
	userSkillInfo.findOne({
		skillId : data.skillId,
		userId : data.userId
	}).then(function(result) {
		if (result !== null) {

			var index = _.findIndex(result.associatedSkills, function(obj) {
				console.log(obj.skillId + ' :: ' + data.associatedSkillId);
				return (obj.skillId === data.associatedSkillId)
			});
			logger.info(util.format('Index %d', index));
			if (index > -1) {
				result.associatedSkills[index].weight = data.weight;
				userSkillInfo.update({
					skillId : data.skillId,
					userId : data.userId
				}, result, function(err, numberAffected, rawResponse) {
					if (err) {
						deffered.reject(err);
					} else {
						deffered.resolve(true);
					}
				});
			} else {
				deffered.resolve(true);
			}
		} else {
			deffered.resolve([]);
		}
	}, function(error) {
		logger.error(util.format('User does not exists %j', auser));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * Update the rating
 * 
 * @param data
 *            contains the skill id to update
 */
skillModel.search = function(data) {
	var deffered = q.defer();
	logger.info(util.format('Data %j', data));
	if (data.searchText === undefined) {
		data.searchText = '';
	}
	Skill.find({
		skill : new RegExp('^' + data.searchText, "i")
	}).sort('skill').limit(20).then(function(result) {
		if (result !== null && result.length > 0) {
			deffered.resolve(result);
		} else {
			deffered.resolve([]);
		}
	}, function(error) {
		logger.error(util.format('Error occured %j', error));
		deffered.reject(error);
	});
	return deffered.promise;
};

module.exports = skillModel;