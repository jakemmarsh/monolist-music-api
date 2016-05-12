'use strict';

const models          = require('../models');
const Queue           = require('../utils/Queue');
const ResponseHandler = require('../utils/ResponseHandler');

exports.postgres = function(req, res) {
  models.sequelize.authenticate().then(() => {
    return ResponseHandler.handleSuccess(res, 200, 'PostgreSQL connection status: GOOD');
  }).catch(() => {
    return ResponseHandler.handleSuccess(req, res, 503, 'PostgreSQL connection status: BAD');
  });
};

/* ====================================================== */

exports.redis = function(req, res) {

  Queue.jobQueue.activeCount((err) => {
    if ( err ) {
      return ResponseHandler.handleSuccess(req, res, 503, 'Redis connection status: BAD');
    } else {
      return ResponseHandler.handleSuccess(res, 200, 'Redis connection status: GOOD');
    }
  });

};
