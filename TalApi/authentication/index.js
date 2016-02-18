var service = require('./authentication-service');

module.exports = function(app) {
	// Define routes related to login here

	// To generate session or to get session details
	app.get('/auth/session', service.session);

	app.get('/test', service.test);

	// To check API status
	app.get('/auth/keepAlive', service.keepAlive);

	// Login request
	app.post('/auth/login', service.login);

	// Logout request
	app.post('/auth/logout', service.logout);

	app.post('/auth/registration', service.register);

	app.post('/auth/linkedin', service.linkedinLogin);

	// For registration confirmation
	app.post('/auth/confirmRegistration', service.confirmRegistration);

};