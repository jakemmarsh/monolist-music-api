'use strict';

var request = require('supertest');

describe('audiomack routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an audio stream provided a track ID', function(done) {
    this.timeout(10000);

    request(url)
    .get('stream/audiomack/https%3A%2F%2Fd1pr08d0h9gmdu.cloudfront.net%2Fstreaming%2Fmixtape-republic%2Fpanda-prod-by-the-menace.mp3%3FExpires%3D1455939953%26Signature%3DI9kR67y5JxpvJxPmblwSqY669URRLaEA5GLR44rFRM~LT-Ra5r3DHtwDT-OqybrkATscn6PD1Zqi7YAX83ZQ1G9PNsAPz0JtlN4HAgEbq8KX7isuQJuR6ByAW3zuwhBMd92FfS8oJ8gq9NhltT~Pj16uhRgFAyEfDeHGEAoBBGk_%26Key-Pair-Id%3DAPKAIKAIRXBA2H7FXITA')
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
      res.body.data.should.have.property('sourceId');
      res.body.data.should.have.property('sourceParam');
      res.body.data.should.have.property('sourceUrl');
      res.body.data.should.have.property('imageUrl');
      res.body.data.should.have.property('title');
      res.body.data.should.have.property('artist');
      done();
    });
  });

});