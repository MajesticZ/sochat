/* global angular */
var app = angular.module('SoChat', ['ngMaterial', 'ngCookies']);
app.controller('LoginController', ['$scope', '$http', '$cookies', function($scope, $http, $cookies) {
    console.log($cookies.get('login'));
    $scope.signInForm = function(form) {
        $http.post('/chat/login', {'login': $scope.login}).then(function (res){
            if(res.data.message !== undefined){
                alert(res.data.message);
            } else {
                window.location = '/chat/' + $cookies.get('login');
            }
        });
    };
}]);