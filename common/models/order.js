// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
"use strict";
const loopback = require('loopback');
const _ = require('lodash');
const db_worker = require("./../util/db.js");
const pd = require("./../logic/preS3");
const output = require("./../util/outputjson");
const logTag = ">OrderOp";
const LoopBackContext = require('loopback-context');
const
  ORIGINAL_WORK = 1001,
  LIMITED_AI_WORK = 1006,
  ORIGINAL_WORK_ANDROID = 2,
  LIMITED_COPY_FROM_ORIGINAL_ANDROID = 3,
  LIMITED_COPY_CANVAS_FROM_ORIGINAL_ANDROID = 4,
  PRODUCT_WOODWORK = 5000,
  LIMITED_COPY_FROM_ORIGINAL = 1005;

module.exports = function (Order) {
  Order.disableRemoteMethodByName('create');
  Order.disableRemoteMethodByName('upsert');
  Order.disableRemoteMethodByName("deleteById");
  Order.disableRemoteMethodByName("updateAll");
  Order.disableRemoteMethodByName("updateAttributes");
  Order.disableRemoteMethodByName("createChangeStream");
  Order.disableRemoteMethodByName("patchOrCreate");
  Order.disableRemoteMethodByName("replaceOrCreate");
  Order.disableRemoteMethodByName("replaceById");
  Order.disableRemoteMethodByName("upsertWithWhere");

  const processOrderP1 = function (modelInstance, liveMode, ptype, stock_uuid, next) {
    if (liveMode) {
      console.log("live mode is started now");
      if (ptype == ORIGINAL_WORK || ptype == ORIGINAL_WORK_ANDROID) {
        db_worker.updateByIdUpdate(modelInstance, stock_uuid, {
          "listing.sold_license": true
        }, next);
      } else if (ptype == LIMITED_COPY_FROM_ORIGINAL) {
        //TODO: sold out with the limited items only
        db_worker.updateByIdUpdate(modelInstance, stock_uuid, {
          "listing.sold_out": false
        }, next);
      } else {
        console.log(logTag, 'error occurred from verification of the order [product type]:', ptype);
        next();
      }
    } else {
      next();
    }
  };

  Order.post_order_notification = function (data, user_id, fn) {
    if (typeof data === "function") {
      data = undefined;
    }
    console.log("> order post from confirmation =======");
    const basemap = Order.app.models.Basemap;
    if (pd.l.isArray(data)) {
      console.log("> ====================================");
      pd.async.eachSeries(data, function (d, next) {
        const _recorded = new Date;
        d.userID = user_id;
        db_worker.getInstanceById(basemap, d.stock_uuid, function (bm_data) {
          d.sellerId = bm_data.owner;
          d.buyerId = user_id;
          const mOrder = new Order(d);
          console.log("order now");
          processOrderP1(basemap, d.is_live_mode, d.product_type, d.stock_uuid, function () {
            mOrder.save(function (err, doc) {
              console.log("save items");
              if (err) {
                console.log(logTag, "save order error", err);
                return next(err);
              } else {
                console.log(logTag, "save order success", doc.id);
                return next();
              }
            });
          });
        }, function (err) {
          console.log(logTag, 'error occurred from verification of the order.', err);
          next();
        });
      }, function (next_done) {
        fn(null, output.outAcknowledgePositive());
      });
    } else {
      fn(new Error("type error from content data post"));
    }
  };

  Order.remoteMethod(
    "post_order_notification",
    {
      description: ["post the transaction order from the payment gateway"],
      accepts: [
        {arg: "data", type: "array", http: {source: "body"}, required: true, description: "document in json"},
        {arg: "id", type: "string"}
      ],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      http: {verb: "post", path: "/confirmed/:id"}
    }
  );




  //https://github.com/strongloop/loopback-example-user-management/blob/master/common/models/user.js
};
/** sample in here
 product_type: 2 -

 [
 {
   "source_network_id":"ch_foeni324",
   "amount_in_cent":389283,
   "unit":2,
   "currency_type":"usd",
   "stock_uuid":"324789sdf98sd",
   "device_order_uuid":"234gert3434",
   "detail_customization":"oisjdfijsio_eiofj32o982\nsfiosr\nodkfoskef",
   "product_type":2,
   "is_live_mode":"false"

 }]

 **/
