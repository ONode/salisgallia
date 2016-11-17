/**
 * Created by hesk on 16年11月17日.
 */
module.exports = function (app) {
  /**
   * we can implement this after the accesstoken part is enabled.
   */
  /*var uuid = require('node-uuid');
   app.dataSources.storage.connector.getFilename = function (file, req, res) {
   var origFilename = file.name;
   var parts = origFilename.split('.'),
   extension = parts[parts.length - 1];
   var newFilename = (new Date()).getTime() + '_' + req.accessToken.userId + '.' + extension;
   return uuid.v1() + '/' + newFilename;
   };*/
};
