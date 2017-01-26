var _ = require('lodash');
var async = require('async');
var db_worker = require("./../util/db.js");
var s3thread = require("./../logic/s3upload");
var s3clean = require("./../logic/s3cleaner");
var ai_basemap = require("./../ai/basemap_action");
var loopback = require('loopback');
var pd = require("./../logic/preS3");
const logTag = "> basemap.js model";

module.exports = function (artist) {
  artist.disableRemoteMethodByName('create');
  artist.disableRemoteMethodByName('upsert');
  artist.disableRemoteMethodByName("deleteById");
  artist.disableRemoteMethodByName("updateAll");
  artist.disableRemoteMethodByName("updateAttributes");
  artist.disableRemoteMethodByName("createChangeStream");
  artist.disableRemoteMethodByName("patchOrCreate");
  artist.disableRemoteMethodByName("replaceOrCreate");
  artist.disableRemoteMethodByName("replaceById");
  artist.disableRemoteMethodByName("upsertWithWhere");

  artist.remoteMethod(
    "update_artist_info",
    {
      description: ["post the artist information about the artist bio"],
      accepts: [
        {arg: "data", type: "array", http: {source: "body"}, required: true, description: "document in json"},
        {arg: "id", type: "string"}
      ],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      http: {verb: "post", path: "/update/:id"}
    }
  );

  artist.update_artist_info = function (data, user_id, fn) {
    if (typeof data === "function") {
      data = undefined;
    }

    if (pd.l.isArray(data)) {
   /*   pd.async.eachSeries(data, function (d, next) {
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
      });*/

      fn(null, output.outAcknowledgePositive());
    } else {
      fn(new Error("type error from content data post"));
    }
  };
};
