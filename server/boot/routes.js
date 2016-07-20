// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
const createbasemap = require("../../common/logic/basemapcreate");
module.exports = function (app) {
  // Install a "/ping" route that returns "pong"
  app.get('/ping', function (req, res) {
    res.send('pong');
  });
  console.log('> created /ping request router');
  var Basemap = app.models.Basemap;
  app.post('/sbupload', function (req, res) {
    createbasemap(Basemap, req, res);
  });
  console.log('> created /sbupload request router');
};
