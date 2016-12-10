/**
 * Created by hesk on 16年12月9日.
 */
var _ = require('lodash');
var async = require('async');
var contract_process = require("./../logic/contract_process");
const logTag = "> basemap.js model";
/*
var result_bool = {
  acknowledged: true
};
*/
module.exports = function (contract) {
 /* contract.construct_contract = function (user_id, data, cb) {
    if (typeof data === 'function') {
      data = undefined;
    }
    var
      contract_type = data["contract_type"],
      context = LoopBackContext.getCurrentContext();

    console.log(context);

  };*/

  contract.by_user = function (user_id, cb) {
    var where_cond = {
      "userId": user_id
    };
    contract.find({
      where: where_cond,
      order: "createtime DESC",
      limit: 5,
      skip: 0
    }, function (err, results) {
      if (_.isError(err)) {
        return cb(err);
      }
      contract.count(where_cond, function (err, number) {
        console.log(logTag, ">> How many does it count? ", number);
      });
      cb(null, results);
    });
    //fixId.fixIddb(basemap, "owner");
    //cb(null, result_bool);
  };
  contract.remoteMethod("by_user", {
    description: ["Construct the certificate from given ids."],
    accepts: [
      {
        arg: "user_id",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "check with user id"
      }
    ],
    returns: {
      arg: "luckylist", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/by_user/:user_id"}

  });
  /*contract.remoteMethod("construct_contract", {
    description: ["Construct the certificate from given ids."],
    accepts: [
      {
        arg: "user_id",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "the user id gain contract certificate"
      },
      {
        arg: "data", type: "object", http: {source: "body"},
        required: true,
        description: "when the admin resolve an issue"
      },
      {arg: 'req', type: 'object', 'http': {source: 'req'}},
      {arg: 'res', type: 'object', 'http': {source: 'res'}}
    ],
    returns: {
      arg: "luckylist", type: "object", root: true, description: "Return value"
    },
    http: {verb: "post", path: "/construct_contract/:user_id"}
  });*/
};
