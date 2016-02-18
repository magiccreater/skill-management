var mongoose = require('mongoose');
var config = require('../config');
var conn = mongoose.createConnection(config.get('mongodb.url') + config.get('mongodb.defaultCollection'));
var q = require('q');
var util = require('util');
var logger = require('../utils/logger');
//var encryption = require('../utils/encryption');
var schemas = require('./schemas');
var common = require('../utils/common');
var _ = require('lodash');
var mailer = require('../utils/mailer');
var rest = require('restler');
var constants = require('../utils/constants');
var profileScrapper = require('../helpers/profile_scraper');

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
	recommendedJobTitles : Array
});

var TitleMISkill = conn.model('drv_titleskillmicountscollection', {
	title : String,
	skills : Array
});

var Skill = conn.model('drv_skillCountsCollection', {
	skill : String
});

var Title = conn.model('drv_titleCountsCollection', {
	title : String,
	count : Number
});

var userModel = function() {};

/**
 * To Create user
 */
userModel.create = function(data) {
	var deffered = q.defer();
	//	logger.info(util.format('%j', data));
	User.find({
		email : data.email
	}, function(error, auser) {
		if (error === null) {
			if (auser === null || auser.length === 0) {
				//var value = encryption.getEncryptedPasswordWithSalt(data.password);
				var value = {};
				value.password = data.password;
				value.salt = config.get('server.security.emailSalt');

				var doc = new User({
					email : data.email,
					password : value.password,
					salt : value.salt,
					name : data.name,
					linkedinId : '',
					linkedinTitle : ''
				});
				//logger.info(util.format('%j', doc));
				doc.save(function(err) {
					if (err) {
						logger.info(util.format('Error occured while creating user error %j', err));
						deffered.reject(error);
					} else {
						//	logger.info(util.format('User created successfully -> %s', data.email));
						deffered.resolve(true);
						mailer.sendRegstrationMail({
							email : data.email
						}).then(function(status) {
						//console.log(status);
						}, function(error) {
							console.error(error.stack);
						});
					}
				});
			} else {
				var error = new Error('A user with same email already exists');
				if (auser[0].linkedinId !== '') {
					error.code = constants.messageKeys.code_4012;
				} else {
					error.code = constants.messageKeys.code_4000;
				}
				deffered.reject(error);
			}
		} else {
			deffered.reject(new Error('Some error occured'));
		}
	})

	return deffered.promise;
};

userModel.findOne = function(email) {
	//	console.log('userModel.findOne email:- ' + email);
	var deffered = q.defer();
	User.find({
		email : email
	}, function(err, aUser) {
		//console.log('userModel.findOne err ' + err);
		if (err === null && aUser !== null && aUser.length > 0) {
			//console.log('userModel.findOne auser:- ' + JSON.stringify(aUser));
			if (aUser[0] !== undefined && aUser[0] !== null) {
				delete aUser[0].__v;
				delete aUser[0].password;
				delete aUser[0].salt;
				// console.log(aUser[0]);
				//console.log('userModel.findOne sending user:- ');
				deffered.resolve({
					email : aUser[0].email,
					name : aUser[0].name,
					skills : aUser[0].skills,
					geoLocation : aUser[0].geoLocation,
					sessionId : aUser[0].sessionId,
					recommendedJobTitles : aUser[0].recommendedJobTitles
				});
			} else {
				deffered.reject(new Error('no user found'));
			}
		} else {
			deffered.reject(err);
			logger.info(util.format('Error occured while finding user error %j', err));
		}
	});
	return deffered.promise;
};

userModel.authenticate = function(data) {
	var deffered = q.defer();
	//logger.info(util.format('data %j', data));
	User.find({
		email : data.email
	}, function(error, aUser) {
		if (error === null) {
			 //console.log(JSON.stringify(aUser));
			if (aUser !== null && aUser.length > 0) {
				if (aUser[0].password === data.password) {
					deffered.resolve({
						email : aUser[0].email,
						name : aUser[0].name,
						skills : aUser[0].skills,
						geoLocation : aUser[0].geoLocation,
						sessionId : aUser[0].sessionId,
						recommendedJobTitles : aUser[0].recommendedJobTitles
						
					});
				} else {
					var error = new Error('Password do not match');
					error.code = constants.messageKeys.code_4001;
					deffered.reject(error);
				}
			} else {
				var error = new Error('user not exists');
				error.code = constants.messageKeys.code_4001;
				deffered.reject(error);
			}
		} else {
			//console.log(error);
			deffered.reject(error);
			logger.info(util.format('Error occured while finding user error %j', error));
		}
	});
	return deffered.promise;
};

userModel.login = function(email, sessionId) {
	var deffered = q.defer();

	User.find({
		email : email
	}, function(error, auser) {
		if (error === null && auser !== null && auser.length > 0) {
			//console.log(JSON.stringify(auser));
			//	logger.info(util.format('userModel.login %j', [ 0 ]));
			auser[0].sessionId = '';
			auser[0].sessionId = sessionId;
			//user.getLocation(ip).then(function(data) {
			//auser.location = data;
			//	logger.info(util.format('User %s logged in', email));
			User.update({
				email : email
			}, auser[0], function(err, numberAffected, rawResponse) {
				if (err) {
					deffered.reject(error);
					logger.info(util.format('Error occured while creating user error %j', err));
				} else {
					//logger.info(util.format('User created successfully -> %s', email));
					deffered.resolve(true);
				}
			});
		} else {
			deffered.reject(new Error());
			logger.info(util.format('Error occured while finding user error'));

		}
	});
	return deffered.promise;
};

/**
 * This will remove the login specific information from user doc when user
 * logout
 * 
 * @param email
 *            email id of logged in user
 */
userModel.logout = function(email, sessionID) {
	var deffered = q.defer();
	User.find({
		email : email
	}).then(function(auser) {
		if (auser !== null && auser.length > 0) {
			auser[0].sessionId = '';
			User.update({
				email : email
			}, auser[0], function(err, numberAffected, rawResponse) {
				if (err) {
					deffered.reject(error);
					logger.error(util.format('Error occured while logging user out error %j', err));
				} else {
					deffered.resolve(true);
					logger.info(util.format('User logged out successfully -> %s', email));
				}
			});
		} else {
			deffered.reject(new Error());
		}
	}, function(error) {
		deffered.reject(error);
	});

	return deffered.promise;
};

userModel.getTitles = function() {
	var deffered = q.defer();

	Title.find({}, function(error, data) {
		console.log(error);
		// console.log(data);

		if (error === null && data !== null && data.length > 0) {
			deffered.resolve(_.pluck(data, 'title'));
		} else {
			deffered.resolve([]);
		}
	});
	return deffered.promise;
};

userModel.getSkills = function(title) {
	var deffered = q.defer();
	//console.log('got req '+ moment().utc().format('HH:mm:ss:SSS'));
	//first fetch title doc
	Title.findOne({
		title : title
	}, function(error, titleDoc) {
		//console.log('got title '+ moment().utc().format('HH:mm:ss:SSS'));
		if (error) {
			deffered.reject(error);
		} else {
			////console.log(titleDoc);
			if (titleDoc !== null) {
				//then fecth title and skills relationship doc
				TitleMISkill.findOne({
					title : titleDoc.title
				}, 'skills', function(error, titleMISkillDoc) {
					//console.log('got skills '+ moment().utc().format('HH:mm:ss:SSS'));
					if (error) {
						deffered.reject(error);
					} else {
						if (titleMISkillDoc !== null) {
							//	//console.log(titleMISkillDoc);

							//last fetch all the skills docs because _id are needed to identify whether user has already selected the skill set in another title
							Skill.find({
								skill : {
									'$in' : _.pluck(titleMISkillDoc.skills, 'skill')
								}
							}, 'skill _id', function(error, skillDocs) {
								//console.log('got relationship '+ moment().utc().format('HH:mm:ss:SSS'));
								if (error) {
									deffered.reject(error);
								} else {
									//console.log(skillDocs.length);
									var result = [];
									for ( var index in titleMISkillDoc.skills) {
										for ( var skillIndex in skillDocs) {
											if (titleMISkillDoc.skills[index].skill === skillDocs[skillIndex].skill) {
												result.push({
													_id : skillDocs[skillIndex]._id,
													skill : titleMISkillDoc.skills[index].skill,
													MI : titleMISkillDoc.skills[index].MI
												});
												break;
											}
										}
									}
									//console.log('Sending response '+ moment().utc().format('HH:mm:ss:SSS'));
									deffered.resolve(result);
								}
							});
						} else {
							deffered.resolve([]);
						}
					}
				});
			} else {
				deffered.resolve([]);
			}
		}
	});

	return deffered.promise;
};

//userModel.getSkills('Software Engineer');

userModel.saveSkills = function(email, data) {
	var deffered = q.defer();
	//logger.info(util.format('userModel.saveSkills  email:- %s data:- %j', email, data));
	User.findOne({
		email : email
	}).then(function(auser) {
		//logger.info(util.format('userModel.saveSkills  auser:- %j', auser));
		if (auser !== undefined && auser !== null) {
			if (data.skills === undefined || data.skills === null || data.skills.length === 0) {
				auser.skills = [];
				auser.recommendedJobTitles = [];
			} else {
				auser.skills = data.skills;
			}
			auser.geoLocation = data.geoLocation;
			User.update({
				email : email
			}, auser, function(err, numberAffected, rawResponse) {
				//logger.info(util.format('userModel.saveSkills  err:- %j', err));
				//logger.info(util.format('userModel.saveSkills  numberAffected:- %d', numberAffected));
				if (err) {
					deffered.reject(error);
					logger.info(util.format('Error occured while saving skills %s', err.stack));
				} else {
					deffered.resolve(true);
					logger.info(util.format('User skills saved successfully -> %s', data.email));

				}
			});
		}
	}, function(error) {
		deffered.reject(error);
	});

	return deffered.promise;
};

userModel.linkedinLogin = function(reqData) {
	var deffered = q.defer();
	//logger.info(util.format('userModel.linkedinLogin reqBody:- %j', reqData));
	// Step 1. Exchange authorization code for access token.
	rest.post(config.get('strategies.linkedin.accessTokenApi'), {
		data : {
			grant_type : 'authorization_code',
			client_id : config.get('strategies.linkedin.api_key'),
			code : reqData.code,
			client_secret : config.get('strategies.linkedin.secret'),
			redirect_uri : config.get('strategies.linkedin.redirect_uri')
		}
	}).on('complete', function(data, resp) {
		// logger.info(util.format('userModel.linkedinLogin access token resp.statusCode:- %d', resp.statusCode));
		//logger.info(util.format('userModel.linkedinLogin data :- %j', data));

		if (resp !== null && resp.statusCode !== 200) {
			var error = new Error('Invalid Repsonse');
			deffered.reject(error);
		} else {
			var accessToken = data.access_token;

			//logger.info(accessToken);
			//logger.info(config.get('strategies.linkedin.dataApi') + accessToken);
			rest.get(config.get('strategies.linkedin.dataApi') + accessToken, {
				headers : {
					'Connection' : 'Keep-Alive'
				}
			}).on('complete', function(profile, resp) {
				if (resp !== null && resp.statusCode === 200) {

					//logger.info(util.format('userModel.linkedinLogin profile info resp:- %d', resp.statusCode));
					//logger.info(util.format('userModel.linkedinLogin profile info :- %j ', profile));
					User.find({
						linkedinId : profile.id
					}, function(err, auser) {
						//logger.info(util.format('userModel.linkedinLogin err :- %j ', err));
						//logger.info(util.format('userModel.linkedinLogin profile :- %j ', profile.positions.values[0].title));

						profileScrapper.getUserData(profile.publicProfileUrl).then(function(userData) {
							var skills = [];
							if (err === null) {
								if (auser !== null && auser.length > 0) {
									for ( var index in userData.skills) {
										var isFound = false;
										for ( var userSkillIndex in auser[0].skills) {
											if (auser[0].skills[userSkillIndex].skill === userData.skills[index]) {
												isFound = true;
												break;
											}
										}
										if (!isFound) {
											auser[0].skills.push({
												skill : userData.skills[index]
											});
										}
									}
									auser[0].email = profile.emailAddress;
									auser[0].name = profile.firstName + ' ' + profile.lastName;
									// auser[0].skills = skills;
									auser[0].geoLocation = profile.location.name;
									if(profile.positions._total > 0){
										auser[0].linkedinTitle = profile.positions.values[0].title;
									}else{
										auser[0].linkedinTitle = '';
									}

									User.update({
										linkedinId : profile.id
									}, auser[0], function(err, numberAffected, rawResponse) {
										if (err) {
											deffered.reject(err);
										} else {
											delete auser[0].password;
											delete auser[0].salt;
											delete auser[0].linkedinId;
											deffered.resolve(auser[0]);
										}
									});
									//console.log(auser);
									//logger.info(util.format('userModel.linkedinLogin auser :- %j ', auser));
								} else {
									User.find({
										email : profile.emailAddress
									}, function(err, auser) {
										
										//logger.info(util.format('userModel.linkedinLogin err :- %j ', err));
										logger.info(util.format('userModel.linkedinLogin--------- auser :- %j ', profile.positions));
										if (err) {
											deffered.reject(err);
											logger.error(util.error('userModel.linedinLogin error in user.find with email:- %s', err.stack));
										} else if (auser === null || auser.length === 0) {
											for ( var index in userData.skills) {
												skills.push({
													skill : userData.skills[index]
												});
											}
											if(profile.positions._total > 0){
												var varlinkedinTitle = profile.positions.values[0].title;
											}else{
												var varlinkedinTitle = '';
											}

											var user = {
												email : profile.emailAddress,
												name : profile.firstName + ' ' + profile.lastName,
												linkedinId : profile.id,
												password : '',
												salt : config.get('server.security.emailSalt'),
												skills : skills,
												geoLocation : profile.location.name,
												linkedinTitle : varlinkedinTitle
												
											};
											new User(user).save(function(error) {
												if (error) {
													deffered.reject(error);
												} else {
													delete user.password;
													delete user.salt;
													delete user.linkedinId;
													deffered.resolve(user);
												}
											});
										} else {
											var error = new Error();
											if (auser[0].linkedinId === '') {
												error.code = constants.messageKeys.code_4011;
											}
											deffered.reject(error);
											logger.error(util.format('userModel.linedinLogin user already exits:- %j', error));
										}
									});
								}
							} else {
								deffered.reject(new Error());
								logger.error(util.format('userModel.linedinLogin error in checking user:- %s', err.stack));
							}
						}, function(error) {
							deffered.reject(error);
							logger.error(util.format('userModel.linedinLogin error in getting profile scrapper:- %s', error.stack));
						});
					});
				} else {
					deffered.reject(new Error());
					logger.error(util.format('userModel.linedinLogin error in getting profile:- %j', resp));
				}
			}, function(error) {
				deffered.reject(error);
				logger.error(util.format('userModel.linedinLogin error in getting access token:- %j', error));
			});
		}
	}, function(error) {
		deffered.reject(error);
		logger.error(util.format('userModel.linedinLogin error in getting access token:- %j', error));
	});

	return deffered.promise;
};

userModel.getJoblist = function(data) {
	var deffered = q.defer();
	var skillStr = '';
	logger.info(util.format('skillStr:- %j', data));
	// if (data.skills !== undefined & data.skills !== null && data.skills.length > 0) {
	// 	skillStr += '(';
	// 	var length = data.skills.length - 1;
	// 	for (var index in data.skills) {
	// 		skillStr += data.skills[index].skill + (index < length ? ' or ' : '');
	// 	}
	// 	skillStr += ')';
	// }
	logger.info('skillStr:- ' + skillStr);

	// var optionalSkills = '';
	// var requiredSkills = '';

	if (data.requiredSkills !== undefined) {
		//skillStr += '(';
		for ( var index in data.requiredSkills) {
			skillStr += data.requiredSkills[index].skill;
			if (index < data.requiredSkills.length - 1) {
				skillStr += ' ';
			}
		}
	}

	logger.info(util.format('skillStr:- %s', skillStr));

	if (data.optionalSkills !== undefined && data.optionalSkills.length > 0) {
		//if (data.requiredSkills === undefined) {
		skillStr += '(';
		//} else {
		//skillStr += ' OR ';
		//}
		for ( var index in data.optionalSkills) {
			skillStr += data.optionalSkills[index].skill;
			if (index < data.optionalSkills.length - 1) {
				skillStr += ' OR ';
			}
		}
		skillStr += ')';
	}

	////if (skillStr.indexOf('(') >= 0) {
	//	skillStr += ')';
	//}

	// logger.info(util.format('optionalSkills:- %j' , optionalSkills));
	logger.info(util.format('skillStr:- %s', skillStr));

	if ((data.recommendedJobTitles !== undefined && data.recommendedJobTitles.length > 0) || data.jobTitle !== undefined) {
		if (skillStr.length > 0) {
			skillStr += ' or title:(';
		} else {
			skillStr += ' title:(';
		}
		for (var index = 0; index < data.recommendedJobTitles.length; index++) {
			if (index !== 0) {
				skillStr += ' or ' + data.recommendedJobTitles[index].jobTitle;
			} else {
				skillStr += data.recommendedJobTitles[index].jobTitle;
			}
		}
		if(data.jobTitle !== undefined){
			skillStr += data.jobTitle;
		}
		skillStr += ')';
	}

	logger.info(util.format('skillStr:- %s', skillStr));

	//if(skillStr !== '') {
	rest.get(config.get('indeedApi.url'), {
		query : {
			publisher : config.get('indeedApi.publisherId'),
			q : skillStr,
			// as_ttl : data.jobTitle !== undefined ? data.jobTitle : '',
			l : data.geoLocation,
			start : data.start,
			limit : data.limit,
			v : config.get('indeedApi.version'),
			format : 'json'
		}
	}).on('complete', function(data, resp) {
		if (resp !== null && resp.statusCode === 200) {
			deffered.resolve(JSON.parse(data));
		} else {
			deffered.reject(new Error());
			logger.error(util.format('userModel.getJoblist  error:- %j', resp));
		}
	});
	// } else {
	// 	var error = new Error();
	// 	error.code === 4002;
	// 	deffered.reject(error);
	// }

	return deffered.promise;
};

// userModel.getJoblist('pratik',{requiredSkills : ['php', 'mysql', 'css'] , optionalSkills:['java']}).then(function(data){
// 	console.log(data);
// },function(error){
// 	console.error(error);
// });

userModel.getJobTitles = function(reqData, email) {
	var deffered = q.defer();
	//logger.info(util.format('userModel.saveSkills  email:- %s data:- %j', email, data));
	// User.findOne({
	// 	email : email
	// }).then(function(auser) {
	//console.info(err);
	// console.info(auser);
	//logger.info(util.format('userModel.saveSkills  auser:- %j', auser));
	// if (auser !== undefined && auser !== null) {
	// if (auser.skills !== undefined && auser.skills !== null && auser.skills.length > 0) {
	if (reqData.skills !== undefined && reqData.skills !== null && reqData.skills.length > 0) {

		TitleMISkill.find({
			'skills.skill' : {
				$in : _.pluck(reqData.skills, 'skill')
			}
		}, function(err, data) {
			if (err) {
				console.info('err:- %j', err);
				deffered.reject(err);
			} else {
				// console.info(data.length);
				// var midata = data;
				// //console.info(midata);
				// console.info(_.pluck(midata,'title'));
				// // console.info('midata.length:- '+ midata.length);
				// for (var i = 0 ; i < midata.length - 2 ; i++) {
				// 	for (var j = i+1 ; j < midata.length - 1 ; j++) {
				// 		if (midata[i].title === midata[j].title) {
				// 			midata.splice(j,1);
				// 			break;
				// 		}
				// 	}
				// }
				// console.info(midata.length);
				//var highestIndex = -1;
				//var highestCount = 0;
				var sortedData = [];
				for ( var index in data) {
					var currentCount = 0;
					for ( var dataIndex in data[index].skills) {
						for ( var userSkillIndex in reqData.skills) {
							if (data[index].skills[dataIndex].skill === reqData.skills[userSkillIndex].skill) {
								if (reqData.skills[userSkillIndex].weight !== undefined) {
									currentCount += data[index].skills[dataIndex].MI * reqData.skills[userSkillIndex].weight;
								}
								break;
							}
						}
					}
					//console.log('index:- '+ index);
					//console.log('currentCount:- '+ currentCount);
					//if (currentCount > highestCount) {
					// if (sortedData.length === 0) {
					// console.log(_.pluck(sortedData,'jobTitle'));
					//	console.log(_.pluck(sortedData,'jobTitle').indexOf(data[index].title));
					//if (_.pluck(sortedData,'jobTitle').indexOf(data[index].title) === -1) {
					sortedData.push({
						id : data[index]._id,
						jobTitle : data[index].title,
						weightage : currentCount
					});
					//}
					//highestCount = currentCount;
					//highestIndex = index;
					//}
				}
				//console.log(_.pluck(sortedData,'jobTitle').sort());
				// console.log('sortedData.length:- ' + sortedData.length);
				if (sortedData.length > 0) {
					for (var i = 0; i < sortedData.length - 2; i++) {
						for (var j = i + 1; j < sortedData.length - 1; j++) {
							if (sortedData[j].weightage > sortedData[i].weightage) {
								var temp = JSON.stringify(sortedData[i]);
								sortedData[i] = sortedData[j];
								sortedData[j] = JSON.parse(temp);
							}
						}
					}

					//if (highestIndex > -1) {
					var recommendedJobTitles = sortedData.slice(0, 20);
					console.log('recommendedJobTitles.length:- ' + recommendedJobTitles.length);
					deffered.resolve({
						recommendedJobTitles : recommendedJobTitles
					});
					if (email !== undefined) {
						User.findOne({
							email : email
						}).then(function(auser) {
							//console.info(err);
							auser.recommendedJobTitles = recommendedJobTitles;

							User.update({
								email : email
							}, auser, function(err, numberAffected, rawResponse) {
								if (err) {
									//deffered.reject(err);
								} else {
									//deffered.resolve({recommendedJobTitles : auser.recommendedJobTitles});
								}
							});
						});
					}
				} else {
					var error = new Error();
					error.code = constants.messageKeys.code_4013;
					deffered.reject(error);
				}
				// console.log('highestIndex:- '+ highestIndex);
				// console.log('highestCount:- '+ highestCount);
				// console.log('data[highestIndex]:- %j' ,data[highestIndex]);
			}
		});
		// auser.skills = data.skills;
		// auser.geoLocation = data.geoLocation;
		// User.update({
		// 	email : email
		// }, auser, function(err, numberAffected, rawResponse) {
		// 	//logger.info(util.format('userModel.saveSkills  err:- %j', err));
		// 	//logger.info(util.format('userModel.saveSkills  numberAffected:- %d', numberAffected));
		// 	if (err) {
		// 		deffered.reject(error);
		// 		logger.info(util.format('Error occured while saving skills %s', err.stack));
		// 	} else {
		// 		deffered.resolve(true);
		// 		logger.info(util.format('User skills saved successfully -> %s', data.email));

		// 	}
		// });
	} else {
		var error = new Error();
		error.code = constants.messageKeys.code_4013;
		deffered.reject(error);
	}
	// } else {
	// 	var error = new Error();
	// 	error.code = constants.messageKeys.code_4001;
	// 	deffered.reject(error);
	// }
	// }, function(error) {
	// 	deffered.reject(error);
	// });

	return deffered.promise;
};

module.exports = userModel;