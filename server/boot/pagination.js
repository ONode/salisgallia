/**
 * Created by zJJ on 7/26/2016.
 */
const log = "> filter object";
console.log("loading pagination module");
var pagin = require("./../middleware/pagination");
//const _ = require('lodash');
//var LoopBackContext = require('loopback-context');
module.exports = function (app) {
  var remotes = app.remotes();
  remotes.after('*.find', pagin.pagination);
};
