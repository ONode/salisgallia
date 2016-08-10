/**
 * Created by zJJ on 7/18/2016.
 */
const

  crypto = require('crypto'),
  numCPUs = require('os').cpus.length,
  path = require('path'),
  multer = require('multer'),
  mapSliceArc = require('mapslice'),
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
/**
 * setup system configurations
 * @type {string}
 */
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

const basic_config = {
  tileSize: 256,
  // (default: 256) Tile-size to be used
  imageMagick: false,
  // (default: false) If (true) then use ImageMagick instead of GraphicsMagick
  background: "#FFFFFFFF",
  // (default: '#FFFFFFFF') Background color to be used for the tiles. More: http://ow.ly/rsluD
  // tmp: "./tmp",
  tmp: upload_helper_folder,
  // (default: '.tmp') Temporary directory to be used to store helper files
  parallelLimit: 1,
  // (default: 5) Maximum parallel tasks to be run at the same time (warning: processes can consume a lot of memory!)
  minWidth: 900,
  // See explanation about Size detection below
  skipEmptyTiles: true,
  // Skips all the empty tiles
  zoomMin: 1
};
const wrapping_process = function (basemap, req, res, next_step) {
//res.writeHead(200);
//http://www.scantips.com/basics1d.html
  var is_done = false;
  console.log(logTag, "cpu: " + numCPUs);
  var mapSlicer;
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
      var _config = {
        file: base_folder + O.folder_base_name + "/" + O.secret_base_map_file,
        //file: base_folder + base_name + '/' +O. secret_base_map_file,
        // (required) Huge image to slice
        output: base_folder + O.folder_base_name + "/{z}/t_{y}_{x}.jpg"
        // Output file pattern
      };

      mapSlicer = mapSliceArc(_.extend(_config, basic_config));
      mapSlicer.on("start", function (files, options) {
        console.info("Starting to process " + files + " files.");
      });

      mapSlicer.on("error", function (err) {
        console.error(err);
        // output.outResErro(err.message, res);
        is_done = true;
        next_step(err, res);
      });

      mapSlicer.on("progress", function (progress, total, current, file) {
        var percentNum = Math.round(progress * 100);
        var percent = percentNum + "%";
        //console.info("Progress: " + percent);
        //console.info(logTag, "Progress: ", basemap);
        save_data.progress(basemap, percentNum / 2, O.carry_id, null);
      });

      mapSlicer.on("end", function () {
        if (!is_done) {
          // output.outResSuccess(O, res);
          next_step(O, res);
        }
      });
      mapSlicer.on("levels", function (levels_found) {
        O.total_zoom_levels = levels_found;
        console.info("Levels calculated: ", levels_found.length);
      });
      cb(null, O.secret_base_map_file);
    }
  });

  var uploadStarter = multer({
    fileFilter: fileFilterFn,
    storage: _storage,
    //   dest: __parentDir + '/tmp/',
    limits: {fileSize: 104857600, files: 1}
  }).single(upload_file_field);

  // console.log(req);
  // var tmp_path = req.files["art"].path;
  // var isArtDefined = !_.isNull(req.files["art"]);
  // var isArtDefined = !_.isNull(req.body["art"]);
  // console.log(req.files);
  // if (req.files && isArtDefined) {

  uploadStarter(req, res, function (err) {
    if (err) {
      console.log(logTag, "error from upload", +err.message);
      output.outResErro(err.message, res);
      return;
    }
    //   var storage = "127.0.0.5:3000/";
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
    console.log("====================================");
    console.log(logTag, a);
    console.log(logTag, b);
    console.log("====================================");
    var options = {
      width: 1000,
      height: 400,
      srcPath: a,
      dstPath: b
    };
    //rmdir(upload_helper_folder);
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
          mapSlicer.start();
        }, function (err) {
          output.outResErro(err.message, res);
        });
      }
    });
  });
};
//limit is 100mb
//https://github.com/martinheidegger/mapslice
//https://www.npmjs.com/package/multer
module.exports = function (loopbackBasemap, req, res) {
  wrapping_process(loopbackBasemap, req, res, function (result, res) {
    if (_.isError(result)) {
      output.outResErro(result.message, res);
    } else {
      var _id = result.carry_id;
      delete result.carry_id;
      delete result.complete;
      if (req.params.owner != null) {
        console.info(logTag, "Id adding..");
        result["owner"] = req.params.owner;
      }
      console.info(logTag, "Finished processing slices. start saving to DB.");
      console.info(logTag, "process before", result);
      save_data.complete(loopbackBasemap, _id, result, function () {
        //output.outResSuccess(result, res);
        console.log(logTag, "save and update complete status");
        console.log(logTag, "S3 transfer");
        s3thread.transferSyncBaseMapS3(loopbackBasemap, _id, result);
      });
    }
  });
};
