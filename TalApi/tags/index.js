var service = require('./tags-service');

module.exports = function(app) {
	// Define routes related to tags her
	app.post('/tags/search', service.search);
};