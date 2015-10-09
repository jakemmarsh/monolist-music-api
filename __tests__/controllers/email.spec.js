'use strict';

var request = require('supertest');
var when    = require('when');
var mailer  = require('../../api/mailer');

require('../../utils/createAuthenticatedSuite')('Controller: Email', function() {

  var url = 'http://localhost:3000/v1/';

  it('#contact should send a contact email', function(done) {
    var req = request(url).post('contact');
    var body = {
      email: 'test@test.com',
      body: 'This is the body of the message to send.'
    };

    req.cookies = global.cookies;
    req.hostname = 'monolist.co';

    sandbox.mock(mailer).expects('sendContact')
    .once()
    .withArgs(body.email, body.body)
    .returns(when());

    req.send(body).end(function(err, res) {
      res.status.should.be.equal(200);
      done();
    });
  });

});