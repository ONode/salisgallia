// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

angular
  .module('app', ['ui.router', 'lbServices'])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

      $stateProvider
        .state('preview-artwork', {
          url: '/preview-article/{id}/{mode}/{lang}',
          templateUrl: 'views/simple-view.html',
          controller: 'SingleArtWorkPreview'
        })
      ;

      $urlRouterProvider.otherwise('preview-artwork');
    }])
  .run(['$rootScope', '$state', function ($rootScope, $state) {
    $rootScope.$on('$stateChangeStart', function (event, next) {
      // redirect to login page if not logged in
      if (next.authenticate && !$rootScope.currentUser) {
        event.preventDefault(); //prevent current page from loading
        $state.go('forbidden');
      }
    });
  }]);
