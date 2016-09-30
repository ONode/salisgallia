// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
var loopback = require('loopback');
var _ = require('lodash');
var db_worker = require("./../util/db.js");
var s3_worker = require("./../logic/transferS3");
var output = require("./../util/outputjson");
const log = "> basemap op";
var LoopBackContext = require('loopback-context');
/*MyIssue = loopback.Model.extend('Issue');
 MyIssue.on('myEvent', function() {
 console.log('meep meep!');
 });
 MyIssue.setup = function() {
 var MyModel = this;
 // since setup is called for every extended model
 // the extended model will also have the event listener
 MyIssue.on('myEvent', function() {
 MyModel.printModelName();
 });
 };*/
module.exports = function (Issue) {
  Issue.setup = function () {
    var MyModel = this;
    // since setup is called for every extended model
    // the extended model will also have the event listener
    MyIssue.on('myEvent', function () {
      MyModel.printModelName();
    });
  };

  Issue.on('myEvent', function () {
    console.log('meep meep!');
  });

  Issue.observe('before save', function (ctx, next) {
    // const cctx = LoopBackContext.getCurrentContext();
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

  Issue.resolve_issue = function (data, fn) {
    if (typeof data === 'function') {
      data = undefined;
    }

    var actiontaken = parseInt(data["actiontaken"]),
      confirmations = data["violation_code"],
      verify = data["verify"],
      subject_id = data["subject_id"],
      from_agent_id = data["from_agent_id"];

    if (actiontaken == 601) {
      /*
       Remove all items based on
       1. subject id
       */
      var basemap = loopback.getModel("Basemap");
      basemap.findById(subject_id, function (err, ins) {
        ins.updateAttributes({
          "listing.enabled": false,
          "listing.violations": confirmations
        }, function (err, ins) {
          if (_.isError(err)) {
            fn(err, null);
          }
          Issue.destroyAll({
            subject_id: subject_id
          }, function (err, info) {
            if (_.isError(err)) {
              fn(err, null);
            }
            fn(null, info);
          });
        });
      });

    } else if (actiontaken == 602) {
      //there
      fn(new Error("no action is taken 602"), null);
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
