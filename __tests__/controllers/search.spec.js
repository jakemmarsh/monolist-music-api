'use strict';

var request = require('supertest');

describe('Controller: Search', function() {

  var url = 'http://localhost:3000/v1/';

  it('should return an array of matching tracks', function(done) {
    this.timeout(10000);

    request(url)
    .get('tracks/search/test')
    .end(function(err, res) {
      res.status.should.be.equal(200);
      res.body.should.be.instanceof(Array);
      res.body[0].should.have.property('title');
      res.body[0].should.have.property('source');
      res.body[0].should.have.property('sourceParam');
      done();
    });
  });

});