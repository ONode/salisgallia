/**
 * Created by hesk on 16年12月15日.
 */

const
  logTag = '> contract process',
  pres3 = require("./../logic/preS3"),
  __parentDir = require('app-root-path'),
  numCPUs = require('os').cpus.length,
  uuid = require('node-uuid'),
  multia = require('multer');


module.exports.request_action_for_sale = function (instance_basemap, item_id, cb) {
  // var basemaps = instance_basemap;
  // var basemaps = instance_contract.app.models.Basemap;
  var approved = false;
  instance_basemap.findOne({where: {id: item_id}}, function (err, doc) {

    if (pres3.l.isArray(doc.listings.violations)) {
      if (doc.listings.violations.length > 0) {
        approved = false;
      } else {
        approved = true;
      }
    } else {
      approved = true;
    }

    if (pres3.l.isInteger(doc.baseprice)) {
      if (doc.baseprice > 0) {
        approved = true;
      } else {
        approved = false;
      }
    } else {
      approved = false;
    }

    if (approved) {
      /**
       * only allow to make sales
       */
      doc.updateAttributes({
        "listing.status": 101,
        "listing.meta_ready": true,
        "listing.searchable": true
      }, function (err, r) {
        if (pres3.l.isFunction(cb)) {
          cb(null, pres3.positive_result);
        }
      });
    } else {
      /**
       * this is the negative side of the result
       */
      cb(null, pres3.negative_result);
    }
  });
};
