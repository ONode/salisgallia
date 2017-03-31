/**
 * Created by hesk on 16年12月6日.
 */
angular
  .module('app', ['ui.router', 'lbServices', 'ng.deviceDetector', 'ngTouch', 'ngAnimate'])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state('CertReview', {
          url: '/certreview/:id/:lang',
          templateUrl: 'views/my-certs.html',
          controller: 'CertReview'
        });

      // url: '/Preview/:id/:mode/:lang',
      console.log("=config done===");
      $urlRouterProvider.otherwise('CertReview');

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
