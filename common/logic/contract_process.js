/**
 * Created by hesk on 16年12月10日.
 */
"use strict";
const
  upload_aws = require("./s3supportdoc"),
  contact_approval = require("./../ai/contact_approval"),
  pres3 = require("./preS3"),
  logTag = '> contract process',
  tool_crypt = require('crypto'),
  _ = require('lodash'),
  __parentDir = require('app-root-path'),
  numCPUs = require('os').cpus.length,
  fse = require('fs-extra'),
  uuid = require('node-uuid'),
  multia = require('multer');


const  fileFilterFn = function fileFilter(req, file, cb) {
  console.log(logTag, file.mimetype);
  const  okay_format = 'image/jpeg';
  if (file.mimetype == okay_format) {
    cb(null, true);
  } else {
    const  str = 'Cannot accept this upload. It must be in jpg format';
    console.log(logTag, str);
    cb(new Error(str));
  }
};

const  upload_start = function (pre_fix, user_id) {
  const  c = {
    engine: null,
    basepath: "",
    fileNames: []
  };
  const  _storage = multia.diskStorage({
    destination: function (req, file, cb) {
      const  folder_name = __parentDir + "/storage/profile/" + user_id + "/";
      fse.mkdirsSync(folder_name);
      c.basepath = folder_name;
      cb(null, folder_name);
    },
    filename: function (req, file, cb) {

      const
        parts = file.originalname.split('.'),
        extension = parts[parts.length - 1],
        generated = uuid.v4();


      const  newFile = pre_fix + "_" + generated.substring(generated.length - 12, generated.length - 1) + '.' + extension;
      c.fileNames.push(newFile);

      console.log("===========");
      console.log(file.originalname);
      console.log("===========");
      console.log(newFile);

      cb(null, newFile);
    }
  });
  c.engine = multia({
    fileFilter: fileFilterFn,
    storage: _storage,
    limits: {fileSize: 104857600, files: 3}
  }).array("document", 3);
  return c;
};
module.exports.process = function (req, res, pre_fix, user_id, contract, cb) {
  let uploader = upload_start(pre_fix, user_id);
  uploader.engine(req, res, function (err) {
    const fileList = uploader.fileNames;
    const  paths = _.map(fileList, function (it) {
      return uploader.basepath + it;
    });
    const  submission = req.query;

    console.log("===========");
    console.log("field for body");
    console.log(submission);
    console.log(paths);
    console.log("===========");

    if (pre_fix == "self_manage") {
      submission.photo_id_a = paths[0];
      submission.agreement_type = 1;
    } else if (pre_fix == "agent_manage") {
      submission.photo_id_a = paths[0];
      submission.photo_id_b = paths[1];
      submission.agreement_type = 2;
    } else if (pre_fix == "org_manage") {
      submission.photo_id_a = paths[0];
      submission.cert_a = paths[1];
      submission.cert_b = paths[2];
      submission.agreement_type = 3;
    } else {
      return cb(new Error("request error"), null);
    }

    //this is a pending status
    submission.status = 1;
    submission.userId = user_id;
    delete submission.contract_type;
    //delete uploader;
    contract.create(submission, function (err, cent) {
      if (_.isError(err)) {
        console.log("technical error from db", err);
        return cb(err, null);
      }

      upload_aws.contract_file_async_aws({
        file_names: fileList,
        local_paths: paths,
        user_id: user_id,
        lb_item: cent
      }, function (done) {
        // remove the existing items from the tmp folders
        pres3.async.eachSeries(paths, function (item, next) {
          fse.removeSync(item);
          next();
        }, function (next_done) {
          console.log("removed local files and start machine approval processing");
          contact_approval.machine_process(cent);
          done();
        });
      });

      console.log("result trigger now");
      return cb(null, pres3.positive_result);
    });
  });
};

module.exports.list_contracts = function (contract, user_id, cb) {
  const  where_cond = {
    "userId": user_id
  };

  contract.find({
    where: where_cond,
    order: "createtime DESC",
    limit: 5,
    skip: 0
  }, function (err, results) {
    if (pres3.l.isError(err)) {
      return cb(err);
    }
    contract.count(where_cond, function (err, number) {
      console.log(logTag, ">> How many does it count? ", number);
    });
    cb(null, results);
  });
};

const  approve_can_sell = module.exports.approved_can_sell_now = function (contract, user_id, cb) {
  const  result_call = function (err, results) {
    if (pres3.l.isError(err)) {
      return cb(err);
    }
    let allowed = false;
    pres3.async.eachSeries(results, function (result, next) {
      if (!pres3.l.isUndefined(result.status)) {
        if (result.status == 2) {
          allowed = true;
        }
      }
      next();
    }, function (next_done) {
      cb(null, {
        allow_making_sale: allowed
      });
    });
  };
  /*
   const  where_cond = {
   "userId": user_id
   };contract.find({
   where: where_cond,
   order: "createtime DESC",
   skip: 0
   }, result_call);*/
  pres3.patchFindFk(contract, "Contract", "userId", user_id, result_call);
};

