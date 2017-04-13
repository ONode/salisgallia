/**
 * Created by hesk on 17年2月6日.
 */
"use strict";
const l = require("lodash");
const ks_db_pricemgr = require("./connector")(process.env.MLAB_M3, "pricings");
module.exports = {
  submit_deal: function (stock_id, content, callback) {
    const after_merge = l.merge({
      key: stock_id,
      state: "pending",
      currency: "USD",
      stock_full_id: stock_id,
      license_price: -1,
      print_limit: -1
    }, content);
    //console.log("merge_test", after_merge);
    ks_db_pricemgr.insertOrUpdate(stock_id, after_merge,
      function (res) {
        callback();
      });
  },
  adminStatus: function (sku, statusName, cb) {
    ks_db_pricemgr.updateOnly(sku, {status: statusName}, cb);
  },
  list_pending_deals: function (skip, limit, callback) {
    ks_db_pricemgr.findFromPagination({
      state: "pending"
    }, skip, limit, function (res) {
      callback(res);
    });
  },
  get_price: function (stock_id, callback) {
    ks_db_pricemgr.find(stock_id,
      function (res) {
        callback(res);
      });
  }
};
