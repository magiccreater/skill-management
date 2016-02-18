var request = require("request"), cheerio = require("cheerio"), q = require('q');

var getUserData = function(url) {
	var deffered = q.defer();
	request(url, function(err, resp, body){
		if(err) {
			deffered.reject(err);
		} else if(resp.statusCode === 200) {
			var this_profile = {};
		  	$ = cheerio.load(body);
		  	
		  	var skills = $('.skill');
			var skill_arr = [];
			$(skills).each(function(i,skill){
				if($(skill).text() != 'See less' && $(skill).text().indexOf('See') < 0 && $(skill).text().indexOf('see') < 0)
					skill_arr.push($(skill).text());
			});
			/*if (skill_arr.length > 22) {
			    skill_arr.length = 22; 
			}*/
			this_profile.skills = skill_arr;
			deffered.resolve(this_profile);
		} else {
			deffered.reject(new Error());
		}
	});
	return deffered.promise;
};

module.exports = {
	getUserData:getUserData
};
