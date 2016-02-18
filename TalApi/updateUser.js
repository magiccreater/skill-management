var mongoose = require('mongoose');
var config = require('./config');
var conn = mongoose.createConnection(config.get('mongodb.url') + config.get('mongodb.defaultCollection'));
var q = require('q');
var util = require('util');
var logger = require('./utils/logger');
var db = require('./utils/db');
var moment = require('moment');
var common = require('./utils/common');
var _ = require('lodash');
var constants = require('./utils/constants');

var User = conn.model('users', {
	email : String,
	password : String,
	salt : String,
	name : String,
	skills : Array,
	geoLocation : String,
	sessionId : String,
	linkedinId : String,
	linkedinTitle : String,
	userId : String,
	recommendedJobTitles : Array,
	isEmailVerified : Boolean,
	createdDate : String
});

var totalUpdatedCount = 0;
var notUpdatedCount = 0;

var updateUser = function(data) {
	var deffered = q.defer();
	if (data.length > 0) {
		var aUser = data.pop();
		if (aUser.userId === undefined || aUser.userId === null || aUser.userId === '') {
			aUser.userId = db.getNextKey();
			User.update({
				email : aUser.email
			}, aUser, function(err, numberAffected, rawResponse) {
				if (err) {
					notUpdatedCount++;
					deffered.reject(error);
					logger.info(util.format('Error occured while creating user error %j', err));
				} else {
					console.log('User Updated :: ' + aUser.email);
					totalUpdatedCount++;
					// logger.info(util.format('User created successfully -> %s', email));
					updateUser(data).then(function(status) {
						deffered.resolve(true);
					}, function(error) {
						deffered.reject(error);
					});
				}
			});
		} else {
			updateUser(data).then(function(status) {
				deffered.resolve(true);
			}, function(error) {
				deffered.reject(error);
			});
		}
	} else {
		deffered.resolve(true);
	}
	return deffered.promise;
};

var searchUsers = function() {
	var deffered = q.defer();
	User.find({
		userId : null

	}).then(function(auser) {
		if (auser !== null && auser.length > 0) {
			logger.info(util.format('Data %j', auser));
			updateUser(auser).then(function(status) {
				console.log('Total updated count :: ' + totalUpdatedCount);
				console.log('Total not updated count :: ' + notUpdatedCount);
			}, function(error) {
				deffered.reject(error);
			});
		} else {
			logger.info('No records found')
		}
	}, function(error) {
		deffered.reject(error);
	});
	return deffered.promise;
};
searchUsers();