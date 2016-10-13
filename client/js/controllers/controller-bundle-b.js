/**
 * Created by hesk on 16年10月13日.
 */
angular.module('app')
  .controller('SingleArtWorkPreview', ['$scope', '$q', '$state', '$stateParams', 'Basemap', 'user',
    function ($scope, $q, $state, $stateParams, _basemap, _user) {
      $scope.ThisArticle = _basemap.findOne(
        {
          filter: {
            where: {
              id: $stateParams.id
            }
          }
        }
      );












    }]);
