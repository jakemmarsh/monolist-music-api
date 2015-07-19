'use strict';

var _      = require('lodash');
var when   = require('when');
var models = require('../models');

/* ====================================================== */

exports.dispatch = function(entityType, entityId, actionType, actorId) {
  var deferred = when.defer();

  deferred.resolve();

  return deferred.promise;
};

/* ====================================================== */