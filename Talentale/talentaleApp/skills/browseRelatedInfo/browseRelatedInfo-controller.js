"use strict";

var ManageSkills = angular.module('ManageSkills');

ManageSkills.controller('browseRelatedInfoController', 
		[ '$scope', '$timeout', '$q', '$filter', 'NgTableParams', 'skillService', 'messageService', 'stackService', 'authService', 'localStorageUtilityService', '$uibModal', 
    function($scope, $timeout, $q, $filter, NgTableParams, skillService, messageService, stackService, authService, localStorageUtilityService, $uibModal) {

	$scope.category = [{ name: "Choose a category", id: '' }, { name: "Text", id : "Text" }, { name: "Image", id : "Image" }, {name: "Video", id : "Video" }];
	$scope.materialTags = new Array();
	$scope.material = {
		title : "",
		category : "",
		tags : new Array(),
		sortedBy : ""
	};
	var materialList = [];
	$scope.current_user_id = "";
	var isLikeOrderBy = false;
	$scope.showGraph = false;
	$scope.radius = 50;
	$scope.charge = -720;
	$scope.linkDistance = 60;
	$scope.height = 550;
	$scope.selectedSkill = {};

	$scope.searchSkills = function(val) {
		return skillService.searchSkills(val).then(function(response) {
			console.log("response for typeahead");
			console.log(response);
			return response;
		});
	};
	$scope.setSelectedSkillId= function(item){
		console.log(item);
		$scope.selectedSkill.skillId = item._id;
		$scope.selectedSkill.skillName = item.skill;
		$scope.material.skillId = item._id;
		$scope.material.sortedBy = "";

		$scope.tableParams.reload();
		$scope.tableParams.page(1);
		if(authService.getIsAuthenticated()){
			if(localStorageUtilityService.checkLocalStorageKey('current-user-id')){
				$scope.current_user_id = localStorageUtilityService.getFromLocalStorage('current-user-id');
            }
			
			$scope.showGraph = true;
			getAssociatedSkillInfo();
		}
	}
	$scope.loadTags = function(query) {
		return skillService.getTags(query);
	};
	function getAssociatedSkillInfo(){
		skillService.getAssociatedSkillInfo($scope.selectedSkill).then(function(response){
			console.log(response);
			prepareGraphJSON(response);
			drawGraphD3();
		});
	}
	$scope.getWidth = function () {
        return window.innerWidth;
    };
    
    $scope.$watch($scope.getWidth, function (newValue, oldValue) {
        if (newValue !== oldValue && $scope.selectedSkill.skillId !== undefined) {
        	$scope.width = document.getElementsByClassName("skillRelationGraphDiv")[0].clientWidth;
        	getForceElement(newValue)
        		.nodes($scope.nodes)
	            .links($scope.links)
	            .on("tick", function(){$scope.$apply()})
	            .start();
        }
    });
    
    function getForceElement(win_width){
    	if($scope.width != undefined && $scope.width <= 500){
    		$scope.radius = 20;
    		$scope.charge = -1500;
    		$scope.linkDistance = 60;
    		$scope.height = 300;
    	} else {
    		$scope.radius = 40;
    		$scope.charge = -1500;
        	$scope.linkDistance = 200;
            $scope.height = 550;
    	}
    	
    	return d3.layout.force()
        	.charge($scope.charge)
        	.linkDistance($scope.linkDistance)
        	.size([$scope.width, $scope.height]);
    }
	function drawGraphD3(){
		$scope.width = document.getElementsByClassName("skillRelationGraphDiv")[0].clientWidth-20;

		var color = d3.scale.category20()
        var force = getForceElement();

		for(var i=0; i < $scope.links.length ; i++){
		    $scope.links[i].strokeWidth = Math.round($scope.links[i].value)
		}

		for(var i=0; i < $scope.nodes.length ; i++){
			$scope.nodes[i].color = color($scope.nodes[i].group)
		}

		force
		     .nodes($scope.nodes)
		     .links($scope.links)
		     .on("tick", function(){$scope.$apply()})
		     .start();
		 
		$scope.showGraph = true;
	}
	function prepareGraphJSON(graph_data){
		$scope.nodes = new Array();
		$scope.links = new Array();
		$scope.nodes.push({
			name : graph_data.skillName,
			group : 1
		});
		$scope.links.push({
			source : 0,
			target : 0,
			value  : 0
		});
		console.log(JSON.stringify(graph_data));
		for(var index=0; index<graph_data.associatedSkills.length; index++){
			$scope.nodes.push({
				name : graph_data.associatedSkills[index]["skillName"].toString(),
				group : 2
			});
			$scope.links.push({
				source : 0,
				target : index+1,
				value  : graph_data.associatedSkills[index]["weight"]
			});
		}
	}
	
	var searchMaterial = function() {
		var defer = $q.defer();

		skillService.searchMaterial($scope.material).then(function(result) {
			console.log(result);
			_.forEach(result, function(data) {
				data.likeCount = data.likes.length;
				data.disLikeCount = data.dislikes.length;
				
				if(data.likes.length && $scope.current_user_id){
					data.already_liked = data.likes.indexOf($scope.current_user_id)>=0? true : false;
				} else {
					data.already_liked = false;
				}
				if(data.dislikes.length && $scope.current_user_id){
					data.already_disliked = data.dislikes.indexOf($scope.current_user_id)>=0? true : false;
				} else {
					data.already_disliked = false;
				}
			});
			
			materialList = result;

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
        	if(!isLikeOrderBy){
	        	searchMaterial().then(function(result) {
	    			var filteredData = result;
	    			
	        		filteredData = $filter('orderBy')(filteredData, params.orderBy());
	    			
	                params.total(filteredData.length);
	                $defer.resolve(filteredData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
				});        	
        	}else{
        		isLikeOrderBy = false;
        		if($scope.material && $scope.material.sortedBy){
        			if($scope.material.sortedBy == 'likes'){
        				materialList = $filter('orderBy')(materialList, 'likeCount', true);
        			}else if($scope.material.sortedBy == 'dislikes'){
        				materialList = $filter('orderBy')(materialList, 'disLikeCount', true);
        			}
        		}else{
        			materialList = $filter('orderBy')(materialList, params.orderBy());
        		}
        		params.total(materialList.length);
                $defer.resolve(materialList.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        	}
        }
    });
    $scope.submitData = function(){
    	$scope.material.tags = $scope.materialTags.map(function(e){return e.text;});
    	console.log("Title     : " + $scope.material.title);
    	console.log("Category  : " + $scope.material.category);
    	console.log("Tags      : " + $scope.material.tags);
    	console.log("Sorted by : " + $scope.material.sortedBy);
    	$scope.material.sortedBy = "";
    	
    	$scope.tableParams.reload();
		$scope.tableParams.page(1);
    };
    $scope.sortDataBy = function(value){
    	isLikeOrderBy = true;
		
		$scope.tableParams.reload();
		$scope.tableParams.page(1);
    }
    $scope.likeMaterial = function(materialID){
    	if($scope.current_user_id){
    		skillService.likeMaterial({ID : materialID}).then(function(result){
    			$scope.tableParams.reload();
    			$scope.tableParams.page(1);
    		});
    	} else {
    		var dialog = $uibModal.open({'animation' : true, templateUrl: "auth/login/partials/login.html", controller:"loginController", 'size': 'md' });
            dialog.result.then(function () {
            	if(authService.getIsAuthenticated()){
        			if(localStorageUtilityService.checkLocalStorageKey('current-user-id')){
        				$scope.current_user_id = localStorageUtilityService.getFromLocalStorage('current-user-id');
                    }
        			
        			$scope.showGraph = true;
        			getAssociatedSkillInfo();
        		}
            	$scope.likeMaterial(materialID);
            }, function () {
            	//$rootScope.showLoginSignUp = true;				
            });
    	}
    };
    $scope.disLikeMaterial = function(materialID){
    	if($scope.current_user_id){
    		skillService.disLikeMaterial({ID : materialID}).then(function(result){
    			$scope.tableParams.reload();
    			$scope.tableParams.page(1);
    		});
    	} else {
    		var dialog = $uibModal.open({'animation' : true, templateUrl: "auth/login/partials/login.html", controller:"loginController", 'size': 'md' });
            dialog.result.then(function () {
            	if(authService.getIsAuthenticated()){
        			if(localStorageUtilityService.checkLocalStorageKey('current-user-id')){
        				$scope.current_user_id = localStorageUtilityService.getFromLocalStorage('current-user-id');
                    }
        			
        			$scope.showGraph = true;
        			getAssociatedSkillInfo();
        		}
            	$scope.disLikeMaterial(materialID);
            }, function () {
            	//$rootScope.showLoginSignUp = true;				
            });
    	
    	}
    };
    $scope.markInappropriate = function(materialID){
    	if($scope.current_user_id){
    		var modalInstance = $uibModal.open({
    			animation: true,
  		      	templateUrl: 'common/template/confirmModal.html',
  		      	controller: 'confirmModalController',
  		      	size: "sm",
  		      	resolve: {
  		      		items: function () {
  		      			return {title: "Inappropriate Material", body: "Are you sure you want to mark this Material as inappropriate?"};
  		      		}
  		      	}
	  		});
	
	  	    modalInstance.result.then(function (selectedItem) {
	  	    	skillService.markInappropriate({ID : materialID}).then(function(result) {
	  	    		//success code
	  			}, function() {
	  				//failure code
	  			});
	  	    });
    	} else {
    		var dialog = $uibModal.open({'animation' : true, templateUrl: "auth/login/partials/login.html", controller:"loginController", 'size': 'md' });
            dialog.result.then(function () {
            	if(authService.getIsAuthenticated()){
        			if(localStorageUtilityService.checkLocalStorageKey('current-user-id')){
        				$scope.current_user_id = localStorageUtilityService.getFromLocalStorage('current-user-id');
                    }
        			
        			$scope.showGraph = true;
        			getAssociatedSkillInfo();
        		}
            	$scope.markInappropriate(materialID);
            }, function () {
            	//$rootScope.showLoginSignUp = true;				
            });
    	}
    };
}]);