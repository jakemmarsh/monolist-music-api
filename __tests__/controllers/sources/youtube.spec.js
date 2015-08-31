'use strict';

var request = require('supertest');

describe('bandcamp routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should get the details of a track from URL', function(done) {
    var videoUrl = 'https://www.youtube.com/watch?v=eLwHD6ae5Sc';

    request(url)
    .get('details/youtube/' + encodeURIComponent(videoUrl))
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
      done();
    });
  });

});