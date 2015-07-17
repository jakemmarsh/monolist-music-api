'use strict';

var request = require('supertest');

describe('soundcloud routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an audio stream provided a track ID', function(done) {
    this.timeout(5000);

    request(url)
    .get('stream/soundcloud/193393571')
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.headers['content-type'].should.match(/audio/);
      done();
    });
  });

});