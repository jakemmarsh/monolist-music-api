'use strict';

var request  = require('supertest');
var slug     = require('slug');
var when     = require('when');
var models   = require('../../api/models');
var fixtures = require('../../utils/fixtures');

require('../../utils/createAuthenticatedSuite')('Controller: Playlist', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return a single playlist', function(done) {
    var titleSlug = slug(fixtures.playlists[0].title).toLowerCase();
    var req = request(url).get('playlist/' + titleSlug);

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('title');
      res.body.should.have.property('slug');
      res.body.should.have.property('tags');
      res.body.should.have.property('privacy');
      done();
    });
  });

  it('should return playlists matching a search query and record the search', function(done) {
    var req = request(url).get('playlists/search/test');

    sandbox.mock(models.PlaylistSearch).expects('create').once();

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      res.body[0].should.have.property('title');
      res.body[0].should.have.property('slug');
      res.body[0].should.have.property('tags');
      res.body[0].should.have.property('privacy');
      done();
    });
  });

  it('should return an array of trending playlists', function(done) {
    var req = request(url).get('playlists/trending');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      res.body[0].should.have.property('title');
      res.body[0].should.have.property('slug');
      res.body[0].should.have.property('tags');
      res.body[0].should.have.property('privacy');
      done();
    });
  });

  it('should return an array of newest playlists', function(done) {
    var req = request(url).get('playlists/newest');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      res.body[0].should.have.property('title');
      res.body[0].should.have.property('slug');
      res.body[0].should.have.property('tags');
      res.body[0].should.have.property('privacy');
      done();
    });
  });

  it('should return an array of recent playlist searches', function(done) {
    var req = request(url).get('playlists/searches');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('data');
      res.body.data.should.be.instanceof(Array);
      res.body.data[0].should.have.property('UserId');
      res.body.data[0].should.have.property('results');
      res.body.data[0].should.have.property('query');
      done();
    });
  });

  it('should successfully create a new playlist', function(done) {
    var req = request(url).post('playlist');
    var playlist = {
      ownerId: 1,
      ownerType: 'group',
      title: 'Playlist for Tests',
      tags: ['test', 'automated', 'new'],
      privacy: 'public'
    };

    req.cookies = global.cookies;

    req.send(playlist).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('title');
      res.body.should.have.property('slug');
      res.body.should.have.property('tags');
      res.body.should.have.property('privacy');
      done();
    });
  });

  it('should successfully record a play', function(done) {
    var req = request(url).post('playlist/1/play');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('PlaylistId');
      res.body.should.have.property('UserId');
      done();
    });
  });

  it('should successfully follow a playlist', function(done) {
    var req = request(url).post('playlist/1/follow');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should successfully like a playlist', function(done) {
    var req = request(url).post('playlist/1/like');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should successfully add a collaborator', function(done) {
    var req = request(url).post('playlist/1/collaborator/3');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('PlaylistId');
      res.body.should.have.property('UserId');
      done();
    });
  });

  it('should successfully remove a collaborator', function(done) {
    var req = request(url).delete('playlist/1/collaborator/3');

    sandbox.mock(models.Collaboration.Instance.prototype)
    .expects('destroy').once().returns(when());

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should successfully add a track', function(done) {
    var req = request(url).post('playlist/1/track');
    var track = {
      title: 'Test Track',
      artist: 'Test',
      source: 'soundcloud',
      sourceParam: 'sfsd234zxew'
    };

    req.cookies = global.cookies;

    req.send(track).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('title');
      res.body.should.have.property('slug');
      res.body.should.have.property('tags');
      res.body.should.have.property('privacy');
      done();
    });
  });

  it('should successfully remove a track', function(done) {
    var req = request(url).delete('playlist/1/track/2');

    sandbox.mock(models.Track.Instance.prototype)
    .expects('destroy').returns(when());

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should successfully delete a playlist', function(done) {
    var req = request(url).delete('playlist/2');

    sandbox.mock(models.Playlist.Instance.prototype)
    .expects('destroy').once().returns(when());

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});