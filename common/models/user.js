/**
 * Created by zJJ on 7/20/2016.
 */
var speakeasy = require('speakeasy');
var https = require('https');
var db = require('../../common/util/db.js');
module.exports = function (user) {


  user.requestCode = function (credentials, fn) {
    this.findOne({where: {email: credentials.email}}, function (err, user) {
      user.hasPassword(credentials.password, function (err, isMatch) {
        if (isMatch) {
          // Note that you'll want to change the secret to something a lot more secure!
          var code = speakeasy.totp({secret: 'APP_SECRET' + credentials.email});
          console.log('Two factor code for ' + credentials.email + ': ' + code);

          // [TODO] hook into your favorite SMS API and send your user their code!

          https.get(
            'https://rest.nexmo.com' +
            '/sms/json?api_key=[YOUR_KEY]&amp;api_secret=[YOUR_SECRET]' +
            '&amp;from=[YOUR_NUMBER]&amp;to=[USER_MOBILE_#]' +
            '&amp;text=Your+verification+code+is+' + code,
            function () {
              res.on('data', function (data) {
                // all done! handle the data as you need to
                fn(null, data);
              });
            }
          ).on('error', function () {
            // handle errors somewhow
            console.log('Error in here from using nexmo');
            var err = new Error('Sorry, nexmo is having issue from making the sms request!');
            err.statusCode = 401;
            err.code = 'LOGIN_FAILED';
            return fn(err);
          });

        } else {
          var err = new Error('Sorry, but that email and password do not match!');
          err.statusCode = 401;
          err.code = 'LOGIN_FAILED';
          return fn(err);
        }
      });
    });
  };

  // Set up remote methods from model config schema json.
  user.loginWithCode = function (credentials, fn) {
    var err = new Error('Sorry, but that verification code does not work!');
    err.statusCode = 401;
    err.code = 'LOGIN_FAILED';

    console.log("update", "loginWithCode");

    this.findOne({where: {email: credentials.email}}, function (err, user) {
      // And don't forget to match this secret to the one in requestCode()
      var code = speakeasy.totp({secret: 'APP_SECRET' + credentials.email});
      if (code !== credentials.twofactor) {
        return fn(err);
      }

      // Everything looks good, so now we can create the access token, which
      // is used for all future API calls to authenticate the user.
      user.createAccessToken(86400, function (err, token) {
        if (err) return fn(err);
        token.__data.user = user;
        fn(err, token);
      });
    });
  };

  user.insertimagemeta = function (data, id, fn) {
    if (typeof data === 'function') {
      // fn = include;
      data = undefined;
    }
    //   console.log("update", "line1");
    /* var ctx = loopback.getCurrentContext();
     var accessToken = ctx.get('accessToken');
     var userid = accessToken.userId;*/
    //  var ojec = JSON.parse(data);
    //  console.log("update ojec", ojec);
    //console.log("update data", data);
    var err = new Error('Sorry, but that verification code does not work!');
    err.statusCode = 401;
    err.code = 'LOGIN_FAILED';
    //  console.log("update", "line3");
    db.updateByIdUpdate(user, id, {
      "photo": data
    }, function (doc) {
      // console.log("update", "completed update and photo object");
      //fn(null, doc);
      // console.log("update", doc);
      fn(null, doc);
    });
  };


  user.remoteMethod(
    "insertimagemeta",
    {
      description: ["Update jumlah ruangan tersedia berdasarkan id dan tanggal"],
      accepts: [
        {arg: "data", type: "object", http: {source: 'body'}, required: true, description: "document in json"},
        {arg: "id", type: "string", http: {source: 'path'}, required: true, description: "id"}
      ],
      returns: {
        arg: "user", type: "object", root: true, description: "Return value"
      },
      // isStatic: false, /* this is to need id systematically */
      http: {verb: "post", path: "/:id/insertimagemeta"}
    }
  );

  /*
   GetRcEscalation.remoteMethod(
   'getEscalations', {
   http: { verb: 'get',path:'/getEscalations' },
   description: "Gets Escalation by the current user",
   accepts: { arg: 'Id_Number', type: 'number' },
   return: { arg: 'data', type: ['GetRcEscalation'], root: true }
   });
   */


  user.afterRemote('create', function (context, user, next) {
    console.log('> user.afterRemote triggered');

    /*var options = {
     type: 'email',
     to: user.email,
     from: 'noreply@loopback.com',
     subject: 'Thanks for registering.',
     template: path.resolve(__dirname, '../../server/views/verify.ejs'),
     redirect: '/verified',
     user: user
     };

     user.verify(options, function(err, response) {
     if (err) return next(err);

     console.log('> verification email sent:', response);

     context.res.render('response', {
     title: 'Signed up successfully',
     content: 'Please check your email and click on the verification link ' +
     'before logging in.',
     redirectTo: '/',
     redirectToLinkText: 'Log in'
     });
     });*/
    next();
  });

  //send password reset link when requested
  user.on('resetPasswordRequest', function (info) {
    var url = 'http://' + config.host + ':' + config.port + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
      info.accessToken.id + '">here</a> to reset your password';

    /*  user.app.models.Email.send({
     to: info.email,
     from: info.email,
     subject: 'Password reset',
     html: html
     }, function(err) {
     if (err) return console.log('> error sending password reset email');
     console.log('> sending password reset email to:', info.email);
     });*/

  });


};
