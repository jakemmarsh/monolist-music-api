'use strict';

var when                = require('when');
var _                   = require('lodash');
var NotificationManager = require('../../api/utils/NotificationManager');
var Queue               = require('../../api/utils/Queue');
var models              = require('../../api/models');
var fixtures            = require('../../utils/fixtures');

describe('Util: NotificationManager', function() {

  var mock;

  it('should retrieve the appropriate user IDs to notify for a group action', function(done) {
    var groupId = 1;
    var userIds = [];

    // Memberships (includes owner)
    if ( !_.isEmpty(fixtures.groupMemberships) ) {
      _.each(_.where(fixtures.groupMemberships, { GroupId: groupId }), function(membership) {
        userIds.push(membership.UserId);
      });
    }

    // Followers
    if ( !_.isEmpty(fixtures.groupFollows) ) {
      _.each(_.where(fixtures.groupFollows, { GroupId: groupId }), function(follow) {
        userIds.push(follow.FollowerId);
      });
    }

    NotificationManager.getGroupUserIds(groupId).then(function(ids) {
      ids.sort().should.eql(userIds.sort());
      done();
    });
  });

  it('should retrieve the appropriate user IDs to notify for a playlist action', function(done) {
    var playlistId = 1;
    var userIds = [];
    var playlist;

    // Owner
    if ( !_.isEmpty(fixtures.playlists) ) {
      playlist = fixtures.playlists[0];

      if ( playlist.ownerType === 'user' ) {
        userIds.push(playlist.ownerId);
      }
    }

    // Collaborators
    if ( !_.isEmpty(fixtures.collaborations) ) {
      _.each(_.where(fixtures.collaborations, { PlaylistId: playlistId }), function(collaboration) {
        userIds.push(collaboration.UserId);
      });
    }

    // Followers
    if ( !_.isEmpty(fixtures.playlistFollows) ) {
      _.each(_.where(fixtures.playlistFollows, { PlaylistId: playlistId }), function(follow) {
        userIds.push(follow.UserId);
      });
    }

    NotificationManager.getPlaylistUserIds(playlistId).then(function(ids) {
      ids.sort().should.eql(userIds.sort());
      done();
    });
  });

  it('should retrieve the appropriate user IDs to notify for a track action', function(done) {
    var trackId = 1;
    var userIds = [1];

    NotificationManager.getTrackUserIds(trackId).then(function(ids) {
      ids.sort().should.eql(userIds.sort());
      done();
    });
  });

  it('should build notifications correctly for an activity', function(done) {
    var activity = {
      entityType: 'playlist',
      entityId: 5,
      actorId: fixtures.userFollows[0].UserId,
      action: 'create'
    };
    var notifications = [
      {
        ActorId: fixtures.userFollows[0].UserId,
        RecipientId: fixtures.userFollows[0].FollowerId,
        entityType: 'playlist',
        entityId: 5,
        action: 'create'
      }
    ];
    var spy = sandbox.spy(NotificationManager, 'getPlaylistUserIds');

    NotificationManager.buildNotifications(activity).then(function(builtNotifications) {
      builtNotifications = _.sortBy(builtNotifications, 'RecipientId');
      notifications = _.sortBy(notifications, 'RecipientId');
      builtNotifications.should.eql(notifications);
      spy.calledOnce.should.be.true;
      done();
    });
    done();
  });

  it('should queue new notifications to be created', function(done) {
    var notifications = [];

    mock = sandbox.mock(Queue);
    sandbox.mock(Queue).expects('notifications').once().withArgs(notifications).returns(when());

    NotificationManager.queue(notifications).then(done);
  });

  it('should save a new notification in the database', function(done) {
    var notification = {};

    sandbox.stub(Queue, 'notifications').returns(when());
    sandbox.mock(models.Notification).expects('create').once().withArgs(notification).returns(when());

    NotificationManager.create(notification).then(done);
  });

  afterEach(function() {
    if ( mock ) { mock.restore(); }
  });

});
