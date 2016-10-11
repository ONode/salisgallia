/**
 * Created by zJJ on 7/20/2016.
 */
var db_worker = require("./../util/db.js");
const _ = require('lodash');
const logTag = '> basemapinfo.js';
module.exports.startNewMapData = function (mapModel, result_object, next, nextError) {
  var saveClip = new mapModel(result_object);
  console.log(logTag, "-------------> before save this", result_object);
  saveClip.save(function (err, doc) {
    if (err) {
      console.log(logTag, "base map error", err);
      return nextError(err);
    } else {
      console.log(logTag, "base map success", doc.id);
      return next(doc.id);
    }
  });
};
/**
 *
 * @param mapModel - the presistent model
 * @param progress - number from 0 - 100
 * @param id - the basemap id
 * @param next - the next setup
 */
module.exports.progress = function (mapModel, progress, id, next) {

  if (_.isEmpty(id)) {
    if (_.isFunction(next)) {
      return next(new Error("Id is not found"));
    } else
      return;
  }

  console.info(logTag, "check id", id);

  var checker_report = function (p) {
    return {
      "complete": p,
      "listing.enabled": p == 100
    };
  };

  db_worker.updateByIdUpdate(mapModel, id, checker_report(progress), next);
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
