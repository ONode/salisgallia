/**
 * Created by zJJ on 7/21/2016.
 */
const logTag = "> db.js";
const _ = require('lodash');
const ay = require('async');
var updateByIdAndIncrease = function (persistentModel, _id_, field_name_inc_1, next) {

  if (persistentModel == null) {
    console.log(logTag, "updateByIdAndIncrease, persistentModel is undefined ..... ");
    console.log(logTag, "==========================================");
    return;
  }

  console.log(logTag, "==========================================");
  console.log(logTag, "==> Update By Id And Increase Start Here =");
  console.log(logTag, "==========================================");
  persistentModel.findOne({where: {id: _id_}}, function (err, _doc_user) {

    if (_.isError(err)) {
      console.log(logTag, "findById has error ..... ", err);
      return;
    }

    var val = 0;
    if (_.isNaN(parseInt(_doc_user[field_name_inc_1]))) {
      val = 1;
    } else {
      val = parseInt(_doc_user[field_name_inc_1]) + 1;
    }
    _doc_user.updateAttribute(field_name_inc_1, val, function (err, r) {
      // console.log(logTag, "updateAttribute result in here.....");
      if (_.isError(err)) {
        console.log(logTag, "updateAttribute has error ..... ", err);
        return;
      }
      if (_.isFunction(next)) {
        next();
      }
    })
  });
};
var updateByIdAndReduce = function (persistentModel, _id_, field_name_inc_1, next) {

  if (persistentModel == null) {
    console.log(logTag, "updateByIdAndReduce, persistentModel is undefined ..... ");
    console.log(logTag, "==========================================");
    return;
  }

  console.log(logTag, "==========================================");
  console.log(logTag, "==> Update By Id And Reduce Start Here =");
  console.log(logTag, "==========================================");
  persistentModel.findOne({where: {id: _id_}}, function (err, oneDoc) {
    var val = 0;
    if (_.isNaN(parseInt(oneDoc[field_name_inc_1]))) {
      val = 0;
    } else {
      val = parseInt(oneDoc[field_name_inc_1]) - 1;
      if (val < 0) {
        val = 0;
      }
    }
    oneDoc.updateAttribute(field_name_inc_1, val, function (err, r) {

      if (_.isError(err)) {
        console.log(logTag, "updateAttribute has error ..... ", err);
        return;
      }

      if (_.isFunction(next)) {

        console.log(logTag, "==========================================");
        console.log(logTag, "==> update doc attribute done =");
        console.log(logTag, "==========================================");

        next();
      }
    })
  });
};
var updateByIdUpdate = function (persistentModel, _id_, update_object, next) {

  if (persistentModel == null) {
    console.log(logTag, "updateByIdUpdate, persistentModel is undefined ..... ");
    console.log(logTag, "==========================================");
    return;
  }

  persistentModel.findOne({where: {id: _id_}}, function (err, oneDoc) {
    if (_.isError(err) || oneDoc == null) {
      console.info(logTag, "error incurred or the query object is not found", err);
      next(err);
    } else {
      try {
        oneDoc.updateAttributes(update_object, function (err, r) {
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
  persistentModel.findOne({where: {id: _id}}, function (err, oneDoc) {
    if (_.isError(next)) {
      return errnext(err);
    }
    next(oneDoc);
  });
};
var removeAll = function (persistentModel, where, callback) {
  persistentModel.destroyAll(where, callback);
};

module.exports.customJobLoopOverModel = function (model_obj, next_up) {
  var _offset = 0, page = 10, migrate_fn;

  var uploop = function () {
    model_obj.find({limit: page, offset: _offset}, function (err, docList) {

      if (_.isError(err) || docList.length == 0) {
        console.info(logTag, "=> error ... custom.job", err, docList);
        return next_up();
      }

      ay.eachSeries(docList, function (item, next) {
          if (_.isFunction(migrate_fn)) {
            migrate_fn(item, next);
          } else {
            console.info(logTag, "custom.job", "cannot find the migration function operation");
          }
        },
        function (err, nu) {
          if (docList.length < page) {
            next_up();
          } else {
            _offset += page;
            uploop();
          }
        });
    });
  };

  return {
    setModelMigrateLogic: function (fn) {
      migrate_fn = fn;
      uploop();
    }
  }
};

module.exports.updateByIdAndIncrease = updateByIdAndIncrease;
module.exports.updateByIdAndReduce = updateByIdAndReduce;
module.exports.updateByIdUpdate = updateByIdUpdate;
module.exports.removeAll = removeAll;
module.exports.getInstanceById = getInstanceById;
