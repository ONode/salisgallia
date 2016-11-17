/**
 * Created by zJJ on 7/26/2016.
 */
const log = "> filter object";
//const _ = require('lodash');
module.exports = function (app) {
  var remotes = app.remotes();
 /* remotes.before('*.find', function (ctx, next) {
    console.log(log, "===============");
    var _filter = {};
    if (ctx.args && ctx.args.filter) {
      console.log(log, ctx.args.filter);
      _filter = ctx.args.filter;
      ctx.args.filter.include = ["folder_base_name", "secret_base_map_file"];
    }
    console.log(log, " before query the ids", _filter);
    next();
  });*/
  remotes.after('*.find', function (ctx, next) {
    var _filter = {};
    /*    var currentPage = Number(options.page) || 1;
     var resultsPerPage = Number(options.perPage) || 8;
     var maxPages = Number(options.maxPages) || 10;       */
    if (ctx.args && ctx.args.filter) {
     // console.log(log, ctx.args.filter);
      _filter = ctx.args.filter.where;
      console.log(log, " --- final filter --- ", _filter);
    }
    if (!ctx.res._headerSent && ctx.args.filter.limit > 0) {
      //additional filter requirement
      //ctx.args.filter.where['complete'] = 100;
      // console.log('> ctx.res._headerSentt', ctx.res._headerSent);
      this.count(_filter, function (err, count) {
        ctx.res.set('X-Total-Count', count);
        ctx.res.set('X-Total-Pages', Math.floor(count / ctx.args.filter.limit) + 1);
        //  console.log(log, "entered count filter");
        next();
      });
       // console.log(log, "header and enter in the filter and exit now. ");
    } else {
      next();
    }
  });
};
