var mongoose = require('mongoose');
var config = require('../config');
var conn = mongoose.createConnection(config.get('mongodb.url') + config.get('mongodb.defaultCollection'));
var q = require('q');
var util = require('util');
var user = require('../models/user');
var logger = require('../utils/logger');
var moment = require('moment');
var common = require('../utils/common');
var _ = require('lodash');
var constants = require('../utils/constants');
var tags = require('../tags/tags-model');

var materialInfo = conn.model('materialinfo', {
	userId : String,
	skillId : String,
	skillName : String,
	tag : Array,
	title : String,
	description : String,
	category : String,
	webLink : String,
	markAsInAppropiate : Boolean,
	createdDate : String,
	updatedDate : String,
	likes : Array,
	dislikes : Array,
	isDeleted : Boolean,
	updatedDate : String,
	markedInAppropiate : []
});

var material = function() {
};

/**
 * To add new material
 * 
 * @param data
 *            contains the material data to add
 */
material.add = function(data) {
	var deffered = q.defer();
	var doc = new materialInfo({
		userId : data.userId,
		skillId : data.skillId,
		skillName : data.skillName,
		tag : data.tag,
		title : data.title,
		description : data.description,
		category : data.category,
		webLink : data.webLink,
		markAsInAppropiate : false,
		createdDate : moment().utc().format(),
		likes : [],
		dislikes : [],
		markedInAppropiate : [],
		isDeleted : false
	});
	doc.save(function(err) {
		if (err) {
			logger.info(util.format('Error occured while adding material info error %j', err));
			deffered.reject(error);
		} else {
			// Create missing tags
			tags.addMissingTags(data.tag).then(function(status) {
				logger.info(util.format('material info successfully saved'));
				user.updateScore(data.userId, 10).then(function(status) {
					logger.info(util.format('User score updated successfully'));
				}, function(error) {
					logger.error(util.format('User score update error %j', error));
				});
				deffered.resolve(true);
			}, function(error) {
				logger.info(util.format('Error while creating missing tags error %j', error));
				deffered.resolve(true);
			});
		}
	});
	return deffered.promise;
};

/**
 * To add new material
 * 
 * @param data
 *            contains the material data to add
 */
material.list = function(userId, skillId) {
	var deffered = q.defer();
	if (skillId !== undefined && skillId !== '') {
		console.log('Skill ID ::::: ' + skillId);
		// Find material information
		materialInfo.find({
			userId : userId,
			skillId : skillId,
			isDeleted : {
				$ne : true
			}
		}, function(error, result) {
			if (error === null) {
				if (result === null || result.length === 0) {
					deffered.resolve([]);
				} else {
					var finalResult = [];
					for (var i = 0; i < result.length; i++) {
						var obj = {
							ID : result[i]._id,
							userId : result[i].userId,
							skillId : result[i].skillId,
							skillName : result[i].skillName,
							title : result[i].title,
							description : result[i].description,
							category : result[i].category,
							webLink : result[i].webLink,
							createdDate : result[i].createdDate,
							markAsInAppropiate : result[i].markAsInAppropiate,
							dislikes : result[i].dislikes,
							likes : result[i].likes,
							tag : result[i].tag
						}
						finalResult.push(obj);
					}
					deffered.resolve(finalResult);
				}
			} else {
				deffered.reject(error);
			}
		});
	} else {
		// Find material information
		materialInfo.find({
			userId : userId,
			isDeleted : {
				$ne : true
			}
		}, function(error, result) {
			if (error === null) {
				if (result === null || result.length === 0) {
					deffered.resolve([]);
				} else {
					var finalResult = [];
					for (var i = 0; i < result.length; i++) {
						var obj = {
							ID : result[i]._id,
							userId : result[i].userId,
							skillId : result[i].skillId,
							skillName : result[i].skillName,
							title : result[i].title,
							description : result[i].description,
							category : result[i].category,
							webLink : result[i].webLink,
							createdDate : result[i].createdDate,
							markAsInAppropiate : result[i].markAsInAppropiate,
							dislikes : result[i].dislikes,
							likes : result[i].likes,
							tag : result[i].tag
						}
						finalResult.push(obj);
					}
					deffered.resolve(finalResult);
				}
			} else {
				deffered.reject(error);
			}
		});
	}
	return deffered.promise;
};

/**
 * To save/update material data
 * 
 * @param data
 *            contains the material information
 */
material.save = function(data) {
	var deffered = q.defer();
	// Find out material information
	materialInfo.findOne({
		_id : data.ID
	}).then(function(result) {
		if (result !== null) {
			result.title = data.title;
			result.description = data.description;
			result.category = data.category;
			result.webLink = data.webLink;
			result.tag = data.tag;
			result.updatedDate = moment().utc().format();
			// Update material information
			materialInfo.update({
				_id : data.ID
			}, result, function(err, numberAffected, rawResponse) {
				if (err) {
					deffered.reject(err);
				} else {
					// Create missing tags
					tags.addMissingTags(data.tag).then(function(status) {
						logger.info(util.format('material info successfully saved'));
						deffered.resolve(true);
					}, function(error) {
						logger.info(util.format('Error while creating missing tags error %j', error));
						deffered.resolve(true);
					});
				}
			});
		} else {
			var error = new Error('Material info does not exists');
			error.code = 4015;
			deffered.reject(error);
		}
	}, function(error) {
		logger.error(util.format('Error occured error %j', error));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * To remove material information
 * 
 * @param data
 *            contains the material id
 */
material.remove = function(data) {
	var deffered = q.defer();
	// Find out material information
	materialInfo.findOne({
		_id : data.ID
	}).then(function(result) {
		if (result !== null) {
			result.isDeleted = true;
			result.updatedDate = moment().utc().format();
			// Update material information
			materialInfo.update({
				_id : data.ID
			}, result, function(err, numberAffected, rawResponse) {
				if (err) {
					deffered.reject(err);
				} else {
					deffered.resolve(true);
				}
			});
		} else {
			var error = new Error('Material info does not exists');
			error.code = 4015;
			deffered.reject(error);
		}
	}, function(error) {
		logger.error(util.format('Error occured error %j', error));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * To search material details
 * 
 * @param data
 *            contains the search crieteria
 */
material.search = function(data) {
	var deffered = q.defer();
	if (data.title === undefined || data.title === null) {
		data.title = '';
	}
	if (data.category === undefined || data.category === null) {
		data.category = '';
	}
	var searchObj = {
		title : new RegExp('^' + data.title, "i"),
		category : new RegExp('^' + data.category, "i"),
	};
	if (data.tags !== undefined && data.tags.length > 0) {
		searchObj.tag = {
			"$in" : data.tags
		};
	}
	if (data.skillId !== undefined && data.skillId !== null && data.skillId !== '') {
		searchObj.skillId = data.skillId;
	}

	materialInfo.find(searchObj).then(function(result) {
		if (result === null) {
			deffered.resolve([]);
		} else {
			var finalResult = [];
			for (var i = 0; i < result.length; i++) {
				var obj = {
					ID : result[i]._id,
					userId : result[i].userId,
					skillId : result[i].skillId,
					skillName : result[i].skillName,
					title : result[i].title,
					description : result[i].description,
					category : result[i].category,
					webLink : result[i].webLink,
					createdDate : result[i].createdDate,
					markAsInAppropiate : result[i].markAsInAppropiate,
					dislikes : result[i].dislikes,
					likes : result[i].likes,
					tag : result[i].tag
				}
				finalResult.push(obj);
			}
			deffered.resolve(finalResult);
		}
	}, function(error) {
		logger.error(util.format('User does not exists %j', auser));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * To like particular material
 * 
 * 
 * @param data
 *            contains material details to like
 * 
 */
material.like = function(data) {
	var deffered = q.defer();
	// Find out material information
	materialInfo.findOne({
		_id : data.ID
	}).then(function(result) {
		if (result !== null) {
			if (result.likes === undefined) {
				result.likes = [];
			}
			if (result.likes.indexOf(data.userId) === -1) {
				result.likes.push(data.userId);
				if (result.dislikes.indexOf(data.userId) > -1) {
					result.dislikes.splice(result.dislikes.indexOf(data.userId), 1);
				}
				// Update material information
				materialInfo.update({
					_id : data.ID
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
			var error = new Error('Material info does not exists');
			error.code = 4015;
			deffered.reject(error);
		}
	}, function(error) {
		logger.error(util.format('Error occured error %j', error));
		deffered.reject(error);
	});

	return deffered.promise;
};

/**
 * To like particular material
 * 
 * 
 * @param data
 *            contains material details to like
 * 
 */
material.dislike = function(data) {
	var deffered = q.defer();
	// Find out material information
	materialInfo.findOne({
		_id : data.ID
	}).then(function(result) {
		if (result !== null) {
			if (result.likes === undefined) {
				result.likes = [];
			}
			if (result.dislikes.indexOf(data.userId) === -1) {
				result.dislikes.push(data.userId);
				if (result.likes.indexOf(data.userId) > -1) {
					result.likes.splice(result.likes.indexOf(data.userId), 1);
				}
				// Update material information
				materialInfo.update({
					_id : data.ID
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
			var error = new Error('Material info does not exists');
			error.code = 4015;
			deffered.reject(error);
		}
	}, function(error) {
		logger.error(util.format('Error occured error %j', error));
		deffered.reject(error);
	});

	return deffered.promise;
};

/**
 * To like particular material
 * 
 * 
 * @param data
 *            contains material details to like
 * 
 */
material.markInAppropiate = function(data) {
	var deffered = q.defer();
	// Find out material information
	materialInfo.findOne({
		_id : data.ID
	}).then(function(result) {
		if (result !== null) {
			if (result.markedInAppropiate === undefined) {
				result.markedInAppropiate = [];
			}
			if (result.markedInAppropiate.indexOf(data.userId) === -1) {
				result.markedInAppropiate.push(data.userId);
				// Update material information
				materialInfo.update({
					_id : data.ID
				}, result, function(err, numberAffected, rawResponse) {

					if (err) {
						deffered.reject(err);
					} else {
						user.updateScore(result.userId, -10).then(function(status) {
							logger.info(util.format('User score updated successfully'));
						}, function(error) {
							logger.error(util.format('User score update error %j', error));
						});
						deffered.resolve(true);
					}
				});
			} else {
				deffered.resolve(true);
			}
		} else {
			var error = new Error('Material info does not exists');
			error.code = 4015;
			deffered.reject(error);
		}
	}, function(error) {
		logger.error(util.format('Error occured error %j', error));
		deffered.reject(error);
	});

	return deffered.promise;
};

module.exports = material;