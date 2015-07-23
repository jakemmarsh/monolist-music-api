'use strict';

var request = require('supertest');

require('../../utils/createAuthenticatedSuite')('track routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return a single track by ID', function(done) {
    var req = request(url).get('track/1');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('title');
      res.body.should.have.property('source');
      res.body.should.have.property('sourceParam');
      done();
    });
  });

  it('should successfully star a track', function(done) {
    var req = request(url).post('track/star');
    var track = {
      title: 'Test Track',
      artist: 'Test Artist',
      source: 'youtube',
      sourceParam: 'sdf93msd'
    };

    req.cookies = global.cookies;

    req.send(track).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('title');
      res.body.should.have.property('source');
      res.body.should.have.property('sourceParam');
      done();
    });
  });

  it('should successfully upvote a track', function(done) {
    var req = request(url).post('track/1/upvote');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('UserId');
      res.body.should.have.property('TrackId');
      done();
    });
  });

  it('should successfully downvote a track', function(done) {
    var req = request(url).post('track/1/downvote');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('UserId');
      res.body.should.have.property('TrackId');
      done();
    });
  });

  it('should successfully add a comment', function(done) {
    var req = request(url).post('track/1/comment');
    var comment = {
      body: 'Test comment body.'
    };

    req.cookies = global.cookies;

    req.send(comment).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('UserId');
      res.body.should.have.property('TrackId');
      res.body.should.have.property('body');
      done();
    });
  });

  it('should successfully remove the comment', function(done) {
    var req = request(url).del('track/1/comment/1');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});