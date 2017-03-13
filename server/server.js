// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict';
const  loopback = require('loopback');
const  boot = require('loopback-boot');
const  app = module.exports = loopback();
if (process.env.S3_ACCESS_KEY_ID == undefined) {
  console.log('Now search for .env file');
  require('dotenv').config();
}
//const  LoopBackContext = require('loopback-context');
//app.use(loopback.token({model: app.models.accessToken}));
/*
 app.use(LoopBackContext.perRequest());
 app.use(loopback.token());
 app.use(function setCurrentUser(req, res, next) {
 if (!req.accessToken) {
 return next();
 }
 app.models.UserModel.findById(req.accessToken.userId, function(err, user) {
 if (err) {
 return next(err);
 }
 if (!user) {
 return next(new Error('No user with this access token was found.'));
 }
 const  loopbackContext = LoopBackContext.getCurrentContext();
 if (loopbackContext) {
 loopbackContext.set('currentUser', user);
 }
 next();
 });
 });*/
app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    const  baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', app.get('url'));
    if (app.get('loopback-component-explorer')) {
      const  explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};
app.buildError = function (err) {
  err.message = 'Custom message: ' + err.message;
  err.status = 408; // override the status
  // remove the statusCode property
  delete err.statusCode;
  return err;
};
//app.use(require('compression'));
//app.use(loopback.token({model: app.models.accessToken, currentUserLiteral: 'me'}));
/*const  bootOptions = {
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
