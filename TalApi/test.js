var tags = require('./tags/tags-model');

tags.addMissingTags([ '123', 'test', '131', 'hello123' ]).then(function(result) {
	console.log(result);
}, function(error) {
	console.log(error);
})