/**
 * Created by hesk on 16年10月13日.
 */
angular.module('app')
  .controller('PreviewController',
    ['$scope', '$stateParams', '$q', '$http', 'Basemap',
      function ($scope, $stateParams, $q, $http, _basemap) {

        var conp1 = 'gallerygo/master/configurations.json';
        var conp2 = 'rawgit';
        var conp3 = 'https://cdn.' + conp2 + '.com/GDxU/';

        var default_path1 = "http://dobsh22.s3.amazonaws.com/basemap/";
        var default_path2 = "http://xboxdoc.s3.amazonaws.com/basemap/";

        var StudentDataOp = {};
        StudentDataOp.getMetaDict = function () {
          var deferred = $q.defer();
          $http({
            method: 'GET',
            url: conp3 + conp1
          }).then(function (response_good) {

            deferred.resolve(response_good.data);
          }, function (response_fail) {

          });

          return deferred.promise;
        };


        var _itemId = $stateParams.id;
        var _mode = $stateParams.mode;
        var _lang = $stateParams.lang;
        console.log("=============================");
        console.log("id", _itemId);
        console.log("_mode", _mode);
        console.log("_lang", _lang);
        console.log("=============================");
        StudentDataOp.getMetaDict().then(function (data_config) {

          _basemap.findOne(
            {
              filter: {
                where: {
                  id: _itemId
                }
              }
            }
          ).$promise.then(function (result) {

            var base = result.folder_base_name;
            var shape = parseInt(result.image_meta.shape), _size;
            if (shape == 5 || shape == 2 || shape == 1) {
              _size = result.image_meta.dimension.r + " cm "+ "半";
            } else {
              _size = result.image_meta.dimension.x + " x " + result.image_meta.dimension.y + " cm";
            }

            for (var i = 0; i < data_config.shape.length; i++) {
              if (data_config.shape[i].key == shape) {
                _size = data_config.shape[i].label.cn + " " + _size;
              }
            }

            var package = {
              meta: result.image_meta,
              size: _size,
              preview: default_path1 + base + "/" + base + ".jpg"
            };

            $scope.ThisArticle = package;

          });

        });

      }]);
