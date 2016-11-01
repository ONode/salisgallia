/**
 * Created by hesk on 16年10月31日.
 */
const pre = require("./preS3");
var get_folder_names = function (list_raw_paths) {
  var list = [];
  pre.l.forEach(list_raw_paths, function (path) {
    //console.log("extractedpath: ", path);
    var g = path.match(pre.crTool.extract_base_id);
    // console.log("extractedpath: ", g);
    if (!pre.l.isEmpty(g[0])) {
      // console.log("p- : ", g[0]);
      list.push(g[0]);
    }
  });
  return list;
};
var s3getlist = function (callback) {
  console.log("test path s3 access: ", pre.access);
  pre.s3Ls({
    bucket: pre.bucket_name
  }).ls('/basemap', function (err, data) {
    // console.log("> done", data);
    var mlist = get_folder_names(data.folders);
    if (pre.l.isFunction(callback)) {
      callback(mlist);
    }
  });
};
var processItemFound = function (bm, name_base, callback) {
  if (!pre.l.isFunction(callback)) {
    console.log("callback from processItemFound is not defined");
    return;
  }
  bm.findOne({
    where: {
      "folder_base_name": name_base
    }
  }, function (err, doc) {
    if (pre.l.isEmpty(doc)) {
      callback(false, name_base);
    } else {
      callback(true, name_base);
    }
  });
};
module.exports = {
  s3checklist: s3getlist,
  remove_file_from_dest: function (name_key_yahoo, callback) {
    pre.s3FsRm(pre.bucket_name, "/basemap/" + name_key_yahoo + "/", function (err, done) {
      if (done) {
        console.log("> ======================");
        console.log("> operation is done from remove ", done);
        console.log("> ======================");
      }
      callback();
    });
  },
  checkExisting: function (bm) {
    var _list = [];
    pre.async.series([
      function (next) {
        s3getlist(function (list) {
          _list = list;
          next(null, true);
        });
      },
      function (next) {
        pre.async.eachSeries(_list, function (base, callback) {
          processItemFound(bm, base, function (bool, name_key) {
            if (!bool) {
              pre.s3FsRm(pre.bucket_name, "/basemap/" + name_key + "/", function (err, done) {
                if (done) {
                  console.log("> operation is done from remove ", done);
                  console.log("> ======================");
                }
                callback();
              });
            } else {
              callback();
            }
          });
        }, function done() {
          next();
        });
      }
    ], function (err, done) {
      console.log("===========================");
      console.log("Job done checkExisting");
      console.log("===========================");
    });
  }
};


