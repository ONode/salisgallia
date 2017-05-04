"use strict";
const pre = require("./preMap");
const resizeModule = require("./resize_queue");
const logTag = "> mapMakerV2";
const makeMaker = function (app, req, res) {
  /**
   * as a new item object, the id cannot presented
   * @type {{carry_id: string, complete: number, total_zoom_levels: Array, folder_base_name: string, secret_base_map_file: string, rename_file: string, folder_path: string, owner: string}}
   */
  const OThis = {
    carry_id: "",
    complete: -1,
    total_zoom_levels: [],
    folder_base_name: "",
    secret_base_map_file: "",
    rename_file: "",
    folder_path: "",
    mid_size: "",
    owner: req.params.owner == null ? "" : req.params.owner,
    replace_map: req.params.sku == null ? "" : req.params.sku,
  };
  let temp_id = "";
  this.new_map_item = pre._.isEmpty(OThis.replace_map);
  this.model_base_map = app.models.Basemap;
  this.model_user = app.models.user;
  this.res = res;
  this.req = req;
  if (!this.new_map_item) {
    temp_id = OThis.replace_map;
  }
  delete OThis.replace_map;
  this.O = OThis;
  if (!this.new_map_item) {
    this.O.id = temp_id;
  }
};
makeMaker.prototype.getModels = function () {
  return {
    lb_basemap: this.model_base_map,
    lb_user: this.model_user
  }
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

makeMaker.prototype.define_slicer = function (mapSlicer, errCallback, endCallback) {

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
    const percentNum = Math.round(progress * 100);
    const percentActual = Math.round(progress * 50);
    console.info(logTag, "dataStructure.carry_id: ", this.O.id);
    if (this.O.id != null) {

      pre.basemapInfo.progress(
        this.model_base_map,
        percentActual,
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

makeMaker.prototype.setupTilingReplace = function (next_step, post_process) {
  const msg_1 = "> This is the upload for replace the existing sku product image - " + this.O.id;
  console.log(msg_1);
  this.model_base_map.findOne({where: {id: this.O.id}}, function (err, doc) {
    if (pre._.isError(err) || doc === null) {
      return next_step(err);
    }
    const uploader = pre.setUploadRepl(doc, function (err) {
        console.log(logTag, "==========================================");
        console.log(logTag, "==> uploadStarter error  =");
        console.log(logTag, "==========================================");
        return next_step(err);
      }
    );
    const folder_base_name = doc.folder_base_name;
    const secret_base_map_file = doc.secret_base_map_file;
    const rename_file = doc.rename_file;
    const mid_size = doc.mid_size;
    const local_path = doc.folder_path;

    uploader(this.req, this.res, function (err) {
      if (pre._.isError(err)) {
        console.log(logTag, "error from upload", err.message);
        return next_step(err);
      }

      this.resize_queue(folder_base_name, secret_base_map_file, rename_file, mid_size,
        function (err) {

          const mapSlicerCore = pre.mapSliceArc(pre._.extend({
            file: pre.base_folder + folder_base_name + "/" + secret_base_map_file,
            output: pre.base_folder + folder_base_name + "/{z}/t_{y}_{x}.jpg"
          }, pre.updatebasicconfig));


          /**
           * start slicing the map
           */

          this.define_slicer(
            mapSlicerCore,
            function (err) {
              console.log(logTag, "==========================================");
              console.log(logTag, "==> mapSlicer error  =====================");
              console.log(logTag, "==========================================");
              console.log(err);
            },

            function (endPack) {
              console.log(logTag, "==========================================");
              console.log(logTag, "==> mapSlicer progress complete  =");
              console.log(logTag, "==========================================");
              return post_process(endPack);
            }).start();


          /**
           * end of slicing the map
           */
        }.bind(this));
    }.bind(this));
  });
};
makeMaker.prototype.setupTiling = function (next_step, post_process) {
  const uploadStarter = pre.setupUploader(
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
    /**
     * resize queue started
     */
    this.resize_queue(this.O.folder_base_name, this.O.secret_base_map_file, this.O.rename_file, this.O.mid_size, function (err) {
      if (pre._.isError(err)) {
        return next_step(err);
      }

      const mapSlicerCore = pre.mapSliceArc(pre._.extend(this.defineSlicerConfig(), pre.updatebasicconfig));

      /**
       * save new basic meta data for this uploading map
       */
      pre.basemapInfo.startNewMapData(this.model_base_map, this.O, function (new_map_ID) {
          this.O.id = new_map_ID;

          /**
           * start the operation for mapslicing
           */
          this.define_slicer(
            mapSlicerCore,
            function (err) {
              console.log(logTag, "==========================================");
              console.log(logTag, "==> mapSlicer error  =====================");
              console.log(logTag, "==========================================");
              console.log(err);
            },

            function (endPack) {
              console.log(logTag, "==========================================");
              console.log(logTag, "==> mapSlicer progress complete  =");
              console.log(logTag, "==========================================");
              return post_process(endPack);
            }).start();

          return next_step(this.O);
        }.bind(this),

        function (err) {
          return next_step(err);
        });

      /**
       * end map slicing
       */

    }.bind(this));

  }.bind(this));
  //end start upload
};

makeMaker.prototype.resize_queue = function (folder_base_name, secret_base_map_file, rename_file, mid_size, next) {
  const resizeOp = new resizeModule.core();
  resizeOp.setSrcPath(pre.base_folder + folder_base_name + "/" + secret_base_map_file);
  resizeOp.enableAutoRotateOnRootImage();
  resizeOp.appendOperation({
    width: 256,
    dstPath: pre.base_folder + folder_base_name + "/" + rename_file
  });
  resizeOp.appendOperation({
    width: 1000,
    dstPath: pre.base_folder + folder_base_name + "/" + mid_size
  });
  resizeOp.execute(function (err) {
    if (pre._.isError(err)) {
      const kk = 'resize image does\'t work and you may check for the installation of gm or imagemagick. error from resizing image';
      console.log(logTag, kk);
      return next(err);
    }
    return next();
  })
};
makeMaker.prototype.updateThisO = function (data) {
  console.log(logTag, "==========================================");
  console.log(logTag, "===> preview upload update metadata ======");
  console.log(logTag, "===> extracted from the uploader process", data);

  if (!pre._.isEmpty(data)) {
    /**
     * This is only for the processing folder path
     */
    this.O.folder_path = data.folder_path;
    this.O.folder_base_name = data.folder_base_name;
    this.O.secret_base_map_file = data.secret_base_map_file;
    this.O.rename_file = data.rename_file;
    this.O.mid_size = data.mid_size;
  }
  console.log(logTag, "============================");
};

makeMaker.prototype.setupPlain = function (next_step) {
  if (this.new_map_item) {
    const uploadStarter = pre.setupUploader(
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
        console.log(logTag, "error from upload", err.message);
        //output.outResErro(err.message, res);
        return next_step(err);
      }
      /**
       * resize queue started
       */
      this.resize_queue(this.O.folder_base_name, this.O.secret_base_map_file, this.O.rename_file, this.O.mid_size, function (err) {
        if (pre._.isError(err)) {
          return next_step(err);
        }
        /**
         * making the new map in the database
         * @type {number}
         */
        this.O.complete = 50;
        pre.basemapInfo.startNewMapData(
          this.model_base_map,
          this.O,

          function (id) {
            this.O.id = id;
            next_step(this.O);
          }.bind(this),

          function (err) {
            return next_step(err);
          });

        /**
         * new map complete
         */


      }.bind(this));


    }.bind(this));

  } else {
    const msg_1 = "> This is the upload for replace the existing sku product image - " + this.O.id;
    console.log(msg_1);
    this.model_base_map.findOne({where: {id: this.O.id}}, function (err, doc) {
      if (pre._.isError(err) || doc === null) {
        return next_step(err);
      }
      const replUpload = pre.setUploadRepl(doc, function (err) {
        return next_step(err);
      });
      const folder_base_name = doc.folder_base_name;
      const secret_base_map_file = doc.secret_base_map_file;
      const rename_file = doc.rename_file;
      const mid_size = doc.mid_size;
      const local_path = doc.folder_path;

      /**
       * upload images from the request endpoint
       */
      replUpload(this.req, this.res, function (err) {
        if (pre._.isError(err)) {
          console.log(logTag, "error from upload", err.message);
          return next_step(err);
        }
        /**
         * resize queue started
         */
        this.resize_queue(folder_base_name, secret_base_map_file, rename_file, mid_size, function (err) {
          if (pre._.isError(err)) {
            return next_step(err);
          }
          /**
           * making the new map in the database
           * @type {number}
           */
          this.model_base_map.findOne({where: {id: this.O.id}}, function (err, doc) {
            doc.updateAttributes({complete: 50}, function (err, count) {

              if (pre._.isError(err)) {
                return next_step(err);
              }

              return next_step(doc);
            });
          });
          /**
           * new map complete
           */
        }.bind(this));

      }.bind(this));

    }.bind(this));

  }
};

/**
 * tiles map setup plan
 * @param app - application
 * @param req - request
 * @param res - response
 */
const v2 = function (app, req, res) {
  let process = null;

  if (!(process instanceof makeMaker)) {
    process = new makeMaker(app, req, res);
  } else {
    console.info(logTag, "There are existing pip working...   --->", process);
  }
  if (process.new_map_item) {
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
        const item_id = result.id;

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
            console.log(logTag, "all local images are transferring to S3 cloud now.");

            pre.s3thread.transferSyncBaseMapS3(process.getModels().lb_basemap, item_id, result);
          });

      });
  } else {
    process.setupTilingReplace(function (result) {
      if (pre._.isError(result)) {
        return pre.output.outResErro(result.message, res);
      }
      return pre.output.outResSuccess(result, res);
    }, function (result) {
      /**
       * the map id
       */
      const item_id = this.O.id;
      console.info(logTag, "Replace tiling map id:", item_id);
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
          console.log(logTag, "all local images are transferring to S3 cloud now.");

          pre.s3thread.transferSyncBaseMapS3(process.getModels().lb_basemap, item_id, result);
        });

    });
  }
};
/**
 * plain image uploader
 * @param app - application
 * @param req - request
 * @param res - response
 */
const v1 = function (app, req, res) {
  let process = null;

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

    const item_id = result.id;
    console.info(logTag, "Finished processing slices. start saving to DB.");
    console.info(logTag, "Process before -------------------->", result);

    pre.s3thread.transferSimpleSingleSmallMapS3(process.getModels().lb_basemap, process.getModels().lb_user, item_id, result);

    console.info(logTag, "============================================");
    console.info(logTag, "Header out put -------------------->", result);
    console.info(logTag, "============================================");

    return pre.output.outResSuccess(result, res);
  });
};
const v3 = function (app, req, res) {

};
module.exports.uploadRegular = v1;
module.exports.uploadTiling = v2;
module.exports.uploadRegularTest = v3;
