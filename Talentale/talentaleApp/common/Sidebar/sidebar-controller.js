"use strict";

var sidebarApp = angular.module('sidebarApp', []);

sidebarApp.controller('SideBarController', ['$scope', '$location', '$rootScope', function ($scope, $location, $rootScope) {
	var mobileView = 768;
	$scope.isSkillActive = $location.path().indexOf("/skill")>=0 ? true : false;
	$scope.isJobActive = $location.path().indexOf("/home")>=0 ? true : false;
	var content_wrapper = $(".content-wrapper-sidebar-close");
	
	$scope.getWidth = function () {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function (newValue, oldValue) {
        if (newValue >= mobileView) {
            /*if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = !$cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = false;
            }*/
        	content_wrapper.removeClass("content-wrapper-sidebar-open")
        	.addClass("content-wrapper-sidebar-close");
        	$scope.toggle = false;
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function () {
        $scope.toggle = !$scope.toggle;
        
        content_wrapper.toggleClass("content-wrapper-sidebar-open").toggleClass("content-wrapper-sidebar-close");
//        $cookieStore.put('toggle', $scope.toggle);
    };
    
    $scope.hideSidebar = function(){
    	if ($scope.toggle)
    		content_wrapper.toggleClass("content-wrapper-sidebar-open").toggleClass("content-wrapper-sidebar-close");
    	
    	$scope.toggle = false;
        //$cookieStore.put('toggle', $scope.toggle);
    }

    window.onresize = function () {
        $scope.$apply();
    };
    
    $rootScope.$on('$routeChangeStart', function (event, nextRoute, currentRoute) {
    	$scope.isSkillActive = $location.path().indexOf("/skill")>=0 ? true : false;
    	$scope.isJobActive = $location.path().indexOf("/home")>=0 ? true : false;
    });
}]);
