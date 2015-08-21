'use strict';

exports.handleSuccess = function(res, status, data) {
  res.status(status).json({
    status: status,
    data: data,
    error: null
  });
};

/* ====================================================== */

exports.handleError = function(res, status, error) {
  res.status(status).json({
    status: status,
    data: null,
    error: error
  });
};