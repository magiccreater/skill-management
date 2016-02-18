"use strict";

var loginApp = angular.module('loginApp', []);

loginApp.controller('loginController', ['$scope', '$uibModalInstance','$auth','$rootScope','$uibModal','authService','userService', 'localStorageUtilityService',
 function ($scope, $uibModalInstance,$auth,$rootScope, $uibModal,authService,userService, localStorageUtilityService) {

	// This object will be filled by the form
	$scope.loginDetail = {};

	// Register the login() function
	$scope.login = function () {
		authService.login($scope.loginDetail.email,$scope.loginDetail.password).then(function(response){
			$rootScope.showLoginSignUp = false;
			$uibModalInstance.close();
//			console.log("current-user-id" + response.userId);
			localStorageUtilityService.addToLocalStorage('current-user-id', response.userId);
			$rootScope.$broadcast('loggedIn');
			$rootScope.$broadcast('scoreUpdated');
		},function(error){
			//alert('error');
		});
	};


	$scope.authenticate = function(provider) {
		$auth.authenticate(provider).then(function(response) {
			if (!_.isUndefined(response) && !_.isUndefined(response.data) && !_.isUndefined(response.data.code)) {
				if (response.data.code == 2003) {
					authService.setIsAuthenticated(true);
					userService.updateUserDetails(response.data.data);
					$rootScope.showLoginSignUp = false;
					$uibModalInstance.close();
					$rootScope.$broadcast('loggedIn');
					$rootScope.$broadcast('scoreUpdated');
					localStorageUtilityService.addToLocalStorage('current-user-id', response.data.data.userId);
				}
			}
		}, function(error) {
			if (error.data.code === 4011) {
                messageService.showMessage('User with this email is already registered.', 'error');
            }
		});
	};
	$scope.close = function(){
		$uibModalInstance.dismiss('cancel');
	};

	$scope.signUp = function () {
		$uibModalInstance.dismiss('cancel');
		$uibModal.open( {'animation' : true, templateUrl: "auth/signup/partials/signup.html", controller: "signupController", 'size': 'md' });
	};
}]);
