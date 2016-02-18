'use strict';
var commonServices = angular.module('commonServices',[]);

/**
 * This service is responsible for opening different types of dialog.
 * Different types available :- wait, process, confirmation, notify and custom dialog
 * Note : currently only custom dialogs implementation is there.
 *  
 */
commonServices.factory('dialogService',['dialogs',function(dialogs){
	var dialogServiceObj = {};
	
	dialogServiceObj.openDialog = function(type,dialogConfiguration,customHtml,controller,scope){
		// By default the dialog will not close by 'esc' or 'mosue click'.
		if(dialogConfiguration==undefined || dialogConfiguration == {}){
			dialogConfiguration = {'keyboard':false,'backdrop':false,'size':'lg'};
		}
		
		switch(type){		
			case 'custom':
				var html=customHtml;
				// For custom dialog, custom html is required. 
				if(html == undefined){
					html = '';
					dialogs.error();
					break;
				}
				var dlg = dialogs.create(html,controller,scope,dialogConfiguration);
				return dlg;
			
			case 'confirm':
				var dlg = dialogs.confirm('Confirmation',customHtml,dialogConfiguration);
				return dlg;
			case 'notify':
				dialogs.notify('Notification',customHtml,dialogConfiguration);
				break;
			
			case 'error':
				dialogs.error('Error',customHtml,dialogConfiguration);
				break;
				
			case 'attention':
				dialogs.error('Attention',customHtml,dialogConfiguration);
				break;		
			default:
				dialogs.error("no such dialog availble.");
				break;
		}
	};
	
	return dialogServiceObj;
}]);


commonServices.factory('httpInterceptor',['$q','$window','$location','$log','$injector','$rootScope','toaster','localStorageUtilityService','messageService',function($q,$window,$location,$log,$injector, $rootScope,toaster,localStorageUtilityService,messageService){
	var httpInterceptor={};
	
	//Counter holding invalidCRF Attempt. 
	var invalidCSRFAttempt = 0;
	
	/*var isModalOpen = false;*/
	//Holding url of api call which got invalid CSRF error
	var invalidCSRFErrorURL = '';
	
	httpInterceptor.request = function(config){				
		//Append unique identifire to avoid caching.
		//All POST request, session and version from GET requests
		if(config.url !='' && (config.method=='POST') || (config.url.indexOf('auth/session')>-1 || config.url.indexOf('app/version/get')>-1)){
			config.url=config.url+'?'+(new Date().getTime());
		}
		
		//Send XSRF Token
		if(localStorageUtilityService.checkLocalStorageKey('xsrfToken')==true){
			config.headers['X-XSRF-TOKEN'] = localStorageUtilityService.getFromLocalStorage('xsrfToken'); 
		}
		
		return config || $q.when(config);
	};
	
	httpInterceptor.requestError= function(rejection) {
        return $q.reject(rejection);
    };
	
	/* Set Authentication.isAuthenticated to true if 200 received */
    httpInterceptor.response=function(response){   	
    	if(response!=null){    		
    		//Store XSRF-Token
    		if(response.headers('XSRF-TOKEN')!=null && (_.isUndefined(response.config.cached) || (!_.isUndefined(response.config.cached) && response.config.cached==false))){
    			localStorageUtilityService.addToLocalStorage('xsrfToken',response.headers('XSRF-TOKEN'));    			
    		}
    	}
    	
    	if(response.status==200 && response.data.code!=undefined && response.data.code!=''){
    		//If invalidCSRFAttempt is not 0 (Means we have hold original request) and url of hold vs this is same then reset attempt 0
    		if(invalidCSRFAttempt>0 && invalidCSRFErrorURL!='' &&  response.config.url!=undefined && response.config.url.indexOf('/auth/session')<0  && invalidCSRFErrorURL==response.config.url){
    			invalidCSRFAttempt = 0;
    		}
    		
    		//Success mesassage
    		messageService.showMessage('','','DAPI_'+response.data.code);
    	}
    	
    	
		
		return response||$q.when(response);
	};
	
	/* Revoke client authentication if 401 is received */
	httpInterceptor.responseError=function(rejection){		
		if(rejection!=null){
			//Store XSRF-Token
			if(rejection.headers('XSRF-TOKEN')!=null && (_.isUndefined(rejection.config) || _.isUndefined(rejection.config.cached) || (!_.isUndefined(rejection.config) && !_.isUndefined(rejection.config.cached) && rejection.config.cached==false))){			 
				localStorageUtilityService.addToLocalStorage('xsrfToken',rejection.headers('XSRF-TOKEN'));
    		}
									
			if(rejection.status==500){
				//This is required for training and news part only.
				if(rejection.config.url.indexOf('training')==-1 || rejection.config.url.indexOf('news')==-1){
					messageService.showMessage('','','DAPI_'+rejection.data.code);
				}				
				//Note: We have disabled this toaster because, some time we do half release on server for FE team which may break some future as API was not there. 
				//Which cause this error popup and it is not good for user. 
				messageService.showMessage('Server Error','error');				
			}else if(rejection.status==400){
				//message key need to be change as it will come from API it self
				messageService.showMessage('','','DAPI_'+rejection.data.code);
			}else if(rejection.status==401){
				messageService.showMessage('','','DAPI_'+rejection.data.code);
			}else if(rejection.status==403){
				if(rejection.data.code==4006){					
						//Retry - Code
						//To Avoid circular dependecy
						var authService = $injector.get('authService');
						var $http = $injector.get('$http');
						
						var defer = $q.defer();
						var promiseAuthService = defer.promise;
						authService.createSession().then(function(success){
							defer.resolve();
						},function(error){
							$log.error(error);
							defer.reject();
						});
						
						var promiseUpdate = promiseAuthService.then(function(){
							return $http(rejection.config);
						});
						
						return promiseUpdate;
						// Code - retry End
				}else if(rejection.data.code==4005){//4005 = Invalid CSRF
					//Check invalid CSRF attempt
					if(invalidCSRFAttempt == 0){
						//If Attempt is 0. Make make session request and on success of that session call re call error api with new token
						invalidCSRFAttempt=1;
						invalidCSRFErrorURL = rejection.config.url;
						
						var authService = $injector.get('authService');
						var $http = $injector.get('$http');
						
						var defer = $q.defer();
						var promiseAuthService = defer.promise;
						authService.createSession().then(function(success){
							defer.resolve();
						},function(error){
							$log.error(error);
							defer.reject();
						});
						
						var promiseUpdate = promiseAuthService.then(function(){
							return $http(rejection.config);
						});
						
						return promiseUpdate;
					}else{//This means we have tried this api one more time for invalid csrf token. So do not try more.						
						//To Avoid circular dependecy
						var authService = $injector.get('authService');
						//Delete Token
						localStorageUtilityService.removeFromLocalStorage('xsrfToken');						
						authService.setIsAuthenticated(false);
						$rootScope.$evalAsync(function () {
							$location.path('/home');
						});
						
					}
				}else if( rejection.data.code==4004){// 4004 = Unauthorized request					
					//To Avoid circular dependecy
					var authService = $injector.get('authService');
					//Delete Token
					localStorageUtilityService.removeFromLocalStorage('xsrfToken');						
					authService.setIsAuthenticated(false);
                    //We have to wrap location change inside $evalAsync,so that the location changes properly and everything stays in sync
                    $rootScope.$evalAsync(function () {
                        $location.path('/home');
                    });					
				}
			}			
			
		}				
		return $q.reject(rejection);
	};
	
	return httpInterceptor;
}]);

/**
 * Service that handles operations on local storage. It may be deleted when we integrate database with application
 */
commonServices.factory('localStorageUtilityService',['$log',function($log){
	var service = {};
	
	service.addToLocalStorage = function(key,data){
		if (typeof (localStorage) == 'undefined') {
			return "Error";
			$log.error('Your browser does not support HTML5 localStorage.Try upgrading.');
        } else {
            try {
            	data = JSON.stringify(data);
            	localStorage.setItem(key,data);
            	return "Success";
            } catch (e) {
                if (e === QUOTA_EXCEEDED_ERR) {
                	$log.error("Quota exceeded!");
                }
                return "Error";
            };
        };
	};
	
	service.removeFromLocalStorage = function(key){
		if (typeof (localStorage) == 'undefined') {
			return "Error";
			$log.error('Your browser does not support HTML5 localStorage.Try upgrading.');
        } else {
            try {            	
            	localStorage.removeItem(key);
            	return "Success";
            } catch (e) {
                if (e === QUOTA_EXCEEDED_ERR) {
                	$log.error("Quota exceeded!");
                }
                return "Error";
            };
        };
	};
	
	
	service.getFromLocalStorage = function(key){
		if(typeof(localStorage)=='undefined'){
			return "Error";
			$log.error('Your browser does not support HTML5 localStorage.Try upgrading.');
		}else{
			try {
				return JSON.parse(localStorage.getItem(key));
			} catch (e) {
				if(e===QUOTA_EXCEEDED_ERR){
					$log.error("Quota exceeded!");
				}
				return "Error";
			}
		}
	};
	
	service.checkLocalStorageKey = function(key){
		if(typeof(localStorage)=='undefined'){
			return false;
			$log.error('Your browser does not support HTML5 localStorage.Try upgrading.');
		}else{
			try {
				if(localStorage[key]){
					return true;
				}else{
					return false;
				}
			} catch (e) {
				if(e===QUOTA_EXCEEDED_ERR){
					$log.error("Quota exceeded!");
				}
				return false;
			}
		}
	};
	
	service.manageLocalStorageReturnList = function(key, data) {
        var currentData = localStorage.getItem(key);

        if (currentData == null) {
            var newList = new Array();
            newList.push(data);
            currentData = JSON.stringify(newList);
        }
        else {
            var currentList = JSON.parse(currentData);
            var isFound = false;
            var foundIndex;

            for (var _idx = 0; _idx < currentList.length; _idx++) {
                if (currentList[_idx].id === data.id){
                	isFound = true;
                	foundIndex = _idx;
                	break;
                }                    
            }

            if (!isFound)
                currentList.push(data);
            else if(angular.isDefined(foundIndex))
            	currentList.splice(foundIndex,1,data);

            currentData = JSON.stringify(currentList);
        }
        localStorage.setItem(key, currentData);
    };
	
	return service;
}]);


commonServices.factory('userService',['$http','$q','$log','talentaleAPI',function($http,$q,$log,talentaleAPI){
	var userService = {};
	
	var userDetails = {};
	
	userService.getUserDetails = function(){
		return userDetails;
	};
	
	userService.updateUserDetails = function(data){
		userDetails = data;
	};
	
	userService.saveUserSkills = function(skills,geoLocation){
		var deferred = $q.defer();
		$http.post(talentaleAPI.base_url+'/user/save/skills',{skills:skills,geoLocation:geoLocation}).then(function(response){
			deferred.resolve(response.data.data);
			updateUserSkills(skills);
		},function(error){
			deferred.reject(error);
		});
		return deferred.promise;
	};
	
	var updateUserSkills = function(skills){
		userDetails.skills = skills;
	};
	
	userService.getUserSkills = function(){
		var deferred = $q.defer();
		$http.post(talentaleAPI.base_url+'/skill/get').then(function(response){
			deferred.resolve(response.data.data);
		},function(error){
			deferred.reject(error);
		});
		return deferred.promise;
	};
	userService.getUserScore = function(){
		var deferred = $q.defer();
		$http.post(talentaleAPI.base_url+'/user/getScore').then(function(response){
			deferred.resolve(response.data.data);
		},function(error){
			deferred.reject(error);
		});
		return deferred.promise;
	};
	return userService;
}]);

commonServices.factory('messageService', ['$log', 'toaster', function ($log, toaster) {
    var messages = [
        { key: 'DAPI_4000', type: 'warning', en: 'User with same email exists.' },            
        { key: 'DAPI_4001', type: 'error', en: 'User email and password combination do not match a registered user' },
        { key: 'DAPI_4002', type: 'error', en: 'Check your inputs' },
        { key: 'DAPI_4004', type: 'error', en: 'Unauthorized access' },
        { key: 'DAPI_4005', type: 'error', en: '' }, /* Invalid CSRF Token*/
        { key: 'DAPI_2002', type: 'success', en: '' }, /*Session Created*/
        { key: 'DAPI_2003', type: 'success', en: '' }, //Login. Already showing this message at controller end
        { key: 'DAPI_5000', type: 'error', en: 'Error in Authentication' },
        { key: 'DAPI_5001', type: 'error', en: 'Error in Creating User' },
        { key: 'DAPI_5002', type: 'error', en: 'Internal Server Error' },
        { key: 'DAPI_4009', type: 'error', en: 'Wrong Password' },//Change Passwored 
        { key: 'DAPI_4007', type: 'error', en: 'Invalid Link' },//invalid link
        { key: 'DAPI_4008', type: 'error', en: 'Registrated email is already verified' },//registration already completed
        { key: 'DAPI_4010', type: 'error', en: 'Registared email is not verified' },//
        { key: 'DAPI_4014', type: 'error', en: 'Skill already associated' }
    ];
    var messageService = {};
    // Last argument duration is used to overwrite default duration of 3sec. 0 will be infinite
    messageService.showMessage = function (defaultMessage, messageType, messageKey, duration) {
        //Check for locale 
                var showType = "info";
                if (angular.isDefined(messageType)) {
                    showType = messageType;
                }
                if(!_.isUndefined(defaultMessage) && !_.isNull(defaultMessage) && defaultMessage != ''){
                	toaster.pop(showType, '', defaultMessage, duration);
                }else if (defaultMessage == '') {
                    var message = _.find(messages, { key: messageKey });
                    var showText = '';
                    var showType = '';
                    if (message != undefined) {
                        //For Message Type
                        if (message.type != '') {
                            showType = message.type;
                        } else if (messageType != undefined && messageType != '') {
                            showType = messageType;
                        }
                        //For Message Text
                        if (message.en != '') {
                            showText = message.en;
                        } else if (defaultMessage != undefined && defaultMessage != '') {
                            showText = defaultMessage;
                        }
                    } else if (messageType != undefined && messageType != '') {
                        //For Message Type			
                        showType = messageType;
                        //For Message Text
                        if (defaultMessage != undefined && defaultMessage != '') {
                            showText = defaultMessage;
                        }
                    }
                    //Display Toaster
                    if (showText != '') {
                        toaster.pop(showType, '', showText, duration);
                    }
                }
    };
    //to clear all toaster
    messageService.clear = function () {
        toaster.clear();
    };
    
    messageService.getMessageText = function(code){
		return _.isUndefined(_.find(messages, {key : code}))?"":_.find(messages, {key : code});
	};
    
    return messageService;
}]);

commonServices.service('stackService', function () {
    var items = [];
    var stackService = {};
    //just storing item at key position.
    stackService.pushItem = function (key, item) {
        items[key] = item;
    };
    //remove item at key position and also remove item with its key after getting it's value
    stackService.popItem = function (key) {
        if (!_.isUndefined(items[key])) {
            var returnPopItem = items[key];
            delete items[key];
            return returnPopItem;
        }
        return;
    };
    return stackService;
});