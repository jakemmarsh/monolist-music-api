'use strict';

var request = require('supertest');

require('../../utils/createAuthenticatedSuite')('group routes', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return a single group by ID', function(done) {
    var req = request(url).get('group/1');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('title');
      res.body.should.have.property('slug');
      res.body.should.have.property('privacy');
      done();
    });
  });

  it('should return all trending groups', function(done) {
    var req = request(url).get('groups/trending');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      if ( res.body[0] ) {
        res.body[0].should.have.property('title');
        res.body[0].should.have.property('slug');
        res.body[0].should.have.property('privacy');
      }
      done();
    });
  });

  it('should return groups matching a search query', function(done) {
    var req = request(url).get('groups/search/test');

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

  it('should update a specific group\'s attributes', function(done) {
    var req = request(url).patch('group/1');
    var updates = {
      title: 'new title'
    };

    req.cookies = global.cookies;

    req.send(updates).end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('title');
      res.body.should.have.property('slug');
      res.body.should.have.property('privacy');
      res.body.title.should.be.equal(updates.title);
      done();
    });
  });

  it('should add a new member to a group', function(done) {
    var req = request(url).post('group/1/member/3');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Object);
      res.body.should.have.property('GroupId');
      res.body.should.have.property('UserId');
      done();
    });
  });

  it('should remove a member from a group', function(done) {
    var req = request(url).delete('group/1/member/3');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should delete a group', function(done) {
    var req = request(url).delete('group/1');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});