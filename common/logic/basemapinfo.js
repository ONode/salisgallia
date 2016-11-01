/**
 * Created by zJJ on 7/20/2016.
 */
var db_worker = require("./../util/db.js");
//var ObjectID = require("loopback-connector-mongodb/lib/mongodb").ObjectID;
var ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');
const logTag = '> basemapinfo.js';


/*!
 * Convert the id to be a BSON ObjectID if it is compatible
 * @param {*} id The id value
 * @returns {ObjectID}
 */
function ObjectID(id) {
  if (id instanceof ObjectID) {
    return id;
  }
  if (typeof id !== 'string') {
    return id;
  }
  try {
    // MongoDB's ObjectID constructor accepts number, 12-byte string or 24-byte
    // hex string. For LoopBack, we only allow 24-byte hex string, but 12-byte
    // string such as 'line-by-line' should be kept as string
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      return new ObjectID(id);
    } else {
      return id;
    }
  } catch (e) {
    return id;
  }
}

module.exports.startNewMapData = function (mapModel, result_object, next, nextError) {
  var svClip = new mapModel(result_object);
  console.log(logTag, "-------------> before save this", result_object);
  svClip.save(function (err, doc) {
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
  var svClip = new mapModel(result_object);
  svClip.save(function (err) {
    if (err) {
      console.log(logTag, "base map error", err);
    } else {
      console.log(logTag, "base map success", err);
    }
    next();
  });
};
