/**
 * Created by zJJ on 7/20/2016.
 */
var app = require('../server/server');
var request = require('supertest');
var assert = require('assert');
var loopback = require('loopback');

describe('REST API request', function () {
  it('returns the created resource on success', function (done) {
    var validPhotoResource = {
      description: 'Photo created on ' + Date.now(),
      filepath: '/path/to/photo.jpg',
      album_id: 1
    };
    request(app)
      .post('/photo')
      .field('description', 'My photo description')
      .field('album_id', 1)
      .attach('photo', __dirname + '/abe.jpg')
      .expect(201)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        assert.equal(res.body.description, validPhotoResource.description);
        assert.equal(res.body.album_id, validPhotoResource.album_id);
        done();
      });
  });
});
