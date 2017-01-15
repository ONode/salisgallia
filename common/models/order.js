// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
var loopback = require('loopback');
var _ = require('lodash');
var db_worker = require("./../util/db.js");
var pd = require("./../logic/preS3");
var output = require("./../util/outputjson");
const logTag = ">OrderOp";
var LoopBackContext = require('loopback-context');

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
  Order.post_order_notification = function (data, user_id, fn) {
    if (typeof data === "function") {
      data = undefined;
    }
    console.log("> ====================================");
    console.log("> order post from confirmation =======");

    /*   console.log(typeof data);
     console.log(user_id);
     console.log(data);*/

    console.log("> ====================================");
    if (pd.l.isArray(data)) {
      pd.async.eachSeries(data, function (d, next) {
        var _recorded = new Date;

        d.userID = user_id;
        var mOrder = new Order(d);
        mOrder.save(function (err, doc) {
          if (err) {
            console.log(logTag, "save order error", err);
            return next(err);
          } else {
            console.log(logTag, "save order success", doc.id);
            return next();
          }
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


 [
 {
   "source_network_id":"ch_foeni324",
   "amount_in_cent":389283,
   "unit":2,
   "currency_type":"usd",
   "stock_uuid":"324789sdf98sd",
   "device_order_uuid":"234gert3434",
   "detail_customization":"oisjdfijsio jeiofj32o982\nsfiosr\nodkfoskef",
   "product_type":2,
   "is_live_mode":"false"

 }]

 **/
