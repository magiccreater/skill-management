var mongoose = require('mongoose');
var config = require('../config');
var conn = mongoose.createConnection(config.get('mongodb.url') + config.get('mongodb.defaultCollection'));
var q = require('q');
var util = require('util');
var logger = require('../utils/logger');
var moment = require('moment');
var common = require('../utils/common');
var _ = require('lodash');
var constants = require('../utils/constants');

var TagsInfo = conn.model('tag', {
	tag : String,
	taggedCount : Number
});

var tags = function() {
};

/**
 * To search particular tag
 * 
 * @param searchText
 *            text to search
 */
tags.search = function(searchText) {
	var deffered = q.defer();
	TagsInfo.find({
		tag : new RegExp('^' + searchText + '*', "i")
	}).then(function(tags) {
		if (tags.length > 0) {
			deffered.resolve(tags);
		} else {
			deffered.resolve([]);
		}
	}, function(error) {
		logger.error(util.format('Error occured while searching tags error %j', error));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * Save new tag
 * 
 * @param tagName
 *            name of the tag
 * 
 * 
 */
tags.add = function(tagName) {
	var deffered = q.defer();
	var newTag = new TagsInfo({
		tag : tagName,
		taggedCount : 0
	});
	newTag.save(function(error) {
		if (error) {
			logger.error(util.format('New tag add error %j', error));
			deffered.reject(error);
		} else {
			deffered.resolve(true);
		}
	});
	return deffered.promise;
};

/**
 * To find missing tags
 * 
 * @param tags
 *            contains tags details
 */
tags.findMissingTags = function(tagsToSearch) {
	var deffered = q.defer();
	TagsInfo.find({
		tag : {
			'$in' : tagsToSearch
		}
	}).then(function(result) {
		if (result.length > 0) {
			var foundTags = _.pluck(result, 'tag');
			var missingTags = _.difference(tagsToSearch, foundTags);
			deffered.resolve(missingTags);
		} else {
			deffered.resolve(tagsToSearch);
		}
	}, function(error) {
		logger.error(util.format('Error occured while searching tags error %j', error));
		deffered.reject(error);
	});
	return deffered.promise;
};

/**
 * Create missing tags
 * 
 * @param tags
 *            contains the tags to search
 * 
 */
tags.addMissingTags = function(tagsToSearch) {
	var deffered = q.defer();
	if (tagsToSearch.length > 0) {
		// Finds missing tags
		tags.findMissingTags(tagsToSearch).then(function(missingTags) {
			// To add multiple insert
			tags.multipleInsert(missingTags).then(function(status) {
				deffered.resolve(true);
			}, function(error) {
				deffered.reject(error);
			});
		}, function(error) {
			deffered.reject(error);
		});
	} else {
		deffered.resolve(true);
	}
	return deffered.promise;
};

/**
 * To insert mulitple tags
 * 
 * @param tagsToInsert
 *            to insert multiple tags
 */
tags.multipleInsert = function(tagsToInsert) {
	var deffered = q.defer();
	if (tagsToInsert.length > 0) {
		var aTag = tagsToInsert.pop();
		// Creates new tag
		tags.add(aTag).then(function(status) {
			logger.info(util.format('New tag added %s', aTag));
			// Recursive function call
			tags.multipleInsert(tagsToInsert).then(function(status) {
				deffered.resolve(true);
			}, function(error) {
				deffered.reject(error);
			});
		}, function(error) {
			deffered.reject(error);
		});
	} else {
		deffered.resolve(true);
	}
	return deffered.promise;
};

module.exports = tags;