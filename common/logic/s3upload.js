/**
 * Created by zJJ on 7/21/2016.
 */
const pre = require("./preS3");
const logTag = "---> transS3";
const update_meta_on_complete = {
  "folder_path": "",
  "listing.enabled": true,
  "complete": 100
};
const setRemoteParamsSample = function (key) {
  return {
    params: {
      Bucket: 'xboxdoc',
      Key: key,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }
  };
};

var worker_transfer = function (instance_model, _id, bns) {
  console.log(logTag, "before process: ", bns);
  if (!pre.check_access_keys_filled()) {
    return;
  }
  var obfiles = [];
  if (pre.l.isArray(bns.total_zoom_levels)) {
    if (bns.total_zoom_levels.length > 0) {
      pre.l.forEach(bns.total_zoom_levels, function (instance) {
        var _level = instance.level;
        console.log(logTag, "level found: " + _level);
        pre.l.forEach(instance.tiles, function (tile) {
          var filepath = pre.resolve_format(_level, tile.y, tile.x);
          obfiles.push(set_aws_worker(bns.folder_base_name + filepath));
          console.log(logTag, "file added: " + filepath);
        });
      });
      obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.rename_file));
      obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.secret_base_map_file));
      obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.mid_size));
    }

    console.log(logTag, "CPU found:" + pre.numCPUs);
    triggerS3(obfiles, 0, function () {
      //When all the S3 files are uploaded.
      console.log(logTag, "trigger database update.");
      pre.db.updateByIdUpdate(instance_model, _id, update_meta_on_complete, null);
    });
  } else {
    console.log(logTag, "error cant find it");
    console.log(logTag, bns);
  }
};
var worker_transfer_simple = function (instance_model, lb_user, basemap_ID, bns, next) {
  console.log(logTag, "simple transfer process: ", bns);
  if (!pre.check_access_keys_filled()) {
    return;
  }
  var obfiles = [];
  obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.rename_file));
  obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.secret_base_map_file));
  obfiles.push(set_aws_worker(bns.folder_base_name + "/" + bns.mid_size));
  console.log(logTag, "CPU found:" + pre.numCPUs);
  triggerS3(obfiles, 0, function () {
    //When all the S3 files are uploaded.
    console.log(logTag, "trigger database update.");
    pre.db.updateByIdUpdate(instance_model, basemap_ID, update_meta_on_complete, function (doc) {
      if (pre.l.isError(doc)) {
        return;
      }
      pre.db.updateByIdAndIncrease(lb_user, doc["owner"], "uploads", null);
      if (pre.l.isFunction(next)) {
        return next();
      }
    });
  });
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
    localFile: pre.fnGetLocalPath(path_key),
    s3Params: {
      Bucket: pre.bucket_name,
      Key: pre.fnGetRemotePath(path_key),
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }
  };

  const uploadr = pre.s3_node_client.uploadFile(config);
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
module.exports = {
  transferSimpleSingleSmallMapS3: worker_transfer_simple,
  transferSyncBaseMapS3: worker_transfer
};
/*
 var S = require("string"),
 path = require("path");
 module.exports.outputresolve = function outputResolve(format, z, y, x) {
 return S(format).template({z: z, y: y, x: x, google: path.join(String(z), String(y), String(x))}, '{', '}').s;
 };
 */
