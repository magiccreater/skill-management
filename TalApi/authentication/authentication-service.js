var util = require('util');
var passport = require('passport');
var logger = require('../utils/logger');
var schemas = require('../models/schemas');
var user = require('../models/user');
var config = require('../config');
var constants = require('../utils/constants');
var common = require('../utils/common');

var test = function(req, res) {
	res.status(200).send("Success");
}
// For initializing session (This web-service need to call first before login or
// registration to generate CSRF token)
var session = function(req, res) {
	if (req.isAuthenticated()) {
		user.findOne(req.session.passport.user).then(function(aUser) {
			// console.log(aUser);
			if (aUser.sessionId !== undefined) {
				if (aUser.sessionId !== '') {
					return res.status(200).send({
						code : 2000,
						messageKey : constants.messageKeys.code_2000,
						data : aUser
					});
				} else {
					req.logout();
					for ( var cookie in req.cookies) {
						res.clearCookie(cookie);
					}
					req.session.destroy();
					return res.status(403).send({
						code : 4004,
						messageKey : constants.messageKeys.code_4004,
						data : {}
					});
				}
			} else {
				req.logout();
				for ( var cookie in req.cookies) {
					res.clearCookie(cookie);
				}
				req.session.destroy();
				return res.status(403).send({
					code : 4004,
					messageKey : constants.messageKeys.code_4004,
					data : {}
				});
			}
		}, function(error) {
			return res.status(500).send({
				code : 5002,
				messageKey : constants.messageKeys.code_5002,
				data : {}
			});
		});
	} else {
		return res.status(200).send({
			code : 2002,
			messageKey : constants.messageKeys.code_2002,
			data : {}
		});
	}
};

// To keep alive the session
var keepAlive = function(req, res) {
	res.status(200).send();
};

var login = function(req, res) {
	passport.authenticate('local', function(error, auser) {
		console.log(error);
		if (error) {
			if (error.code === constants.messageKeys.code_4001) {
				return res.status(400).send({
					code : 4001,
					messageKey : constants.messageKeys.code_4001,
					data : {}
				});
			} else if (error.code === constants.messageKeys.code_4010) {
				return res.status(400).send({
					code : 4010,
					messageKey : constants.messageKeys.code_4010,
					data : {}
				});
			} else {
				return res.status(500).send({
					code : 5002,
					messageKey : constants.messageKeys.code_5002,
					data : {}
				});
			}
		} else {
			user.login(auser.email, req.sessionID).then(function(result) {
				req.login(auser, function(error) {
					return res.status(200).send({
						code : 2003,
						messageKey : constants.messageKeys.code_2003,
						data : auser
					});
				});
			}, function(error) {
				return res.status(500).send({
					code : 5000,
					messageKey : constants.messageKeys.code_5000,
					data : {}
				});
			});
		}
	})(req, res);
};

var linkedinLogin = function(req, res) {
	// console.log(req.sessionID);
	user.linkedinLogin(req.body).then(function(auser) {

		user.login(auser.email, req.sessionID).then(function(result) {
			req.login(auser, function(error) {
				return res.status(200).send({
					code : 2003,
					messageKey : constants.messageKeys.code_2003,
					data : auser
				});
			});
		}, function(error) {
			return res.status(500).send({
				code : 5000,
				messageKey : constants.messageKeys.code_5000,
				data : {}
			});
		});
	}, function(error) {
		if (error.code === constants.messageKeys.code_4001) {
			return res.satus(400).send({
				code : 4001,
				messageKey : constants.messageKeys.code_4001,
				data : {}
			});
		} else if (error.code === constants.messageKeys.code_4011) {
			return res.status(400).send({
				code : 4000,
				messageKey : constants.messageKeys.code_4011,
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

// For logout
var logout = function(req, res, next) {
	user.logout(req.session.passport.user, req.sessionID).then(function(result) {
		delete result.userAgent;
		delete result.sessionId;
		req.logout();
		for ( var cookie in req.cookies) {
			res.clearCookie(cookie);
		}
		req.session.destroy();
		res.status(200).end();
	}, function(error) {
		res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : {}
		});
	});
};

// For registeration
var register = function(req, res) {
	// logger.info(util.format('%j', req.body));
	var data = common.sanitize(req.body.registration, schemas.user);
	// logger.info(util.format('%j', data));
	logger.info('Validating schema for create user request');
	if (schemas.validate(data, schemas.user)) {
		user.create(data).then(function(result) {
			res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : {}
			});
		}, function(error) {
			if (error.code === constants.messageKeys.code_4000) {
				return res.status(400).send({
					code : 4000,
					messageKey : constants.messageKeys.code_4000,
					data : {}
				});
			} else if (error.code === constants.messageKeys.code_4012) {
				return res.status(400).send({
					code : 4012,
					messageKey : constants.messageKeys.code_4012,
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
			data : {}
		});
	}
};

// To get the history details
var getHistoryData = function(req) {
	var data = {
		loginTime : moment().utc().format(),
		sessionId : req.sessionID,
		ip : req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		userAgent : req.headers['user-agent']
	};
	return data;
};

// To confirm registration
var confirmRegistration = function(req, res) {
	var data = common.sanitize(req.body, schemas.confirmRegisteration);
	logger.debug('Validating schema for confirm registeration request');
	if (schemas.validate(data, schemas.confirmRegisteration)) {
		user.confirmRegistration(data).then(function(result) {
			res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : result
			});
		}, function(error) {
			if (error.code === 4008) {
				// User already confirmed the registration
				return res.status(400).send({
					code : 4008,
					messageKey : constants.messageKeys.code_4008,
					data : {}
				});
			} else if (error.code === 4007) {
				// Invalid link
				return res.status(400).send({
					code : 4007,
					messageKey : constants.messageKeys.code_4007,
					data : {}
				});
			} else {
				// Internal server error
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
			data : {}
		});
	}
};

module.exports = {
	session : session,
	keepAlive : keepAlive,
	login : login,
	logout : logout,
	register : register,
	test : test,
	linkedinLogin : linkedinLogin,
	confirmRegistration : confirmRegistration
};