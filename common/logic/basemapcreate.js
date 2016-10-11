/**
 * Created by zJJ on 7/18/2016.
 */
const

  tool_crypt = require('crypto'),
  numCPUs = require('os').cpus.length,
  path = require('path'),
  mulOperation = require('multer'),
  mapSliceArc = require('mapslice'),
  output = require('.././util/outputjson.js'),
  rmdir = require('.././util/rmdir.js'),
  _ = require('lodash'),
  async = require('async'),
  fse = require('fs-extra'),
  im = require('imagemagick'),
  s3thread = require('./transferS3.js'),
  basemapInfo = require('./basemapinfo.js')

  ;
/**
 * setup system configurations
 * @type {string}
 */
const

  logTag = '> basemapcreate.js',
  __parentDir = path.dirname(module.main),
  saltFile = 'catherineboobsarebig69',
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

var defineSlicer = function (_config, dataStructure, lb_map, errCallback, endCallback) {
  var mapSlicer = mapSliceArc(_.extend(_config, basic_config));
  mapSlicer.on("start", function (files, options) {
    console.info("Starting to process " + files + " files.");
  });

  mapSlicer.on("error", function (err) {
    console.error(err);
    //is_done = true;
    errCallback(err);
  });

  mapSlicer.on("progress", function (progress, total, current, file) {
    var percentNum = Math.round(progress * 100);
    var percent = percentNum + "%";
    //console.info("Progress: " + percent);
    console.info(logTag, "dataStructure.carry_id: ", dataStructure.carry_id);
    if (dataStructure.carry_id != null) {
      basemapInfo.progress(lb_map, percentNum / 2, dataStructure.carry_id, null);
    }
  });

  mapSlicer.on("end", function () {
    return endCallback(dataStructure);
  });

  mapSlicer.on("levels", function (levels_found) {
    dataStructure.total_zoom_levels = levels_found;
    console.info("Levels calculated: ", levels_found.length);
  });

  return mapSlicer;
};

var setupUploader = function (dataStructure, extraOperationFromAfterNameDefined, callback_err) {
  var _storage = mulOperation.diskStorage({
    destination: function (req, file, cb) {
      console.log(logTag, '==================================');
      console.log(logTag, 'check folder structure and define upload folder structures');
      console.log(logTag, '==================================');

      dataStructure.folder_base_name = 'basemap-' + Date.now();
      dataStructure.folder_path = public_folder_path + dataStructure.folder_base_name + "/";
      var folder_tmp = base_folder + dataStructure.folder_base_name;
      fse.mkdirs(folder_tmp, function (err) {
        if (_.isError(err)) {
          return callback_err(err);
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
      var hash = tool_crypt.createHmac('sha256', saltFile)
        .update(dataStructure.folder_base_name)
        .digest('hex');

      dataStructure.secret_base_map_file = hash.substring(0, 18) + '.jpg';
      dataStructure.rename_file = dataStructure.folder_base_name + '.jpg';
      if (_.isFunction(extraOperationFromAfterNameDefined)) {
        extraOperationFromAfterNameDefined(dataStructure);
      }
      cb(null, dataStructure.secret_base_map_file);
    }
  });
  return mulOperation({
    fileFilter: fileFilterFn,
    storage: _storage,
    //   dest: __parentDir + '/tmp/',
    limits: {fileSize: 104857600, files: 1}
  }).single(upload_file_field);
};

const wrap_process_tilingmap = function (basemap, req, res, next_step) {

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
  var mapSlicer = null;
  var uploadStarter = setupUploader(O, function (data) {
    mapSlicer = defineSlicer({
      file: base_folder + data.folder_base_name + "/" + data.secret_base_map_file,
      //file: base_folder + base_name + '/' +O. secret_base_map_file,
      // (required) Huge image to slice
      output: base_folder + data.folder_base_name + "/{z}/t_{y}_{x}.jpg"
      // Output file pattern
    }, basemap, function (err) {
      console.log(logTag, "==========================================");
      console.log(logTag, "==> mapSlicer error  =");
      console.log(logTag, "==========================================");
      console.log(err);
      console.log(logTag, "==========================================");
    }, function (end) {

      console.log(logTag, "==> mapSlicer progress complete  =");
      return next_step(O);
    });
  }, function (err) {
    console.log(logTag, "==========================================");
    console.log(logTag, "==> uploadStarter error  =");
    console.log(logTag, "==========================================");
    return next_step(err);
  });

  // console.log(req);
  // var tmp_path = req.files["art"].path;
  // var isArtDefined = !_.isNull(req.files["art"]);
  // var isArtDefined = !_.isNull(req.body["art"]);
  // console.log(req.files);
  // if (req.files && isArtDefined) {

  uploadStarter(req, res, function (err) {
    if (err) {
      console.log(logTag, "error from upload", +err.message);
      return next_step(err);
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
        // output.outResErro(notworking, res);
        return next_step(err);
      } else {
        if (req.params.owner != null) {
          O.owner = req.params.owner;
        } else {
          console.log("====================================");
          console.log("warning there is no owner id for this basemap..");
          console.log("====================================");
        }
        basemapInfo.start(basemap, O, function (id) {
          O.carry_id = id;
          // output.outResSuccess(O, res);
          mapSlicer.start();
         // return next_step(O);
        }, function (err) {
          // output.outResErro(err.message, res);
          return next_step(err);
        });
      }
    });
  });
};

const wrap_process_regular = function (basemap, req, res, next_step) {
//res.writeHead(200);
//http://www.scantips.com/basics1d.html
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
  var uploadStarter = setupUploader(O, null, function (err) {
    return next_step(err);
  });
  uploadStarter(req, res, function (err) {
    if (_.isError(err)) {
      console.log(logTag, "error from upload", +err.message);
      //output.outResErro(err.message, res);
      next_step(err);
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
      if (_.isError(err)) {
        var notworking = 'resize image does\'t work and you may check for the installation of gm or imagemagick. error from resizing image';
        console.log(logTag, notworking);
        return next_step(err);
      }
      if (req.params.owner != null) {
        O.owner = req.params.owner;
      } else {
        console.log("====================================");
        console.log("warning there is no owner id for this basemap..");
        console.log("====================================");
      }
      basemapInfo.start(basemap, O, function (id) {
        O.carry_id = id;
        next_step(O);
      }, function (err) {
        next_step(err);
      });

    });
  });
};
//limit is 100mb
//https://github.com/martinheidegger/mapslice
//https://www.npmjs.com/package/multer
//Add your routes here, etc.
function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}
module.exports.uploadRegular = function (app, req, res) {
  var model_base_map = app.models.Basemap;
  var model_user = app.models.user;
  wrap_process_regular(model_base_map, req, res, function (result) {
    if (_.isError(result)) {
      return output.outResErro(result.message, res);
    }
    var _id = result.carry_id;

    if (req.params.owner != null) {
      //console.info(logTag, "Id adding..");
      result["owner"] = req.params.owner;
      result["listing.enabled"] = true;
    } else {
      return output.outResSuccess(result, res);

    }
    basemapInfo.localUploadProgressComplete(model_base_map, model_user, _id, result, function (err) {
      if (_.isError(err)) {
        return res(err);
      }
      console.log(logTag, "save and update complete status");
      output.outResSuccess(result, res);
      delete result.carry_id;
      delete result.complete;
      // res(result);
      console.log(logTag, "regular images of 2 transfer to S3 now");
      s3thread.transferSimpleSingleSmallMapS3(model_base_map, _id, result);
    });

  });
};

module.exports.uploadTiling = function (app, req, res) {
  //IF u have large image then. use this to avoid timeout..
  //req.connection.setTimeout(120000);
  var model_base_map = app.models.Basemap;
  var model_user = app.models.user;
  wrap_process_tilingmap(model_base_map, req, res, function (result) {
    if (_.isError(result)) {
      return output.outResErro(result.message, res);
    }
    var _id = result.carry_id;

    if (req.params.owner != null) {
      console.info(logTag, "Id adding..");
      result["owner"] = req.params.owner;
      result["listing.enabled"] = false;
    } else {
      return output.outResSuccess(result, res);
    }
    console.info(logTag, "Finished processing slices. start saving to DB.");
    console.info(logTag, "Process before --------------------", result);


    basemapInfo.localUploadProgressComplete(model_base_map, model_user, _id, result, function (err) {
      if (_.isError(err)) {
        console.info(logTag, "stop here because of the error.");
        return output.outResErro(err.message, res);
      }

      console.log(logTag, "save and update complete status");
      delete result.carry_id;
      delete result.complete;
      console.log(logTag, "all local images are transfering to S3 cloud now.");
      s3thread.transferSyncBaseMapS3(model_base_map, _id, result);
      return output.outResSuccess(result, res);
    });
  });
};
