'use strict';

before(function(done) {

  // Ensure that 'should' library methods will be
  // available to all tests
  global.should = require('should');
  global.sinon = require('sinon');

  // Start and configure the server
  require('../server');

  // Wait 5 seconds before calling "done" to ensure
  // that DB is connected and populated
  setTimeout(done, 2000);

});