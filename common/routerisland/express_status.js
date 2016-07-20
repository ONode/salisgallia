/**
 * Created by zJJ on 7/20/2016.
 */

const
  crypto = require('crypto'),
  express = require('express'),
  multer = require('multer'),
  router = express.Router(),
  mapSliceArc = require('mapslice'),
  output = require('.././util/outputjson.js'),
  path = require('path'),
  _ = require('lodash'),
  mkp = require('mkdirp'),
  async = require('async'),
  im = require('imagemagick'),
  fs = require('fs')
  ;

const logTag = 'express status info',
  __parentDir = path.dirname(module.main),
  upload_path_public = '/express-status'
  ;

router.get(upload_path_public, function (req, res, next) {
  console.log(logTag, req);
  res.json({running: true});
});

module.exports = router;
