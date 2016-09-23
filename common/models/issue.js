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
  Issue.setup = function() {
    var MyModel = this;
    // since setup is called for every extended model
    // the extended model will also have the event listener
    MyIssue.on('myEvent', function() {
      MyModel.printModelName();
    });
  };

  Issue.on('myEvent', function() {
    console.log('meep meep!');
  });

  Issue.observe('before save', function (ctx_old, next) {

    const ctx = LoopBackContext.getCurrentContext();
    console.log('> before save LoopBackContext...');
    console.log(ctx);
   // console.log('> before save Old Context...');
  //  console.log(ctx_old);
    //console.log(LoopBackContext);
    //LoopBackContext.args.data.create = Date.now();
    //LoopBackContext.res.render('response', output.dataResponse("done", LoopBackContext.args.data));
    console.log('> remote save item ticket issue now...');
    next();
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
