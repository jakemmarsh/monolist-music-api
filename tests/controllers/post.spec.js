'use strict';

var request = require('supertest');
var when    = require('when');
var models  = require('../../api/models');

require('../../utils/createAuthenticatedSuite')('Controller: Post', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return a single post by ID', function(done) {
    var req = request(url).get('post/1');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('data');
      res.body.data.should.be.instanceof(Object);
      res.body.data.should.have.property('body');
      done();
    });
  });

  it('should return all newest posts', function(done) {
    var req = request(url).get('posts/newest');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.have.property('data');
      res.body.data.should.be.instanceof(Array);
      if ( res.body.data[0] ) {
        res.body.data[0].should.have.property('body');
      }
      done();
    });
  });

  it('should successfully create a new post', function(done) {
    var req = request(url).post('post');
    var post = {
      UserId: 1,
      body: 'this is a new post',
      track: {}
    };

    req.cookies = global.cookies;

    req.send(post).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('data');
      res.body.data.should.be.instanceof(Object);
      res.body.data.should.have.property('body');
      res.body.data.should.have.property('track');
      done();
    });
  });

  it('should successfully like a post', function(done) {
    var req = request(url).post('post/1/like');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should successfully add a comment', function(done) {
    var req = request(url).post('post/1/comment');
    var comment = {
      body: 'Test comment body.'
    };

    req.cookies = global.cookies;

    req.send(comment).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('data');
      res.body.data.should.be.instanceof(Object);
      res.body.data.should.have.property('UserId');
      res.body.data.should.have.property('PostId');
      res.body.data.should.have.property('body');
      done();
    });
  });

  it('should successfully remove the comment', function(done) {
    var req = request(url).del('post/1/comment/1');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should delete a post', function(done) {
    var req = request(url).del('post/1');
    var mock = sandbox.mock(models.Post.Instance.prototype);

    mock.expects('destroy').once().returns(when());

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});
