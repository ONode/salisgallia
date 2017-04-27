/**
 * Created by hesk on 26/4/2017.
 */
"use strict";
const shippo = require('shippo')('shippo_live_984c926d9ee8962a02e50b4b442fbbe9f9ad0a5a');
const addressFrom = {
  "name": "Shawn Xiao",
  "street1": "96 LinJiang Road",
  "city": "Wuhan",
  "state": "GuangDong",
  "zip": "00213",
  "country": "HONG KONG",
  "phone": "+86 13532155511",
  "email": "shippotle@goshippo.com"
};
const addressTo = {
  "name": "Mr Hippo",
  "street1": "Broadway 1",
  "city": "New York",
  "state": "NY",
  "zip": "10007",
  "country": "US",
  "phone": "+1 555 341 9393",
  "email": "mrhippo@goshippo.com"
};
const parcel = {
  "length": "5",
  "width": "5",
  "height": "5",
  "distance_unit": "cm",
  "weight": "2",
  "mass_unit": "kg"
};
/*
"carrier_accounts":[],
  "object_created": "2017-04-26T07:23:55.185Z",
  "object_updated": "2017-04-26T07:23:55.185Z",
  "object_id": "154bed53ab32407ea5391b0a3e65c77a",
  "object_owner": "jobhesk@gmail.com",
  "status": "SUCCESS",
  "address_from":{
  "object_id": "4436c2afd4b64b0698a29e075840f6aa",
    "is_complete": false,
    "name": "Shawn Xiao",
    "company": "",
    "street_no": "",
    "street1": "96 LinJiang Road",
    "validation_results":{},
    "street2": "",
    "street3": "",
    "city": "Wuhan",
    "state": "GuangDong",
    "zip": "00213",
    "country": "CN",
    "phone": "008613532155511",
    "is_residential": null,
    "test": false
},
"address_to":{
  "object_id": "9eb0b7bb3b494e5894e9c16d7755d685",
    "is_complete": false,
    "name": "Mr Hippo",
    "company": "",
    "street_no": "",
    "street1": "Broadway 1",
    "validation_results":{},
  "street2": "",
    "street3": "",
    "city": "New York",
    "state": "NY",
    "zip": "10007",
    "country": "US",
    "phone": "0015553419393",
    "is_residential": null,
    "test": false
},
"parcels":[
  {
    "object_state": "VALID",
    "object_created": "2017-04-26T07:23:55.161Z",
    "object_updated": "2017-04-26T07:23:55.197Z",
    "object_id": "493e539595dc40c585c53cae343967b1",
    "object_owner": "jobhesk@gmail.com",
    "template": null,
    "extra":{},
    "length": "5.0000",
    "width": "5.0000",
    "height": "5.0000",
    "distance_unit": "cm",
    "weight": "2.0000",
    "mass_unit": "kg",
    "value_amount": null,
    "value_currency": null,
    "metadata": "",
    "line_items":[],
    "test": false
  }
],
  "shipment_date": "2017-04-26T07:23:55.161Z",
  "address_return":{
  "object_id": "4436c2afd4b64b0698a29e075840f6aa",
    "is_complete": false,
    "name": "Shawn Xiao",
    "company": "",
    "street_no": "",
    "street1": "96 LinJiang Road",
    "validation_results":{},
  "street2": "",
    "street3": "",
    "city": "Wuhan",
    "state": "GuangDong",
    "zip": "00213",
    "country": "CN",
    "phone": "008613532155511",
    "is_residential": null,
    "test": false
},
"customs_declaration": null,
  "extra":{},
"rates":[],
  "messages":[
  {
    "source": "DHLExpress",
    "code": "",
    "text": "Shippo's DHL Express master account doesn't support shipments from outside of the US"
  }
],
  "metadata": "",
  "test": false

}
  */
module.exports.gettoken = function (cb) {
  shippo.shipment.create({
    "address_from": addressFrom,
    "address_to": addressTo,
    "parcels": [parcel],
    "async": false
  }, function (err, shipment) {
    // asynchronously called
    //console.log("try the shipping", err, shipment);
    if (err) {
      cb(err)
    } else
      cb(null, shipment);
  });




};
