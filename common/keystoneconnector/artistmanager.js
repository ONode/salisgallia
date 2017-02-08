/**
 * Created by hesk on 17年2月7日.
 */
const l = require("lodash");
const ks_db = require("./connector")(process.env.MLAB_M3, "artists");
module.exports = {
  update_artist: function (artist_id, content, callback) {
    ks_db.insertOrUpdate(artist_id, l.merge({
        key: artist_id,
        state: "pending"
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
