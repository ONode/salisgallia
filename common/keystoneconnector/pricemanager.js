/**
 * Created by hesk on 17年2月6日.
 */
"use strict";
const l = require("lodash");
const pd = require("./../logic/preS3");
const ks_db_pricemgr = require("./connector")(process.env.MLAB_M3, "pricings");
module.exports = {
  /**
   * the price is provided by the customers
   * @param stock_id the stock id
   * @param content the content
   * @param callback the callback is now
   */
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
  adminStatus: function (sku, data, cb) {
    ks_db_pricemgr.updateOnly(sku, {
      state: data.state,
      estlicenseprice: parseInt(data.estlicenseprice),
      estprice: parseInt(data.estprice)
    }, cb);
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
  },
  clean_price_record: function (basemap) {
    const on_result = function (err, results, q) {
      console.log("price q", q);
      let took_actions = 0;
      pd.async.eachSeries(results, function (d, next) {
        const d_od = d._id;
        basemap.findOne({where: {id: d_od}}, function (err, d) {
          if (d === null || d === {}) {
            ks_db_pricemgr.removeById(d_od, function (e) {
              console.log("bulk", "remove by id not exists");
              took_actions++;
              next();
            });
          } else {
            if (!d.listing.enabled) {
              ks_db_pricemgr.removeById(d_od, function (e) {
                console.log("bulk", "removed by enabled - false");
                took_actions++;
                next();
              });
            } else
              next();
          }
        });
      }, function (nextDone) {
        const isLastPage = q.limit > q.result.count;
        const skip_start = q.limit - took_actions;
        console.log("bulk", "isLastPage", isLastPage);
        if (!isLastPage) {
          ks_db_pricemgr.lbloopget({
            limit: 50,
            skip: skip_start,
            result: {
              count: 0,
              page: 0
            }
          }, on_result);
        }
      });
    };

    ks_db_pricemgr.lbloopget({
      limit: 50,
      skip: 0,
      result: {
        count: 0,
        page: 0
      }
    }, on_result);

  }
};
