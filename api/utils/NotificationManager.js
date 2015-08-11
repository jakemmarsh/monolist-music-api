'use strict';

var _      = require('lodash');
var when   = require('when');
var models = require('../models');
var Queue  = require('./Queue');

/* ====================================================== */

function getGroupUserIds(groupId) {

  var deferred = when.defer();

  // fetch all members/followers of group
  deferred.resolve([]);

  return deferred.promise;

}

/* ====================================================== */

function getPlaylistUserIds(playlistId) {

  var deferred = when.defer();

  // fetch owner/all collaborators of playlist
  deferred.resolve([]);

  return deferred.promise;

}

/* ====================================================== */

function getTrackUserIds(trackId) {

  var deferred = when.defer();

  // fetch adder of track. fetch all collaborators???
  deferred.resolve([]);

  return deferred.promise;

}

/* ====================================================== */

function getUserIdsForEntity(entityType, entityId) {

  if ( entityType === 'group' ) {
    return getGroupUserIds(entityId);
  } else if ( entityType === 'playlist' ) {
    return getPlaylistUserIds(entityId);
  } else if ( entityType === 'track' ) {
    return getTrackUserIds(entityId)
  } else if ( entityType === 'user' ) {
    return when([entityId]);
  }

}

/* ====================================================== */

exports.buildNotifications = function(activity) {
  var deferred = when.defer();

  getUserIdsForEntity(activity.entityType, activity.entityId).then(function(userIds) {
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

  notifications = notifications.constructor === Array ? notifications : [notifications];
  notifications = _.map(notifications, function(notification) {
    // TODO: sanitize
    return {

    };
  });

  Queue.notifications(notifications)
  .then(deferred.resolve)
  .catch(deferred.reject);

  deferred.resolve();

  return deferred.promise;
};

/* ====================================================== */

exports.create = function(notification) {

  var deferred = when.defer();

  // Can be assumed notification is sanitized and singular since coming from queue
  models.Notification.create(notification)
  .then(deferred.resolve)
  .catch(deferred.reject);

  return deferred.promise;

};