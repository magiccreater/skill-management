/**
 * 
 */
var initApp = angular.module('initApp', []);

initApp.controller('initController', ['$scope', '$routeParams', '$location', '$window', 'initService', 'messageService' , function ($scope, $routeParams, $location,$window, initService, messageService) {
	$scope.isConfirmRegistrationPage = false;
	$scope.isConfirmRegistrationSuccess = false;
	$scope.message = "";
	var path = $location.path();
	var queryString = $location.search();
	
	if(path.indexOf('/RegisterationConfirmation') >= 0){
		$scope.isConfirmRegistrationPage = true;
		initService.confirmRegistration(queryString.reqId).then(function(response){
			$scope.isConfirmRegistrationSuccess = true;
		}, function(error){
			$scope.isConfirmRegistrationSuccess = false;
			if(error && error.code){
				$scope.message = messageService.getMessageText('DAPI_' + error.code).en;
			}
		});
	}else{
		$scope.isConfirmRegistrationSuccess = false;
	}
	
	$scope.redirectTo = function(url) {
		$scope.isConfirmRegistrationPage = false;
		$scope.isConfirmRegistrationSuccess = false;
		$scope.message = "";
		$window.location.href = "#" + url;
	};
}]);

initApp.service("initService", function(talentaleAPI, $http, $q){
	var initService = {};
	
	initService.confirmRegistration = function(reqid){
		var defer = $q.defer();
		
		if(reqid){
			$http.post(talentaleAPI.base_url + "/auth/confirmRegistration", {
				ID : reqid
			}).then(function(response){
				defer.resolve();
			},function(error){
				defer.reject(error.data);
			});
		}else{
			defer.reject();
		}
		
		return defer.promise;
	};
	
	return initService;
	
});