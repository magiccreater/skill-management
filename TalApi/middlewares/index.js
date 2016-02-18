var bodyParser = require('body-parser');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var config = require('../config');
var logger = require('../utils/logger');
var util = require('util');
var constants = require('../utils/constants');
var session = require('express-session');
var MongoStore = require('connect-mongo/es5')(session);

module.exports = function(app, express, root) {

	// Enable request logger
	require('./requestLog')(app);

	// // To catch uncaught exception and give an appropriate response to the user
	app.use(function(err, req, res, next) {
		logger.error(util.format('Uncaught exception caught, error:- %j', err));
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});

	// Enable http logging
	if (config.get('server.enableHttpLogging'))
		app.use(logger.startHttpLogger());

	// Enable compression
	if (config.get('server.enableCompression'))
		app.use(compression());

	// Prevent opening page in frame or iframe to protect from clickjacking
	if (config.get('server.security.enableXframe'))
		app.use(helmet.xframe());

	// Remove X-Powered-By
	if (config.get('server.security.enableHidePoweredBy'))
		app.use(helmet.hidePoweredBy());

	// Prevents browser from caching and storing page
	if (config.get('server.security.enableNoCaching'))
		app.use(helmet.cacheControl());

	// Allow loading resources only from white-listed domains
	if (config.get('server.security.enableCSP'))
		app.use(helmet.csp());

	// Allow communication only on HTTPS
	if (config.get('server.security.enableHSTS'))
		app.use(helmet.hsts());

	// Enable XSS filter in IE (On by default)
	if (config.get('server.security.enableXssFilter'))
		app.use(helmet.xssFilter());

	// Forces browser to only use the Content-Type set in the response header
	// instead of sniffing or guessing it
	if (config.get('server.security.enableForceContentType'))
		app.use(helmet.contentTypeOptions());

	// Eanble CORS support
	if (config.get('server.security.enableCORS'))
		require('./CORS')(app);

	// Enable paths that we want to have it served statically
	if (config.get('server.enableStatic'))
		app.use(express.static(root + config.get('server.staticDirectory')));

	// Enable request body parsing
	app.use(bodyParser.urlencoded({
		extended : true,
		limit : config.get('server.bodyParser.limit')
	}));

	// Enable request body parsing in JSON format
	app.use(bodyParser.json({
		limit : config.get('server.bodyParser.limit')
	}));

	// Enable cookie parsing
	app.use(cookieParser(config.get('server.session.cookieSecret')));

	// Enable session creation using MongoDB
	app.use(session({
		secret : config.get('server.session.cookieSecret'),
		store : new MongoStore({
			url : config.get('mongodb.url') + config.get('mongodb.sessionCollection')
		}),
		resave : true,
		saveUninitialized : false
	}));

	// Initialize passport module
	require('./passport')(app);

	// Enable CSRF token security
	require('./CSRF')(app);

	require('./requestLog')(app);

};