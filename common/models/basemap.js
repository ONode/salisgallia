/**
 * Created by zJJ on 7/19/2016.
 */
var _ = require('lodash');
var db_worker = require("./../util/db.js");
var s3thread = require("./../logic/transferS3");
const logTag = "> basemap.js model";
module.exports = function (basemap) {

  /* var reduceUploads = function (user_uuid, cb) {
   var UserItem = basemap.models.user;
   UserItem.findOne({
   where: {
   "id": user_uuid
   }
   }, function (err, item) {

   if (_.isError(err)) {
   cb(err);
   return;
   }

   db.updateByIdUpdate(UserItem, user_uuid, {
   "uploads": item.uploads - 1
   }, function (doc) {
   return cb(doc);
   });
   });
   };*/


  /**
   * throwing in an extra request on value in the filter object
   */
  basemap.observe('access', function (context, next) {
    /**
     * the query specific for getting the complete listing
     */
    if (_.isEqual(context.query['ready'], 'on')) {
      if (!context.query.where) {
        context.query.where = {}
      }
      context.query.where['complete'] = 100;
      context.query.where['listing.enabled'] = true;
      //context.query.where['listing.enabled'] = {$exists: true};
      //context.query.include = ["folder_base_name", "secret_base_map_file", "rename_file", "price", "estprice", "baseprice", "currency", "owner", "image_type", "image_meta", "listing","createtime","updatetime"];
      context.query.fields = {
        id: true,
        createtime: true,
        updatetime: true,
        listing: true,
        image_meta: true,
        folder_base_name: true,
        secret_base_map_file: true,
        price: true,
        estprice: true,
        baseprice: true,
        owner: true,
        currency: true,
        rename_file: true,
        fast_id: true
      };
      console.log(logTag, 'Additional query request filter', context.Model.modelName, JSON.stringify(context.query.where));
    }
    next()
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
  /*  remotes.after('*.find', function (ctx, next) {
   var filter;
   if (ctx.args && ctx.args.filter) {
   console.log('> filter object', ctx.args.filter);
   filter = ctx.args.filter.where;
   console.log('> ctx.res. basemap', filter);
   }
   });*/

  /*
   if (!ctx.res._headerSent) {
   // console.log('> ctx.res._headerSentt', ctx.res._headerSent);
   this.count(filter, function (err, count) {
   ctx.res.set('X-Total-Count', count);
   ctx.res.set('X-Total-Pages', Math.floor(count / ctx.args.filter.limit) + 1);
   next();
   });
   } else {
   next();
   }*/

  /*
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
