var service = require('./material-service');

module.exports = function(app) {
	// Define routes related to materials here
	app.post('/material/add', service.add);

	// List all the materials
	app.post('/material/list', service.list);

	// Tp Save materials
	app.post('/material/save', service.save);

	// To remove materials
	app.post('/material/remove', service.remove);

	// To search
	app.post('/material/search', service.search);

	// To search
	app.post('/material/like', service.like);

	// To search
	app.post('/material/dislike', service.dislike);

	// To search
	app.post('/material/markInAppropiate', service.markInAppropiate);
};