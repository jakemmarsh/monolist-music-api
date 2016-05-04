'use strict';

var request = require('supertest');
var stream  = require('stream');

describe('bandcamp routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an audio stream provided a track URL', function(done) {
    this.timeout(10000);

    var passThrough = new stream.PassThrough();

    passThrough.on('data', function() {
      // Stream has begun successfully once chunks are being received
      passThrough.end();
      // TODO: more robust checking here?
      done();
    });

    request(url)
    .get('stream/bandcamp/http%3A%2F%2Fillarious.bandcamp.com%2Ftrack%2Fchoppin-along')
    .pipe(passThrough);
  });

  it('should get the details of a track from URL', function(done) {
    this.timeout(5000);

    var videoUrl = 'http://hopalong.bandcamp.com/track/tibetan-pop-stars';

    request(url)
    .get('details/bandcamp/' + encodeURIComponent(videoUrl))
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