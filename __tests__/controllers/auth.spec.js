'use strict';

var request  = require('supertest');
var when     = require('when');
var mailer   = require('../../api/mailer');
var fixtures = require('../../utils/fixtures');

describe('Controller: Auth', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an error on initial check', function(done) {
    request(url)
    .get('auth/check')
    .end(function(err, res) {
      res.status.should.be.equal(401);
      done();
    });
  });

  it('should register a new user and send the welcome email', function(done) {
    var profile = {
      username: 'jane.doe',
      email: 'jane.doe@gmail.com',
      password: 'janedoe1'
    };
    var spy = sandbox.spy(mailer, 'sendWelcome');

    request(url)
    .post('auth/register')
    .send(profile)
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.have.property('username');
      res.body.should.have.property('email');
      spy.calledOnce.should.be.true;
      done();
    });
  });

  it('should log a user in', function(done) {
    var user = {
      username: 'test',
      password: 'test'
    };

    request(url)
    .post('auth/login')
    .send(user)
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.have.property('username');
      res.body.should.have.property('email');
      global.cookies = res.headers['set-cookie'].pop().split(';')[0];
      done();
    });
  });

  it('should receive a user when checking after log in', function(done) {
    var req = request(url).get('auth/check');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.have.property('username');
      res.body.should.have.property('email');
      done();
    });
  });

  it('should log a user out', function(done) {
    var req = request(url).post('auth/logout');

    req.cookies = global.cookies;

    req.end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should start the password reset flow and send the reset email', function(done) {
    var user = fixtures.users[0];
    var spy = sandbox.spy(mailer, 'sendReset');


    request(url)
    .post('auth/forgot/' + user.username)
    .end(function(err, res) {
      res.status.should.be.equal(200);
      spy.calledOnce.should.be.true;
      done();
    });
  });

  it('should reset a password', function(done) {
    var user = fixtures.users[0];

    sandbox.mock(models.User).expects('find').once().returns(when(user));
    sandbox.mock(models.User.Instance.prototype).expects('updateAttributes').once().returns(when(user));

    request(url)
    .post('auth/reset/'+ user.id + '/' + user.passwordResetKey)
    .end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});