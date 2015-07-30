'use strict';

var when                = require('when');
var NotificationManager = require('../../api/utils/NotificationManager');
var Queue               = require('../../api/utils/Queue');
var models              = require('../../api/models');
var sinon               = global.sinon || require('sinon');

describe('Util: NotificationManager', function() {

  var mock;

  it('should queue new notifications to be created', function(done) {
    var notifications = [];

    mock = sinon.mock(Queue);
    mock.expects('notifications').once().withArgs(notifications).returns(when());

    NotificationManager.queue(notifications).then(done);
  });

  it('should save a new notification in the database', function(done) {
    var notification = {};

    mock = sinon.mock(models.Notification);
    sinon.stub(Queue, 'notifications').returns(when());
    mock.expects('create').once().withArgs(notification).returns(when());

    NotificationManager.create(notification).then(done);
  });

  afterEach(function() {
    mock.restore();
  });

});