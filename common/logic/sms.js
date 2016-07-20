/**
 * Created by zJJ on 7/20/2016.
 */
const request = require('request');
var countryCode = '+1',
  mobileNumber = '4155550000',
  message = 'Hello from Blower.io';

module.exports = function (countryCode, mobileNumber, verifycode, next) {
  request.post({
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Accepts': 'application/json'
    },
    url: process.env.BLOWERIO_URL + '/messages',
    form: {
      to: countryCode + mobileNumber,
      message: verifycode
    }
  }, next);
};

/**
 * example
 */
/*

request.post({
 headers: {
 'content-type': 'application/x-www-form-urlencoded',
 'Accepts': 'application/json'
 },
 url: process.env.BLOWERIO_URL + '/messages',
 form: {
 to: countryCode + mobileNumber,
 message: message
 }
 }, function (error, response, body) {
 if (!error && response.statusCode == 201) {
 console.log('Message sent!')
 } else {
 var apiResult = JSON.parse(body)
 console.log('Error was: ' + apiResult.message)
 }
 });*/

