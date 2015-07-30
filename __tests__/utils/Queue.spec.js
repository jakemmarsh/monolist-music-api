'use strict';

var when                = require('when');
var ActivityManager     = require('../../api/utils/ActivityManager');
var NotificationManager = require('../../api/utils/NotificationManager');
var Queue               = require('../../api/utils/Queue');
var models              = require('../../api/models');
var sinon               = global.sinon || require('sinon');

describe('Util: Queue', function() {

  var mock;

  it('should add a job to the queue when it receives an activity', function(done) {
    done();
  });

  it('should add a job to the queue when it receives a notification', function(done) {
    done();
  });

  it('should prompt ActivityManager to save an activity on job process', function(done) {
    // TODO: flesh this out
    var activity = {};

    mock = sinon.mock(ActivityManager);
    mock.expects('create').once().withArgs(activity).returns(when());

    // TODO: force queue to somehow process an 'activity' job
  });

  it('should prompt NotificationManager to save a notification on job process', function(done) {
    // TODO: flesh this out
    var notification = {};

    mock = sinon.mock(NotificationManager);
    mock.expects('create').once().withArgs(notification).returns(when());

    // TODO: force queue to somehow process an 'activity' job
  });

  afterEach(function() {
    mock.restore();
  });

});