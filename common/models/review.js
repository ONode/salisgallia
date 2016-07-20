// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

module.exports = function(Review) {
  Review.beforeRemote('create', function(context, user, next) {
    context.args.data.date = Date.now();
    context.args.data.publisherId = context.req.accessToken.userId;
    next();
  });

  Review.observe('before save', function(ctx, next) {
    console.log('> Magazine before save triggered');
 /*   var model = ctx.instance;
    var coffeeShopService = Review.app.dataSources.CoffeeShopService;

    coffeeShopService.find(function(err, response, context) {
      if (err) throw err; //error making request
      if (response.error) {
        next('> response error: ' + response.error.stack);
      }
      model.coffeeShops = response;
      console.log('> coffee shops fetched successfully from remote server');
      //verify via `curl localhost:3000/api/Magazines`
      next();
    });*/
  });
  //https://github.com/strongloop/loopback-example-user-management/blob/master/common/models/user.js
};
