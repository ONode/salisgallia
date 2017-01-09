// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
const
  makerMap = require("../../common/logic/mapMakerV2.js"),
  clearall = require("../../common/logic/clearallfolders"),
  _ = require("lodash"),
  express = require("express"),
  timeout = require("req-timeout"),
  request = require("request"),
  __parentDir = require('app-root-path');

module.exports = function (app) {
  // Install a "/ping" route that returns "pong"
  app.get("/ping", function (req, res) {
    res.send("pong");
  });
  console.log("> created /ping request router");
  app.post("/api/basemapupload/:owner/", function (req, res) {
    makerMap.uploadTiling(app, req, res);
  });
  app.post("/api/basemapnonstd/:owner/", function (req, res) {
    makerMap.uploadRegular(app, req, res);
  });
  app.post("/api/basemap_std_test_upload/", function (req, res) {
    makerMap.uploadRegularTest(app, req, res);
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
  app.use("/.well-known/acme-challenge/VoIsK8u8Q1UtO5ngPbFOytwGgL_TwGS4fstTx7Sjd3c", function (req, res) {
    res.write("VoIsK8u8Q1UtO5ngPbFOytwGgL_TwGS4fstTx7Sjd3c.ZJ-PHo7PYvpQ_yjOBiq3jSQ85yBES9ASYB7uz8tkN6o");
    res.end();
  });

  app.use("/.well-known/acme-challenge/iSTxbvI4_Va4J5c1f1C5EMGvbxPkHI3Cqo87V5JId9k", function (req, res) {
    res.write("iSTxbvI4_Va4J5c1f1C5EMGvbxPkHI3Cqo87V5JId9k.ZJ-PHo7PYvpQ_yjOBiq3jSQ85yBES9ASYB7uz8tkN6o");
    res.end();
  });

  console.log("> remove all uploaded tmp files with http://{domain}/removeallxxx");
};
