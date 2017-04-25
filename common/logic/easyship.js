/**
 * Created by hesk on 24/4/2017.
 */

"use strict";
const pd = require("./../logic/preS3");
const express = require("express");
const CryptoJS = require("crypto-js");
const timeout = require("req-timeout");
const request = require("request");
//https://app.goeasyship.com/tools/api
//http://docs.easyshipapi.apiary.io/#introduction/generate-the-access-token/step-2.3.-forming-the-signature
function generateAssertion() {
  const now = Date.now();
  const jwt_claim_set = {
    iss: process.env.EASYSHIP_API,
    scope: 'rate label shipment company track',
    aud: 'https://auth.goeasyship.com/oauth2/token',
    exp: now + 120,
    iat: now
  };
  return pd.jwt.encode(jwt_claim_set, process.env.EASYSHIP_SECRET, 'RS256');
};

function generateHeader() {
  return new Buffer({"alg": "RS256", "typ": "JWT"}).toString('base64');
}
function generateClaimSet() {
  const now = Date.now();
  const jwt_claim_set = {
    "iss": process.env.EASYSHIP_API,
    "scope": "rate label shipment company track",
    "aud": "https://auth.goeasyship.com/oauth2/token",
    "exp": now + 120,
    "iat": now
  };
  return new Buffer(jwt_claim_set).toString('base64');
}
function generateCleimOut() {
  const the_right_amount = "";
  return new Buffer(the_right_amount).toString('base64');
}
module.exports.gettoken = function (cb) {

  console.log("start - request");
  console.log("start - EASYSHIP_SECRET", process.env.EASYSHIP_SECRET);

  const ast = generateAssertion();

  console.log("key assertion", ast);

  request.post({
      headers: {
        'content-type': 'application/json'
      },
      url: 'https://auth.goeasyship.com/oauth2/token',
      form: {
        "grant_type": "assertion",
        "assertion": ast,
        "assertion_type": "urn:ietf:params:oauth:grant-type:jwt-bearer"
      }
    },


    function (error, response, configuration_body) {
      if (pd._.isError(error)) {
        cb(error);
        return;
      }
      cb(null, response);
    });
};
