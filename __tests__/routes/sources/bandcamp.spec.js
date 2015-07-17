'use strict';

var request = require('supertest');

describe('bandcamp routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an audio stream provided a track URL', function(done) {
    this.timeout(10000);

    request(url)
    .get('stream/bandcamp/http%3A%2F%2Fillarious.bandcamp.com%2Ftrack%2Fchoppin-along')
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.headers['content-type'].should.match(/audio/);
      done();
    });
  });

});