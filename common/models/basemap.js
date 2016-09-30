/**
 * Created by zJJ on 7/19/2016.
 */
var loopback = require('loopback');
var _ = require('lodash');
var db_worker = require("./../util/db.js");
var s3_worker = require("./../logic/transferS3");
const log = "> basemap op";
module.exports = function (basemap) {
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
      console.log('Additional query request filter', context.Model.modelName, JSON.stringify(context.query.where));
    }
    next()
  });
  basemap.observe('before delete', function (ctx, next) {
    console.log('Going to delete %s matching %j',
      ctx.Model.pluralModelName,
      ctx.where);

    var _basemap_id = ctx.where['id'];
    db_worker.getInstanceById(ctx.Model, _basemap_id,
      function (data) {
        console.log('remove item', data);
        if (data != null) {
          console.log('=================== continue');
          var base_path = data.folder_base_name;
          console.log('remove base_path', base_path);
          s3_worker.S3RemoveItemFolder(base_path);
          console.log('=================== end');
        }
        next();
      }, function (err) {
        console.log('remove item', err);
        next();
      });
  });

  basemap.observe('after delete', function (context, next) {
    console.log('remove item', 'done');
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
