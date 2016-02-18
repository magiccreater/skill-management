module.exports = function(app) {
	require('../authentication/index')(app);
	require('../user/index')(app);
	require('../skills/index')(app);
	require('../material/index')(app);
	require('../tags/index')(app);
};
