'use strict';

var when                = require('when');
var kue                 = require('kue');
var ActivityManager     = require('../../api/utils/ActivityManager');
var NotificationManager = require('../../api/utils/NotificationManager');
var Queue               = require('../../api/utils/Queue');
var models              = require('../../api/models');

describe('Util: Queue', function() {

  // TODO: flesh these out?
  var activity = {};
  var notifications = [{}, {}];
  var notification = notifications[0];
  var queueResponse = {
    removeOnComplete: function() {
      return {
        save: function(cb) {
          cb(null, {});
          return {};
        }
      };
    }
  };

  this.timeout(5000);

  it('should add a job to the queue when it receives an activity', function(done) {
    sandbox.mock(Queue.jobQueue).expects('create').once().withArgs('activity', activity).returns(queueResponse);

    Queue.activity(activity).then(done);
  });

  it('should add jobs to the queue when it receive notifications', function(done) {
    sandbox.mock(Queue.jobQueue).expects('create').exactly(notifications.length).returns(queueResponse);

    Queue.notifications(notifications).then(done);
  });

  it('should prompt ActivityManager to save an activity on job process', function(done) {
    sandbox.mock(ActivityManager).expects('create').once().withArgs(activity).returns(when());

    Queue.activity(activity);

    // Wait to ensure the queue has time to save and process the activity
    setTimeout(done, 2000);
  });

  it('should prompt NotificationManager to save a notification on job process', function(done) {
    sandbox.mock(NotificationManager).expects('create').exactly(notifications.length).returns(when());

    Queue.notifications(notifications);

    // Wait to ensure the queue has time to save and process the notification
    setTimeout(done, 2000);
  });

});