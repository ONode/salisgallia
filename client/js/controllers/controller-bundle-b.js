/**
 * Created by hesk on 16年10月13日.
 */
angular.module('app')
  .controller('PreviewController',
    ['$scope', '$stateParams', '$q', '$http', 'Basemap',
      function ($scope, $stateParams, $q, $http, _basemap) {
        var googleplayurl = 'https://play.google.com/store/apps/details?id=com.zyntauri.gogallery&hl=zh-TW';
        var china_apk_url = 'https://play.google.com/store/apps/details?id=com.zyntauri.gogallery&hl=zh-TW';
        var detectionuser = 'https://api.userinfo.io/userinfos';
        var conp1 = 'gallerygo/master/configurations.json';
        var conp2 = 'rawgit';
        var conp3 = 'https://cdn.' + conp2 + '.com/GDxU/';

        var default_path1 = "http://dobsh22.s3.amazonaws.com/basemap/";
        var default_path2 = "http://xboxdoc.s3.amazonaws.com/basemap/";

        setInterval(function () {
          jQuery('.star-1').fadeOut(150).delay(2000).fadeIn(300).fadeOut(150).delay(1254);
          jQuery('.star-2').fadeOut(300).fadeIn(120).fadeOut(120).delay(1920);
          jQuery('.star-3').fadeOut(150).delay(1200).fadeIn(300).fadeOut(150).delay(800);
          jQuery('.star-4').fadeOut(700).fadeIn(300).fadeOut(160).delay(1350);
        }, 1);


        var _itemId = $stateParams.id;
        var _mode = $stateParams.mode;
        var _lang = $stateParams.lang;
        var Servica = {};
        /*  console.log("=============================");
         console.log("id", _itemId);
         console.log("_mode", _mode);
         console.log("_lang", _lang);
         console.log("=============================");*/
        Servica.getGeo = function () {
          var deferred = $q.defer();
          $http({method: 'GET', url: detectionuser}).then(function (response) {
            deferred.resolve(response.data);
          }, function (respf) {
            console.log("error", respf);
          });
          return deferred.promise;
        };
        Servica.getMetaDict = function () {
          var deferred = $q.defer();
          $http({
            method: 'GET',
            url: conp3 + conp1
          }).then(function (response_good) {
            deferred.resolve(response_good.data);
          }, function (response_fail) {
            deferred.reject(response_fail);
          });
          return deferred.promise;
        };
        var locale_convert = function (tag) {
          var final_lang = tag;
          if (tag == "ja") {
            final_lang = "jp";
          }
          if (tag == "zh") {
            final_lang = "cn";
          }
          if (tag == "it") {
            final_lang = "en";
          }
          if (tag == "ko") {
            final_lang = "kr";
          }
          return final_lang;
        };
        var _get_name_tag = function (intput_label) {
          if (_lang == null || _lang == "") {
            return intput_label.cn;
          } else {
            var lang_t = locale_convert(_lang);
            if (intput_label.hasOwnProperty(lang_t)) {
              return intput_label[lang_t];
            } else {
              return intput_label.cn;
            }
          }
        };
        $scope.OnClickFn = {
          installapp: function () {
            // var el = angular.element(document.querySelector('#openGallery .open-icon'));
            this.rotating = !this.rotating;
            Servica.getGeo().then(function (json) {
              console.log(json);
              if (json.country.code == "CN") {
                //  console.log("you are in China");
                window.location.href = china_apk_url;
              } else {
                //  console.log("you are not in", json.country.name);
                window.location.href = googleplayurl;
              }
            }, function (fail) {
              alert("error to detect", fail);
            });
          },
          rotating: false,
          ondetect: function (e) {
            console.log(e);
          }
        }
        ;

        Servica.getMetaDict().then(function (data_config) {
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
              _size = result.image_meta.dimension.r + " cm " + "半";
            } else {
              _size = result.image_meta.dimension.x + " x " + result.image_meta.dimension.y + " cm";
            }

            for (var i = 0; i < data_config.shape.length; i++) {
              if (data_config.shape[i].key == shape) {
                _size = _get_name_tag(data_config.shape[i].label) + " " + _size;
              }
            }

            $scope.ThisArticle = {
              meta: result.image_meta,
              size: _size,
              preview: default_path1 + base + "/" + base + ".jpg"
            };

          });

        });

      }]);
