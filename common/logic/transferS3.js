/**
 * Created by zJJ on 7/21/2016.
 */

const
  db_worker = require("./../util/db.js"),
  logTag = "> S3: ",
  loopback = require('loopback')(),
  async = require('async'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  outputResolve = require("mapslice/lib/util/outputResolve"),
  s3 = require('s3'),
  cluster = require('cluster'),
  numCPUs = require('os').cpus.length,
  AWS = require('aws-sdk')
  ;

const
  test_s3_keyid = "",
  test_s3_accesskey = "",
  file_format = "/{z}/t_{y}_{x}.jpg",
  access = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || test_s3_keyid,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || test_s3_accesskey
  },
  bucket_active = "dobsh22",
  bucket_inactive = "xboxdoc",
  remote_base_path = "http://dobsh22.s3.amazonaws.com/basemap/",
  remote_base_path2 = "http://xboxdoc.s3.amazonaws.com/basemap/"
  ;
var getLocalPath = function (the_rest) {
  return path.dirname(module.main) + "/storage/tmp/storage_f/" + the_rest;
};

var getRemotePath = function (the_rest) {
  return "basemap/" + the_rest;
};
var getFolderPathS3 = function (path) {
  var f = remote_base_path + path;
  console.log(logTag, "check path", f);
  return f;
};
var worker_transfer = function (instance_model, _id, bns) {
  console.log(logTag, "before process: ", bns);
  if (_.isEmpty(access.accessKeyId) || _.isEmpty(access.secretAccessKey)) {
    console.log(logTag, "S3 process access is not found. Process stop here");
    return;
  } else {
    console.log(logTag, access);
  }
  var obfiles = [];
  //  AWS.config.region
  if (_.isArray(bns.total_zoom_levels)) {
    if (bns.total_zoom_levels.length > 0) {
      _.forEach(bns.total_zoom_levels, function (instance) {
        var _level = instance.level;
        console.log(logTag, "level found: " + _level);
        _.forEach(instance.tiles, function (tile) {
          var filepath = outputResolve(file_format, _level, tile.y, tile.x);
          obfiles.push(set_aws_worker(bns.folder_base_name + filepath));
          console.log(logTag, "file added: " + filepath);
        });
      });
      obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.rename_file));
      obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.secret_base_map_file));
    }
    /*
     if (obfiles.length > 0) {
     if (cluster.isMaster) {
     cluster.fork()
     }
     triggerS3(obfiles, 6);
     }
     */
    console.log(logTag, "CPU found:" + numCPUs);
    triggerS3(obfiles, 0, function () {
      //When all the S3 files are uploaded.
      console.log(logTag, "trigger database update.");
      db_worker.updateByIdUpdate(instance_model, _id, {
        "folder_path": getFolderPathS3(bns.folder_base_name),
        "complete": 100,
        "listing.enabled": true
      }, null);
    });
  } else {
    console.log(logTag, "error cant find it");
    console.log(logTag, bns);
  }
};
var worker_transfer_simple = function (instance_model, lb_user, basemap_ID, bns, next) {
  console.log(logTag, "simple transfer process: ", bns);
  if (_.isEmpty(access.accessKeyId) || _.isEmpty(access.secretAccessKey)) {
    console.log(logTag, "S3 process access is not found. Process stop here");
    return;
  } else {
    console.log(logTag, access);
    var obfiles = [];
    obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.rename_file));
    obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.secret_base_map_file));
    console.log(logTag, "CPU found:" + numCPUs);
    triggerS3(obfiles, 0, function () {
      //When all the S3 files are uploaded.
      console.log(logTag, "trigger database update.");
      db_worker.updateByIdUpdate(instance_model, basemap_ID, {
        "folder_path": getFolderPathS3(bns.folder_base_name),
        "listing.enabled": true,
        "complete": 100
      }, function (doc) {

        if (_.isError(doc)) {
          return;
        }

        db_worker.updateByIdAndIncrease(lb_user, doc["owner"], "uploads", null);
        if (_.isFunction(next)) {
          return next();
        }
      });
    });
  }
};
var setRemoteParams = function (key) {
  return {
    params: {
      Bucket: 'xboxdoc',
      Key: key,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }
  };
};

var triggerS3 = function (tasks, processors, next) {
  console.log(logTag, "S3 process start");
  if (processors > 0) {
    async.parallelLimit(tasks, processors, function (err, results) {
      console.log(logTag, "S3 process done");
      next();
    });
  } else {
    async.parallel(tasks, function (err, results) {
      console.log(logTag, "S3 process done");
      next();
    });
  }
};


var set_aws_worker = function (path_key) {

  const config = {
    localFile: getLocalPath(path_key),
    s3Params: {
      Bucket: bucket_active,
      Key: getRemotePath(path_key),
      ContentType: 'image/jpeg',
      ACL: 'public-read'
      // other options supported by putObject, except Body and ContentLength.
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
    }
  };

  const client = s3.createClient({
    s3Client: new AWS.S3(access)
    // more options available. See API docs below.
  });

  const uploadr = client.uploadFile(config);
  // Upload the file to S3
  return function worker(callback_aysnc) {
    uploadr.on('error', function (err) {
      console.error("unable to upload:", err.stack);
      return callback_aysnc(err);
    });
    uploadr.on('progress', function () {
      //console.log(logTag, uploadr.progressMd5Amount, uploadr.progressAmount, uploadr.progressTotal);
    });
    uploadr.on('end', function () {
      console.log(logTag, "done uploading: " + path_key);
      callback_aysnc();
    });
  };
};
var worker_remove = function (path) {

  const client = new AWS.S3(access);
  var params = {
    Bucket: bucket_active,
    Key: getRemotePath(path)
  };

  client.listObjects(params, function (err, data) {
    if (err) return console.log(err);
    //params = {Bucket: bucket_active};
    params.Delete = {};
    params.Delete.Objects = [];
    data.Contents.forEach(function (content) {
      params.Delete.Objects.push({Key: content.Key});
      console.log(logTag, content.Key);
    });
    client.deleteObjects(params, function (err, data) {
      if (err) return console.log(err);
      return console.log(data.Deleted.length);
    });

  });

};


module.exports.transferSimpleSingleSmallMapS3 = worker_transfer_simple;
module.exports.transferSyncBaseMapS3 = worker_transfer;
module.exports.S3RemoveItemFolder = worker_remove;
/*
 var S = require("string"),
 path = require("path");
 module.exports.outputresolve = function outputResolve(format, z, y, x) {
 return S(format).template({z: z, y: y, x: x, google: path.join(String(z), String(y), String(x))}, '{', '}').s;
 };
 */
