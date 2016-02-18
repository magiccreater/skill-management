var talentaleApp = angular.module('talentaleApp', ['ngRoute', 'ngAnimate','ui.bootstrap',  'toaster','angular-loading-bar',
		 'ngSanitize','ui.select','ngTable','satellizer','angularRangeSlider','headerApp', 'sidebarApp', 'modalApp',
		 'homeApp', 'loginApp','signupApp','commonServices', 'logoutApp','initApp','demoApp','rzModule', 'ManageSkills', 'isteven-multi-select', 'ngTagsInput']);

talentaleApp.constant('talentaleAPI',{
//	base_url:'http://192.168.0.174:3001'
	base_url:'http://localhost:3001'
});

talentaleApp.constant('contantValue',{
    weight:7
});

talentaleApp.config(['$httpProvider',function($httpProvider){
	$httpProvider.interceptors.push('httpInterceptor');	
	//Enable with credentials -true  for every call
	$httpProvider.defaults.withCredentials = true;
}]);

//Set
talentaleApp.config(function($locationProvider) {
	  $locationProvider.html5Mode(false);
});

talentaleApp.config(function($authProvider,cfpLoadingBarProvider) {
    $authProvider.linkedin({
      clientId: '75a4uxlo20lwp5'
    });
    
    cfpLoadingBarProvider.includeSpinner = false;
});	

//This configures the routes and associates each route with a view and a controller
talentaleApp.config(function ($routeProvider) {
    $routeProvider.when('/login', {
        controller: 'loginController',
        templateUrl: '/auth/login/partials/login.html'
    }).when('/home', {
        controller: 'homeController',
        templateUrl: '/home/partials/home.html'
    }).when('/signup', {
        controller: 'signupController',
        templateUrl: '/auth/signup/partials/signup.html'
    }).when('/logout', {
        controller: 'logoutController',
        templateUrl: '/auth/logout/partials/logout.html'
    }).when('/RegisterationConfirmation', {
       
    }).when('/RegisterationConfirmation/:reqId?', {
       
    })/*.when('/demo',{
    	controller: 'skillsEditController',
        templateUrl: '/manage/skills/partials/edit.html'
    })*/.when('/skills',{
    	controller: 'ManageSkillsController',
        templateUrl: '/skills/manage-skills.html'
    }).when('/skills/:tabname?',{
    	controller: 'ManageSkillsController',
        templateUrl: '/skills/manage-skills.html'
    }).otherwise({
        redirectTo: '/home'
    });
});

//call api to establish session once per application boot
talentaleApp.run(['$http', '$log', 'talentaleAPI', '$injector', '$location', '$rootScope', 'localStorageUtilityService',
    function ($http, $log, talentaleAPI, $injector, $location, $rootScope, localStorageUtilityService) {
        $rootScope.showView = true;
        $rootScope.showLoginSignUp = true;
        $http.get(talentaleAPI.base_url + '/auth/session').then(function (response) {
//            $log.debug('session call succeed');
//            $log.debug(response);
            if (response.data.data != null && response.data.data.email != null && response.data.data.email != "") {
            	$rootScope.$broadcast('scoreUpdated');
            	if(localStorageUtilityService.checkLocalStorageKey('current-user-id')==false){
                	localStorageUtilityService.addToLocalStorage('current-user-id', response.data.data.userId);
                }
                //runtime inject authService to avoid circular dependency 
                var authService = $injector.get('authService');
                //here in past we are first recreate login and then redirect to last path but now this position is interchanged  for solve below issue 
                //#issue solved : redirect from updateUserDetails method not work because its call after recreate so its redirect to last path
                //Redirect to last path
                if (authService.lastUserPath != '') {
                    //We have to wrap location change inside $evalAsync,so that the location changes properly and everything stays in sync
                    $rootScope.$evalAsync(function () {
                        $location.path(authService.lastUserPath);
                        authService.lastUserPath = "";
                    });

                }
                //As user is already logged in on server. Set details in client side/
                authService.recreateLogin(response.data.data);
                //$log.debug('session auth - ' + authService.getIsAuthenticated());
            }

            $rootScope.showView = false;
        }, function (error) {
            $log.error(error);
            $rootScope.showView = false;
        });
    }
]);

//Register $routeChangeStart event to intercept route change and redirect user to login page if it has not been Authenticated (logged in)
talentaleApp.run(['$rootScope','$location', '$log','authService', function ($rootScope, $location, $log, authService) {
        $rootScope.$on('$routeChangeStart', function (event, nextRoute, currentRoute) {
        	$log.debug('route auth - '+authService.getIsAuthenticated()+' next location - '+nextRoute.originalPath);
    		if(nextRoute!=null && nextRoute.access!=null && nextRoute.access.requiredAuthentication){
    			if(!authService.getIsAuthenticated()){
    				//Store user path before redirect to login
    				authService.lastUserPath = $location.path();
    									
    				$location.path('/home');					
    			}else{
    				authService.lastUserPath='';
    			}
    		}
    		// In case of logout we don't need to go further.
    		else if (angular.isDefined(currentRoute) && angular.isDefined(currentRoute.originalPath) && currentRoute.originalPath=='/logout'){
    			authService.lastUserPath = "/logout";
    			//$location.path('/login');			
    		}
    		else if(nextRoute.originalPath=='/login' && authService.lastUserPath==''){
    			//If User is already logged in redirect to Home page
    			$log.debug('route auth - '+authService.getIsAuthenticated());
    			if(authService.getIsAuthenticated() && localStorageUtilityService.checkLocalStorageKey('xsrfToken')==true){
    				$location.path('/home');
    			}else{
    				$location.path('/home');
    			}
    		}
        });
    }
]);