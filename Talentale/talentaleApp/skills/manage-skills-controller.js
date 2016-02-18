"use strict";

var ManageSkills = angular.module('ManageSkills', []);

ManageSkills.controller('ManageSkillsController', ['$scope',  'authService', function ($scope, authService) {
	$scope.tabName = 'build';
	$scope.isAuthenticate = authService.getIsAuthenticated();
	
	if(!$scope.isAuthenticate){
		$scope.tabName = 'browse';
	}
	
	$scope.goTo = function(value) {
		if(!$scope.isAuthenticate){
			$scope.tabName = 'browse';
		}else{
			$scope.tabName = value;
		}
	};
	
	var ses = $scope.$on('Authenticated', function() {
		$scope.isAuthenticate = authService.getIsAuthenticated();
	});
	
	var data = $scope.$on('setDataScreen2', function() {
		$scope.tabName = "material";
	});
	
	$scope.$on('$destroy', function() {
		ses(); data();
	});
}]);

ManageSkills.service("skillService", ["$http", "$q", 'talentaleAPI', '$rootScope', function($http, $q, talentaleAPI, $rootScope) {
	var skillService = {};
	
	skillService.getMySkills = function(query, selectedSkillId) {
		var deferred = $q.defer();
		$http.post(talentaleAPI.base_url+'/user/get/userSkills',{searchText : query, selectedSkillId: selectedSkillId})
		.then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	
	skillService.getSkills = function(query, selectedSkillId) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/user/get/findSkills',{searchText : query, selectedSkillId : selectedSkillId})
		.then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	skillService.getAssociatedSkillInfo = function(query) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/skills/getAssociatedSkillInfo',query)
		.then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	skillService.saveSkillRelationship = function(data) {
		
		var deferred = $q.defer();
		$http.post(talentaleAPI.base_url+'/skills/associateNewSkillInfo',data)
		.then(function(response) {
			$rootScope.$broadcast('scoreUpdated');
			deferred.resolve(response);
		}, function(error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	skillService.getCategories = function() {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/user/get/categories',{})
		.then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	
	skillService.getTags = function(query) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/tags/search',{searchText : query})
		.then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data.map(function(item) {
					 item.text = item.tag;
					 return item;
				}));
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	skillService.addMaterial = function(data) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/add', data)
		.then(function(response) {
			$rootScope.$broadcast('scoreUpdated');
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	skillService.getMaterialList = function(query) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/list', {skillId : query})
		.then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	skillService.saveMaterial = function(data) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/save',  {
		      "ID": data.ID,
		      "title": data.title,
		      "description": data.description,
		      "category": data.category,
		      "webLink": data.webLink,
		      "tag" : _.pluck(data.tag, "text")
		 }).then(function(response) {
			deferred.resolve();
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	skillService.removeMaterial = function(id) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/remove', {ID : id}).then(function(response) {
			$rootScope.$broadcast('scoreUpdated');
			deferred.resolve();
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	skillService.getAssociatedSkill = function(id) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/skills/getAssociatedSkills', {skillId : id}).then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};

	skillService.updateRating = function(data) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/skills/updateRating', {skillId : data.id, weight : data.weight, associatedSkillId : data.associatedSkillId}).then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	skillService.searchMaterial = function(query) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/search', query).then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	skillService.searchSkills = function(query) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/skills/search', {searchText : query}).then(function(response) {
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	skillService.likeMaterial = function(data) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/like', data).then(function(response) {
			$rootScope.$broadcast('scoreUpdated');
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	skillService.disLikeMaterial = function(data) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/dislike', data).then(function(response) {
			$rootScope.$broadcast('scoreUpdated');
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	skillService.markInappropriate = function(data) {
		var deferred = $q.defer();
		
		$http.post(talentaleAPI.base_url+'/material/markInAppropiate', data).then(function(response) {
			$rootScope.$broadcast('scoreUpdated');
			if(response.data != undefined && response.data.data != undefined)
				deferred.resolve(response.data.data);
			else {
				deferred.resolve([]);
			}
		}, function(error) {
			deferred.reject(error);
		});
		
		return deferred.promise;
	};
	
	return skillService;
}]);