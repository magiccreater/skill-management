var q = require('q');
var constants = require('../utils/constants');
var config = require('../config');
var nodemailer = require('nodemailer');
var _ = require('lodash');
var logger = require('./logger');
var util = require('util');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
	// Host Name i.e 01.securemails.org
	service : 'Gmail',
	port : 465,
	auth : {
		// Sender Mail address
		user : config.get('mailer.email'),
		// Sender password
		pass : config.get('mailer.password')
	},
	// For SSL
	secure : true,
	debug : true
});

var sendMail = function(mailOptions) {
	var deffered = q.defer();
	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			deffered.reject(error);
		} else {
			deffered.resolve(true);
		}
	});
	return deffered.promise;
};

var mailer = function() {
};

mailer.sendRegstrationMail = function(data) {
	var deffered = q.defer();
	var text = "<html><body>Dear <%= name %>,<br><br>Thank you for your interest in Talentale.<br><br>In order to activate your user account,please click the following link <a href=<%= link%>><%= link%></a><br><br>Should you have any questions or problems, please contact us by sending an e-mail to the following address:support@talentale.com<br><br>Please note that the links provided are only valid for thiry days after this e-mail has been sent.<br>Kind regards,<br>Talentale Team</body></html>"
	var compiled = _.template(text);
	var link = config.get('basePath') + data.userId;
	var mailerOptions = {
		from : config.get('mailer.email'),
		to : data.email,
		subject : config.get('mailer.registration.subject'),
		html : compiled({
			'name' : data.name,
			'link' : link
		})
	};
	sendMail(mailerOptions).then(function(status) {
		deffered.resolve(status);
	}, function(error) {
		deffered.reject(error);
	})

	return deffered.promise;
};
module.exports = mailer;