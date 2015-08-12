'use strict';

var _      = require('lodash');
var when   = require('when');
var models = require('../models');
var Queue  = require('./Queue');

/* ====================================================== */

exports.getGroupUserIds = function(groupId) {

  var deferred = when.defer();

  models.Group.find({
    where: { id: groupId },
    include: [
      {
        model: models.GroupMembership,
        as: 'Memberships'
      },
      {
        model: models.GroupFollow,
        as: 'Followers'
      }
    ]
  }).then(function(group) {
    var memberIds = _.pluck(group.Memberships, 'UserId');
    var followerIds = _.pluck(group.Followers, 'UserId');
    var ids = _([group.OwnerId]).concat(memberIds, followerIds).uniq().value();

    deferred.resolve(ids);
  }).catch(function(err) {
    deferred.reject(err);
  });

  return deferred.promise;

};

/* ====================================================== */

exports.getPlaylistUserIds = function(playlistId) {

  var deferred = when.defer();

  // TODO: also get members of group if playlist owner is group

  models.Playlist.find({
    where: { id: playlistId },
    include: [
      {
        model: models.Collaboration,
        attributes: ['UserId']
      },
      {
        model: models.PlaylistFollow,
        as: 'Followers',
        attributes: ['UserId']
      }
    ]
  }).then(function(playlist) {
    var collaboratorIds = _.pluck(playlist.Collaborations, 'UserId');
    var followerIds = _.pluck(playlist.Followers, 'UserId');
    var ids = _([]).concat(collaboratorIds, followerIds).uniq().value();

    if ( playlist.ownerType === 'user' && !_.contains(ids, playlist.ownerId) ) {
      ids.push(playlist.ownerId);
    }

    deferred.resolve(ids);
  }).catch(function(err) {
    deferred.reject(err);
  })

  return deferred.promise;

};

/* ====================================================== */

exports.getTrackUserIds = function(trackId) {

  var deferred = when.defer();

  models.Track.find({
    where: { id: trackId }
  }).then(function(track) {
    deferred.resolve([track.UserId]);
  }).catch(function(err) {
    deferred.reject(err);
  });

  return deferred.promise;

}

/* ====================================================== */

exports.getUserIdsForEntity = function(entityType, entityId) {

  if ( entityType === 'group' ) {
    return exports.getGroupUserIds(entityId);
  } else if ( entityType === 'playlist' ) {
    return exports.getPlaylistUserIds(entityId);
  } else if ( entityType === 'track' ) {
    return exports.getTrackUserIds(entityId)
  } else if ( entityType === 'user' ) {
    return when([entityId]);
  }

}

/* ====================================================== */

exports.buildNotifications = function(activity) {
  var deferred = when.defer();

  exports.getUserIdsForEntity(activity.entityType, activity.entityId).then(function(userIds) {
    deferred.resolve(_.map(userIds, function(userId) {
      return {
        ActorId: activity.actorId || activity.ActorId,
        RecipientId: userId,
        entityType: activity.entityType,
        entityId: activity.entityId,
        action: activity.action
      }
    }));
  });

  return deferred.promise;
};

/* ====================================================== */

exports.queue = function(notifications) {
  var deferred = when.defer();

  notifications = _.isArray(notifications) ? notifications : [notifications];

  Queue.notifications(notifications)
  .then(deferred.resolve)
  .catch(deferred.reject);

  return deferred.promise;
};

/* ====================================================== */

exports.create = function(notification) {

  var deferred = when.defer();

  models.Notification.create(notification)
  .then(deferred.resolve)
  .catch(deferred.reject);

  return deferred.promise;

};