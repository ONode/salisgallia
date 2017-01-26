/**
 * Created by zJJ on 7/20/2016.
 */

const
  crypto = require('crypto'),
  express = require('express'),
  multer = require('multer'),
  router = express.Router()
  ;

const logTag = 'express status info',
  upload_path_public = '/express-status'
  ;

router.get(upload_path_public, function (req, res, next) {
  console.log(logTag, req);
  res.json({running: true});
});

module.exports = router;
