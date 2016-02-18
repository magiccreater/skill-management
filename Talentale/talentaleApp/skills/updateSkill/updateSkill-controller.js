"use strict";

var ManageSkills = angular.module('ManageSkills');

ManageSkills.controller("updateSkillController", ['$scope', 'skillService', function($scope, skillService){
	$scope.mySkills = [];
	$scope.materialSkills = [];
	$scope.selectedSkill = {};
	$scope.choosenSkill = {};
	
	
	
}]);