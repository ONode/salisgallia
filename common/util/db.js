/**
 * Created by zJJ on 7/21/2016.
 */
const logTag = "> db worker";
const _ = require('lodash');
var updateByIdAndIncrease = function (persistentModel, _id_, field_name_inc_1, next) {
  persistentModel.findById(_id_, function (err, r) {
    var update = {};
    update[field_name_inc_1] = r[field_name_inc_1] + 1;
    r.updateAttribute(update, function (err, r) {
      if (_.isFunction(next)) {
        delete update;
        next();
      }
    })
  });
};
var updateByIdUpdate = function (persistentModel, _id_, update_object, next) {
  persistentModel.findById(_id_, function (err, r) {
    if (_.isError(err) || r == null) {
      console.info(logTag, "error incurred or the query object is not found", err);
      next(err);
    } else {
      /*console.info(logTag, "======================");
      console.info(logTag, "update subject", update_object);
      console.info(logTag, "======================");
      console.info(logTag, "check queried object", r);
      console.info(logTag, "======================");*/
      try {
        r.updateAttributes(update_object, function (err, r) {
          if (_.isFunction(next)) {
          //  console.info(logTag, "success r.updateAttributes");
            next(r);
          }
        })
      } catch (e) {
        console.info(logTag, "failure r.updateAttributes");
      }
    }
  });
};
var getInstanceById = function (persistentModel, _id, next, errnext) {
  persistentModel.findById(_id, function (err, r) {
    if (_.isError(next)) {
      return errnext(err);
    }
    next(r);
  });
};
var removeAll = function (persistentModel, where, callback) {
  persistentModel.destroyAll(where, callback);
};
module.exports.updateByIdAndIncrease = updateByIdAndIncrease;
module.exports.updateByIdUpdate = updateByIdUpdate;
module.exports.removeAll = removeAll;
module.exports.getInstanceById = getInstanceById;
