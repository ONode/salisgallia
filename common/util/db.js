/**
 * Created by zJJ on 7/21/2016.
 */
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
    r.updateAttributes(update_object, function (err, r) {
      if (_.isFunction(next)) {
        next();
      }
    })
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
