/**
 * Created by zJJ on 7/26/2016.
 */
const log = "> filter object";
console.log("loading pagination module");
const pagin = require("./../middleware/pagination");
//const _ = require('lodash');
//const  LoopBackContext = require('loopback-context');
module.exports = function (app) {
  const  remotes = app.remotes();
  remotes.after('*.find', pagin.pagination);
};
