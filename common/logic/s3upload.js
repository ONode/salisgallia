/**
 * Created by zJJ on 7/21/2016.
 */
const pre = require("./preS3");
const preMap = require("./preMap");
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

var triggerS3 = function (tasks, processors, next) {
  console.log(logTag, "S3 process start");
  if (processors > 0) {
    pre.async.parallelLimit(tasks, processors, function (err, results) {
      console.log(logTag, "S3 process done");
      next();
    });
  } else {
    pre.async.parallel(tasks, function (err, results) {
      console.log(logTag, "S3 process done");
      next();
    });
  }
};

var uploadQueneManager = function () {
  this.total_items = 0;
  this.current_item = 0;
  this.instance_model = null;
  this.model_instance_id = null;
  this.aws_work_queue = [];
  this.client = pre.s3_node_client.createClient({s3Client: pre.s3_base_engine()});
};
uploadQueneManager.prototype.onUpdateProgress = function () {
  this.current_item++;
  var mode2progress = this.current_item / this.total_items * 50 + 50;
  preMap.basemapInfo.progress(
    this.instance_model,
    mode2progress,
    this.model_instance_id,
    null
  );
};
uploadQueneManager.prototype.setModelConfig = function (instance_model, basemap_id) {
  this.instance_model = instance_model;
  this.model_instance_id = basemap_id;
};
uploadQueneManager.prototype.large_transfer_call = function (zoom_map) {

  if (pre.l.isArray(zoom_map.total_zoom_levels)) {
    if (zoom_map.total_zoom_levels.length > 0) {

      this.aws_work_queue.push(this.transfer_in_action(zoom_map.folder_base_name + "/" + zoom_map.rename_file));
      this.aws_work_queue.push(this.transfer_in_action(zoom_map.folder_base_name + "/" + zoom_map.secret_base_map_file));
      this.aws_work_queue.push(this.transfer_in_action(zoom_map.folder_base_name + "/" + zoom_map.mid_size));

      pre.l.forEach(zoom_map.total_zoom_levels, function (instance) {
        var _level = instance.level;
        console.log(logTag, "level found: " + _level);
        pre.l.forEach(instance.tiles, function (tile) {
          var file_path = pre.resolve_format(_level, tile.y, tile.x);
          this.aws_work_queue.push(this.transfer_in_action(zoom_map.folder_base_name + file_path));
          console.log(logTag, "file added: " + file_path);
        }.bind(this));
      }.bind(this));

    }

    this.total_items = this.aws_work_queue.length;
    console.log(logTag, "CPU found:" + pre.numCPUs);
    triggerS3(this.aws_work_queue, 0, function () {
      //When all the S3 files are uploaded.
      console.log(logTag, "trigger database update.");
      pre.db.updateByIdUpdate(this.instance_model, this.model_instance_id, update_meta_on_complete, null);
    }.bind(this));
  } else {
    console.log(logTag, "error cant find it");
    console.log(logTag, zoom_map);
  }
};
uploadQueneManager.prototype.simple_transfer_call = function (lb_user, bns, next) {
  console.log(logTag, "simple transfer process: ", bns);
  if (!pre.check_access_keys_filled()) {
    return;
  }
  this.aws_work_queue.push(this.transfer_in_action(bns.folder_base_name + "/" + bns.rename_file));
  this.aws_work_queue.push(this.transfer_in_action(bns.folder_base_name + "/" + bns.secret_base_map_file));
  this.aws_work_queue.push(this.transfer_in_action(bns.folder_base_name + "/" + bns.mid_size));
  console.log(logTag, "CPU found:" + pre.numCPUs);
  this.total_items = this.aws_work_queue.length;
  triggerS3(this.aws_work_queue, 0, function () {
    //When all the S3 files are uploaded.
    console.log(logTag, "trigger database update.");
    pre.db.updateByIdUpdate(this.instance_model, this.model_instance_id, update_meta_on_complete, function (doc) {
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
uploadQueneManager.prototype.transfer_in_action = function (path_key) {

  return function worker(aync_next_loop) {

    var dta = {
      localFile: pre.fnGetLocalPath(path_key),
      s3Params: {
        Bucket: pre.bucket_name,
        Key: pre.fnGetRemotePath(path_key),
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      }
    };

    console.log(logTag, "=======================>start AWS upload");
    // console.log(logTag, client);
    console.log(logTag, dta);
    console.log(logTag, "=======================>end AWS upload");

    const newUp = this.client.uploadFile(dta);
    newUp.on('error', function (err) {
      console.error("Unable to upload:", err);
      return aync_next_loop(err);
    });

    newUp.on('progress', function () {
      //console.log(logTag, newUp.progressMd5Amount, newUp.progressAmount, newUp.progressTotal);
    });

    newUp.on('end', function () {
      console.log(logTag, "done uploading: " + path_key);
      console.log(logTag, "==============>end upload file");
      this.onUpdateProgress();
      return aync_next_loop();
    }.bind(this));
  }.bind(this);
};
/*
 var worker_transfer_simple = function (instance_model, lb_user, basemap_ID, bns, next) {
 console.log(logTag, "simple transfer process: ", bns);
 if (!pre.check_access_keys_filled()) {
 return;
 }
 var ob_file_list = [];
 ob_file_list.push(set_aws_worker(bns.folder_base_name + "/" + bns.rename_file));
 ob_file_list.push(set_aws_worker(bns.folder_base_name + "/" + bns.secret_base_map_file));
 ob_file_list.push(set_aws_worker(bns.folder_base_name + "/" + bns.mid_size));
 console.log(logTag, "CPU found:" + pre.numCPUs);
 triggerS3(ob_file_list, 0, function () {
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
 };*/



/*

 pre.basemapInfo.progress(
 this.model_base_map,
 percentActual,
 this.O.id,
 null);

 */
/*

 var set_aws_worker = function (path_key) {
 const client = pre.s3_node_client.createClient({s3Client: pre.s3_base_engine()});
 // Upload the file to S3
 return function worker(aync_next_loop) {

 var dta = {
 localFile: pre.fnGetLocalPath(path_key),
 s3Params: {
 Bucket: pre.bucket_name,
 Key: pre.fnGetRemotePath(path_key),
 ContentType: 'image/jpeg',
 ACL: 'public-read'
 }
 };

 console.log(logTag, "=======================>start AWS upload");
 // console.log(logTag, client);
 console.log(logTag, dta);
 console.log(logTag, "=======================>end AWS upload");

 const uploadr = client.uploadFile(dta);
 uploadr.on('error', function (err) {
 console.error("Unable to upload:", err);
 return aync_next_loop(err);
 });

 uploadr.on('progress', function () {
 //console.log(logTag, uploadr.progressMd5Amount, uploadr.progressAmount, uploadr.progressTotal);
 });

 uploadr.on('end', function () {
 console.log(logTag, "done uploading: " + path_key);
 console.log(logTag, "==============>end upload file");

 return aync_next_loop();
 });

 };
 };*/

/*
 var S = require("string"),
 path = require("path");
 module.exports.outputresolve = function outputResolve(format, z, y, x) {
 return S(format).template({z: z, y: y, x: x, google: path.join(String(z), String(y), String(x))}, '{', '}').s;
 };
 */

module.exports.transferSimpleSingleSmallMapS3 = function (instance_model, lb_user, basemap_ID, bns) {
  var q = new uploadQueneManager();
  q.setModelConfig(instance_model, _id);
  q.simple_transfer_call(lb_user, bns, null);
};
module.exports.transferSyncBaseMapS3 = function (instance_model, _id, bns) {
  var q = new uploadQueneManager();
  q.setModelConfig(instance_model, _id);
  q.large_transfer_call(bns);
};



