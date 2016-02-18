var util = require('util');
var Validator = require('jsonschema').Validator;
var logger = require('../utils/logger');
var constants = require('../utils/constants');
var _validator = new Validator();

var schemas = function() {
};

// For registeration confirmation
schemas.confirmRegisteration = {
	'id' : '/confirmRegisteration',
	'type' : 'object',
	'properties' : {
		'ID' : {
			'type' : 'string',
			'required' : true
		}
	}
};

// Login response schema
schemas.user = {
	'id' : '/user',
	'type' : 'object',
	'properties' : {
		'email' : {
			'type' : 'string',
			'pattern' : constants.regExp.email,
			'required' : true
		},
		'name' : {
			'type' : 'string',
			'required' : true
		},
		'password' : {
			'type' : 'string',
			'required' : true
		},
		'skills' : {
			'type' : 'array',
			'items' : {
				'type' : 'string'
			}
		},
		'geoLocation' : {
			'type' : 'string'
		},
		'score' : {
			'type' : 'string',
			'required' : false
		}
	}
};

// Login response schema
schemas.loginResponse = {
	'id' : '/loginResponse',
	'type' : 'object',
	'properties' : {
		'email' : {
			'type' : 'string',
			'pattern' : constants.regExp.email,
			'required' : true
		},
		'name' : {
			'type' : 'string',
			'required' : true
		},
		'skills' : {
			'type' : 'array',
			'items' : {
				'type' : 'object'
			}
		},
		'geoLocation' : {
			'type' : 'string'
		},
		'sessionId' : {
			'type' : 'array'
		},
		'userId' : {
			'type' : 'string',
			'required' : false
		},
		'score' : {
			'type' : 'string',
			'required' : false
		}
	}
};

// job list request schema
schemas.getJobListRequest = {
	'id' : '/getJobListRequest',
	'type' : 'object',
	'properties' : {
		'start' : {
			'type' : 'number',
			'required' : true
		},
		'limit' : {
			'type' : 'number',
			'required' : true
		},
		'jobTitle' : {
			'type' : 'string',
			'required' : false
		},
		'recommendedJobTitles' : {
			'type' : 'array',
			'items' : {
				'type' : 'object'
			},
			'required' : false
		},
		'requiredSkills' : {
			'type' : 'array',
			'items' : {
				'type' : 'object'
			},
			'required' : false
		},
		'optionalSkills' : {
			'type' : 'array',
			'items' : {
				'type' : 'object'
			},
			'required' : false
		},
		'geoLocation' : {
			'type' : 'string'
		}
	}
};

schemas.associateNewSkillRequest = {
	'id' : '/associateNewSkillRequest',
	'type' : 'object',
	'properties' : {
		'skillId' : {
			'type' : 'string',
			'required' : false,
			'maxLength' : 24,
			'minLength' : 24
		},
		'skillName' : {
			'type' : 'string',
			'required' : false
		},
		'associatedSkillId' : {
			'type' : 'string',
			'required' : false
		},
		'associatedSkillName' : {
			'type' : 'string',
			'required' : false
		},
		'associatedSkillWeight' : {
			'type' : 'number',
			'required' : false
		}
	}
};

schemas.addMaterialRequest = {
	'id' : '/addMaterialRequest',
	'type' : 'object',
	'properties' : {
		'skillId' : {
			'type' : 'string',
			'required' : false,
			'maxLength' : 24,
			'minLength' : 24
		},
		'skillName' : {
			'type' : 'string',
			'required' : false
		},
		'tag' : {
			'type' : 'array',
			'items' : {
				'type' : 'string'
			}
		},
		'title' : {
			'type' : 'string',
			'required' : false
		},
		'description' : {
			'type' : 'string',
			'required' : false
		},
		'category' : {
			'type' : 'string',
			'required' : false
		},
		'webLink' : {
			'type' : 'string',
			'required' : false
		},
		'markAsInAppropiate' : {
			'type' : 'boolean',
			'required' : false
		}
	}
};

// Save material request schema
schemas.saveMaterialRequest = {
	'id' : '/saveMaterialRequest',
	'type' : 'object',
	'properties' : {
		'ID' : {
			'type' : 'string',
			'required' : false
		},
		'tag' : {
			'type' : 'array',
			'items' : {
				'type' : 'string'
			}
		},
		'title' : {
			'type' : 'string',
			'required' : false
		},
		'description' : {
			'type' : 'string',
			'required' : false
		},
		'category' : {
			'type' : 'string',
			'required' : false
		},
		'webLink' : {
			'type' : 'string',
			'required' : false
		}
	}
};

schemas.validate = function(object, schema) {
	var errors = _validator.validate(object, schema).errors;
	if (errors.length > 0) {
		logger.error(util.format('Schema validation failed for: %j', errors));
	}
	return errors.length <= 0 ? true : false;
};

module.exports = schemas;