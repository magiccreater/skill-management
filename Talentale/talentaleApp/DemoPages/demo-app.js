var demoApp = angular.module('demoApp', []);

demoApp.controller('demoController', ['$scope', function($scope) {
	$scope.items = [{
	      name  : 'First Item',
	      value : 500
	    },
	    {
	      name  : 'Second Item',
	      value : 200
	    },
	    {
	      name  : 'Third Item',
	      value : 700
	    }];
	
	$scope.slider = {
		    value: 10
		};

}]);