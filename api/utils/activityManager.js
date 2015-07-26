'use strict';

var _                   = require('lodash');
var when                = require('when');
var models              = require('../models');
var NotificationManager = require('./NotificationManager');

/* ====================================================== */

exports.create = function(entityType, entityId, actionType, actorId) {
  var deferred = when.defer();

  deferred.resolve();

  return deferred.promise;
};

/* ====================================================== */