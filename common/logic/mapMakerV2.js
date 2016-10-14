const pre = require("./mapMakerPre.js");
const logTag = "> mapMakerV2";
var makeMaker = function (app, req, res) {
  /**
   * as a new item object, the id cannot presented
   * @type {{carry_id: string, complete: number, total_zoom_levels: Array, folder_base_name: string, secret_base_map_file: string, rename_file: string, folder_path: string, owner: string}}
   */
  var OThis = {
    carry_id: "",
    complete: -1,
    total_zoom_levels: [],
    folder_base_name: "",
    secret_base_map_file: "",
    rename_file: "",
    folder_path: "",
    owner: req.params.owner == null ? "" : req.params.owner
  };

  this.model_base_map = app.models.Basemap;
  this.model_user = app.models.user;
  this.res = res;
  this.req = req;
  this.O = OThis;
};
makeMaker.prototype.getModels = function () {
  return {
    lb_basemap: this.model_base_map,
    lb_user: this.model_user
  }
};
makeMaker.prototype.setupBasePathForResize = function () {
  var a = pre.base_folder + this.O.folder_base_name + "/" + this.O.secret_base_map_file;
  var b = pre.base_folder + this.O.folder_base_name + "/" + this.O.rename_file;
  console.log("====================================");
  console.log("=======create resize input==========");
  console.log("====================================");
  console.log(logTag, a);
  console.log(logTag, b);
  console.log("====================================");
  return {
    width: 1000,
    height: 400,
    srcPath: a,
    dstPath: b
  };
};

makeMaker.prototype.defineSlicerConfig = function () {
  return {
    file: pre.base_folder + this.O.folder_base_name + "/" + this.O.secret_base_map_file,
    //file: base_folder + base_name + '/' +O. secret_base_map_file,
    // (required) Huge image to slice
    output: pre.base_folder + this.O.folder_base_name + "/{z}/t_{y}_{x}.jpg"
    // Output file pattern
  };
};

makeMaker.prototype.define_slicer = function (errCallback, endCallback) {
  var mapSlicer = pre.mapSliceArc(pre._.extend(this.defineSlicerConfig(), pre.updatebasicconfig));
  mapSlicer.on("start", function (files, options) {
    console.info("Starting to process " + files + " files.");
  }.bind(this));

  mapSlicer.on("error", function (err) {
    if (pre._.isFunction(errCallback)) {
      return errCallback(err);
    }
    console.error(err);
  }.bind(this));

  mapSlicer.on("progress", function (progress, total, current, file) {
    var percentNum = Math.round(progress * 100);
    var percent = percentNum + "%";
    //console.info("Progress: " + percent);
    console.info(logTag, "dataStructure.carry_id: ", this.O.id);
    if (this.O.id != null) {

      pre.basemapInfo.progress(
        this.model_base_map, percentNum / 2,
        this.O.id,
        null);
    }
  }.bind(this));

  mapSlicer.on("end", function () {
    if (pre._.isFunction(endCallback)) {
      return endCallback(this.O);
    }
  }.bind(this));

  mapSlicer.on("levels", function (levels_found) {
    this.O.total_zoom_levels = levels_found;
    console.info("Levels calculated: ", levels_found.length);
  }.bind(this));

  return mapSlicer;
};


makeMaker.prototype.setupTiling = function (next_step, post_process) {
  var uploadStarter = pre.setupUploader(
    this.O,

    function (dataThisBaseO) {
      this.updateThisO(dataThisBaseO);
    }.bind(this),

    function (err) {
      console.log(logTag, "==========================================");
      console.log(logTag, "==> uploadStarter error  =");
      console.log(logTag, "==========================================");
      return next_step(err);
    }
  );

  if (pre._.isEmpty(this.O.owner)) {
    console.log("================================================");
    console.log("warning there is no owner id for this basemap...");
    console.log("================================================");
    return next_step(new Error("owner id not present"));
  }


  uploadStarter(this.req, this.res, function (err) {
    if (pre._.isError(err)) {
      console.log(logTag, "error from upload", +err.message);
      return next_step(err);
    }

    pre.imageMagic.resize(this.setupBasePathForResize(), function (err) {

      if (pre._.isError(err)) {
        var kk = 'resize image does\'t work and you may check for the installation of gm or imagemagick. error from resizing image';
        console.log(logTag, kk);
        return next_step(err);
      }


      pre.basemapInfo.startNewMapData(this.model_base_map, this.O, function (new_map_ID) {
          this.O.id = new_map_ID;
          var mapSlicer = this.define_slicer(
            function (err) {
              console.log(logTag, "==========================================");
              console.log(logTag, "==> mapSlicer error  =====================");
              console.log(logTag, "==========================================");
              console.log(err);
              console.log(logTag, "==========================================");
            },


            function (endPack) {
              console.log(logTag, "==========================================");
              console.log(logTag, "==> mapSlicer progress complete  =");
              console.log(logTag, "==========================================");
              return post_process(endPack);
            });

          mapSlicer.start();

          return next_step(this.O);
        }.bind(this),

        function (err) {
          return next_step(err);
        });

    }.bind(this));
  }.bind(this));
  //end start upload
};

makeMaker.prototype.updateThisO = function (data) {
  console.log(logTag, "==========================================");
  console.log(logTag, "========> preview upload update metadata =");
  console.log(logTag, "==============> extracted from the uploader process", data);

  if (!pre._.isEmpty(data)) {
    this.O.folder_base_name = data.folder_base_name;
    this.O.folder_path = data.folder_path;
    this.O.secret_base_map_file = data.secret_base_map_file;
    this.O.rename_file = data.rename_file;
  }
  console.log(logTag, "==========================================");
};

makeMaker.prototype.setupPlain = function (next_step) {
  var uploadStarter = pre.setupUploader(
    this.O,

    function (dataThisBaseO) {
      this.updateThisO(dataThisBaseO);
    }.bind(this),

    function (err) {
      return next_step(err);
    });
  if (pre._.isEmpty(this.O.owner)) {
    console.log("================================================");
    console.log("warning there is no owner id for this basemap...");
    console.log("================================================");
    return next_step(new Error("owner id not present"));
  }
  uploadStarter(this.req, this.res, function (err) {
    if (pre._.isError(err)) {
      console.log(logTag, "error from upload", +err.message);
      //output.outResErro(err.message, res);
      return next_step(err);
    }

    pre.imageMagic.resize(this.setupBasePathForResize(), function (err) {
      if (pre._.isError(err)) {
        var notworking = 'resize image does\'t work and you may check for the installation of gm or imagemagick. error from resizing image';
        console.log(logTag, notworking);
        return next_step(err);
      }

      pre.basemapInfo.startNewMapData(this.model_base_map, this.O, function (id) {
          this.O.id = id;
          next_step(this.O);
        }.bind(this),

        function (err) {
          return next_step(err);
        });

    }.bind(this));
  }.bind(this));
};

/**
 * tiles map setup plan
 * @param app - application
 * @param req - request
 * @param res - response
 */
var v2 = function (app, req, res) {
  var process = null;

  if (!(process instanceof makeMaker)) {
    process = new makeMaker(app, req, res);
  } else {
    console.info(logTag, "There are existing pip working...   --->", process);
  }

  process.setupTiling(
    function (result) {
      if (pre._.isError(result)) {
        return pre.output.outResErro(result.message, res);
      }
      return pre.output.outResSuccess(result, res);
    },
    function (result) {
      /**
       * the map id
       */
      var item_id = result.id;

      console.info(logTag, "Finished processing slices. start saving to DB.");
      console.info(logTag, "Process before ------------------>", result);

      if (pre._.isEmpty(result)) {
        return pre.output.outResErro("empty result", res);
      }

      pre.basemapInfo.localUploadProgressComplete(
        process.getModels().lb_basemap,
        process.getModels().lb_user,
        item_id,
        result,

        function (err) {
          if (pre._.isError(err)) {
            console.info(logTag, "stop here because of the error.");
            return pre.output.outResErro(err.message, res);
          }
          console.log(logTag, "save and update complete status");
          console.log(logTag, "all local images are transfering to S3 cloud now.");

          pre.s3thread.transferSyncBaseMapS3(
            process.getModels().lb_basemap,
            item_id,
            result);
        });

    });
};
/**
 * plain image uploader
 * @param app - application
 * @param req - request
 * @param res - response
 */
var v1 = function (app, req, res) {
  var process = null;

  if (!(process instanceof makeMaker)) {
    process = new makeMaker(app, req, res);
  } else {
    console.info(logTag, "There are existing pip working...   --->", process);
  }

  process.setupPlain(function (result) {
    if (pre._.isError(result)) {
      return pre.output.outResErro(result.message, res);
    }

    if (pre._.isEmpty(result)) {
      return pre.output.outResErro("empty result", res);
    }

    var item_id = result.id;
    console.info(logTag, "Finished processing slices. start saving to DB.");
    console.info(logTag, "Process before -------------------->", result);

    pre.s3thread.transferSimpleSingleSmallMapS3(
      process.getModels().lb_basemap,
      process.getModels().lb_user,
      item_id,
      result);

    console.info(logTag, "============================================");
    console.info(logTag, "header out put -------------------->", result);
    console.info(logTag, "============================================");

    return pre.output.outResSuccess(result, res);
  });
};
var v3 = function (app, req, res) {

};
module.exports.uploadRegular = v1;
module.exports.uploadTiling = v2;
module.exports.uploadRegularTest = v3;
