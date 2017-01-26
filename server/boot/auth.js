var loopback = require('loopback');
module.exports= function (app) {
  app.use(loopback.token());

/*  app.use(function (req, res, next) {
    if (!req.accessToken) return next();

    app.models.User.findById(req.accessToken.userId, function (err, user) {
      if (err)   return next(err);
      if (!user) return next(new Error('No user with this access token was found.'));
      res.locals.currentUser = user;

      var loopbackContext = loopback.getCurrentContext();
      console.log('SERVER CTX?' + loopbackContext);
      if (loopbackContext) {
        loopbackContext.set('currentUser', user);
      } else {
        throw new Error('Current context is null.');
      }
      next();
    });
  });*/

};
