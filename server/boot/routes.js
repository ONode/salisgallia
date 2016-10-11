// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
const
  imageUploader = require("../../common/logic/basemapcreate"),
  clearall = require("../../common/logic/clearallfolders"),
  path = require("path"),
  _ = require("lodash"),
  express = require("express"),
  timeout = require("req-timeout"),
  request = require("request")
  ;
const
  __parentDir = path.dirname(module.main)
  ;
module.exports = function (app) {
  // Install a "/ping" route that returns "pong"
  app.get("/ping", function (req, res) {
    res.send("pong");
  });
  console.log("> created /ping request router");
  app.post("/api/basemapupload/:owner/", function (req, res) {
    //req.resetTimeout(120000);
    //console.log(res);
    imageUploader.uploadTiling(app, req, res);
  });
  app.post("/api/basemapnonstd/:owner/", function (req, res) {
   // console.log(res);
    imageUploader.uploadRegular(app, req, res);
  });
  app.get("/api/config/", function (req, res) {
    var production = "https://cdn.rawgit.com/GDxU/gallerygo/master/configurations.json";
    var development = "https://rawgit.com/GDxU/gallerygo/master/configurations.json";
    request({url: development, json: true}, function (error, response, configuration_body) {
      if (_.isError(error)) {
        res.json({});
        return;
      }
      res.json(configuration_body);
    });
  });
  console.log("> created /sbupload request router");
  app.use("/static", express.static(__parentDir + "/storage/tmp/"));
  console.log("> server static file path is created and started from http://{domain}/static");
  app.use("/removeallxxx", function (req, res) {
    var Basemap_model = app.models.Basemap;
    clearall(Basemap_model, req, res);
  });
  app.use("/first_install", function (req, res) {
    var Basemap_model = app.models.Basemap;
    clearall(Basemap_model, req, res);
  });
  console.log("> remove all uploaded tmp files with http://{domain}/removeallxxx");
};
