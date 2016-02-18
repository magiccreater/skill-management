var materialApp = angular.module("ManageSkills");

materialApp.controller('materialController',['$scope', '$location', '$q', '$filter', 'NgTableParams', 'skillService', 'stackService', function($scope, $location, $q, $filter, NgTableParams, skillService, stackService){
	$scope.skills = [];	
	$scope.material = {title:"", url:"", tag : []};
	$scope.category = [{ name: "Choose a category", id: '' }, { name: "Text", id : "Text" }, { name: "Image", id : "Image" }, {name: "Video", id : "Video" }];
	$scope.materialList = [];
	var skillRaltionObj = {};
	
	var selSkill = stackService.popItem("selectedSkill");
	
	if(selSkill){
		$scope.selectedSkill = selSkill.skill;
		skillRaltionObj.id = selSkill.id;
		skillRaltionObj.skill = selSkill.skill;
	}else{
		selSkill = stackService.popItem("selectedSkill");
		if(selSkill){
			$scope.selectedSkill = selSkill.skill;
			skillRaltionObj.id = selSkill.id;
			skillRaltionObj.skill = selSkill.skill;
		}
	}
	
	var getMaterialList = function() {
		var defer = $q.defer();
		
		skillService.getMaterialList((skillRaltionObj.id)?skillRaltionObj.id : "").then(function(result) {
			defer.resolve(result);
		}, function(error) {
			defer.resolve([]);
		});
		
		return defer.promise;
	};
	
    $scope.tableParams = new NgTableParams({
        page: 1, count: 5
    }, {
        total: 0, // length of data
        getData: function ($defer, params) {
        	getMaterialList().then(function(result) {
    			var filteredData = result;
    			filteredData = $filter('orderBy')(filteredData, params.orderBy());
                params.total(filteredData.length);
                $defer.resolve(filteredData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
			});
        }
    });
	
	var _init = function() {
		/*skillService.getCategories().then(function(result) {
			$scope.material.category = result;
		}, function(error) {
			
		});*/
	};	
	
	$scope.getSkills = function(val) {
		return skillService.getMySkills(val).then(function(result) {
			return result;
		});
	};
	
	$scope.setSkillId = function(item){
		console.log(item);
		skillRaltionObj.id = item._id;
		skillRaltionObj.skill = item.skill;
		$scope.tableParams.reload();
		$scope.tableParams.page(1);
	};
	
	$scope.addMaterial = function() {
		if(skillRaltionObj.id && skillRaltionObj.skill){			
			var material = {skillId: skillRaltionObj.id, skillName: skillRaltionObj.skill, title:$scope.material.title, webLink: $scope.material.url, tag : _.pluck($scope.material.tag, "text"), category : $scope.materialSelectedCategory, description: $scope.material.relatedMaterial, markAsInAppropiate : false};

			skillService.addMaterial(material).then(function(result) {
				$scope.material = {};
				//$scope.selectedSkill = "";
				$scope.materialSelectedCategory = "";
				//$scope.selectedSkill = undefined;
				$scope.tableParams.reload();
				$scope.tableParams.page(1);
			}, function(error) {
				
			});
		}
	};
	
	$scope.loadTags = function(query) {
		//return [{text: "dsds1"}, {text: "dsd2"}, {text: "dsd3"}];
		return skillService.getTags(query);
	};
	
	_init();
}]);
