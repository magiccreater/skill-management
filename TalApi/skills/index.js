var service = require('./skill-service');

module.exports = function(app) {
	// Define routes related to skills her
	app.post('/skills/associateNewSkillInfo', service.associateNewSkillInfo);

	// To get associated skill info
	app.post('/skills/getAssociatedSkillInfo', service.getAssociatedSkillInfo);

	// To get associated skills
	app.post('/skills/getAssociatedSkills', service.getAssociatedSkills);

	// To get associated skills
	app.post('/skills/updateRating', service.updateRating);

	// To get associated skills
	app.post('/skills/search', service.search);

};