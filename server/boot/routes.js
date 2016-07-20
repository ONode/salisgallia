// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
const

  createbasemap = require("../../common/logic/basemapcreate"),
  path = require("path"),
  express = require('express')

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
    var Basemap_model = app.models.Basemap;
    createbasemap(Basemap_model, req, res);
  });
  console.log('> created /sbupload request router');

  app.use('/static', express.static(__parentDir + "/storage/tmp/"));
  console.log('> server static file path is created and started from http://{domain}/static');
};
