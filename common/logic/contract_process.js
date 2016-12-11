/**
 * Created by hesk on 16年12月10日.
 */
const
  upload_aws = require("./s3supportdoc"),
  logTag = '> contract process',
  tool_crypt = require('crypto'),
  _ = require('lodash'),
  __parentDir = require('app-root-path'),
  numCPUs = require('os').cpus.length,
  fse = require('fs-extra'),
  uuid = require('node-uuid'),
  multia = require('multer');
var result_bool = {
  acknowledged: true
};

var fileFilterFn = function fileFilter(req, file, cb) {
  console.log(logTag, file.mimetype);
  var okay_format = 'image/jpeg';
  if (file.mimetype == okay_format) {
    cb(null, true);
  } else {
    var str = 'Cannot accept this upload. It must be in jpg format';
    console.log(logTag, str);
    cb(new Error(str));
  }
};

var upload_start = function (pre_fix, user_id) {
  var c = {
    engine: null,
    basepath: "",
    fileNames: []
  };
  var _storage = multia.diskStorage({
    destination: function (req, file, cb) {
      var folder_name = __parentDir + "/storage/profile/" + user_id + "/";
      fse.mkdirsSync(folder_name);
      c.basepath = folder_name;
      cb(null, folder_name);
    },
    filename: function (req, file, cb) {

      var
        parts = file.originalname.split('.'),
        extension = parts[parts.length - 1],
        generated = uuid.v4();


      var newFile = pre_fix + "_" + generated.substring(generated.length - 12, generated.length - 1) + '.' + extension;
      c.fileNames.push(newFile);


      console.log("===========");
      console.log(generated);
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
  var uploader = upload_start(pre_fix, user_id);
  uploader.engine(req, res, function (err) {
    var paths = _.map(uploader.fileNames, function (it) {
      return uploader.basepath + it;
    });
    var submission = req.query;
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
    contract.create(submission, function (err, cent) {
      if (_.isError(err)) {
        console.log("technical error from db", err);
        return cb(err, null);
      }

      upload_aws.contract_file_async_aws({
        file_names: uploader.fileNames,
        local_paths: paths,
        user_id: user_id,
        lb_item: cent
      }, function (done) {

      });
      return cb(null, result_bool);
    });
  });
};
