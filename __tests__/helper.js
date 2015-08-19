'use strict';

var dotenv = require('dotenv');

before(function(done) {

  this.timeout(12000);

  // Ensure that 'should' library methods will be
  // available to all tests
  global.should = require('should');
  global.sinon = require('sinon');

  // Load all process.env.* variables
  //dotenv.load();

  // Start and configure the server
  require('../server');

  // Wait 5 seconds before calling "done" to ensure
  // that DB is connected and populated
  setTimeout(done, 8000);

});

beforeEach(function() {
  global.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  global.sandbox.restore();
});