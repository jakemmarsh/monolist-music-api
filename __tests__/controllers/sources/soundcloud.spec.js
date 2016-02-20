'use strict';

var request = require('supertest');

describe('soundcloud routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an audio stream provided a track ID', function(done) {
    this.timeout(10000);

    request(url)
    .get('stream/soundcloud/193393571')
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.headers['content-type'].should.match(/audio/);
      done();
    });
  });

  it('should get the details of a track from URL', function(done) {
    var trackUrl = 'https://soundcloud.com/nickraymondg/skizzy-mars-weekend-millionaires-remix';

    request(url)
    .get('details/soundcloud/' + encodeURIComponent(trackUrl))
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