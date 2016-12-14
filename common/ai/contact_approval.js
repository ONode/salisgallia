/**
 * Created by hesk on 16年12月14日.
 */
const
  upload_aws = require("./../logic/s3supportdoc"),
  pres3 = require("./../logic/preS3"),
  logTag = '> contract process',
  tool_crypt = require('crypto'),
  _ = require('lodash'),
  __parentDir = require('app-root-path'),
  numCPUs = require('os').cpus.length,
  fse = require('fs-extra'),
  uuid = require('node-uuid');

module.exports.machine_process = function (instance_model) {
  console.log("========= machine process now ===========");
  console.log(instance_model);
  const photo_id_a = instance_model.photo_id_a;
  const type = instance_model.agreement_type;
  const status = instance_model.status;
  const updatetime = instance_model.updatetime;

  instance_model.updateAttributes({
    status: 2
  }, function (err, r) {
    if (pres3.l.isError(err)) {
      console.log(logTag, "updateAttribute has error ..... ", err);
      return;
    }
    console.log(logTag, "s3 process error...");
  });
  console.log("========= machine process now ===========");
};




