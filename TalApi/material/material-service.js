var util = require('util');
var _ = require('lodash');
var logger = require('../utils/logger');
var schemas = require('../models/schemas');
var material = require('./material-model');
var constants = require('../utils/constants');
var common = require('../utils/common');

var add = function(req, res) {
	var data = common.sanitize(req.body, schemas.addMaterialRequest);
	logger.info('Validating schema for addMaterial Request');
	if (schemas.validate(data, schemas.addMaterialRequest)) {
		data.userId = req.user.userId;
		material.add(data).then(function(status) {
			return res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : {}
			});
		}, function(error) {
			return res.status(500).send({
				code : 5002,
				messageKey : constants.messageKeys.code_5002,
				data : {}
			});
		});
	} else {
		// Incomplete data
		return res.status(401).send({
			code : 4002,
			messageKey : constants.messageKeys.code_4002,
			data : {},
		});
	}
};

// To list all the materials of user
var list = function(req, res) {
	material.list(req.user.userId, req.body.skillId).then(function(result) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : result
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});
};

// To save material
var save = function(req, res) {
	var data = common.sanitize(req.body, schemas.saveMaterialRequest);
	logger.info('Validating schema for save Material Request');
	if (schemas.validate(data, schemas.saveMaterialRequest)) {
		data.userId = req.user.userId;
		material.save(data).then(function(status) {
			return res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : {}
			});
		}, function(error) {
			if (error.code === 4015) {
				return res.status(401).send({
					code : 4015,
					messageKey : constants.messageKeys.code_4015,
					data : {}
				});
			} else {
				return res.status(500).send({
					code : 5002,
					messageKey : constants.messageKeys.code_5002,
					data : {}
				});
			}
		});
	} else {
		// Incomplete data
		return res.status(401).send({
			code : 4002,
			messageKey : constants.messageKeys.code_4002,
			data : {},
		});
	}
};

// To remove material
var remove = function(req, res) {
	material.remove(req.body).then(function(status) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : {}
		});
	}, function(error) {
		if (error.code === 4015) {
			return res.status(401).send({
				code : 4015,
				messageKey : constants.messageKeys.code_4015,
				data : {}
			});
		} else {
			return res.status(500).send({
				code : 5002,
				messageKey : constants.messageKeys.code_5002,
				data : {}
			});
		}
	});

};

// To search material
var search = function(req, res) {
	var data = req.body;
	material.search(data).then(function(result) {
		return res.status(200).send({
			code : 2000,
			messageKey : constants.messageKeys.code_2000,
			data : result
		});
	}, function(error) {
		return res.status(500).send({
			code : 5002,
			messageKey : constants.messageKeys.code_5002,
			data : {}
		});
	});

};

// To like material
var like = function(req, res) {
	var data = req.body;
	if (req.user !== undefined && req.user.userId != undefined) {
		data.userId = req.user.userId;
		material.like(data).then(function(result) {
			return res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : result
			});
		}, function(error) {
			return res.status(500).send({
				code : 5002,
				messageKey : constants.messageKeys.code_5002,
				data : {}
			});
		});
	} else {
		return res.status(401).send({
			code : 4016,
			messageKey : constants.messageKeys.code_4016,
			data : {}
		});
	}
};

// To dislike material
var dislike = function(req, res) {
	var data = req.body;
	if (req.user !== undefined && req.user.userId != undefined) {
		data.userId = req.user.userId;
		material.dislike(data).then(function(result) {
			return res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : result
			});
		}, function(error) {
			return res.status(500).send({
				code : 5002,
				messageKey : constants.messageKeys.code_5002,
				data : {}
			});
		});
	} else {
		return res.status(401).send({
			code : 4016,
			messageKey : constants.messageKeys.code_4016,
			data : {}
		});
	}
};

// To dislike material
var markInAppropiate = function(req, res) {
	var data = req.body;
	if (req.user !== undefined && req.user.userId != undefined) {
		data.userId = req.user.userId;
		material.markInAppropiate(data).then(function(result) {
			return res.status(200).send({
				code : 2000,
				messageKey : constants.messageKeys.code_2000,
				data : result
			});
		}, function(error) {
			return res.status(500).send({
				code : 5002,
				messageKey : constants.messageKeys.code_5002,
				data : {}
			});
		});
	} else {
		return res.status(401).send({
			code : 4016,
			messageKey : constants.messageKeys.code_4016,
			data : {}
		});
	}
};

module.exports = {
	add : add,
	list : list,
	save : save,
	remove : remove,
	search : search,
	like : like,
	dislike : dislike,
	markInAppropiate : markInAppropiate
};