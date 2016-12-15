const
  test_s3_keyid = "",
  test_s3_accesskey = "",
  test_cloudinary_name = "",
  test_cloudinary_apikey = "",
  test_cloudinary_secret = "",
  logTag = "> pre s3 --> ",
  access = {
    apiVersion: '2006-03-01',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || test_s3_keyid,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || test_s3_accesskey
  },
  access_cloudinary = {
    cloud_name: process.env.CLOUDINARY_CLOUDNAME || test_cloudinary_name,
    api_key: process.env.CLOUDINARY_APIKEY || test_cloudinary_apikey,
    api_secret: process.env.CLOUDINARY_SECRET || test_cloudinary_secret
  },
  bucket_active = "s3.heskeyo.com",
  fileName = "basemap",
  remote_base_path = "http://" + bucket_active + ".s3.amazonaws.com/" + fileName + "/",
  tool = {
    extract_base_id: /basemap-\d+/g,
    map_path_key: "/{z}/t_{y}_{x}.jpg"
  }
  ;
var _ = require('lodash');
var __parentDir = require('app-root-path');
var depthResolver = require('mapslice/lib/util/outputResolve');
var s3_fs = require('s3fs');
var dbpatch = require('./../util/db');
var s3_aws = require('aws-sdk');
var s3_client_engine = require('s3');
var base_aws_s3_client = new s3_aws.S3(access);
var s3ls = function (options) {
  var bucket = options.bucket;
  //var s3 = new s3_aws.S3(access);
  return {
    ls: function ls(_fpath, callback) {
      var prefix = _.trimStart(_.trimEnd(_fpath, '/') + '/', '/');
      var result = {files: [], folders: []};

      function s3ListCallback(error, data) {
        if (error) return callback(error);

        result.files = result.files.concat(_.map(data.Contents, 'Key'));
        result.folders = result.folders.concat(_.map(data.CommonPrefixes, 'Prefix'));

        if (data.IsTruncated) {
          base_aws_s3_client.listObjectsV2({
            Bucket: bucket,
            MaxKeys: 2147483647, // Maximum allowed by S3 API
            Delimiter: '/',
            Prefix: prefix,
            ContinuationToken: data.NextContinuationToken
          }, s3ListCallback)
        } else {
          callback(null, result);
        }
      }

      base_aws_s3_client.listObjectsV2({
        Bucket: bucket,
        MaxKeys: 2147483647, // Maximum allowed by S3 API
        Delimiter: '/',
        Prefix: prefix,
        StartAfter: prefix // removes the folder name from the file listing
      }, s3ListCallback);

    }
  };
};
var s3lpkeys = function (options) {
  return {
    lp: function ls(_fpath, callback) {
      var result = {files: []};
      var one_sub_layer = [];
      var it = 0;

      function s3ListFilesCallback(error, data) {
        if (error) return callback(error);
        if (data.files.length > 0) {
          result.files = result.files.concat(data.files);
        }
        if (data.folders.length > 0) {
          console.log(logTag, "add folders");
          one_sub_layer = data.folders;
          s3ls(options).ls(one_sub_layer[it], s3ListFilesCallback);
        } else if (data.folders.length == 0) {
          if (one_sub_layer.length > 0 && it < one_sub_layer.length - 1) {
            it++;
            //console.log(logTag, "===================");
            //console.log(logTag, data);
            // console.log(logTag, one_sub_layer[it]);
            // console.log(logTag, "===================");
            s3ls(options).ls(one_sub_layer[it], s3ListFilesCallback);
          } else {
            return callback(null, result);
          }
        }
      }

      s3ls(options).ls(_fpath, s3ListFilesCallback);
    }
  };
};
var getProfileHeadLocalPath = function (filename) {
  return __parentDir + "/storage/tmp/profile/" + filename;
};
var getProfileHeadRemotePath = function (filename) {
  return "profile/" + filename;
};
var getLocalPath = function (the_rest) {
  return __parentDir + "/storage/tmp/storage_f/" + the_rest;
};
var getRemotePath = function (the_rest) {
  return "basemap/" + the_rest;
};

var getFolderPathS3 = function (_fpath) {
  var f = remote_base_path + _fpath;
  console.log(logTag, "check path", f);
  return f;
};

var rmrecursively_v1 = function (bucket_name, folder_path, callback) {
  console.log(logTag, "v1 Start operation for bucket name:: ", bucket_name, folder_path);
  var fsImpl = new s3_fs(bucket_name, access);
  fsImpl.rmdirp(folder_path).then(function () {
    // Directory has been recursively deleted
    console.log(logTag, "Directory has been recursively deleted", folder_path);
    callback(null, true);
  }, function (reason) {
    console.log(logTag, "Something went wrong", reason);
    // callback(reason, null);
    // Something went wrong
  });
};

var rmrecursively_v2 = function (bucket_name, folder_path, callback) {
  console.log(logTag, "v2 Start operation for bucket name:: ", bucket_name, folder_path);
  //const client_base = new s3_aws.S3(access);
  var s3client = s3_client_engine.createClient({s3Client: base_aws_s3_client});

  var params_remove = {
    Bucket: bucket_name,
    Delete: {
      Objects: [],
      Quiet: false
    },
    //MFA: 'STRING_VALUE',
    RequestPayer: 'requester'
  };

  s3lpkeys({bucket: bucket_name}).lp(folder_path, function (err, data) {
    //console.log("> done", data);
    //var mlist = get_folder_names(data.folders);
    ///if (_.isFunction(callback)) {
    //callback(mlist);
    //}
    params_remove.Delete.Objects = _.map(data.files, function (item) {
      return {
        Key: item
      }
    });
    if (params_remove.Delete.Objects.length > 0) {

      var deleteOperation = s3client.deleteObjects(params_remove);

      deleteOperation.on('error', function (err) {
        console.log(
          "unable to remove:",
          params_remove.Delete.Objects);

        console.error(
          "unable to remove:",
          err.stack
        );
      });

      deleteOperation.on('progress', function () {
        console.log("progress remove: ",
          deleteOperation.progressAmount,
          deleteOperation.progressTotal);
      });

      deleteOperation.on('end', function () {
        console.log("done uploading");
        callback(null, true);
      });

    } else {

      console.log("done next up");
      callback(null, true);

    }
  });
};
module.exports = {
  resolve_format: function (z, y, x) {
    return depthResolver(tool.map_path_key, z, y, x);
  },
  check_access_keys_filled: function () {
    if (_.isEmpty(access.accessKeyId) || _.isEmpty(access.secretAccessKey)) {
      console.log(logTag, "cannot proceed further because api is missing.");
      return false;
    } else {
      console.log(logTag, access);
      return true;
    }
  },
  access: access,
  bucket_name: bucket_active,
  filename: fileName,
  ready_path: remote_base_path,

  fnGetLocalPath: getLocalPath,
  fnGetFolderPathS3: getFolderPathS3,
  fnGetRemotePath: getRemotePath,
  fnGetLocalHeadImagePath: getProfileHeadLocalPath,
  fnGetRemoteHeadImagePath: getProfileHeadRemotePath,
  db: require("./../util/db.js"),
  loopback: require('loopback')(),
  async: require('async'),
  fs: require('fs'),
  rootpath: __parentDir,
  l: _,
  cluster: require('cluster'),
  numCPUs: require('os').cpus.length,
  aws: s3_aws,
  s3FsRm: rmrecursively_v2,
  crTool: tool,
  cloudinary_access: access_cloudinary,
  s3Ls: s3ls,
  newS3Client: function () {
    return s3_client_engine.createClient({s3Client: new s3_aws.S3(access)});
  },
  patchFindFk: dbpatch.patch_find_by_fk,
  makeId: dbpatch.patch_find_ensure_id,
  positive_result: {
    acknowledged: true
  },
  negative_result: {
    acknowledged: false
  }
}
;

