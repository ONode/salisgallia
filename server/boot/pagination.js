/**
 * Created by zJJ on 7/26/2016.
 */
const log = "> filter object";
const _ = require('lodash');
module.exports = function (app) {
  var remotes = app.remotes();
  remotes.after('*.find', function (ctx, next) {
    var filter;
    /*    var currentPage = Number(options.page) || 1;
     var resultsPerPage = Number(options.perPage) || 8;
     var maxPages = Number(options.maxPages) || 10;       */
    if (ctx.args && ctx.args.filter) {
      console.log(log, ctx.args.filter);
      filter = ctx.args.filter.where;
    }
    if (!ctx.res._headerSent && ctx.args.filter.limit > 0) {

      //additional filter requirement
      //ctx.args.filter.where['complete'] = 100;

      
      // console.log('> ctx.res._headerSentt', ctx.res._headerSent);
      this.count(filter, function (err, count) {
        ctx.res.set('X-Total-Count', count);
        ctx.res.set('X-Total-Pages', Math.floor(count / ctx.args.filter.limit) + 1);
        next();
      });
    } else {
      next();
    }
  });
};
