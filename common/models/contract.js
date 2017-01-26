/**
 * Created by hesk on 16年12月9日.
 */
var async = require('async');
var contract_process = require("./../logic/contract_process");
var pre = require("./../logic/preS3");
const logTag = "> basemap.js model";
module.exports = function (contract) {

  contract.disableRemoteMethodByName('upsert');
  contract.disableRemoteMethodByName("deleteById");
  contract.disableRemoteMethodByName("updateAll");
  contract.disableRemoteMethodByName("updateAttributes");
  contract.disableRemoteMethodByName("createChangeStream");

  contract.disableRemoteMethodByName("patchOrCreate");
  contract.disableRemoteMethodByName("replaceOrCreate");
  contract.disableRemoteMethodByName("replaceById");
  contract.disableRemoteMethodByName("upsertWithWhere");

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
  /**
   * the user usually making it work
   * @param user_id the user id
   * @param cb the call back
   */
  contract.by_user = function (user_id, cb) {
    contract_process.list_contracts(contract, user_id, cb);
  };
  /**
   * to confirm if the item is ready for sale
   * @param user_id user id
   * @param cb call back
   */
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
    description: ["Answer whether this user can make sell of artworks."],
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

  /**
   * document
   * status
   * 101 - ready for public sale
   * 102 - not for public sale
   * 103 - sold not price shall be listed
   * 104 - reserved for private sale during the period
   * 105 - scheduled for private sale
   */
};
