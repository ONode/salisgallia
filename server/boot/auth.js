"use strict";
const  loopback = require('loopback');
module.exports = function (app) {

  /*
   for cookie use only
   app.use(loopback.token(
   {
   model: app.models.accessToken,
   currentUserLiteral: 'me'
   }
   ));
   */
  // app.use(loopback.status());
  app.use(loopback.token(
    {
      currentUserLiteral: 'me',
      headers: ['X-Access-Token', 'AccessToken'],
    }
  ));
  app.remotes().phases
    .addBefore('invoke', 'options-from-request')
    .use(function (ctx, next) {
      if (!ctx.args.options) return next();
     // console.log('SERVER OPT', ctx.args.options);
      if (!ctx.args.options.accessToken) return next();
      /*  User.findById(ctx.args.options.accessToken.userId, function(err, user) {
       if (err) return next(err);
       ctx.args.options.currentUser = user;

       console.log('SERVER CTX?' + loopbackContext);

       next();
       });*/
     // let options = ctx.args.options.accessToken;
     // console.log('SERVER OPT', options);
      next();
    });


};
