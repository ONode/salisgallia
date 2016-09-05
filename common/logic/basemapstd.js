/**
 * Created by hesk on 16年9月5日.
 */
const

  crypto = require('crypto'),
  numCPUs = require('os').cpus.length,
  path = require('path'),
  multer = require('multer'),
  output = require('.././util/outputjson.js'),
  rmdir = require('.././util/rmdir.js'),
  _ = require('lodash'),
  mkp = require('mkdirp'),
  async = require('async'),
  fse = require('fs-extra'),
  im = require('imagemagick'),
  s3thread = require('./transferS3.js'),
  save_data = require('./basemapinfo.js')

  ;

const

  logTag = '> file info',
  __parentDir = path.dirname(module.main),
  upload_hash_file_secret = 'catherineboobsarebig69',
  upload_file_field = 'art',
  upload_helper_folder = __parentDir + "/storage/tmp/tmpsgi/",
  base_folder = __parentDir + "/storage/tmp/storage_f/",
  base_folder_process = __parentDir + "/storage/tmp/tmpsgi/",
  public_folder_path = "/static/storage_f/"

  ;


const fileFilterFn = function fileFilter(req, file, cb) {
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted
  // To reject this file pass `false`, like so:
  // cb(null, false)
  // To accept the file pass `true`, like so:
  // cb(null, true)
  // You can always pass an error if something goes wrong:
  console.log(logTag, file.mimetype);
  var okay_format = 'image/jpeg';
  if (file.mimetype == okay_format) {
    cb(null, true);
  } else {
    var str = 'Cannot accept this upload. I don\'t have a clue!';
    console.log(logTag, str);
    cb(new Error(str));
  }
};

const wrapping_process = function (basemap, req, res, next_step) {
//res.writeHead(200);
//http://www.scantips.com/basics1d.html
  var is_done = false;
  console.log(logTag, "cpu: " + numCPUs);

  var O = {
    carry_id: "",
    complete: -1,
    total_zoom_levels: [],
    folder_base_name: "",
    secret_base_map_file: "",
    rename_file: "",
    folder_path: ""
  };

  var _storage = multer.diskStorage({
    destination: function (req, file, cb) {

      console.log(logTag, '==================================');
      console.log(logTag, 'check folder structure and define upload folder structures');
      console.log(logTag, '==================================');

      O.folder_base_name = 'basemap-' + Date.now();
      O.folder_path = public_folder_path + O.folder_base_name + "/";
      var folder_tmp = base_folder + O.folder_base_name;
      fse.mkdirs(folder_tmp, function (err) {
        if (err) {
          return console.error(err);
        } else {
          fse.mkdirsSync(base_folder_process);
          console.log(logTag, '==================================');
          console.log(logTag, 'create folder that is not existed!');
          console.log(logTag, folder_tmp);
          console.log(logTag, base_folder_process);
          console.log(logTag, '==================================');
          cb(null, folder_tmp);
        }
      });
    },
    filename: function (req, file, cb) {
      console.log(logTag, "rename file");
      var hash = crypto.createHmac('sha256', upload_hash_file_secret)
        .update(O.folder_base_name)
        .digest('hex');
      O.secret_base_map_file = hash + '.jpg';
      O.rename_file = O.folder_base_name + '.jpg';
      cb(null, O.secret_base_map_file);
    }
  });

  var uploadStarter = multer({
    fileFilter: fileFilterFn,
    storage: _storage,
    limits: {fileSize: 104857600, files: 1}
  }).single(upload_file_field);

  uploadStarter(req, res, function (err) {
    if (err) {
      console.log(logTag, "error from upload", +err.message);
      output.outResErro(err.message, res);
      return;
    }
    //var storage = "127.0.0.5:3000/";
    var a = base_folder + O.folder_base_name + "/" + O.secret_base_map_file;
    var b = base_folder + O.folder_base_name + "/" + O.rename_file;
    var c = {
      size: {
        width: 600,
        height: 400
      },
      quality: 0.9,
      format: 'jpg'
    };
    console.log("=======create resize input==========");
    console.log(logTag, a);
    console.log(logTag, b);
    console.log("====================================");
    var options = {
      width: 1000,
      height: 400,
      srcPath: a,
      dstPath: b
    };
    im.resize(options, function (err) {
      if (err) {
        var notworking = 'resize image does\'t work and you may check for the installation of gm or imagemagick. error from resizing image';
        console.log(logTag, notworking);
        output.outResErro(notworking, res);
        return;
      } else {
        if (req.params.owner != null) {
          O.owner = req.params.owner;
        }
        save_data.start(basemap, O, function (id) {
          O.carry_id = id;
          output.outResSuccess(O, res);
          if (!is_done) {
            // output.outResSuccess(O, res);
            next_step(O, res);
          }
        }, function (err) {
          output.outResErro(err.message, res);
        });
      }
    });
  });
};

module.exports = function (loopbackBasemap, req, res) {
  wrapping_process(loopbackBasemap, req, res, function (result, res) {
    if (_.isError(result)) {
      output.outResErro(result.message, res);
    } else {
      var _id = result.carry_id;
      delete result.carry_id;
      delete result.complete;
      if (req.params.owner != null) {
        //console.info(logTag, "Id adding..");
        result["owner"] = req.params.owner;
      }
      save_data.complete(loopbackBasemap, _id, result, function () {
        //output.outResSuccess(result, res);
        console.log(logTag, "save and update complete status");
        console.log(logTag, "S3 transfer");
        s3thread.transferSimpleSingleSmallMapS3(loopbackBasemap, _id, result);
      });
    }
  });
};
