angular.module('NerdService', []).factory('Nerd', ['$http', function($http) {

    return {
        // call to get all Nerds
        get : function() {
            return $http.get('/api/nerds');
        },

        // call to POST and create a new Nerd
        create : function(nerdData) {
            return $http.post('/api/nerds', nerdData);
        },

        // call to DELETE a Nerd
        delete : function(id) {
            return $http.delete('/api/nerds/' + id);
        }
    };
    
}]);