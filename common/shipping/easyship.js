/**
 * Created by hesk on 24/4/2017.
 */
"use strict";
const pd = require("./../logic/preS3");
const express = require("express");
const jwtsim = require('jwt-simple');
const base64url = require('base64url');
const jwst = require("yocto-jwt");
const timeout = require("req-timeout");
const request = require("request");
const fs = require("fs");
const fetch = require('node-fetch');
const FormData = require('form-data');
//https://app.goeasyship.com/tools/api
//http://docs.easyshipapi.apiary.io/#introduction/generate-the-access-token/step-2.3.-forming-the-signature
function getcert() {
  const appRoot = process.cwd();
  return fs.readFileSync(appRoot + '/easyship.pem', 'utf-8');
}
function generateAssertion() {
  const now = Date.now();
  const jwt_claim_set = {
    iss: process.env.EASYSHIP_API,
    sub: process.env.EASYSHIP_API,
    scope: 'rate',
    aud: 'https://auth.goeasyship.com/oauth2/token',
    exp: now + 3600,
    iat: now
  };
  // const jwt_sim = new jwst();
  return jwtsim.encode(jwt_claim_set, getcert(), 'RS256');
};
function generateHeader() {
  // console.log("jwst - generateHeader");
  // new Buffer({"alg": "RS256", "typ": "JWT"}).toString('base64');
  // return eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9

  //eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
  const str = JSON.stringify({"alg": "RS256", "typ": "JWT"});
  const base_64 = Buffer.from(str).toString('base64');
  console.log(str, ">", base_64);
  //return strg;
  return base_64;
}

function generateClaimSet() {
  const _now_ = Date.now();
  const jwt_claim_set = {
    iss: process.env.EASYSHIP_API,
    scope: "rate label shipment company track",
    aud: "https://auth.goeasyship.com/oauth2/token",
    exp: _now_ + 120,
    iat: _now_
  };
  const str = JSON.stringify(jwt_claim_set);
  return Buffer.from(str).toString('base64');
}
function generateClaimOut() {
  let signed = "";
  const bb = new jwst();
  if (bb.setKey(getcert())) {
    const data_string = generateHeader() + "." + generateClaimSet();
    signed = bb.sign(data_string, {algorithm: 'RS256'});
  }
  return Buffer.from(signed).toString('base64');
}
function getToken(cb) {
  request.post({
      url: 'https://auth.goeasyship.com/oauth2/token',
      form: {
        "grant_type": "assertion",
        "assertion": generateAssertion(),
        "assertion_type": "urn:ietf:params:oauth:grant-type:jwt-bearer"
      },
      followRedirect: false
    },
    function (error, response, configuration_body) {
      if (pd.l.isError(error)) {
        console.log("error - JWT");
        cb(error);
        return;
      }
      const access_tok = JSON.parse(response.body);
      cb(null, access_tok);
    });
}
function getRate(token, from, to, shipping_info, cb) {
  console.log("token here", token);
  //const formData = new FormData();

  const d = {
    "origin_country_alpha2": "CN",
    "origin_postal_code": "518054",
    "destination_country_alpha2": "US",
    "destination_postal_code": "75211",
    "taxes_duties_paid_by": "Sender",
    "is_insured": false,
    "items": [{
      "actual_weight": 3.4,
      "height": 30,
      "width": 35,
      "length": 40,
      "category": "home_decor",
      "declared_currency": "USD",
      "declared_customs_value": "100",
    }]
  };
  /*
   for (let k in d) {
   formData.append(k, d[k]);
   }

   const request = {
   method: 'POST',
   headers: {
   'Authorization': 'Bearer ' + token,
   'Content-Type': 'application/x-www-form-urlencoded'
   },
   body: formData
   };
   fetch('https://api.goeasyship.com/rate/v1/rates', request).then(function (res) {
   if (res.statusCode !== 200) {
   console.log('fail to get rate');
   } else {
   cb(null, res);
   }
   });*/
  request.post({
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      url: 'https://api.goeasyship.com/rate/v1/rates',
      form: d,
      followRedirect: false
    },
    function (err, resraw) {
      if (err || resraw.statusCode !== 200) {
        console.log('fail to get rate');
        if (resraw) {
          console.log(resraw.request);
          console.log(resraw.body);
        }
        cb('fail to get rate');
        return;
      }
      cb(null, resraw);
    });
}
/**

 "access_token": "b51d08517d392c610825fa4f0219b9a7bd6d52ae3ee464a02a82a80bee395e66",
 "token_type": "bearer",
 "expires_in": 7200,
 "refresh_token": "53868cf3ff88e3b9a49cf93d1307478d3169d8a382c3b527d904626cd274f003",
 "scope": "rate",
 "created_at": 1493277232

 * @param cb
 */
module.exports.gettoken = getToken;
module.exports.check_rate_easyship = function (basemapInstance, sku, cb) {
  getToken(function (err, access_tokn) {
    getRate(access_tokn.access_token, {}, {}, {}, function (rates) {
      cb(null, rates);
    })
  });
};
