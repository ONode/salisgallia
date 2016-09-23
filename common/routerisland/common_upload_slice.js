/**
 * Created by zJJ on 7/18/2016.
 */
const
  crypto = require('crypto'),
  express = require('express'),
  router = express.Router(),
  multer = require('multer'),
  mapSliceArc = require('mapslice'),
  output = require('.././util/outputjson.js'),
  path = require('path'),
  _ = require('lodash'),
  mkp = require('mkdirp-promise/lib/node5'),
  async = require('async'),
  rimraf = require('gulp-rimraf'),
  im = require('imagemagick'),
  fs = require('fs')
  ;
/**
 * setup system configurations
 * @type {string}
 */
const logTag = 'file info',
  __parentDir = path.dirname(module.main),
  upload_path_public = '/sdpupload',
  upload_hash_file_secret = 'catherineboobsarebig69',
  upload_file_field = 'art',
  upload_helper_folder = __parentDir + "/storage/tmp/tmpsgi/",
  base_folder = __parentDir + "/storage/tmp/storage_f/"

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
  parallelLimit: 4,
  // (default: 5) Maximum parallel tasks to be run at the same time (warning: processes can consume a lot of memory!)
  minWidth: 900,
  // See explanation about Size detection below
  skipEmptyTiles: true,
  // Skips all the empty tiles
  zoomMin: 3
};
const wrapping_process = function (req, res, next) {
//res.writeHead(200);
//http://www.scantips.com/basics1d.html
  var is_done = false;

  var mapSlicer;
  var O = {
    total_zoom_levels: 0,
    folder_base_name: "",
    secret_base_map_file: "",
    rename_file: "",
    folder_path: ""
  };
  var _storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log(logTag, "rename destination");
      O.folder_base_name = 'basemap-' + Date.now();
      O.folder_path = "/storage_f/" + O.folder_base_name + "/";
      mkp(base_folder + O.folder_base_name, function (err) {
        if (err) console.error(err);
        else console.log('create folder that is not existed!')
      });

      cb(null, base_folder + O.folder_base_name);
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
        output.outResErro(err.message, res);
        is_done = true;
      });

      mapSlicer.on("progress", function (progress, total, current, file) {
        var percent = Math.round(progress * 100) + "%";
        console.info("Progress: " + percent);
        //res.write(percent);
      });

      mapSlicer.on("end", function () {
        console.info("Finished processing slices.");
        if (!is_done) {
          output.outResSuccess(O, res);
        }
      });
      mapSlicer.on("levels", function (levels_found) {
        O.total_zoom_levels = levels_found;
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

  uploadStarter(req, res, function (err) {
    if (err) {
      output.outResErro(err.message, res);
      return;
    }
    // mapSlicer.start();

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
    console.log(logTag, a);
    console.log(logTag, b);
    var options = {
      width: 1000,
      height: 400,
      srcPath: a,
      dstPath: b
    };
    removefileshelper(upload_helper_folder);
    im.resize(options, function (err) {
      if (err) {
        console.log(logTag, 'resize image does\'t work and you may check for the installation of gm or imagemagick. error from resizing image');
        // throw err;
      }
      // res.end("Image resize complete");
      mapSlicer.start();
    });
  });
};
var removefileshelper = function (uploadsDir) {
  fs.readdir(uploadsDir, function (err, files) {
    files.forEach(function (file, index) {
      fs.stat(path.join(uploadsDir, file), function (err, stat) {
        var endTime, now;
        if (err) {
          return console.error(err);
        }
        now = new Date().getTime();
        endTime = new Date(stat.ctime).getTime() + 3600000;
        if (now > endTime) {
          return rimraf(path.join(uploadsDir, file), function (err) {
            if (err) {
              return console.error(err);
            }
            console.log('successfully deleted');
          });
        }
      });
    });
  });
};
//limit is 100mb
//https://github.com/martinheidegger/mapslice
//https://www.npmjs.com/package/multer
router.post(upload_path_public, function (req, res, next) {
  wrapping_process(req, res, next);
});
module.exports = router;
