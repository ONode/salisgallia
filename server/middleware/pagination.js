/**
 * Created by hesk on 17年2月7日.
 */
"use strict";
const mlog = "pagination";
module.exports.pagination = function (ctx, next) {
  //const  ctx = LoopBackContext.getCurrentContext();
  // console.log("check remote Context", ctx);
  let _filter = {};
  if (ctx.args && ctx.args.filter) {
    _filter = ctx.args.filter.where;
    console.log(mlog, "--- final filter ---", _filter);
  }
  const Lm = parseInt(ctx.args.filter.limit);
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
};
module.exports.paginationKs = function (ctx, next) {
  let _filter = {};
  if (!ctx.res._headerSent && ctx && ctx.args.filter) {
    _filter = ctx.args.filter;
    //console.log(mlog, "--- final filter ---", _filter);
    const max_limit = parseInt(ctx.args.filter.limit);
    if (max_limit > 0 && ctx.args.result) {
      ctx.res.set('X-Total-PPG', max_limit);
      ctx.res.set('X-Total-Count', ctx.args.result.count);
      ctx.res.set('X-Total-Pages', ctx.args.result.page);
    }
    next();
  } else {
    next();
  }
};
