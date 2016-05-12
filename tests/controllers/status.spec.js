'use strict';

var request     = require('supertest');

describe('Controller: Status', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return the status of the PostgreSQL connection', function(done) {
    request(url)
    .get('status/postgres')
    .end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

  it('should return the status of the Redis connection', function(done) {
    request(url)
    .get('status/redis')
    .end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});
