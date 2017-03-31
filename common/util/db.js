"use strict";
/**
 * Created by zJJ on 7/21/2016.
 */
const logTag = "> db.js";
const _ = require('lodash');
const ay = require('async');
const updateByIdAndIncrease = function (persistentModel, query_item_id, field_name_inc_1, next) {

  if (persistentModel == null) {
    console.log(logTag, "updateByIdAndIncrease, persistentModel is undefined ..... ");
    console.log(logTag, "==========================================");
    return;
  }

  console.log(logTag, "==========================================");
  console.log(logTag, "==> Update By Id And Increase Start Here =");
  console.log(logTag, "==========================================");
  persistentModel.findOne({where: {id: query_item_id}}, function (err, _doc_user) {
    if (_.isError(err)) {
      console.log(logTag, "findById has error ..... ", err);
      return;
    }
    let val = 0;
    console.log(logTag, "got item for value increase [", field_name_inc_1, " : ", _doc_user[field_name_inc_1], " ]");
    const read = _doc_user[field_name_inc_1];
    if (_.isNumber(read)) {
      val = read + 1;
    } else {
      console.log(logTag, "this field is not a number..  [", field_name_inc_1);
      val = 1;
    }
    console.log(logTag, "instruction to update a single attribute -[ ", field_name_inc_1, val, " ]");
    _doc_user.updateAttribute(field_name_inc_1, val, function (err, r) {
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
const updateByIdAndReduce = function (persistentModel, _id_, field_name_inc_1, next) {

  if (persistentModel == null) {
    console.log(logTag, "updateByIdAndReduce, persistentModel is undefined ..... ");
    console.log(logTag, "==========================================");
    return;
  }

  console.log(logTag, "==========================================");
  console.log(logTag, "==> Update By Id And Reduce Start Here ===");
  console.log(logTag, "==========================================");
  persistentModel.findOne({where: {id: _id_}}, function (err, oneDoc) {
    let val = 0;
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
const updateByIdUpdate = function (persistentModel, _id_, update_object, next) {

  if (persistentModel == null) {
    console.log(logTag, "updateByIdUpdate, persistentModel is undefined ..... ");
    console.log(logTag, "==========================================");
    return;
  }

  persistentModel.findOne({where: {id: _id_}}, function (err, oneDoc) {
    if (_.isError(err) || oneDoc == null) {
      console.info(logTag, "error incurred or the query object is not found", err);
      if (_.isFunction(next)) {
        next(err);
      }
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
const getInstanceById = function (persistentModel, _id, next, errnext) {
  persistentModel.findOne({where: {id: _id}}, function (err, oneDoc) {
    if (_.isError(next)) {
      return errnext(err);
    }
    if (_.isFunction(next)) {
      next(oneDoc);
    }
  });
};
const patch_to_ensure_monogodb_id = function (persistentModel, _id) {
  return persistentModel.getDataSource().ObjectID(_id);
};
const removeAll = function (persistentModel, where, callback) {
  persistentModel.destroyAll(where, callback);
};
const patch_find_by_fk = function (persistentModel, persistentModelName, fk_field, fk_id, callback) {
  persistentModel.getDataSource().connector.connect(function (err, db) {
    const collection = db.collection(persistentModelName);
    const where = {};
    where[fk_field] = patch_to_ensure_monogodb_id(persistentModel, fk_id);
    collection.find(where).toArray(callback);
  });
};
module.exports.customJobLoopOverModel = function (model_obj, next_up) {
  let _offset = 0, page = 10, migrate_fn;

  const uploop = function () {
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
            if (_.isFunction(next_up)) {
              next_up();
            }
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
module.exports.patch_find_by_fk = patch_find_by_fk;
module.exports.patch_find_ensure_id = patch_to_ensure_monogodb_id;
