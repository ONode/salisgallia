/**
 * Created by zJJ on 7/19/2016.
 */
"use strict";
const _ = require('lodash');
const async = require('async');
const db_worker = require("./../util/db.js");
const s3thread = require("./../logic/s3upload");
const s3clean = require("./../logic/s3cleaner");
const easyship = require("./../shipping/easyship");
const shippo = require("./../shipping/shippo");
const ai_basemap = require("./../ai/basemap_action");
const loopback = require('loopback');
const ks_db_price_mgr = require("./../keystoneconnector/pricemanager");
const logTag = "> basemap.js model";
const result_bool = {
  acknowledged: true
};
const display_as_list = {
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
const display_single_owner = {
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
  shipping: true,
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
  // basemap.disableRemoteMethodByName("deleteById");
  basemap.disableRemoteMethodByName("updateAll");
  basemap.disableRemoteMethodByName("updateAttributes");
  basemap.disableRemoteMethodByName("createChangeStream");
  basemap.disableRemoteMethodByName("patchOrCreate");
  basemap.disableRemoteMethodByName("replaceOrCreate");
  basemap.disableRemoteMethodByName("replaceById");
  basemap.disableRemoteMethodByName("upsertWithWhere");
  basemap.createOptionsFromRemotingContext = function (ctx) {
    const base = this.base.createOptionsFromRemotingContext(ctx);
    //console.log("check createOptionsFromRemotingContext---");
    return Object.assign(base, {
      currentUserId: base.accessToken && base.accessToken.userId,
    });
  };
  /**
   * Throwing in an extra request on value in the filter object
   */
  basemap.observe('access', function (ctx, next) {
    if (!ctx.query.where) {
      ctx.query.where = {};
    }

    const isSingle = !_.isEmpty(ctx.query.where.id);
    const hasOwnerQuery = !_.isEmpty(ctx.query.where.owner);
    const ownerConfirmed = hasOwnerQuery ? ctx.options.currentUserId == ctx.query.where.owner : false;
    /*
     console.log("=============================================");
     console.log("access token get", ctx.options);
     console.log("=============================================");
     console.log("access token get active", ctx.active);
     console.log("=============================================");
     */

    /**
     * The query specific for getting the complete listing
     */
    if (!isSingle) {
      if (hasOwnerQuery) {
        // let str_id = ctx.query.where.owner;
        // let object_id = db_worker.patch_find_ensure_id(basemap, str_id);
        // ctx.query.where['owner'] = str_id;
        if (ownerConfirmed) {
          console.log("test ownership", "it is logined with the owner too");
        } else {
          ctx.query.where['complete'] = 100;
          ctx.query.where['listing.enabled'] = true;
        }
      } else {
        ctx.query.where['complete'] = 100;
        ctx.query.where['listing.enabled'] = true;
      }
      ensureVariableInteger(ctx, 'image_meta.material');
      ensureVariableInteger(ctx, 'image_meta.shape');
      ensureVariableInteger(ctx, 'image_meta.cat');
      ensureVariableInteger(ctx, 'image_meta.topic');
      ensureVariableInteger(ctx, 'image_meta.frame_width');
      ensureVariableInteger(ctx, 'image_meta.frame_shadow');
      ctx.query.fields = display_as_list;
    } else {
      ctx.query.fields = display_single_owner;
    }
    console.log("listing", "query starts================");
    ctx.query.order = "createtime DESC";
    next()
  });
  /*
   remotes.before('*.find', function (ctx, next) {
   console.log(log, "===============");
   const _filter = {};
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
    const currentLoginUserId = ctx.options.currentUserId;
    console.log("checkLogin", currentLoginUserId);

    if (ctx.instance) {
      /*  if (!_.isUndefined(ctx.instance.owner)) {
       const toString = new String(ctx.instance.owner);
       ctx.instance.owner = fixId.toObject(toString);
       }*/

      console.log("check data", ctx.instance);

      const owner = ctx.instance.owner;
      if (owner && typeof (owner) == 'string') {
        console.log("basemap owner id", typeof (owner), "need to be converted.");
        ctx.instance.owner = db_worker.patch_find_ensure_id(basemap, owner);
      }

      ctx.instance.updatetime = new Date();
      console.log("with instance");
    } else {
      /* if (!_.isUndefined(ctx.data.owner)) {
       const toString = new String(ctx.data.owner);
       ctx.data.owner = fixId.toObject(toString);
       }*/

      ctx.data.updatetime = new Date();
      console.log("without instance");
    }
    next();
  });

  basemap.observe('before delete', function (ctx, next) {
    //     const ctx=loopback.getCurrentContext();
    //     console.log('Going to delete %s matching %j', ctx.Model.pluralModelName, ctx.where);
    const basemapId = ctx.where['id'];
    const usr = basemap.app.models.user;
    db_worker.getInstanceById(basemap, basemapId, function (data) {
      //   console.log(logTag, '/-\-Remove item', data);
      const base_path = data.folder_base_name;
      if (data != null) {
        // console.log(logTag, '/-\-Start removing files from S3 folder');
        db_worker.updateByIdAndReduce(usr, data.owner, "uploads", function () {
          s3clean.remove_file_from_dest(base_path, function () {
            //console.log(logTag, '/-\-End removing files from S3 folder');
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
    const count_final = _count > 20 ? 20 : _count;
    const where_cond = {
      "listing.enabled": true
    };
    basemap.count(where_cond, function (err, number) {
      if (_.isError(err)) {
        return cb(err);
      }
      console.log("> get sample list with total items: ", number);
      const __skip = parseInt(Math.random() * (number - _count));

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
    const where_cond = {
      "owner": {
        "exists": true
      }
    };
    const where_cond2 = {
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
        const file_name = item.rename_file;
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

  basemap.admin_get_price_list = function (skip, limit, status_name, cb) {
    ks_db_price_mgr.listbystate(status_name, skip, limit, function (res) {
      cb(null, res);
    })
  };

  basemap.adminApprovePrice = function (sku, data, cb) {
    console.log("adminApprovePrice", data);
    ks_db_price_mgr.adminStatus(sku, data, function (res) {
      ks_db_price_mgr.get_price(sku, function (docc) {
        //console.log("docc object", docc);
        basemap.findOne({where: {id: sku}}, function (err, doc) {
          //console.log("find one object", doc);
          const unit = parseInt(docc.print_limit);
          doc.updateAttributes({
            "price": docc.estprice,
            "baseprice": docc.estprice,
            "license_price": docc.estlicenseprice,
            "print_limit": unit,
            "currency": doc.currency,
            "listing.sold_out": unit == 0,
            "listing.sold_license": false,
            "listing.monetize": true,
            "listing.searchable": true
          }, function (err, r) {
            cb(null, r);
          });
        });
      });
    });
  };

  basemap.shipping_eval_easyship = function (sku, cb) {
    easyship.check_rate_easyship(basemap, sku, cb);
  };

  basemap.pricemanager = function (stock_id, content, cb) {
    if (typeof content === 'function') {
      content = undefined;
    }
    if (_.isEmpty(content)) {
      cb(new Error("body is not found"), null);
    }
    ks_db_price_mgr.submit_deal(stock_id, content, function () {
      cb(null, result_bool);
    })
  };

  basemap.checkprice = function (stock_id, cb) {
    ks_db_price_mgr.get_price(stock_id, function (doc) {
      cb(null, doc);
    })
  };
  basemap.price_clean_up = function (cb) {
    ks_db_price_mgr.clean_price_record(basemap);
    cb(null, {known: true});
  };
  basemap.remoteMethod("price_clean_up", {
    description: ["Request action for running against the approval of listing process."],
    accepts: [],
    returns: {
      arg: "list_price", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/admin_price_cln"}
  });
  basemap.remoteMethod("admin_get_price_list", {
    description: ["Request action for running against the approval of listing process."],
    accepts: [
      {
        arg: "skip",
        type: "number",
        http: {source: "path"},
        required: true,
        description: "pagination skip items"
      },
      {
        arg: "limit",
        type: "number",
        http: {source: "path"},
        required: true,
        description: "pagination limit"
      },
      {
        arg: "status_name",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "status name"
      }
    ],
    returns: {
      arg: "list_price", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/adminpricelist/:skip/:limit/:status_name"}
  });
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

  basemap.remoteMethod("adminApprovePrice", {
    description: ["Request action for running against the approval of listing process."],
    accepts: [
      {
        arg: "sku",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "pagination skip items"
      },
      {
        arg: "data", type: "object", http: {source: "body"},
        required: true,
        description: "the new status in change"
      }
    ],
    returns: {
      arg: "list_price", type: "object", root: true, description: "Return value"
    },
    http: {verb: "post", path: "/adminpriceaction/:sku"}
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

  basemap.remoteMethod("shipping_eval_easyship", {
    description: ["Cron job to the list locally.."],
    accepts: [{
      arg: "sku",
      type: "string",
      http: {source: "path"},
      required: true,
      description: "Deal with the price model and its calculations"
    }],
    returns: {
      arg: "luckylist", type: "array", root: true, description: "Return value"
    },
    http: {verb: "post", path: "/shipping/rate/easyship/:sku"}
  });


  basemap.remoteMethod("pricemanager", {
    description: ["This is the submission of the suggestion price models .."],
    accepts: [
      {
        arg: "stock_uuid",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "Deal with the price model and its calculations"
      },
      {
        arg: "data", type: "object", http: {source: "body"},
        required: true,
        description: "The content of the deal details"
      }
    ],
    returns: {
      arg: "ret", type: "object", root: true, description: "Return value"
    },
    http: {verb: "post", path: "/pricemanager/:stock_uuid"}
  });

  basemap.remoteMethod("checkprice", {
    description: ["This is the submission of the suggestion price models .."],
    accepts: [
      {
        arg: "stock_uuid",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "Deal with the price model and its calculations"
      }
    ],
    returns: {
      arg: "ret", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/checkprice/:stock_uuid"}
  });

  /*

   remotes.after('*.find', function (ctx, next) {
   const filter;
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
   const currentDate = new Date();
   const currentHour = currentDate.getHours();
   const OPEN_HOUR = 6;
   const CLOSE_HOUR = 20;
   console.log('Current hour is ' + currentHour);
   const response;
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
