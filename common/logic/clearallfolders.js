/**
 * Created by zJJ on 7/21/2016.
 */
const
  output = require('.././util/outputjson.js'),
  db_worker = require("./../util/db.js"),
  rmdir = require('.././util/rmdir.js'),
  path = require('path')
  ;

const
  logTag = '> remove',
  __parentDir = path.dirname(module.main),
  upload_helper_folder = __parentDir + "/storage/tmp/tmpsgi/",
  base_folder = __parentDir + "/storage/tmp/storage_f/"
  ;

module.exports = function (loopbackBasemap, req, res) {
  rmdir.fast(upload_helper_folder);
  rmdir.fast(base_folder);
  console.log(logTag, "--- files remove file triggered.");
  db_worker.removeAll(loopbackBasemap, [], function (err, info) {
    console.log(logTag, "-- database removed.");
    output.outResSuccess("done", res);
  });
};
