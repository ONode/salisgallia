/**
 * Created by hesk on 16年11月11日.
 */
"use strict";
//const pre = require("./preMap");
const pS3 = require("./preS3");
const resizeModule = require("./resize_queue");
//const cloudinary = require("cloudinary");
const logTag = "> mapMakerV2";
const upload_prob = function (file_name, cb) {
  this.src_filename = file_name;
  this.callback = cb;
  /// cloudinary.config(pS3.cloudinary_access);
  this.db = null;
  this.user_id = "";
  this.format = "";
  this.image_size = 0;
  this.client = pS3.newS3Client();
};
upload_prob.prototype.exe_aws_profile_image = function () {
  if (pS3.l.isFunction(this.callback)) {
    const aws_upload_meta_configuration = {
      localFile: pS3.fnGetLocalHeadImagePath(this.src_filename),
      s3Params: {
        Bucket: pS3.bucket_name,
        Key: pS3.fnGetRemoteHeadImagePath(this.src_filename),
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      }
    };
    console.log(logTag, "==========> start AWS upload profile image too");
    console.log(logTag, aws_upload_meta_configuration);
    const newUp = this.client.uploadFile(aws_upload_meta_configuration);
    newUp.on('error', (err) => {
      console.error("Unable to upload:", err);
      return this.callback(err);
    });
    newUp.on('progress', function () {

    });
    newUp.on('end', () => {
      this.updateUserProfilePhoto((result) => {
        console.log("success", "progress completed aws end.");
      });
    });
    /**
     * give an instance response to the request.
     */
    this.db.findOne({where: {id: this.user_id}}, (err, oneDoc) => {
      return this.callback(null, oneDoc.photo);
    });
  }
};
upload_prob.prototype.getReturnObject = function () {
  const path_sub = pS3.fnGetRemoteHeadImagePath(this.src_filename);
  const path_pre = "http://s3.heskeyo.com/" + path_sub;
  return {
    "photo.url": path_pre,
    "photo.secure_url": path_pre,
    "photo.format": this.format,
    "photo.image_size": this.image_size
  };
};
upload_prob.prototype.updateUserProfilePhoto = function (callback) {
  pS3.db.updateByIdUpdate(this.db, this.user_id, this.getReturnObject(), () => {
  });
};
upload_prob.prototype.setUpdateUserObject = function (user) {
  this.db = user;
};

upload_prob.prototype.setId = function (userid) {
  this.user_id = userid;
};
upload_prob.prototype.setImageSize = function (size) {
  this.image_size = size;
};
upload_prob.prototype.setformat = function (format) {
  this.format = format;
};
/*

 upload_prob.prototype.exe_cloudinary = function () {
 cloudinary.uploader.upload(this.src_filename, function (result) {
 if (pS3.l.isUndefined(this.callback)) {
 this.callback(result);
 }
 }.bind(this));
 };


 module.exports.profile_upload_cloudinary = function (file_name, cb) {
 const  d = new upload_prob(file_name, cb);
 d.exe_cloudinary();
 };*/
module.exports.profile_upload_s3 = function (result, user_lb, cb) {
  if (pS3.l.isEmpty(result) || pS3.l.isEmpty(result.files)) {
    cb(new Error("no result"));
  } else {
    const image = result.files.user_image[0];
    const filename = image.name;
    const path = image.container;
    const size = image.size;
    const format = image.format;
    const d = new upload_prob(path + "/" + filename, cb);
    d.setImageSize(size);
    d.setId(path);
    d.setformat(format);
    d.setUpdateUserObject(user_lb);
    d.exe_aws_profile_image();
  }
};
