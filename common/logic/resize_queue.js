/**
 * Created by hesk on 16年11月1日.
 */
const pre = require("./preMap.js");
var ResizeOperation = function () {
  this.queue_jobs = [];
  this.default_options = {srcPath: ""};
};
ResizeOperation.prototype.setSrcPath = function (path) {
  this.default_options = pre._.assign(this.default_options, {srcPath: path});
};
ResizeOperation.prototype.appendOperation = function (options) {
  var j = pre._.merge(options, this.default_options);
  this.queue_jobs.push(j);
};
ResizeOperation.prototype.enableAutoRotateOnRootImage = function () {
  this.queue_jobs.push("auto-orient");
};
ResizeOperation.prototype.execute = function (callback) {
  if (!pre._.isFunction(callback)) {
    console.log("callback is not a function.");
    return;
  }
  if (this.queue_jobs.length == 0) {
    console.log("if the job lengths are just zero the queue will not start and now it is the case.");
    return callback();
  }

  pre.async.eachSeries(this.queue_jobs, function (job, next) {
      var timeStarted = new Date;
      if (pre._.isString(job) && job == "auto-orient") {
        pre.imageMagic.EXIFAutoRotate({
          srcPath: this.default_options.srcPath,
          dstPath: this.default_options.srcPath
        }, function (err, stout, stderr) {
          if (pre._.isError(err)) {
            return next(err);
          }
          console.log('Real time spent for resize this image: ' + (new Date() - timeStarted) + ' ms');
          next();
        });
      } else if (pre._.isObject(job)) {
        pre.imageMagic.resize(job, function (err, stdout, stderr) {
          if (pre._.isError(err)) {
            return next(err);
          }
          console.log('Real time spent for resize this image: ' + (new Date() - timeStarted) + ' ms');
          next();
        });
      }
    }.bind(this),

    function (err, done) {
      if (pre._.isError(err)) {
        console.error(err.stack || err);
        return callback(err);
      }

      return callback();
    });
};

module.exports = {
  core: ResizeOperation,
  test: function () {
    var mh = new ResizeOperation();
    mh.setSrcPath("...");
    mh.appendOperation("....");
    mh.execute(function (err) {

    });
  }
};
