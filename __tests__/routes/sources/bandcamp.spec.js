'use strict';

var request = require('supertest');
var stream  = require('stream');

describe('bandcamp routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an audio stream provided a track URL', function(done) {
    var passThrough = new stream.PassThrough();

    this.timeout(10000);

    passThrough.on('data', function(chunk) {
      // Stream has begun successfully once chunks are being received
      passThrough.end();
      // TODO: more robust checking here?
      done();
    });

    request(url)
    .get('stream/bandcamp/http%3A%2F%2Fillarious.bandcamp.com%2Ftrack%2Fchoppin-along')
    .pipe(passThrough);
  });

});