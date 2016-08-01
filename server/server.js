// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
//app.use(loopback.token({model: app.models.accessToken}));
app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};
//app.use(require(".././common/routerisland/express_status"));
//app.use(require(".././common/routerisland/common_upload_slice"));
/*
 Using the technique shown above, the application will still run all the boot scripts in /server/boot in alphabetical order (unless you move or delete them) after your custom-ordered boot scripts specified in bootScripts.
 */
app.buildError = function (err) {
  err.message = 'Custom message: ' + err.message;
  err.status = 408; // override the status
  // remove the statusCode property
  delete err.statusCode;
  return err;
};

app.use(loopback.token({model: app.models.accessToken, currentUserLiteral: 'me'}));
/*var bootOptions = {
 "appRootDir": __dirname,
 "bootScripts": [
 "/full/path/to/boot/script/first.js",
 "//full/path/to/boot/script/second.js"
 ]
 };*/
// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.

boot(app, __dirname, function (err) {
  if (err) throw err;
  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
