'use strict';

var when                = require('when');
var _                   = require('lodash');
var models              = require('../models');
var Queue               = require('./Queue');
var NotificationManager = require('./NotificationManager');

/* ====================================================== */

exports.queue = function(entityType, entityId, action, actorId, recipientId, passThrough) {

  var deferred = when.defer();
  var activity;

  if ( !passThrough ) {
    passThrough = recipientId;
  }

  entityId = entityId ? parseInt(entityId) : passThrough.id;
  activity = {
    entityType: entityType,
    entityId: entityId,
    actorId: actorId,
    recipientId: _.isNumber(recipientId) ? recipientId : null,
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
  models.Activity.create(activity).then(function() {
    NotificationManager.buildNotifications(activity)
    .then(NotificationManager.queue)
    .then(deferred.resolve.bind(null, null, activity));
  }).catch(deferred.reject);

  return deferred.promise;

};
