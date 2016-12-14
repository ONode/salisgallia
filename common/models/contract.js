/**
 * Created by hesk on 16年12月9日.
 */
var async = require('async');
var contract_process = require("./../logic/contract_process");
var pre = require("./../logic/preS3");
const logTag = "> basemap.js model";
module.exports = function (contract) {
  contract.observe('after save', function (ctx, next) {
    if (ctx.instance) {
      var id = ctx.instance.userId;
      ctx.instance.updateAttribute("userId", pre.makeId(contract, id), function (callback) {
        console.log('update after save');
        next();
      });
    } else {
      next();
    }
  });
  contract.by_user = function (user_id, cb) {
    contract_process.list_contracts(contract, user_id, cb);
  };
  contract.sell_ready = function (user_id, cb) {
    contract_process.approved_can_sell_now(contract, user_id, cb);
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

  contract.remoteMethod("sell_ready", {
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
    http: {verb: "get", path: "/sell_ready/:user_id"}
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
