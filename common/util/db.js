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
    console.log(update_object);
    r.updateAttributes(update_object, function (err, r) {
      if (_.isFunction(next)) {
        next();
      }
    })
  });
};
var removeAll = function (persistentModel, where, callback) {
  persistentModel.destroyAll(where, callback);
};
module.exports.updateByIdAndIncrease = updateByIdAndIncrease;
module.exports.updateByIdUpdate = updateByIdUpdate;
module.exports.removeAll = removeAll;
