/**
 * Created by hesk on 17年2月7日.
 */
const l = require("lodash");
const ks_db = require("./connector")(process.env.MLAB_M3, "artists");
module.exports = {
  update_artist: function (stock_id, content, callback) {
    ks_db.insertOrUpdate(stock_id, l.merge({
        key: stock_id,
        state: "pending",
        currency: "USD",
        stock_full_id: stock_id,
        factory_shared: -1,
        printed_shared: -1,
        price: -1,
        estprice: -1,
        license_price: -1,
        print_limit: -1
      }, content),
      function (res) {
        console.log("item", res);
        callback();
      });
  },
  get_artist_single: function (stock_id, callback) {
    ks_db.find(stock_id,
      function (res) {
        callback(res);
      });
  },
  ListPublic: function (queryObjectContex, callback) {
    ks_db.lbQueryLooper(queryObjectContex, {
      state: "proved_publish"
    }, function (err, res) {
      callback(err, res);
    });
  }
};
