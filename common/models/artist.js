"use strict";
const async = require('async');
const db_worker = require("./../util/db.js");
const output = require("./../util/outputjson");
const loopback = require('loopback');
const pd = require("./../logic/preS3");
const logTag = "> basemap.js model";
const ks_db_artist = require("./../keystoneconnector/artistmanager");
const remotepagination = require("./../../server/middleware/pagination");
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

  artist.create_artist = function (data, user_id, fn) {
    if (typeof data === "function") {
      data = undefined;
    }
    ks_db_artist.insertOrUpdate(null, pd.l.merge({
      user: user_id
    }, data), fn);
  };
  artist.update_artist_info_single = function (data, user_id, artist_id, fn) {
    ks_db_artist.insertOrUpdate(artist_id, data, function (res) {
      fn(null, output.outAcknowledgePositive());
    });
  };
  artist.update_artist_info_batch = function (data, user_id, artist_id, fn) {
    if (typeof data === "function") {
      data = undefined;
    }
    if (pd.l.isArray(data)) {
      ks_db_artist.insertOrUpdate(artist_id, data, function (res) {
        fn(null, output.outAcknowledgePositive());
      });
    } else {
      fn(new Error("type error from content data post"));
    }
  };
  artist.listitems = function (queryContext, cb) {
    if (pd.l.isObject(queryContext)) {
      ks_db_artist.ListPublic(queryContext, function (err, output_data) {
        if (err) {
          cb(err, null);
        } else {
          cb(null, output_data);
        }
      });
    } else {
      cb(new Error("type error from content data get"));
    }
  };
  artist.afterRemote('listitems', function (context, remoteMethodOutput, next) {
    remotepagination.paginationKs(context, function () {
      next();
    });
  });
  artist.remoteMethod(
    "listitems",
    {
      description: ["list out the artists"],
      accepts: [{
        arg: "query",
        type: "object",
        http: function (context) {
          //    var expressReq = context.req;
          return context;
        }
      }],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      http: {verb: "get", path: "/list"}
    }
  );
  artist.remoteMethod(
    "detailitem",
    {
      description: ["get info from single detail artist"],
      accepts: [
        {arg: "artist_id", type: "string"}
      ],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      http: {verb: "get", path: "/detail/:artist_id"}
    }
  );
  artist.remoteMethod(
    "update_artist_info_batch",
    {
      description: ["post the artist information about the artist bio"],
      accepts: [
        {arg: "data", type: "array", http: {source: "body"}, required: true, description: "document in json"},
        {arg: "id", type: "string"},
        {arg: "artist_id", type: "string"}
      ],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      http: {verb: "post", path: "/updatebatch/:id"}
    }
  );
  artist.remoteMethod(
    "create_artist",
    {
      description: ["post new artist information about the artist bio"],
      accepts: [
        {arg: "data", type: "object", http: {source: "body"}, required: true, description: "document in json"},
        {arg: "id", type: "string"}
      ],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      http: {verb: "post", path: "/newartist/:id"}
    }
  );
  artist.remoteMethod(
    "update_artist_info_single",
    {
      description: ["post new artist information about the artist bio"],
      accepts: [
        {arg: "data", type: "object", http: {source: "body"}, required: true, description: "document in json"},
        {arg: "id", type: "string"},
        {arg: "artist_id", type: "string"}
      ],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      http: {verb: "post", path: "/update/:id/:artist_id"}
    }
  );
};
