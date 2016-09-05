// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
const
  createbasemap = require("../../common/logic/basemapcreate"),
  createbasestd = require("../../common/logic/basemapstd"),
  clearall = require("../../common/logic/clearallfolders"),
  path = require("path"),
  express = require('express'),
  timeout = require('req-timeout')
  ;
const
  __parentDir = path.dirname(module.main)
  ;
module.exports = function (app) {
  // Install a "/ping" route that returns "pong"
  app.get('/ping', function (req, res) {
    res.send('pong');
  });
  console.log('> created /ping request router');
  app.post('/sbupload', function (req, res) {
    var model_instance = app.models.Basemap;
    createbasemap(model_instance, req, res);
  });
  app.post('/sbuploadstd', function (req, res) {
    var model_instance = app.models.Basemap;
    createbasestd(model_instance, req, res);
  });
  app.post('/api/basemapupload/:owner/', function (req, res) {
    var model_instance = app.models.Basemap;
    req.resetTimeout(120000);
    createbasemap(model_instance, req, res);
  });
  app.post('/api/basemapnonstd/:owner/', function (req, res) {
    var model_instance = app.models.Basemap;
    createbasestd(model_instance, req, res);
  });
  console.log('> created /sbupload request router');
  app.use('/static', express.static(__parentDir + "/storage/tmp/"));
  console.log('> server static file path is created and started from http://{domain}/static');

  app.use('/removeallxxx', function (req, res) {
    var Basemap_model = app.models.Basemap;
    clearall(Basemap_model, req, res);
  });

  app.use('/first_install', function (req, res) {
    var Basemap_model = app.models.Basemap;
    clearall(Basemap_model, req, res);
  });
  console.log('> remove all uploaded tmp files with http://{domain}/removeallxxx');

};
