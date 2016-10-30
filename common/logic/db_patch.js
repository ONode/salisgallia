/**
 * Created by hesk on 16年10月30日.
 */
var objType = require('mongodb').ObjectID;
var _ = require('lodash');
var async = require('async');
module.exports.toObject = function (val) {
  return new objType(val);
};
module.exports.fixIddb = function (loopback_model, field) {

  loopback_model.find({
    order: "createtime DESC",
    limit: 1000,
    skip: 0
  }, function (err, results) {
    if (_.isError(err)) {
      return cb(err);
    }

    async.eachSeries(
      results,

      function (r, next_step) {

        var new_replace = new objType(r.owner);
        r.updateAttribute(field, new_replace, function (err, done_yet) {
          if (_.isError(err)) {
            console.log(logTag, "updateAttribute has error ..... ", err);
            return;
          }
          if (_.isFunction(next_step)) {
            console.log(logTag, "operation done to as new objectId on owner", done_yet);
            next_step();
          }
        })
      },

      function done(err) {
        if (_.isError(err)) {
          console.error(err.message);
        }
        //callback(null, "tow");
      });

  });
};
