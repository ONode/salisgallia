/**
 * Created by hesk on 16年10月11日.
 */
const
  tool_crypt = require('crypto'),
  numCPUs = require('os').cpus.length,
  path = require('path'),
  uploaderMU = require('multer'),
  mapSliceArc = require('mapslice'),
  output = require('.././util/outputjson.js'),
  rmdir = require('.././util/rmdir.js'),
  _ = require('lodash'),
  async = require('async'),
  fse = require('fs-extra'),
  _moduleIm = require('imagemagick'),
  s3thread = require('./transferS3.js'),
  colorPaletteGenerator = require('colors-palette'),
  basemapInfo = require('./basemapinfo.js')

  ;

const
  logTag = "> mapMakerPre.js",
  __parentDir = path.dirname(module.main),
  saltFile = "cath52i43#$#^ebs*^%$ig69",
  upload_file_field = "art",
  upload_helper_folder = __parentDir + "/storage/tmp/tmpsgi/",
  base_folder = __parentDir + "/storage/tmp/storage_f/",
  base_folder_process = __parentDir + "/storage/tmp/tmpsgi/",
  public_folder_path = "/static/storage_f/"

  ;


var setupUploader = function (_data_pre, extraOperationFromAfterNameDefined, callback_err) {
  var _storage = uploaderMU.diskStorage({
    destination: function (req, file, cb) {
      console.log(logTag, '==================================');
      console.log(logTag, 'check folder structure and define upload folder structures');
      console.log(logTag, '==================================');

      _data_pre.folder_base_name = 'basemap-' + Date.now();
      _data_pre.folder_path = public_folder_path + _data_pre.folder_base_name + "/";
      var folder_tmp = base_folder + _data_pre.folder_base_name;
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
        .update(_data_pre.folder_base_name)
        .digest('hex');

      _data_pre.secret_base_map_file = hash.substring(0, 18) + '.jpg';
      _data_pre.rename_file = _data_pre.folder_base_name + '.jpg';

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
  __parentDir: path.dirname(module.main),
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
  s3thread: s3thread,
  basemapInfo: basemapInfo,
  setupUploader: setupUploader,
  colorPalGen: colorPaletteGenerator

};
