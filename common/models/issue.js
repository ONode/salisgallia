// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
const loopback = require('loopback');
const _ = require('lodash');
const db_worker = require("./../util/db.js");
const s3_worker = require("./../logic/s3upload");
const output = require("./../util/outputjson");
const log = "> basemap op";
const LoopBackContext = require('loopback-context');
/*MyIssue = loopback.Model.extend('Issue');
 MyIssue.on('myEvent', function() {
 console.log('meep meep!');
 });
 MyIssue.setup = function() {
 const MyModel = this;
 // since setup is called for every extended model
 // the extended model will also have the event listener
 MyIssue.on('myEvent', function() {
 MyModel.printModelName();
 });
 };*/
module.exports = function (Issue) {


  Issue.disableRemoteMethodByName('upsert');
  Issue.disableRemoteMethodByName("deleteById");
  Issue.disableRemoteMethodByName("updateAll");
  Issue.disableRemoteMethodByName("updateAttributes");
  Issue.disableRemoteMethodByName("createChangeStream");

  Issue.disableRemoteMethodByName("patchOrCreate");
  Issue.disableRemoteMethodByName("replaceOrCreate");
  Issue.disableRemoteMethodByName("replaceById");
  Issue.disableRemoteMethodByName("upsertWithWhere");
  Issue.setup = function () {
    const MyModel = this;
    // since setup is called for every extended model
    // the extended model will also have the event listener
    Issue.on('myEvent', function () {
      MyModel.printModelName();
    });
  };

  Issue.on('myEvent', function () {
    console.log('meep meep!');
  });

  Issue.observe('before save', function (ctx, next) {
    // const ctx = LoopBackContext.getCurrentContext();
    //console.log(ctx);
    if (_.isEmpty(ctx.instance)) {
      console.log('> no query body found ...');
      next();
      return;
    }
    //  console.log(ctx.app);
    // console.log("> =======================");
    // console.log(ctx.args);
    if (_.isEmpty(ctx.instance.subject_id) || _.isEmpty(ctx.instance.from_agent_id)) {
      console.log('> data is not complete ...');
      return;
    }
    //console.log(ctx.instance.violation_code);
    Issue.findOne({
      where: {
        subject_id: ctx.instance.subject_id,
        from_agent_id: ctx.instance.from_agent_id
      }
    }, function (err, item) {
      if (_.isEmpty(item)) {
        console.log('> item not found ...');
        next();
      } else {
        console.log('> item found and update...');
        item.updateAttribute("violation_code", ctx.instance.violation_code, function (err, ins) {
          console.log('> item updated ', ins);
          next();
        });
      }
    });
  });


  const remove_tickets_related = function removeAllIssues(subject_id, fn) {
    Issue.destroyAll({subject_id}, function (err, info) {
      if (_.isError(err)) {
        console.log("remove error found:", err);
        fn(err, null);
      }
      console.log("remove done:");
      fn(null, info);
    });
  };

  Issue.resolve_issue = function (data, fn) {
    if (typeof data === 'function') {
      data = undefined;
    }
    const _bmp = loopback.getModel("Basemap");
    const actiontaken = parseInt(data["actiontaken"]),
      confirmations = data["violation_code"],
      verify = data["verify"],
      subject_id = data["subject_id"],
      from_agent_id = data["from_agent_id"];

    if (actiontaken == 601) {
      /* Remove all items based on 1. subject id */
      console.log("notified - Remove all items based on ID:", subject_id);

      _bmp.findById(subject_id, function (err, ins) {
        console.log("found item for:", subject_id);
        ins.updateAttributes({
          "listing.enabled": false,
          "listing.violations": confirmations
        }, function (err, ins) {
          if (_.isError(err)) {
            fn(err, null);
          }
          console.log("removing items for:", subject_id);
          remove_tickets_related(subject_id, fn)
        });
      });

    } else if (actiontaken == 602) {
      console.log("notified - Approve all of them and enable the listing:", subject_id);
      _bmp.findById(subject_id, function (err, ins) {
        ins.updateAttributes({
          "listing.enabled": true,
          "listing.violations": []
        }, function (err, ins) {
          if (_.isError(err)) {
            fn(err, null);
          }
          remove_tickets_related(subject_id, fn)
        });
      });

    } else if (actiontaken == 603) {
      //there
      fn(new Error("no action is taken 603"), null);
    } else {
      fn(new Error("no action is taken"), null);
    }
  };

  Issue.remoteMethod("resolve_issue", {
    description: ["Update resolved issue with the document.."],
    accepts: [
      {
        arg: "data", type: "object", http: {source: "body"},
        required: true,
        description: "when the admin resolve an issue"
      }
    ],
    returns: {
      arg: "success", type: "object", root: true, description: "Return value"
    },
    http: {verb: "post", path: "/resolve_issue"}
  });

  //https://github.com/strongloop/loopback-example-user-management/blob/master/common/models/user.js
};
/*

 {
 "violation_code": [10,203,13],
 "from_agent_type":"user",
 "subject_type": "basemap",
 "subject_id":"57cec24268ceeb0300e87a5d",
 "additional": "--",
 "from_agent_id":"579f3377f898303787a52577",
 }


 */
