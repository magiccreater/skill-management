"use strict";
/**
 * This service is used only for authentication for Data API user
 */
talentaleApp.factory('authService', ['$q', '$http', '$log', '$rootScope', 'talentaleAPI', 'userService',
    function ($q, $http, $log, $rootScope, talentaleAPI, userService) {
        var authService = {};

        var isAuthenticated = false;

        //Path where user pressed ctrl+F5
        authService.lastUserPath = "";

        //this variable store signup user details
        var userDetails = {};

        // setting data at login time
        var _login = function (data) {
            //update isAuthenticated variable
            isAuthenticated = true;

            localStorage.setItem('userEmailSalt', data.emailSalt);

            //Update user details
            userService.updateUserDetails(data);
            $rootScope.$broadcast('Authenticated', true);
        };

        // clear data at logout time
        var _logout = function () {
            //Reset user details
            userService.updateUserDetails({});

            //reset isAuthenticated
            isAuthenticated = false;

            localStorage.setItem('userEmailSalt', '');

            //Delete token
            //localStorageUtilityService.removeFromLocalStorage('xsrfToken');
        };

        //login method
        authService.login = function (email, password) {
            var deferred = $q.defer();

            $http.post(talentaleAPI.base_url + '/auth/login', { 'email': email, 'password': password}).then(function (response) {
                _login(response.data.data);
                deferred.resolve(response.data.data);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

             //Logout method
        //Note: We have to reset whole app on logout. Means re boot like ctrl+F5
        authService.logout = function () {
            var deferred = $q.defer();
            //Call to api
            $http.post(talentaleAPI.base_url + '/auth/logout').then(function (success) {
                _logout();
                deferred.resolve(success);
            }, function (error) {
                $log.error(error);
            });
            return deferred.promise;
        };

        //This is used to recreate login session at client side if it is retrieved from api (Ex. ctrl+F5)
        authService.recreateLogin = function (userData) {
            //update isAuthenticated variable
            isAuthenticated = true;
            //Update user details
            userService.updateUserDetails(userData);
            
            $rootScope.$broadcast('Authenticated', true);
            $rootScope.showLoginSignUp = false;
        };

        //To establish session with API Server
        authService.createSession = function () {
            var deferred = $q.defer();
            //Call API
            $http.get(talentaleAPI.base_url + '/auth/session').then(function (response) {
                $log.debug('session call succeed authService');
                if (response.data.data != null && response.data.data.email != null && response.data.data.email != "") {
                    //As user is already logged in on server. Set details in client side/
                    authService.recreateLogin(response.data.data);
                    $log.debug('session authService.createSession - ' + authService.getIsAuthenticated());
                }
                //Turn off loading bar
                $rootScope.showView = false;
                deferred.resolve("success");
            }, function (error) {
                $log.debug('session call got error');
                $log.error(error);
                //Turn off loading bar
                $rootScope.showView = false;
                deferred.reject(error);
            });

            return deferred.promise;
        };

        //To return isAuthenticated
        //Note: We have to write is and can methods for roles and privileges
        authService.getIsAuthenticated = function () {
            return isAuthenticated;
        };

        //To update isAuthenticated
        //Note: This is for temporary
        authService.setIsAuthenticated = function (value) {
            isAuthenticated = Boolean(value);
        };

     
        //Method is calling the API to sent the mail to user email address to confirm the registration 
        authService.registration = function (regDetail) {
            var deferred = $q.defer();

            $http.post(talentaleAPI.base_url + '/auth/registration', {
                registration: {
                    email: regDetail.email,
                    password:regDetail.password,
                    name:regDetail.name
                }
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

     
        //Oauth method 
        authService.getDetailsForExternalEntity = function (key) {
            var deferred = $q.defer();
            $http.post(talentaleAPI.base_url + '/auth/user/external/get', { 'emailSalt': key }).then(function (response) {
                deferred.resolve(response.data.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };
        authService.externalUserDetailsSave = function (fullUserDetails) {
            var deferred = $q.defer();
            $http.post(talentaleAPI.base_url + '/auth/user/external/save', { 'emailSalt': fullUserDetails.emailSalt, 'firstName': fullUserDetails.firstName, 'lastName': fullUserDetails.lastName, 'gender':parseInt( fullUserDetails.gender), 'dateOfBirth': fullUserDetails.dateOfBirth, 'country': fullUserDetails.country, 'city': fullUserDetails.city, 'zip': fullUserDetails.zip, 'sports': fullUserDetails.sports }).then(function (response) {
                //_login(response.data.data);
                deferred.resolve(response.data.data);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };
        return authService;
    }
]);