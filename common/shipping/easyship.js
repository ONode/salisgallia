/**
 * Created by hesk on 24/4/2017.
 */
"use strict";
const pd = require("./../logic/preS3");
const express = require("express");
const jwtt = require('jsonwebtoken');
const base64url = require('base64url');
const jwst = require("yocto-jwt");
const timeout = require("req-timeout");
const request = require("request");
const fs = require("fs");
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
    scope: 'rate label shipment company track',
    aud: 'https://auth.goeasyship.com/oauth2/token',
    exp: now + 120,
    iat: now
  };
  return new jwtt().encode(jwt_claim_set, getcert(), 'RS256');
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
module.exports.gettoken = function (cb) {
  const jwt_token = generateHeader() + "." + generateClaimSet() + "." + generateClaimOut();
  // Signature verification raised
  // const assertion = generateAssertion();
  console.log("jwst jwt_token", jwt_token);
  request.post({
      headers: {
        'content-type': 'application/json'
      },
      url: 'https://auth.goeasyship.com/oauth2/token',
      form: {
        "grant_type": "assertion",
        "assertion": jwt_token,
        "assertion_type": "urn:ietf:params:oauth:grant-type:jwt-bearer"
      }
    },
    function (error, response, configuration_body) {
      if (pd.l.isError(error)) {
        console.log("error - JWT");
        cb(error);
        return;
      }
      // console.log("response - JWT", response);
      cb(null, response);
    });
};
