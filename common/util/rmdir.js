/**
 * Created by zJJ on 7/21/2016.
 */

const
  logTag = '> rm worker',
  gulp = require('gulp'),
  fs = require('fs'),
  path = require("path"),
  fse = require('fs-extra'),
  rimraf = require('gulp-rimraf');

var fast = function (uploadsDir) {
  fse.emptyDir(uploadsDir, function (err) {
    if (!err) console.log('success!')
  })
};

var check_time = function (uploadsDir, time_after) {
  var time_plus = time_after == null ? 10000 : time_after;
  fs.readdir(uploadsDir, function (err, files) {
    files.forEach(function (file, index) {
      // console.log(logTag, 'found file ' + index);
      fs.stat(path.join(uploadsDir, file), function (err, stat) {
        var endTime, now;
        if (err) {
          return console.error(err);
        }
        now = new Date().getTime();
        endTime = new Date(stat.ctime).getTime() + time_plus;
        console.log(logTag, endTime + " : " + now);
        console.log(logTag, stat);
        if (now > endTime) {
          console.log(logTag, "remove file");
          return rimraf(path.join(uploadsDir, file), function (err) {
            if (err) {
              return console.error(err);
            }
            console.log(logTag, 'successfully deleted');
          });
        }
      });
    });
  });
};

module.exports.fast = fast;
module.exports.check_time = check_time;
