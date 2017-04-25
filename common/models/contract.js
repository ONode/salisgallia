/**
 * Created by hesk on 16年12月9日.
 */
"use strict";
const async = require('async');
const contract_process = require("./../logic/contract_process");
const pre = require("./../logic/preS3");
const logTag = "> basemap.js model";
const result_bool = {
  acknowledged: true
};
module.exports = function (Contrax) {
  Contrax.disableRemoteMethodByName('create');
  Contrax.disableRemoteMethodByName('upsert');
  Contrax.disableRemoteMethodByName("updateAll");
  Contrax.disableRemoteMethodByName("deleteById");
  Contrax.disableRemoteMethodByName("updateAttributes");
  Contrax.disableRemoteMethodByName("createChangeStream");
  Contrax.disableRemoteMethodByName("patchOrCreate");
  Contrax.disableRemoteMethodByName("replaceOrCreate");
  Contrax.disableRemoteMethodByName("replaceById");
  Contrax.disableRemoteMethodByName("upsertWithWhere");

  Contrax.observe('after save', function (ctx, next) {
    if (ctx.instance) {
      const id = ctx.instance.userId;
      ctx.instance.updateAttribute("userId", pre.makeId(Contrax, id), function (callback) {
        console.log('update after save');
        next();
      });
      console.log('update after save');
      //next();
    } else {
      next();
    }
  });
  /**
   * the user usually making it work
   * @param user_id the user id
   * @param cb the call back
   */
  Contrax.by_user = function (user_id, cb) {
    contract_process.list_contracts(Contrax, user_id, cb);
  };
  /**
   * to confirm if the item is ready for sale
   * @param user_id user id
   * @param cb call back
   */
  Contrax.sell_ready = function (user_id, cb) {
    contract_process.approved_can_sell_now(Contrax, user_id, cb);
  };

  Contrax.licensed = function (user_id, cb) {
    Contrax.find({where: {userId: user_id}, limit: 20, order: "createtime DESC"}, (err, list) => {
      if (err) {
        cb(err, null);
        return;
      }
      let triggered = false;
      pre.l.forEach(list, function (item, i) {
        if (item.status && item.status == 1) {
          triggered = true;
          cb(null, {
            licensed: true
          });
          return false;
        }
      });
      if (!triggered) {
        cb(null, {
          licensed: false
        });
      }
    });
  };
  /**
   *
   * @param cid Contrax id
   * @param b request body
   * @param cb callback
   */
  Contrax.admin_action = function (cid, b, cb) {
    Contrax.findById(cid, {}, function (err, oneDoc) {
      if (err) cb(err, null);
      // console.log("update what now", oneDoc, b.actionCode);
      if (b.actionCode) {
        oneDoc.updateAttributes({
          "status": b.actionCode,
          "updatetime": new Date()
        }, function (err, r) {
          if (err) cb(err, null);
          //   console.log("update success", r);
          cb(null, result_bool);
        });
      } else {
        cb("cannot complete this request");
      }
    })
  };
  Contrax.remoteMethod("by_user", {
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

  Contrax.remoteMethod("licensed", {
    description: ["Request of query for a user having the license to issue the price or not."],
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
      arg: "n", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/licensed/:user_id"}
  });

  Contrax.remoteMethod("sell_ready", {
    description: ["Answer whether this user can make sell of artworks. depreciated as of 2017/3"],
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

  Contrax.remoteMethod("admin_action", {
    description: ["Construct the certificate from given ids."],
    accepts: [
      {
        arg: "contractId",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "Id of the Contrax pending certificate"
      },
      {
        arg: "data", type: "object", http: {source: "body"},
        required: true,
        description: "what to do in admin action"
      },
      // {arg: 'req', type: 'object', 'http': {source: 'req'}},
      // {arg: 'res', type: 'object', 'http': {source: 'res'}}
    ],
    returns: {
      arg: "actioncomplete", type: "object", root: true, description: "Return value"
    },
    http: {verb: "post", path: "/action/:contractId"}
  });

  /**
   * document
   * status
   * 101 - ready for public sale
   * 102 - it is not for public sale
   * 103 - sold not price shall be listed
   * 104 - reserved for private sale during the period
   * 105 - scheduled for private sale
   */
};
