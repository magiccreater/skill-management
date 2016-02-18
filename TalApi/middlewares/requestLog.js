module.exports = function(app) {
	var logger = require('../utils/logger');
	var util = require('util');

	app.use(function(req, res, next) {
		// User may not be logged in so pass on the request
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		logger.info(util.format('%s request from:- %s', req.url, ip));
		// logger.info(util.format('request from:- %j', req.headers));

		if (req.method.toLowerCase() === 'get') {
			logger.info(util.format('request query:- %j', req.query));
		} else {
			logger.info(util.format('request body:- %j', req.body));
		}
		next();
	});
};
