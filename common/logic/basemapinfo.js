/**
 * Created by zJJ on 7/20/2016.
 */
var db_worker = require("./../util/db.js");
const logTag = '> save info';
module.exports.start = function (mapModel, result_object, next, nextError) {
  var saveClip = new mapModel(result_object);
  saveClip.save(function (err, doc) {
    if (err) {
      console.log(logTag, "new basemap error", err);
      nextError(err);
    } else {
      console.log(logTag, "new basemap success", doc.id);
      next(doc.id);
    }
  });
};
module.exports.progress = function (mapModel, progress, id, next) {
  db_worker.updateByIdUpdate(mapModel, id, {
    "complete": progress
  }, next);
};
module.exports.complete = function (mapModel, id, result_object, next) {
  db_worker.updateByIdUpdate(mapModel, id, result_object, next);
};
module.exports.complete_once_off = function (mapModel, result_object, next) {
  var saveClip = new mapModel(result_object);
  saveClip.save(function (err) {
    if (err) {
      console.log(logTag, "new basemap error", err);
    } else {
      console.log(logTag, "new basemap success", err);
    }
    next();
  });
};
