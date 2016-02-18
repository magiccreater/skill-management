"use strict";

var ManageSkills = angular.module('ManageSkills');

ManageSkills.controller("modifyInputsController", ['$scope', '$timeout', '$q', '$uibModal', '$filter', 'NgTableParams', 'skillService', 'messageService', function($scope, $timeout, $q, $uibModal, $filter, NgTableParams, skillService, messageService){
	var mySkill = {}, associatedSkill = {};	
	$scope.category = [{ name: "Choose a category", id: '' }, { name: "Text", id : "Text" }, { name: "Image", id : "Image" }, {name: "Video", id : "Video" }];
	$scope.showSelectedSkill = false;
	$timeout(function(){
		$scope.scale = {
	        value: 0,
	        options: {showSelectionBar: true, floor: 1, ceil: 10, step: 1}
	    };
	}, 500);
	
	var getMaterialList = function() {
		var defer = $q.defer();
		
		skillService.getMaterialList(mySkill.id).then(function(result) {
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
    
    var _tableReload = function() {
		$scope.tableParams.reload();
		$scope.tableParams.page(1);
	};
    
    $scope.mySkills = function(val) {
		return skillService.getMySkills(val).then(function(result) {
			return result;
		});
	};
	
	$scope.getSkills = function(val) {
		if(mySkill && mySkill.id && $scope.selectedMySkill){
			return skillService.getAssociatedSkill(mySkill.id).then(function(result) {
				return result;
			});
		}else{
			return [];
		}		
	};
	
	$scope.setSkillId = function(item, selectedSkill){
		if(selectedSkill == "myskill"){
			mySkill.id = item._id;
			mySkill.skill = item.skill;

			skillService.getAssociatedSkill(mySkill.id).then(function(result) {
				if(result.length){
					$scope.showSelectedSkill = true;
				}else{
					$scope.showSelectedSkill = false;
				}
			});
		}else{
			associatedSkill.skillId = item.skillId;
			associatedSkill.skillName = item.skillName;
			associatedSkill.weight = item.weight;
			$timeout(function(){
				$scope.scale = {
			        value: item.weight,
			        options: {showSelectionBar: true, floor: 1, ceil: 10, step: 1}
			    };
				        $scope.$broadcast('rzSliderForceRender');
			}, 200);
		}
		_tableReload();
	};
	
	$scope.saveMaterial = function(data) {
		skillService.saveMaterial(data).then(function(result) {
			_tableReload();
		}, function() {
			_tableReload();
		});
	};
	
	$scope.deleteMaterial = function(id) {
		var modalInstance = $uibModal.open({
		      animation: true,
		      templateUrl: 'common/template/confirmModal.html',
		      controller: 'confirmModalController',
		      size: "sm",
		      resolve: {
		        items: function () {
		          return {title: "Material", body: "Are you sure you want to delete?"};
		        }
		      }
		});

	    modalInstance.result.then(function (selectedItem) {
	    	skillService.removeMaterial(id).then(function(result) {
				_tableReload();
			}, function() {
				_tableReload();
			});
	    });
	};
	
	$scope.cancel = function() {
		_tableReload();
	};
	
	$scope.loadTags = function(query) {
		return skillService.getTags(query);
	};
	
	$scope.updateRating = function() {
		if(mySkill && mySkill.id && associatedSkill && associatedSkill.skillId && $scope.scale && $scope.scale.value){
			skillService.updateRating({id :mySkill.id, weight: $scope.scale.value, associatedSkillId: associatedSkill.skillId}).then(function() {
				messageService.showMessage('Weight updated successfully','success', 1000);
			}, function(error) {
				
			});
		}
	};
}]);