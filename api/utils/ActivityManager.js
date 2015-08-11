'use strict';

var _                   = require('lodash');
var when                = require('when');
var models              = require('../models');
var Queue               = require('./Queue');
var NotificationManager = require('./NotificationManager');

/* ====================================================== */

function queueNotifications(activity) {

  var deferred = when.defer();
  var notifications = [];

  // TODO: determine what notifications need to be saved, and build them

  NotificationManager.queue(notifications)
  .then(deferred.resolve)
  .catch(deferred.reject);

  return deferred.promise;

}

/* ====================================================== */

exports.queue = function(entityType, entityId, actionType, actorId, passThrough) {

  var deferred = when.defer();
  // TODO: sanitize/build
  var activity = {};

  entityId = entityId ? parseInt(entityId) : passThrough.id;

  console.log('queue activity for:', arguments);

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
