var util = require('util');
var _ = require('lodash');
var logger = require('./logger');
var schemas = require('../models/schemas');
var constants = require("./constants");
var fs = require('fs');
var config = require('../config');
var q = require('q');

/**
 * This function will remove all the fields which is not included in schema.
 * 
 * @param object
 *            data object
 * @param schema
 *            schema for the object to compare fields
 */
var sanitize = function(object, schema) {
	var schemaKeys = _.keys(schema.properties);
	var objectKeys = _.keys(object);
	var constantsValues = _.values(constants.keys);

	for ( var key in objectKeys) {
		var isValueMatched = false;
		for ( var index in constantsValues) {
			if (constantsValues[index].indexOf(objectKeys[key].substring(0, constantsValues[index].length)) === 0) {
				isValueMatched = true;
				break;
			}
		}
		if (!isValueMatched && schemaKeys.indexOf(objectKeys[key]) === -1) {
			delete object[objectKeys[key]];
		} else {
			var propertyList = _.keys(schema.properties[objectKeys[key]]);
			for (var index = 0; index < propertyList.length; index++) {
				if (propertyList[index] === '$ref') {
					var refValue = schema.properties[objectKeys[key]];
					var refSchema = refValue.$ref.substring(1, refValue.$ref.length);
					sanitize(object[objectKeys[key]], schemas[refSchema]);
				}
			}
		}
	}
	// logger.info(util.format('%j', object));
	return object;
};

/**
 * This is function will remove the fields which are not allowed to vie
 * 
 * @param object
 *            data object
 * @param privacyObject
 *            contains the details privacy
 * @param viewerRelation
 *            relation of viewer with user
 */
var sanitizeByPrivacy = function(object, privacyObject, viewerRelation) {
	for ( var index in privacyObject) {
		var keys = _.keys(privacyObject[index]);
		var matchedResult = _.intersection(viewerRelation, keys);
		if (matchedResult.length === 0) {
			delete object[index];
		}
	}
	return object;
};

var formatJson = function(json) {
	var i = 0, il = 0, tab = " ", newJson = "", indentLevel = 0, inString = false, currentChar = null;
	for (i = 0, il = json.length; i < il; i += 1) {
		currentChar = json.charAt(i);
		switch (currentChar) {
		case '{':
		case '[':
			if (!inString) {
				newJson += currentChar + "\n" + repeat(tab, indentLevel + 1);
				indentLevel += 1;
			} else {
				newJson += currentChar;
			}
			break;
		case '}':
		case ']':
			if (!inString) {
				indentLevel -= 1;
				newJson += "\n" + repeat(tab, indentLevel) + currentChar;
			} else {
				newJson += currentChar;
			}
			break;
		case ',':
			if (!inString) {
				newJson += ",\n" + repeat(tab, indentLevel);
			} else {
				newJson += currentChar;
			}
			break;
		case ':':
			if (!inString) {
				newJson += ": ";
			} else {
				newJson += currentChar;
			}
			break;
		case ' ':
		case "\n":
		case "\t":
			if (inString) {
				newJson += currentChar;
			}
			break;
		case '"':
			if (i > 0 && json.charAt(i - 1) !== '\\') {
				inString = !inString;
			}
			newJson += currentChar;
			break;
		default:
			newJson += currentChar;
			break;
		}
	}
	return newJson;
};

var repeat = function(s, count) {
	return new Array(count + 1).join(s);
}

var saveFile = function(filePath, data, callback) {
	var deffered = q.defer();
	fs.exists(filePath, function(exists) {
		if (!exists) {
			fs.writeFile(filePath, data, function(error, status) {
				if (error) {
					deffered.reject(error);
				} else {
					deffered.resolve(status);
				}
			});
		} else {
			deleteFile(filePath).then(function(status) {
				logger.info('file deleted successfully');
				fs.writeFile(filePath, data, function(error, status) {
					if (error) {
						deffered.reject(error);
					} else {
						deffered.resolve(status);
					}
				});
			}, function(error) {
				logger.error('error in writing a file');
			});
		}
	});
	return deffered.promise;
};

var deleteFile = function(filePath) {
	var deffered = q.defer();

	fs.unlink(filePath, function(error, status) {
		if (error) {
			deffered.reject(error);
		} else {
			deffered.resolve(status);
		}
	});
	return deffered.promise;
};

/**
 * Get file name without extension.
 * 
 * @param fileName
 *            full file name.
 * @param extension
 *            extension of file.
 */
var getFileName = function(fileName, extension) {
	return fileName.substr(0, fileName.indexOf(extension) - 1);
};

/**
 * Get file extension from file name.
 * 
 * @param fileName
 *            full file name.
 */
var getFileExtension = function(fileName) {
	return (/[.]/.exec(fileName)) ? /[^.]+$/.exec(fileName) : undefined;
};

/**
 * Extract image extension and data
 * 
 * @param data
 *            data
 */
var extractImageData = function(data) {

	logger.info(data.substr(0, 25));
	var extension = data.substring(data.indexOf('data:image/') + 11, data.indexOf(';base64'));
	logger.info(extension);
	var imageData = data.substr(data.indexOf('base64') + 7, data.length);
	logger.info(data.substr(0, 10));
	logger.info(imageData.substr(0, 10));

	return {
		extension : extension,
		imageData : imageData
	};
};

/**
 * It is used to omit spaces from a string and replace them with the string
 * provided in the constants file
 * 
 * @param str
 *            any string
 */
var omitSpace = function(str) {
	return str.replace(/ /g, constants.spaceReplacement);
};

module.exports = {
	sanitize : sanitize,
	sanitizeByPrivacy : sanitizeByPrivacy,
	formatJson : formatJson,
	saveFile : saveFile,
	deleteFile : deleteFile,
	getFileNameWithoutExtension : getFileName,
	getFileExtension : getFileExtension,
	extractImageData : extractImageData,
	omitSpace : omitSpace
};