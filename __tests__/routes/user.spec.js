'use strict';

var request = require('supertest');

require('../../utils/createAuthenticatedSuite')('user routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return a single user by ID', function(done) {
    var req = request(url).get('user/1');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('username');
      res.body.should.have.property('email');
      done();
    });
  });

  it('should return users matching a search query', function(done) {
    var req = request(url).get('users/search/test');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      res.body[0].should.have.property('username');
      res.body[0].should.have.property('email');
      done();
    });
  });

  it('should update a specific user\'s attributes', function(done) {
    var req = request(url).patch('user/1');
    var updates = {
      email: 'newemail@new.com'
    };

    req.cookies = global.cookies;

    req.send(updates).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('username');
      res.body.should.have.property('email');
      res.body.email.should.be.equal(updates.email);
      done();
    });
  });

  it('should retrieve notifications for a user', function(done) {
    var req = request(url).get('user/1/notifications');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      // res.body[0].should.have.property('activity');
      // res.body[0].should.have.property('entityType');
      done();
    });
  });

  it('should follow a user', function(done) {
    var req = request(url).post('user/2/follow');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('FollowerId');
      res.body.should.have.property('UserId');
      done();
    });
  });

  it('should return a list of user\'s playlists', function(done) {
    var req = request(url).get('user/1/playlists');

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

  it('should return a list of playlists user can edit', function(done) {
    var req = request(url).get('user/1/editable');

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

  it('should return a list of user\'s public collaborations', function(done) {
    var req = request(url).get('user/1/collaborations');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      if ( res.body[0] ) {
        res.body[0].should.have.property('title');
        res.body[0].should.have.property('slug');
        res.body[0].should.have.property('tags');
        res.body[0].should.have.property('privacy');
      }
      done();
    });
  });

  it('should return a list of user\'s liked playlists', function(done) {
    var req = request(url).get('user/1/likes');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      if ( res.body[0] ) {
        res.body[0].should.have.property('title');
        res.body[0].should.have.property('slug');
        res.body[0].should.have.property('tags');
        res.body[0].should.have.property('privacy');
      }
      done();
    });
  });

  it('should return a list of user\'s starred tracks', function(done) {
    var req = request(url).get('user/1/stars');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      if ( res.body[0] ) {
        res.body[0].should.have.property('title');
        res.body[0].should.have.property('source');
        res.body[0].should.have.property('sourceParam');
      }
      done();
    });
  });

  it('should return a list of user\'s groups', function(done) {
    var req = request(url).get('user/1/groups');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      res.body[0].should.have.property('title');
      res.body[0].should.have.property('slug');
      res.body[0].should.have.property('privacy');
      done();
    });
  });

  it('should delete a user', function(done) {
    var req = request(url).del('user/2');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});