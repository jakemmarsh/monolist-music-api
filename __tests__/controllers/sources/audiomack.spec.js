'use strict';

var request = require('supertest');

describe('audiomack routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an audio stream provided a track ID', function(done) {
    this.timeout(10000);

    request(url)
    .get('stream/audiomack/http%3A%2F%2Faudiomack.com%2Fsong%2Fdirty-glove-bastard%2Fabout-the-money-cdq')
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.headers['content-type'].should.match(/audio/);
      done();
    });
  });

  it('should get the details of a track from URL', function(done) {
    var trackUrl = 'http://www.audiomack.com/song/mixtape-republic/panda';

    request(url)
    .get('details/audiomack/' + encodeURIComponent(trackUrl))
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('data');
      res.body.data.should.be.instanceof(Object);
      res.body.data.should.have.property('source');
      res.body.data.should.have.property('sourceParam');
      res.body.data.should.have.property('sourceUrl');
      res.body.data.should.have.property('imageUrl');
      res.body.data.should.have.property('title');
      res.body.data.should.have.property('artist');
      done();
    });
  });

});