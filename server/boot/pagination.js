/**
 * Created by zJJ on 7/26/2016.
 */
const log = "> filter object";
console.log("loading pagination module");
//const _ = require('lodash');
//var LoopBackContext = require('loopback-context');
module.exports = function (app) {
  var remotes = app.remotes();
  remotes.after('*.find', function (ctx, next) {
    //var ctx = LoopBackContext.getCurrentContext();
    // console.log("check remote Context", ctx);
    var _filter = {};
    if (ctx.args && ctx.args.filter) {
      _filter = ctx.args.filter.where;
      console.log(log, " --- final filter --- ", _filter);
    }
    var Lm = parseInt(ctx.args.filter.limit);
    if (!ctx.res._headerSent && Lm > 0) {
      this.count(_filter, function (err, count) {
        ctx.res.set('X-Total-PPG', Lm);
        ctx.res.set('X-Total-Count', count);
        ctx.res.set('X-Total-Pages', Math.floor(count / Lm) + 1);
        next();
      });
    } else {
      next();
    }
  });
};
