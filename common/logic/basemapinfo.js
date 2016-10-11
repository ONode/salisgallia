/**
 * Created by zJJ on 7/20/2016.
 */
var db_worker = require("./../util/db.js");
const _ = require('lodash');
const logTag = '> basemapinfo.js';
module.exports.start = function (mapModel, result_object, next, nextError) {
  var saveClip = new mapModel(result_object);
  saveClip.save(function (err, doc) {
    if (err) {
      console.log(logTag, "base map error", err);
      nextError(err);
    } else {
      console.log(logTag, "base map success", doc.id);
      next(doc.id);
    }
  });
};
module.exports.progress = function (mapModel, progress, id, next) {
  console.info(logTag, "check id", id);
  var checker = function (p) {
    return p == 100;
  };
  db_worker.updateByIdUpdate(mapModel, id, {
    "complete": progress,
    "listing.enabled": checker(progress)
  }, next);
};
/*
 lb_basemap.findOne({where:{id:map_id}}, function (err, inst) {

 });
 lb_basemap.updateAttributes()*/
module.exports.localUploadProgressComplete = function (lb_basemap, lb_user, map_id, result_object, next) {

  console.log(logTag, "localUploadProgressComplete continue ..... ");


  db_worker.updateByIdAndIncrease(lb_user, result_object["owner"], "uploads",
    function () {

      console.log(logTag, "operation continue ..... ");
      db_worker.updateByIdUpdate(lb_basemap, map_id, result_object, next);
    },

    function (err) {

      console.log(logTag, "occurred error", err);
      if (_.isError(err)) {
        next(err);
      } else {
        next();
      }




    });
};
module.exports.complete_once_off = function (mapModel, result_object, next) {
  var saveClip = new mapModel(result_object);
  saveClip.save(function (err) {
    if (err) {
      console.log(logTag, "base map error", err);
    } else {
      console.log(logTag, "base map success", err);
    }
    next();
  });
};
