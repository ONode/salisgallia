/**
 * Created by hesk on 16年12月9日.
 */
var _ = require('lodash');
var db_worker = require("./../util/db.js");
var async = require('async');
var s3thread = require("./../logic/s3upload");
var s3clean = require("./../logic/s3cleaner");
var fixId = require("./../logic/db_patch");
const logTag = "> basemap.js model";
var result_bool = {
  acknowledged: true
};
/*
 var k = function () {
 var StorageContainer = user.app.models.container;
 StorageContainer.getContainers(function (err, containers) {
 if (containers.some(function (e) {
 return e.name == user_id;
 })) {
 StorageContainer.upload(req, res, {
 container: user_id,
 getFilename: renamefiles
 }, function (err, result) {
 //  console.log("update", result);
 profile_pic.profile_upload_s3(result, user, cb);
 });
 } else {
 StorageContainer.createContainer({name: user_id}, function (err, c) {
 StorageContainer.upload(req, res, {
 container: c.name,
 getFilename: renamefiles
 }, function (err, result) {
 // console.log("create", result);
 profile_pic.profile_upload_s3(result, user, cb);
 });
 });
 }
 }*/
module.exports = function (contract) {

  contract.construct_contract = function (user_id, data, cb) {
    if (typeof data === 'function') {
      data = undefined;
    }

    var
      contract_type = data["contract_type"];

    if (contract_type == "self_manage") {

/*
      var actiontaken = parseInt(data["actiontaken"]),
        verify = data["verify"],
        subject_id = data["subject_id"],
        from_agent_id = data["from_agent_id"];

      */

      cb(null, result_bool);
    } else if (contract_type == "agent_manage") {

/*
      var actiontaken = parseInt(data["actiontaken"]),
        verify = data["verify"],
        subject_id = data["subject_id"],
        from_agent_id = data["from_agent_id"];
*/


      cb(null, result_bool);
    } else if (contract_type == "org_manage") {

  /*
      var actiontaken = parseInt(data["actiontaken"]),
        verify = data["verify"],
        subject_id = data["subject_id"],
        from_agent_id = data["from_agent_id"];

*/




      cb(null, result_bool);
    } else {
      fn(new Error("no action is taken 7775"), null);
    }
  };


  contract.remoteMethod("construct_contract", {
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
  });
};
