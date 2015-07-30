'use strict';

var _      = require('lodash');
var when   = require('when');
var models = require('../models');
var Queue  = require('./Queue');

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