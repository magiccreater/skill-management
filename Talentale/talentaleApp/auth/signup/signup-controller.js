"use strict";

var signupApp = angular.module('signupApp', []);

signupApp.controller('signupController', ['$scope','$rootScope','$uibModalInstance','$uibModal','authService','messageService', function ($scope,$rootScope, $uibModalInstance,$uibModal,authService,messageService) {
    $scope.signUpDetail = {};

    $scope.registerForm = true;
    $scope.errorMessage = '';
    
    $scope.$watch('signUpDetail.confirmPassword',function(){
    	if($scope.signUpDetail.password !== $scope.signUpDetail.confirmPassword){
    		$scope.errorMessage = 'Confirm Password does not match.';
    	}else{
    		$scope.errorMessage = '';
    	}
    });

    // Register the register() function
    $scope.signUp = function () {
    	authService.registration($scope.signUpDetail).then(function(response){
    		$rootScope.$broadcast('signUp');
    		$uibModalInstance.close();
            messageService.showMessage('Registration done successfully. Please do the login.','success');
    		$scope.login();
    	},function(error) {
            // console.log(error);
            if (error.data.code === 4012) {
                messageService.showMessage('User already exists as a linkedin user. Please login using your linkedin account.', 'error');
            }
    	});
    };
    
    $scope.close = function(){
    	$uibModalInstance.dismiss('cancel');
    };

    $scope.login = function () {
    	$uibModalInstance.dismiss('cancel');
        var dialog = $uibModal.open({'animation' : true, templateUrl: "auth/login/partials/login.html", controller : "loginController", 'size': 'md' });
        dialog.result.then(function (success) {						
        	$rootScope.showLoginSignUp = false;
        }, function (cancel) {
        	$rootScope.showLoginSignUp = true;				
        });
    };
}]);
