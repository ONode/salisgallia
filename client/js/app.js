// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
angular
  .module('app', ['ui.router', 'lbServices', 'ng.deviceDetector', 'ngTouch', 'ngAnimate'])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state('Preview', {
          url: '/preview/:id/:mode/:lang',
          templateUrl: 'views/simple-view.html',
          controller: 'PreviewController'
        });

      // url: '/Preview/:id/:mode/:lang',
      //  console.log("=config done===");
      //$urlRouterProvider.otherwise('Preview');
    }])
  .run(['$rootScope', '$state', function ($rootScope, $state) {
    $rootScope.$on('$stateChangeStart', function (event, next) {
      // redirect to login page if not logged in
      //console.log("====== state change start =======");
      if (next.authenticate && !$rootScope.currentUser) {
        event.preventDefault(); //prevent current page from loading
        $state.go('forbidden');
      }
    });
  }]);
