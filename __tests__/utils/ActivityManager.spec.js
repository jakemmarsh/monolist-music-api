'use strict';

var when                = require('when');
var ActivityManager     = require('../../api/utils/ActivityManager');
var NotificationManager = require('../../api/utils/NotificationManager');
var Queue               = require('../../api/utils/Queue');
var models              = require('../../api/models');
var sinon               = global.sinon || require('sinon');

describe('Util: ActivityManager', function() {

  var entityType = 'user';
  var entityId = 1;
  var action = 'follow';
  var actorId = 2;
  var passThrough = {};
  var activity = {
    entityType: entityType,
    entityId: entityId,
    actorId: actorId,
    action: action
  };
  var mock;

  it('should queue a new activity to be created', function(done) {
    mock = sinon.mock(Queue);

    mock.expects('activity').once().withArgs(activity).returns(when());

    ActivityManager.queue(entityType, entityId, action, actorId, passThrough).then(function() {
      done();
    });
  });

  it('should save a new activity in the database', function(done) {
    mock = sinon.mock(models.Activity);

    sinon.stub(Queue, 'activity').returns(when());
    mock.expects('create').once().withArgs(activity).returns(when());

    ActivityManager.create(activity).then(done);
  });

  it('should build and queue notifications when an activity is saved', function(done) {
    mock = sinon.mock(NotificationManager);

    sinon.stub(models.Activity, 'create').returns(when());
    mock.expects('buildNotifications').once().returns(when());
    mock.expects('queue').once().returns(when());

    ActivityManager.create(activity).then(done);
  });

  afterEach(function() {
    if ( mock ) { mock.restore(); }
  })

});