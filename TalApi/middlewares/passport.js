module.exports = function(app) {

	var passport = require('passport'), userModel = require('../models/user'), config = require('../config'), LocalStrategy = require('passport-local').Strategy,
	// LinkedInStrategy = require('passport-linkedin').Strategy,
	common = require('../utils/common'), schemas = require('../models/schemas');

	app.use(passport.initialize());
	app.use(passport.session());

	var strategy = new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true
	}, function(req, email, password, done) {
		userModel.authenticate({
			email : email,
			password : password
		}).then(function(user) {
			return done(null, user);
		}, function(error) {
			return done(error);
		});
	});

	passport.use(strategy);

	// passport.use(new LinkedInStrategy({
	//   consumerKey: config.get('strategies.linkedin.api_key'),
	//   consumerSecret: config.get('strategies.linkedin.secret'),
	//   callbackURL: config.get('strategies.linkedin.callback_url')
	// },
	// function(token, tokenSecret, profile, done) {
	//   User.findOrCreate({ linkedinId: profile.id }, function (err, user) {
	//     return done(err, user);
	//   });
	// }
	// ));

	// setup local strategy

	passport.serializeUser(function(user, next) {
	//	console.log('user:- ' + user);
		next(null, user.email);
	});

	passport.deserializeUser(function(email, next) {
		//console.log('email:- ' + email);
		userModel.findOne(email).then(function(auser) {
			auser = common.sanitize(auser, schemas.loginResponse);
			next(null, auser);
		}, function(error) {
			next(error);
		});
	});
};