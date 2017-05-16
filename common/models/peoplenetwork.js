/**
 * Created by hesk on 16/5/2017.
 */

"use strict";
const loopback = require('loopback');
const _ = require('lodash');
const db_worker = require("./../util/db.js");
const pd = require("./../logic/preS3");
const output = require("./../util/outputjson");
const logTag = ">OrderOp";
const LoopBackContext = require('loopback-context');
const
  ACTION_T_VIEW_ARTWORK = 4,
  ACTION_T_FOLLOW_PERSON = 5,
  ACTION_T_INVEST_FULL_ARTWORK = 2,
  ACTION_T_TRAVEL_WITH = 3;
const result_bool = {
  acknowledged: true
};
module.exports = function (Pl) {

  /*
   var query = 'select table_schema, column_name, data_type,' +
   ' character_maximum_length, column_default ' +
   "from information_schema.columns where table_name = 'postincustomschema'" +
   " and column_name='created'";
   const query = "SELECT * FROM people_net.pl_network WHERE user_from='" + frm + "' AND user_to='" + sbjt + "' AND action_type=" + ACTION_T_VIEW_ARTWORK + "";

   const db = Pl.dataSources.psql_pl_re;

   db.connector.execute(query, function (err, results) {
   console.log("--> add_relation_view this", results);
   cb(null, result_bool);
   });
   */
  const display_user_meta = {
    id: true,
    name: true,
    role: true,
    uploads: true,
    country: true,
    photo: true
  };
  Pl.redonlist = function (sbjt, cb) {
    const user = Pl.app.models.user;
    const _src_bundle = {
      subjectTo: sbjt,
      actionType: ACTION_T_VIEW_ARTWORK
    };
    Pl.find({
      where: _src_bundle,
      order: "count DESC",
      skip: 0,
      limit: 10
    }, function (err, recs) {
      let jm = [];
      pd.async.eachSeries(recs, function (pg, next) {
        user.findById(pg.userFrom, {fields: display_user_meta}, function (err, userd) {
          if (err || userd == null) {
            next();
          } else {
            jm.push(Object.assign(userd, {count: parseInt(pg.count)}));
            next();
          }
        });
      }, function (next_done) {
        cb(null, jm);
      });
    });
  };
  Pl.radrelview = function (frm, sbjt, cb) {
    const _src_bundle = {
      userFrom: frm,
      subjectTo: sbjt,
      actionType: ACTION_T_VIEW_ARTWORK
    };
    //  console.log("--> add_relation_view this", _src_bundle);
    Pl.find({where: _src_bundle}, function (err, rec) {
      if (err) {
        console.log("--> error from this");
        cb(null, result_bool);
      } else {
        // console.log("-->result ", rec);
        if (rec.length === 0) {
          //   console.log("--> new from this");
          Pl.create(_src_bundle, function (err, rec) {
            cb(null, result_bool);
          });
        } else {
          //console.log("--> items:: ");
          const item = rec[0],
            new_count = parseInt(item.count) > 0 ? parseInt(item.count) + 1 : 1;
          item.updateAttributes({count: new_count}, function (err, counts) {
            //  console.log("--> update action counts ::", new_count);
            cb(null, result_bool)
          });
        }
      }
    });
  };
  Pl.remoteMethod("redonlist", {
    description: "report the top 10 users from visiting this painting",
    accepts: [
      {
        arg: "sbjt",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "to a subject ID, that could be a person or an object"
      }
    ],
    returns: {
      arg: "ret", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/sub/:sbjt"}
  });
  Pl.remoteMethod("radrelview", {
    description: "report the visitor to seeing the artwork in the statistics",
    accepts: [
      {
        arg: "frm",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "from a user ID"
      },
      {
        arg: "sbjt",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "to a subject ID, that could be a person or an object"
      }
    ],
    returns: {
      arg: "ret", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/si/:frm/:sbjt"}
  });

};
