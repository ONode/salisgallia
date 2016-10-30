/**
 * Created by zJJ on 7/19/2016.
 */
var _ = require('lodash');
var db_worker = require("./../util/db.js");
var async = require('async');
var s3thread = require("./../logic/transferS3");
var fixId = require("./../logic/db_patch");
const logTag = "> basemap.js model";

var result_bool = {
  acknowledged: true
};
module.exports = function (basemap) {
  /**
   * Throwing in an extra request on value in the filter object
   */
  basemap.observe('access', function (context, next) {
    /**
     * The query specific for getting the complete listing
     */
    if (_.isEqual(context.query['ready'], 'on')) {
      if (!context.query.where) {
        context.query.where = {}
      }
      context.query.order = "createtime DESC";
      context.query.where['complete'] = 100;
      context.query.where['listing.enabled'] = true;
      //context.query.where['listing.enabled'] = {$exists: true};
      //context.query.include = ["folder_base_name", "secret_base_map_file", "rename_file", "price", "estprice", "baseprice", "currency", "owner", "image_type", "image_meta", "listing","createtime","updatetime"];

      context.query.fields = {
        id: true,
        owner: true,
        createtime: true,
        updatetime: true,
        listing: true,
        image_meta: true,
        folder_base_name: true,
        secret_base_map_file: true,
        price: true,
        estprice: true,
        baseprice: true,
        currency: true,
        rename_file: true
      };


      console.log(logTag, 'Additional query request filter', context.Model.modelName, JSON.stringify(context.query.where));
    } else {
      context.query.order = "createtime DESC";
    }


    console.log(logTag, "=> logtag in the context", context.query);
    next()
  });
  /*  remotes.before('*.find', function (ctx, next) {
   console.log(log, "===============");
   var _filter = {};
   if (ctx.args && ctx.args.filter) {
   console.log(log, ctx.args.filter);
   _filter = ctx.args.filter;
   ctx.args.filter.include = ["folder_base_name", "secret_base_map_file"];
   }
   console.log(log, " before query the ids", _filter);
   next();
   });*/
  basemap.observe('before save', function updateTimestamp(ctx, next) {
    if (ctx.instance) {
      ctx.instance.updatetime = new Date();
      if (!_.isUndefined(ctx.instance.owner)) {
        var toString = new String(ctx.instance.owner);
        ctx.instance.owner = fixId.toObject(toString);
      }
    } else {
      if (!_.isUndefined(ctx.data.owner)) {
        var data = new String(ctx.instance.owner);
        ctx.data.owner = fixId.toObject(toString);
      }
      ctx.data.updatetime = new Date();
    }
    next();
  });

  basemap.observe('before delete', function (ctx, next) {
    console.log('Going to delete %s matching %j',
      ctx.Model.pluralModelName,
      ctx.where);
    var basemapId = ctx.where['id'];
    db_worker.getInstanceById(basemap, basemapId,
      function (data) {
        console.log(logTag, 'remove item', data);
        if (data != null) {
          console.log(logTag, '=================== start removing the files from S3 folder');
          var base_path = data.folder_base_name;
          db_worker.updateByIdAndReduce(basemap.app.models.user, data.owner, "uploads", function () {
            console.log(logTag, 'S3RemoveItemFolder');
            s3thread.S3RemoveItemFolder(base_path);
          });
          console.log(logTag, '=================== end');
        }
        next();
      }, function (err) {
        console.log(logTag, 'remove item', err);
        next();
      });
  });

  basemap.observe('after delete', function (context, next) {
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

  basemap.get_by_owner = function (_the_owner, cb) {
    var where_cond = {
      "owner": {
        "exists": true
      }
    };
    var where_cond2 = {
      "currency": "HKD"
    };
    //57e4c5255410d603006997ff

    console.log(logTag, " where to owner.. ", where_cond);
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
        console.log(logTag, " how many does it count? ", number);
      });
      cb(null, results);
    });


    //fixId.fixIddb(basemap, "owner");
    cb(null, result_bool);
  };

  basemap.remoteMethod("get_by_owner", {
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
