"use strict";

var homeApp = angular.module('homeApp', []);

homeApp.controller('homeController', ['$scope', '$rootScope', '$http', '$q', '$sce', '$filter', 'talentaleAPI', 'contantValue', 'NgTableParams', 'userService', '$uibModal', 'messageService',
    function ($scope, $rootScope,  $http, $q, $sce, $filter, talentaleAPI, contantValue, NgTableParams, userService, $uibModal, messageService) {

        var mobileView = 992;
        var pageNumber, count = 0, isReload = false;

        $scope.jobTitle = [];

        $scope.jobSearchDetail = { skills: [] };

        $scope.skills = [];
        $scope.predicate = 'skill';
        $scope.reverse = true;
        $scope.order = function (predicate) {
            $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
            $scope.predicate = predicate;
        };

        $scope.geoLocation = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida',
            'Georgia', 'Hawaii', 'Idaho', 'Illinois Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
            'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana Nebraska',
            'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
            'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
            'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

        $scope.showJobResult = false;

        var _initJobList = function (jobTitle, geoLocation, limit, startIndex, skills) {
            var deferred = $q.defer();
            var requiredSkills = [], optionalSkills = [];
            geoLocation = _.isUndefined(geoLocation) ? '' : geoLocation;
            if (skills != undefined && skills != null && skills.length > 0) {
                requiredSkills.push(_.max(skills, "weight"));
                _.forEach(skills, function (skillObj) {
                    if (requiredSkills[0].skill != skillObj.skill)
                        optionalSkills.push(skillObj);
                });
            }
            $http({
                method: 'post',
                url: talentaleAPI.base_url + '/user/get/jobList',
                data: {
                    jobTitle: $scope.jobSearchDetail.jobTitle,
                    recommendedJobTitles: ($scope.jobSearchDetail.recommendedJobTitles.length > 5) ? $scope.jobSearchDetail.recommendedJobTitles.slice(0, 5) : $scope.jobSearchDetail.recommendedJobTitles,
                    start: startIndex,
                    limit: limit,
                    geoLocation: geoLocation.replace(/ /g, '').replace(/,/g, '-'),
                    requiredSkills: requiredSkills,
                    optionalSkills: optionalSkills
                }
                /*header:{
                    'Access-Control-Allow-Origin': 'http://localhost:3000'
                }*/
            }).then(function (response) {
                deferred.resolve(response.data.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };

        $scope.getJobList = function () {
            $scope.showJobResult = true;
            var totalRecords;
            $scope.tableParams = new NgTableParams({
                page: 1,            // show first page
                count: 5           // count per page
            }, {
                    total: 0, // length of data
                    getData: function ($defer, params) {
                        _initJobList($scope.jobSearchDetail.jobTitle, $scope.jobSearchDetail.geoLocation, params.count(), (params.count() * (params.page() - 1) + 1), $scope.jobSearchDetail.skills).then(function (response) {

                            $scope.totalRecords = totalRecords = response.totalResults;
                            params.total(totalRecords);
                            params.settings({ counts: totalRecords > 5 ? [5, 10, 15, 20, 25] : [] });
                            _.forEach(response.results, function (obj) {
                                obj.date = new Date(obj.date);
                            });
                            response.results = $filter('orderBy')(response.results, params.orderBy());
                            if (totalRecords <= 0) {
                                $scope.showJobResult = false;
                                messageService.showMessage('Job for the detail filled is not available. Please change the detail for jobs.');
                            }
                            $defer.resolve(response.results);
                        }, function (error) {

                            $scope.showJobResult = false;
                        });
                    }
                });
        };

        $scope.undesiredJobTitle = ['Intern', 'Janitor', 'Cashier'];

        var _init = function () {
            $http.get(talentaleAPI.base_url + '/user/get/titles').then(function (response) {
                $scope.jobTitle = response.data.data;
                var getUserDetails = userService.getUserDetails();
                $scope.jobSearchDetail.recommendedJobTitles = !_.isUndefined(getUserDetails.recommendedJobTitles) ? getUserDetails.recommendedJobTitles : [];
            }, function (error) {

            });
            var getUserDetails = userService.getUserDetails();

            if (!_.isUndefined(getUserDetails) && !_.isNull(getUserDetails) && !_.isEmpty(getUserDetails)) {
                $scope.jobSearchDetail.skills = angular.copy(getUserDetails.skills);
            }
        };

        $scope.$on('Authenticated', function (event, args) {
            var getUserDetails = userService.getUserDetails();
            $scope.jobSearchDetail = { skills: [] };
            $scope.jobSearchDetail.geoLocation = !_.isUndefined(getUserDetails.geoLocation) ? getUserDetails.geoLocation : '';
            $scope.jobSearchDetail.recommendedJobTitles = !_.isUndefined(getUserDetails.recommendedJobTitles) ? getUserDetails.recommendedJobTitles : [];
            if (!_.isUndefined(getUserDetails) && !_.isNull(getUserDetails) && !_.isEmpty(getUserDetails)) {
                $scope.jobSearchDetail.skills = angular.copy(getUserDetails.skills);
            }


        });

        $scope.getSkills = function () {
            $scope.skills = [];
            $http.get(talentaleAPI.base_url + '/user/get/skills?title=' + $scope.jobSearchDetail.jobTitle).then(function (response) {
                $scope.skills = response.data.data;
                _.forEach($scope.skills, function (obj) {
                    obj.selected = false;
                    _.forEach($scope.jobSearchDetail.skills, function (selectedSkillObj) {
                        if (selectedSkillObj._id == obj._id) {
                            obj.selected = true;
                            return false;
                        } else if (selectedSkillObj.skill === obj.skill) {
                            obj.selected = true;
                            return false;
                        }
                    });
                });
            }, function (error) {

            });

        };

        $scope.getRecJobSkills = function (recJobTitle) {
            $scope.skills = [];
            $http.get(talentaleAPI.base_url + '/user/get/skills?title=' + recJobTitle).then(function (response) {
                $scope.skills = response.data.data;
                _.forEach($scope.skills, function (obj) {
                    obj.selected = false;
                    _.forEach($scope.jobSearchDetail.skills, function (selectedSkillObj) {
                        if (selectedSkillObj._id == obj._id) {
                            obj.selected = true;
                            return false;
                        } else if (selectedSkillObj.skill === obj.skill) {
                            obj.selected = true;
                            return false;
                        }
                    });
                });
            }, function (error) {

            });

        };

        $scope.addToSkill = function (skill) {
            skill.selected = true;
            skill.weight = 5;
            $scope.jobSearchDetail.skills.push(skill);
            if (!$rootScope.showLoginSignUp) {
                _saveSkills();
            } else {
                $scope.getRecommendedJob();
            }
        };

        $scope.removeFromSkill = function (userSkill, index) {
            var _isExist = false;
            var _getSkill = _.find($scope.jobSearchDetail.skills, { _id: userSkill._id });
            if (!_.isUndefined(_getSkill)) {
                _getSkill.selected = false;
            }
            if ($scope.skills.length > 0) {
                _.forEach($scope.skills, function (obj) {
                    if (obj.MI == userSkill.MI) {
                        //_isExist = true;
                        obj.selected = false;
                        return false;
                    }
                });
            }
            var _removeIndex = _.findIndex($scope.jobSearchDetail.skills, function (skill) {
                return skill.skill == userSkill.skill;
            });
            if (_removeIndex != -1)
                $scope.jobSearchDetail.skills.splice(_removeIndex, 1);

            if (!$rootScope.showLoginSignUp) {
                _saveSkills();
                //_isExist = false;
            } else {
                if ($scope.jobSearchDetail.skills.length > 0) {
                    $scope.getRecommendedJob();
                } else {
                    $scope.jobSearchDetail.recommendedJobTitles = [];
                }

            }
        };

        var _saveSkills = function () {
            if (!$rootScope.showLoginSignUp) {
                if ($scope.jobSearchDetail) {
                    userService.saveUserSkills($scope.jobSearchDetail.skills, $scope.jobSearchDetail.geoLocation).then(function (response) {
                      
                        messageService.showMessage('Skills are updated to your profile', 'success');
                    }, function (error) {
                        messageService.showMessage('Something went wrong while adding skills to your profile.', 'error');

                    });
                }
            } else {
                var dialog = $uibModal.open({ 'animation' : true, templateUrl: "auth/login/partials/login.html" ,'size': 'md', controller :"loginController" , resolve : { data : function() {
                	return $scope.jobSearchDetail;
				}}});
                
                localStorage.setItem('jobsearchdetail', JSON.stringify($scope.jobSearchDetail));
                dialog.result.then(function (success) {
                    $rootScope.showLoginSignUp = false;
                }, function (cancel) {
                    $rootScope.showLoginSignUp = true;
                });
            }

        };

        $scope.saveSkills = function () {
            _saveSkills();
        };

        $scope.updateUserLocation = function () {
            if (!$rootScope.showLoginSignUp) {
                userService.saveUserSkills($scope.jobSearchDetail.skills, $scope.jobSearchDetail.geoLocation).then(function (response) {

                }, function (error) {

                });
            }
        };

        $scope.getRecommendedJob = function () {
            $http.post(talentaleAPI.base_url + '/user/get/jobtitles', { skills: $scope.jobSearchDetail.skills }).then(function (response) {
                $scope.jobSearchDetail.recommendedJobTitles = response.data.data.recommendedJobTitles;
            });
        };

        $scope.$on('loggedIn', function (event) {
            var getUserDetails = userService.getUserDetails();
            $scope.jobSearchDetail.geoLocation = !_.isUndefined(getUserDetails.geoLocation) ? getUserDetails.geoLocation : '';
            $scope.jobSearchDetail.recommendedJobTitles = !_.isUndefined(getUserDetails.recommendedJobTitles) ? getUserDetails.recommendedJobTitles : [];
            if (!_.isUndefined(getUserDetails) && !_.isNull(getUserDetails) && !_.isEmpty(getUserDetails)) {
                $scope.jobSearchDetail.skills = angular.copy(getUserDetails.skills);
            }
            if (_.isUndefined(userService.getUserDetails().skills) || _.isNull(userService.getUserDetails().skills) || _.isEmpty(userService.getUserDetails().skills)) {
                if (localStorage.getItem('jobsearchdetail')) {
                    $scope.jobSearchDetail = JSON.parse(localStorage.getItem('jobsearchdetail'));
                    if ($scope.jobSearchDetail.skills != undefined && $scope.jobSearchDetail.skills.length > 0) {
                        _saveSkills();
                    }
                }
            }
            if ($scope.jobSearchDetail.skills != undefined && $scope.jobSearchDetail.skills.length > 0) {
                $scope.getRecommendedJob();
            }

        });

        $scope.getRequirement = function (snippet) {
            return $sce.trustAsHtml(snippet);
        };

        /*$scope.getWidth = function () {
            return window.innerWidth;
        };

        $scope.$watch($scope.getWidth, function (newValue, oldValue) {
            if (newValue >= mobileView) {
                if (angular.isDefined($cookieStore.get('toggle'))) {
                    $scope.toggle = !$cookieStore.get('toggle') ? false : true;
                } else {
                    $scope.toggle = false;
                }
            } else {
                $scope.toggle = false;
            }

        });

        $scope.toggleSidebar = function () {
            $scope.toggle = !$scope.toggle;
            $cookieStore.put('toggle', $scope.toggle);
        };

        window.onresize = function () {
            $scope.$apply();
        };*/



        //initialization
        _init();
    }]);


homeApp.directive('googleplace', [function () {
    return {
        require: 'ngModel',
        scope: {
            ngModel: '=',
            details: '=?'
        },
        link: function (scope, element, attrs, model) {
            var options = {
                types: ['(cities)'],
                componentRestrictions: { country: 'USA' }
            };

            scope.gPlace = new google.maps.places.Autocomplete(element[0], options);

            google.maps.event.addListener(scope.gPlace, 'place_changed', function () {
                var geoComponents = scope.gPlace.getPlace();
                var latitude = geoComponents.geometry.location.lat();
                var longitude = geoComponents.geometry.location.lng();
                var addressComponents = geoComponents.address_components;

                addressComponents = addressComponents.filter(function (component) {
                    switch (component.types[0]) {
                        case "locality": // city
                            return true;
                        case "administrative_area_level_1": // state
                            return true;
                        case "country": // country
                            return true;
                        default:
                            return false;
                    }
                }).map(function (obj) {
                    return obj.short_name;
                });

                addressComponents.push(latitude, longitude);

                scope.$apply(function () {
                    scope.details = addressComponents; // array containing each location component
                    element.val(addressComponents[0] + ', ' + addressComponents[1]);
                    model.$setViewValue(element.val());
                });
            });
        }
    };
}]);