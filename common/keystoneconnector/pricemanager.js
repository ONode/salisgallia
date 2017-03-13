/**
 * Created by hesk on 17年2月6日.
 */
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
  get_price: function (stock_id, callback) {
    ks_db_pricemgr.find(stock_id,
      function (res) {
        callback(res);
      });
  }
};
