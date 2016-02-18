"use-strict";

var logoutApp = angular.module('logoutApp',[]);

logoutApp.controller('logoutController', ['$log','$window','$rootScope','authService','messageService', 'userService','$scope', 'localStorageUtilityService',
                                          function($log,$window,$rootScope,authService,messageService, userService,$scope, localStorageUtilityService) {
	
	//Logout function
	var logout = function() {
		authService.logout(userService.getUserDetails().email).then(function(success) {
			$window.location.href = "#/home";

			messageService.showMessage('Logged Out Successfully','success','LOGOUT_SUCCESSMSG');
			localStorageUtilityService.removeFromLocalStorage('current-user-id');
			$rootScope.showLoginSignUp = true;	
		}, function(error) {
			$log.error(error);
		});
	};
	// initial call logout
	logout();
}]);