/**
 * Created by zJJ on 7/19/2016.
 */
var _ = require('lodash');
var async = require('async');
var db_worker = require("./../util/db.js");
var s3thread = require("./../logic/s3upload");
var s3clean = require("./../logic/s3cleaner");
var ai_basemap = require("./../ai/basemap_action");
var loopback = require('loopback');
const logTag = "> basemap.js model";
var result_bool = {
  acknowledged: true
};
var display_as_list = {
  id: true,
  owner: true,
  createtime: true,
  updatetime: true,
  listing: true,

  price: true,
  estprice: true,
  baseprice: true,

  image_meta: true,
  folder_base_name: true,
  mid_size: true,
  rename_file: true
};
var display_single_owner = {
  id: true,
  fast_id: true,
  complete: true,
  owner: true,
  createtime: true,
  updatetime: true,

  listing: true,
  price: true,

  estprice: true,
  baseprice: true,
  license_price: true,
  factory_shared: true,
  printed_shared: true,
  print_limit: true,
  currency: true,

  total_zoom_levels: true,
  secret_base_map_file: true,
  image_meta: true,
  folder_base_name: true,
  mid_size: true,
  image_type: true,
  rename_file: true
};
function ensureVariableInteger(context, item) {
  // var context = loopback.getCurrentContext();
  if (!_.isUndefined(context.query.where[item])) {
    context.query.where[item] = parseInt(context.query.where[item]);
    //  console.log("added query-- ", item);
  }
}
module.exports = function (basemap) {
  basemap.disableRemoteMethodByName('create');
  basemap.disableRemoteMethodByName('upsert');
  basemap.disableRemoteMethodByName("deleteById");
  basemap.disableRemoteMethodByName("updateAll");
  basemap.disableRemoteMethodByName("updateAttributes");
  basemap.disableRemoteMethodByName("createChangeStream");
  basemap.disableRemoteMethodByName("patchOrCreate");
  basemap.disableRemoteMethodByName("replaceOrCreate");
  basemap.disableRemoteMethodByName("replaceById");
  basemap.disableRemoteMethodByName("upsertWithWhere");

  /**
   * Throwing in an extra request on value in the filter object
   */
  basemap.observe('access', function (ctx, next) {
    //var ctx = loopback.getCurrentContext();
    if (!ctx.query.where) {
      ctx.query.where = {};
     // console.log("reset where");
    }

    var isSingle = !_.isEmpty(ctx.query.where.id);
    var hasOwnerQuery = !_.isEmpty(ctx.query.where.owner);
    /**
     * The query specific for getting the complete listing
     */
    // console.log(ctx.query);
    if (!isSingle) {

      if (!hasOwnerQuery) {
        ctx.query.where['complete'] = 100;
        ctx.query.where['listing.enabled'] = true;
      } else {
        ctx.query.where['owner'] = db_worker.patch_find_ensure_id(basemap, ctx.query.where.owner);
      }

      ensureVariableInteger(ctx, 'image_meta.material');
      ensureVariableInteger(ctx, 'image_meta.shape');
      ensureVariableInteger(ctx, 'image_meta.cat');
      ensureVariableInteger(ctx, 'image_meta.topic');
      ensureVariableInteger(ctx, 'image_meta.frame_width');
      ensureVariableInteger(ctx, 'image_meta.frame_shadow');
      ctx.query.fields = display_as_list;
      //console.log("with fields");
    } else {
      ctx.query.fields = display_single_owner;
      //console.log("no fields");
    }
    ctx.query.order = "createtime DESC";
    next()
  });
  /*

   remotes.before('*.find', function (ctx, next) {
   console.log(log, "===============");
   var _filter = {};
   if (ctx.args && ctx.args.filter) {
   console.log(log, ctx.args.filter);
   _filter = ctx.args.filter;
   ctx.args.filter.include = ["folder_base_name", "secret_base_map_file"];
   }
   console.log(log, " before query the ids", _filter);
   next();
   });

   */
  basemap.observe('before save', function updateTimestamp(ctx, next) {
    // var ctx = loopback.getCurrentContext();
    if (ctx.instance) {

      /*  if (!_.isUndefined(ctx.instance.owner)) {
       var toString = new String(ctx.instance.owner);
       ctx.instance.owner = fixId.toObject(toString);
       }*/

      ctx.instance.updatetime = new Date();

    } else {

      /* if (!_.isUndefined(ctx.data.owner)) {
       var toString = new String(ctx.data.owner);
       ctx.data.owner = fixId.toObject(toString);
       }*/
      ctx.data.updatetime = new Date();

    }
    next();
  });

  basemap.observe('before delete', function (ctx, next) {

    //var ctx = loopback.getCurrentContext();

    console.log('Going to delete %s matching %j',
      ctx.Model.pluralModelName,
      ctx.where);


    var basemapId = ctx.where['id'];
    db_worker.getInstanceById(basemap, basemapId,
      function (data) {
        console.log(logTag, 'remove item', data);
        if (data != null) {
          console.log(logTag, '>========== START removing the files from S3 folder');
          var base_path = data.folder_base_name;
          db_worker.updateByIdAndReduce(
            basemap.app.models.user, data.owner,
            "uploads",
            function () {
              s3clean.remove_file_from_dest(base_path, function () {
                console.log(logTag, '>========== END removing the files from S3 folder');
              });
            });
        }
        next();
      }, function (err) {
        console.log(logTag, 'remove item', err);
        next();
      });
  });

  basemap.observe('after delete', function (ctx, next) {
    console.log(logTag, 'remove item', 'done');
    next();
  });

  basemap.get_lucky_list = function (_count, cb) {
    var count_final = _count > 20 ? 20 : _count;
    var where_cond = {
      "listing.enabled": true
    };
    basemap.count(where_cond, function (err, number) {
      if (_.isError(err)) {
        return cb(err);
      }
      console.log("> get sample list with total items: ", number);
      var __skip = parseInt(Math.random() * (number - _count));

      basemap.find({
        where: where_cond,
        order: "createtime DESC",
        limit: count_final,
        skip: __skip
      }, function (err, results) {
        if (_.isError(err)) {
          return cb(err);
        }
        cb(null, results);
      });
    });
  };

  basemap.get_empty_check = function (cb) {
    s3clean.checkExisting(basemap);
    cb(null, result_bool);
  };

  basemap.get_by_owner_v2 = function (_the_owner, cb) {
    var where_cond = {
      "owner": {
        "exists": true
      }
    };
    var where_cond2 = {
      "currency": "HKD"
    };
    //57e4c5255410d603006997ff
    //console.log(logTag, ">>Where to owner.. ", where_cond);
    basemap.find({
      where: where_cond,
      order: "createtime DESC",
      limit: 1000,
      skip: 0
    }, function (err, results) {
      if (_.isError(err)) {
        return cb(err);
      }
      basemap.count(where_cond, function (err, number) {
        console.log(logTag, ">> How many does it count? ", number);
      });
      cb(null, results);
    });

    cb(null, result_bool);
  };
  /**
   * fixed the empty mid_size map
   * @param cb
   */
  basemap.get_custom_job = function (cb) {
    db_worker.customJobLoopOverModel(basemap, function (err, done) {
      console.log(logTag, 'done and done for model migration', 'one');
    }).setModelMigrateLogic(function (item, next) {
      if (_.isUndefined(item.mid_size)) {
        var file_name = item.rename_file;
        item.updateAttribute("mid_size", file_name, function (err, r) {
          console.log(logTag, 'done update on the entry', r.id);
          next();
        });
      } else {
        next();
      }
    });
    cb(null, result_bool);
  };

  /**
   * further request approval for sale of this item
   * @param basemapid item id
   * @param requeststatuscode request code
   * @param cb call back
   */
  basemap.request_action = function (basemapid, requeststatuscode, cb) {
    if (requeststatuscode == 101) {
      ai_basemap.request_action_for_sale(basemap, basemapid, cb);
    } else {
      cb(new Error("not available for this action"), null);
    }
  };

  basemap.remoteMethod("request_action", {
    description: ["Request action for running against the approval of listing process."],
    accepts: [
      {
        arg: "basemapid",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "resource id"
      },
      {
        arg: "requeststatuscode",
        type: "number",
        http: {source: "path"},
        required: true,
        description: "the status code id"
      }
    ],
    returns: {
      arg: "luckylist", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/request_action/:basemapid/:requeststatuscode"}
  });


  basemap.remoteMethod("get_custom_job", {
    description: ["Cron get empty removals ..."],
    accepts: [],
    returns: {
      arg: "ret", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/get_custom_job/"}
  });

  basemap.remoteMethod("get_empty_check", {
    description: ["Cron get empty removals ..."],
    accepts: [],
    returns: {
      arg: "ret", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/check_removals/"}
  });


  basemap.remoteMethod("get_by_owner_v2", {
    description: ["Cron job to the list locally.."],
    accepts: [{
      arg: "owner",
      type: "string",
      http: {source: "path"},
      required: true,
      description: "list the items by the owner"
    }],
    returns: {
      arg: "luckylist", type: "array", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/get_by_owner/:owner"}
  });


  basemap.remoteMethod("get_lucky_list", {
    description: ["Cron job to the list locally.."],
    accepts: [{
      arg: "count",
      type: "number",
      http: {source: "path"},
      required: true,
      description: "the count number of the random list"
    }],
    returns: {
      arg: "luckylist", type: "array", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/getlucky/:count"}
  });


  /*

   remotes.after('*.find', function (ctx, next) {
   var filter;
   if (ctx.args && ctx.args.filter) {
   console.log('> filter object', ctx.args.filter);
   filter = ctx.args.filter.where;
   console.log('> ctx.res. basemap', filter);
   }
   });


   if (!ctx.res._headerSent) {
   // console.log('> ctx.res._headerSentt', ctx.res._headerSent);
   this.count(filter, function (err, count) {
   ctx.res.set('X-Total-Count', count);
   ctx.res.set('X-Total-Pages', Math.floor(count / ctx.args.filter.limit) + 1);
   next();
   });
   } else {
   next();
   }


   CoffeeShop.status = function(cb) {
   var currentDate = new Date();
   var currentHour = currentDate.getHours();
   var OPEN_HOUR = 6;
   var CLOSE_HOUR = 20;
   console.log('Current hour is ' + currentHour);
   var response;
   if (currentHour > OPEN_HOUR && currentHour < CLOSE_HOUR) {
   response = 'We are open for business.';
   } else {
   response = 'Sorry, we are closed. Open daily from 6am to 8pm.';
   }
   cb(null, response);
   };
   CoffeeShop.remoteMethod(
   'status',
   {
   http: {path: '/status', verb: 'get'},
   returns: {arg: 'status', type: 'string'}
   }
   );


   */

};
