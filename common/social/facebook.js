/**
 * Created by hesk on 30/4/2017.
 */

const speakeasy = require("speakeasy"),
  _ = require("lodash"),
  salt = "moc43viv8ipum",
  https = require("https"),
  _crypto = require("crypto"),
  loopback = require("loopback"),
  promise = require("promise"),
  profile_pic = require("../logic/s3profile"),
  db = require("../../common/util/db.js"),
  logTag = "> user.js",
  result_bool = {
    acknowledged: true
  };

const check_date_expired = function (expire_time) {
  if (!_.isEmpty(expire_time)) {
    const date = new Date(expire_time);
    const now = new Date();
    if (date.parse() >= now.parse()) {
      console.log("> login =====================");
      console.log("This token is expired.");
      return true;
    } else {
      return false;
    }
  } else
    return false;
};

const pwdassign = function (token) {
  return _crypto.createHmac("md5", salt)
    .update(token)
    .digest("hex");
};

function login_facebook(instance_user, data, fn) {
  if (typeof data === "function") {
    data = undefined;
  }
//console.log("> ==== :", data);
  const _url_ = data["photo"];
  const facebook_id = data["facebook.userid"];
  const email = data["facebook.email"];
  const facebook_token = data["facebook.token"];
  const facebook_expire = data["facebook.expire"];
  console.log("> ====================================");
  console.log("> Facebook login =====================");
  console.log("> ====================================");
  console.log("> ==== facebook expire is here");
  console.log("> ====>> :", facebook_expire);
  console.log("> ==== facebook user email here");
  console.log("> ====>> :", facebook_id);
  console.log("> ==== facebook user token here");
  console.log("> ====>> :", facebook_token);
  console.log("> ==== facebook url for photo");
  console.log("> ====>> :", _url_);

  instance_user.findOne({
    where: {
      "facebook.userid": facebook_id
    }
  }, function (err, r) {
    if (_.isError(err)) {
      console.log("technical error from db", err);
      return;
    }
    if (_.isEmpty(r)) {
      console.log("> ==============================================");
      console.log("> Create new login account =====================");
      console.log("> ==============================================");
      instance_user.create({
        "facebook": {
          "userid": facebook_id,
          "email": email,
          "token": facebook_token,
          "expire": facebook_expire
        },
        "email": email,
        "password": pwdassign(facebook_token)
      }, function (err, r) {
        if (_.isError(err)) {
          console.log("technical error from db", err);
        }
        instance_user.login({email: email, password: pwdassign(facebook_token)},
          function (err, token) {
            console.log("> ==============================================");
            console.log("> ===========   Login Success    ===============");
            console.log("> ==============================================");
            console.log("The new user object is defined in here", r);
            console.log("You have just created a new account and log on to this account now and the token object is [", token, "]");
            console.log("> ==============================================");
            fn(null, r);
          });
      });

    } else {

      const user_id = r.id;

      console.log("> ============================================================================");
      console.log("> found existing user id from using the facebook user ID =====================");
      console.log("> The converted user Id from facebook = [", user_id, "]");
      console.log("> ============================================================================");

      if (_.isEmpty(user_id)) {
        console.log("> Login error because the converted user id is not found. ");
        return fn(new Error("Login error because the converted user id is not found"), null);
      }

      if (_.isEmpty(r.facebook)) {
        console.log("> facebook object is not found. ");
        return fn(new Error("Facebook object is not found"), null);
      }

      const __facebook = r.facebook;
      const __email = r.facebook.email;
      const __pwd = pwdassign(r.facebook.token);
      const __pwd_from_request = pwdassign(facebook_token);

      console.log("> =======================================================");
      console.log("> Review facebook object before login =======", r.facebook);
      console.log("> Review facebook email =======", __email);
      console.log("> Review facebook password =======", __pwd);
      console.log("> =======================================================");
      const bool_expired = check_date_expired(__facebook.expire);
      if (__facebook.token != facebook_token) {
        console.log("> =======================================================");
        console.log("> Found differ from the previous token now need to change a new password");
        console.log("> =======================================================");
        change_password(user_id, __pwd_from_request, function (err) {
          if (_.isError(err)) {
            console.log("> =======================================================");
            console.log("> Error from changing password", err);
            console.log("> =======================================================");
            return;
          }

          instance_user.login({email: __email, password: __pwd_from_request},
            function (err, token) {

              if (_.isError(err)) {
                console.log("technical error from login process", err);
                return fn(err, null);
              }

              console.log("> ==================================================");
              console.log("> After login ======================================");
              console.log("> ==================================================");
              console.log("You have just logon and the user token = [", token, "]");
              console.log("> ==================================================");
              fn(null, token);
            });

        });
      } else {

        instance_user.login({email: __email, password: __pwd},
          function (err, token) {

            if (_.isError(err)) {
              console.log("technical error from login process", err);
              return fn(err, null);
            }

            console.log("> ==================================================");
            console.log("> After login ======================================");
            console.log("> ==================================================");
            console.log("You have just logon and the user token = [", token, "]");
            console.log("> ==================================================");
            fn(null, token);
          });
      }

    }
  });
  console.log("update", "execute first faster line here");
}

module.exports.login_fb = login_facebook;
