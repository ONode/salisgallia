



const
__parentDir = require('app-root-path');

console.log("----------");
console.log(__parentDir);

const
  tool_crypt = require('crypto'),
  numCPUs = require('os').cpus.length,
  uploaderMU = require('multer'),
  mapSliceArc = require('mapslice'),
  output = require('.././util/outputjson.js'),
  rmdir = require('.././util/rmdir.js'),
  _ = require('lodash'),

  async = require('async'),
  fse = require('fs-extra'),
  _moduleIm = require('zyn-imagemagick'),
  uploaderS32 = require('./s3upload'),
  colorPaletteGenerator = require('colors-palette'),
  basemapInfo = require('./basemapinfo.js'),


  logTag = "> preMap.js",
  saltFile = "cath52i43#$#^ebs*^%$ig69",
  upload_file_field = "art",
  upload_helper_folder = __parentDir + "/storage/tmp/tmpsgi/",
  base_folder = __parentDir + "/storage/tmp/storage_f/",
  base_folder_process = __parentDir + "/storage/tmp/tmpsgi/",
  public_folder_path = "/static/storage_f/"

  ;


var setupUploader = function (_data_pre, extraOperationFromAfterNameDefined, callback_err) {
  var _baseFolderName = "";
  var _storage = uploaderMU.diskStorage({
    destination: function (req, file, cb) {
      console.log(logTag, '==================================');
      console.log(logTag, 'check folder structure and define upload folder structures');
      console.log(logTag, '==================================');

      _baseFolderName = 'basemap-' + Date.now();
      _data_pre.folder_path = public_folder_path + _baseFolderName + "/";
      var folder_tmp = base_folder + _baseFolderName;
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
        .update(_baseFolderName)
        .digest('hex');

      _data_pre.secret_base_map_file = hash.substring(0, 18) + '.jpg';
      _data_pre.rename_file = _baseFolderName + '.jpg';
      _data_pre.mid_size = _baseFolderName + '_mid.jpg';
      _data_pre.folder_base_name = _baseFolderName;

      if (_.isFunction(extraOperationFromAfterNameDefined)) {
        extraOperationFromAfterNameDefined(_data_pre);
      }

      cb(null, _data_pre.secret_base_map_file);
    }
  });


  return uploaderMU({
    fileFilter: function fileFilter(req, file, cb) {
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
    },
    storage: _storage,
    //dest: __parentDir + '/tmp/',
    limits: {fileSize: 104857600, files: 1}
  }).single(upload_file_field);
};

/*
 colorPaletteGenerator("/path/to/img", 8, function(err, colors){
 if(err){
 console.error(err);
 return false;
 }
 console.log(colors);
 });
 */
module.exports = {
  logTag: logTag,
  __parentDir: __parentDir,
  saltFile: 'catherineboobsarebig69',
  upload_file_field: 'art',
  base_folder: base_folder,
  base_folder_process: base_folder_process,
  public_folder_path: public_folder_path,
  updatebasicconfig: {
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
  },
  _: _,
  numCPUs: numCPUs,
  mapSliceArc: mapSliceArc,
  output: output,
  rmdir: rmdir,
  async: async,
  fse: fse,
  imageMagic: _moduleIm,
  s3thread: uploaderS32,
  basemapInfo: basemapInfo,
  setupUploader: setupUploader,
  colorPalGen: colorPaletteGenerator

};
