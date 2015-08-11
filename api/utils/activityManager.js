'use strict';

var _                   = require('lodash');
var when                = require('when');
var models              = require('../models');
var Queue               = require('./Queue');
var NotificationManager = require('./NotificationManager');
var ActionTypes         = require('./ActionTypes');

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

};

/* ====================================================== */

function getTrackUserIds(trackId) {

  var deferred = when.defer();

  // fetch adder of track. fetch all collaborators???
  deferred.resolve([]);

  return deferred.promise;

};

/* ====================================================== */

function getUserIdsForEntity(entityType, entityId) {

  if ( entityType === 'group' ) {
    return getGroupUserIds(entityId);
  } else if ( entityType === 'playlist' ) {
    return getPlaylistUserIds(entityId);
  } else if ( entityType === 'track' ) {
    return getTrackUserIds(entityId)
  }

};

/* ====================================================== */

function queueNotifications(activity) {

  var deferred = when.defer();
  var notifications = [];

  var buildNotifications = function(activity) {
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

  buildNotifications(activity)
  .then(NotificationManager.queue)
  .then(deferred.resolve)
  .catch(deferred.reject);

  return deferred.promise;

}

/* ====================================================== */

exports.queue = function(entityType, entityId, action, actorId, passThrough) {

  var deferred = when.defer();
  var activity;

  entityId = entityId ? parseInt(entityId) : passThrough.id;
  activity = {
    entityType: entityType,
    entityId: entityId,
    actorId: actorId,
    action: action
  };

  Queue.activity(activity)
  .then(function() {
    deferred.resolve(passThrough);
  })
  .catch(deferred.reject);

  return deferred.promise;

};

/* ====================================================== */

exports.create = function(activity) {

  var deferred = when.defer();

  // Can be assumed activity is sanitized since coming from queue
  models.Activity.create(activity).then(function(createdActivity) {
    queueNotifications(createdActivity).then(deferred.resolve);
  }).catch(deferred.reject);

  return deferred.promise;

};
