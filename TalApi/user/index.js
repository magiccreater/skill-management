var service = require('./user-service');

module.exports = function(app) {
	// Define routes related to user here

	app.get('/user/get/titles', service.getTitles);

	app.get('/user/get/skills', service.getSkills);

	app.post('/user/save/skills', service.saveSkills);

	app.post('/user/get/jobList', service.getJoblist);

	app.post('/user/get/jobtitles', service.getJobTitles);

	app.post('/user/get/userSkills', service.getUserSkills);

	app.post('/user/get/findSkills', service.getUserSkills);

	app.post('/user/getScore', service.getScore);
};