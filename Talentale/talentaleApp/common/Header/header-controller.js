"use strict";

var headerApp = angular.module('headerApp', []);

headerApp.controller('HeaderController', ['$scope','$rootScope','$location','$uibModal','userService', function ($scope,$rootScope,$location,$uibModal,userService) {


    $scope.rightMenus = [{ "name": "Home", "title": "Home", "link": "#/home", "roles": [], "icon": null, "submenus": [] },
        { "name": "About", "title": "About", "link": "", "roles": [], "icon": null, "submenus": [] },
        { "name": "Contact", "title": "Contact", "link": "", "roles": [], "icon": null, "submenus": [] },
        { "name": "Help", "title": "Help", "link": "", "roles": [], "icon": null, "submenus": [] }];

    $scope.userDetail = userService.getUserDetails();
    
    $scope.LoginDialoge = function () {
        var dialog = $uibModal.open({'animation' : true, templateUrl: "auth/login/partials/login.html", controller:"loginController", 'size': 'md' });
        dialog.result.then(function (success) {						
        	$scope.userDetail = userService.getUserDetails();
        }, function (cancel) {
        	$rootScope.showLoginSignUp = true;				
        });
    };
    
    $scope.signUpDialoge = function () {
        $uibModal.open({'animation' : true, templateUrl:"auth/signup/partials/signup.html", controller: "signupController" ,'size': 'md' });
    };
    
    $scope.$on('loggedIn',function(event){
    	$scope.userDetail = userService.getUserDetails();
    });
    
    $scope.$on('Authenticated',function(event,args){
    	$scope.userDetail = userService.getUserDetails();
    });
    
    $scope.logout = function(){
    	$scope.userDetail.linkedinTitle = "";
    	$location.path('logout');
    };
    
    $scope.$on('scoreUpdated',function(event){
    	userService.getUserScore().then(function(response){
    		$scope.userScore = response;
    	});    	
    });
}]);
