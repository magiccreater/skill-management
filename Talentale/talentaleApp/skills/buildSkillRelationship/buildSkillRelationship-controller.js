"use strict";

var ManageSkills = angular.module('ManageSkills');

ManageSkills.controller('buildSkillRelationshipController', 
		[ '$scope', '$timeout', '$rootScope', 'skillService', 'messageService', 'stackService', '$compile', 
		  function($scope, $timeout, $rootScope, skillService, messageService, stackService, $compile) {
	$scope.skillRaltionObj = {};
	$scope.showGraph = false;
	$scope.radius = 15;
	$scope.charge = -720;
	$scope.linkDistance = 60;
	$scope.height = 500;
	$scope.my_skills = [];
	
	$timeout(function(){
		$scope.related_skill_weight = {
	        value: 2,
	        options: {
	        	showSelectionBar: true,
	            floor: 1,
	            ceil: 10,
	            step: 1
	        }
	    };
	}, 500);
	
	$scope.getSkills = function(val) {
		var skill_id = ($scope.selectedSkillLbl==undefined || $scope.selectedSkillLbl=="")?"":$scope.skillRaltionObj.skillId;
		return skillService.getSkills(val, skill_id).then(function(response) {
			console.log("response for typeahead");
			console.log(response);
			return response;
		});
	};
	$scope.getMySkills = function(val) {
		var skill_id = ($scope.selectedRelSkillLbl==undefined || $scope.selectedRelSkillLbl=="")?"":$scope.skillRaltionObj.associatedSkillId;
		return skillService.getMySkills(val, skill_id).then(function(response) {
			console.log("response for typeahead");
			console.log(response);
			return response;
		});
	};
	$scope.setRelectedSkillId= function(item){
		console.log(item);
		$scope.skillRaltionObj.associatedSkillId = item._id;
		$scope.skillRaltionObj.associatedSkillName = item.skill;
	}
	$scope.setSelectedSkillId= function(item){
		console.log(item);
		$scope.skillRaltionObj.skillId = item._id;
		$scope.skillRaltionObj.skillName = item.skill;
		
		getAssociatedSkillInfo();
	}
	$scope.saveSkillRelationship = function(){
		$scope.skillRaltionObj.associatedSkillWeight = $scope.related_skill_weight.value;

		//alert(JSON.stringify($scope.skillRaltionObj));
		skillService.saveSkillRelationship($scope.skillRaltionObj).then(function(response){
			console.log(response);
			messageService.showMessage('Skill successfully associated','success', 1000);
//			$scope.skillRaltionObj = {};
//			$scope.selectedSkillLbl = "";
			$scope.selectedRelSkillLbl="";
			$scope.skillRaltionObj.associatedSkillId = "";
			$scope.skillRaltionObj.associatedSkillName = "";
			$scope.related_skill_weight.value = 2;
			
        	$scope.buildSkillRelationship.$setPristine();
        	$scope.buildSkillRelationship.$setUntouched();
        	
        	getAssociatedSkillInfo();
		});
	}
	function getAssociatedSkillInfo(){
		skillService.getAssociatedSkillInfo($scope.skillRaltionObj).then(function(response){
			console.log(response);
//			alert(response);
			prepareGraphJSON(response);
			drawGraphD3();
		});
	}
	$scope.getWidth = function () {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function (newValue, oldValue) {
//    	console.log("New size :" +  ($scope.skillRaltionObj.skillId !== undefined) );
//    	console.log("Old size :" +  ($scope.skillRaltionObj.skillId) );
    	
        if (newValue !== oldValue && $scope.skillRaltionObj.skillId !== undefined) {
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
    		$scope.radius = 15;
    		$scope.charge = -1500;
    		$scope.linkDistance = 60;
    		$scope.height = 300;
    	} else {
    		$scope.radius = 30;
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
		$compile(force)($scope);
		 
		$scope.showGraph = true;
	}
	
    /*window.onresize = function () {
        $scope.$apply();
    };*/
	function prepareGraphJSON(graph_data){
		$scope.nodes = new Array();
		$scope.links = new Array();
		$scope.nodes.push({
			name : graph_data.skillName,
			node_id : graph_data.skillId,
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
				node_id : graph_data.associatedSkills[index]["skillId"].toString(),
				group : 2
			});
			$scope.links.push({
				source : 0,
				target : index+1,
				value  : graph_data.associatedSkills[index]["weight"]
			});
		}
	}
	
	$scope.setData = function(context) {
		if($scope.skillRaltionObj){
			var id, skill;
			if(context == "related"){
				id = $scope.skillRaltionObj.associatedSkillId;
				skill = $scope.skillRaltionObj.associatedSkillName;
			}
			else{
				id = $scope.skillRaltionObj.skillId;
				skill = $scope.skillRaltionObj.skillName;
			}
			
			stackService.pushItem("selectedSkill", {id: id , skill : skill});
			stackService.pushItem("selectedSkill", {id: id , skill : skill});
			$rootScope.$broadcast('setDataScreen2', true);
		}
	};
	
	$scope.displayGraphFor = function(selectedNode){
		if(selectedNode.index){
			var query = {
				skillId : selectedNode.node_id,
				skillName : selectedNode.name
			}
			skillService.getAssociatedSkillInfo(query).then(function(response){
				console.log(response.associatedSkills);
				if(response.associatedSkills.length){
					$scope.selectedSkillLbl = selectedNode.name;
					$scope.skillRaltionObj.skillName = selectedNode.name;
					$scope.skillRaltionObj.skillId = selectedNode.node_id;
					
					prepareGraphJSON(response);
					drawGraphD3();
				} else {
					messageService.showMessage('There is no skill connected to '+ selectedNode.name 
					+'. Please add related skills to '+ selectedNode.name,'error', 2000);
				}
			});
//			getAssociatedSkillInfo();
		}
	}
}]);