var skillsApp = angular.module('skillsApp', []);


skillsApp.controller('skillsListController',['$scope', function($scope){
	$scope.list = [{skill : "test"}, {skill : "test1"}, {skill : "test2"}];
	
	
}]);

skillsApp.controller('skillsEditController',['$scope', '$location', '$routeParams', function($scope, $location, $routeParams){
	var skillParam, mode;
	$scope.skillSet = [{id: 1, name: "sql"}, {id: 2, name: "c"}, {id: 3, name: "dbms"}];
	$scope.skill;
	$scope.slider = {value: 10};
	$scope.material = [{title:"a", url: "www.google.com", category: [{id: 1, name: "sql"}, {id: 2, name: "c"}, {id: 3, name: "dbms"}], tag: [{id: 1, name: "sql"}, {id: 2, name: "c"}, {id: 3, name: "dbms"}], comments: "sd"}];
	
	var _init = function() {
		skillParam = $routeParams.id;
		$scope.skill =  mode == "edit" ? skillParam : "";
		mode = $routeParams.id != undefined ? "edit" : "create";
	};	
		
	$scope.save = function() {
		$location.path("/manage/skills/list");
	};
	
	$scope.cancel = function() {
		$location.path("/manage/skills/list");
	};
}]);

skillsApp.service("skillService", [function() {
	var skillService = {};
	
	return skillService;
}]);
