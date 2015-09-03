'use strict';

exports.handleSuccess = function(res, status, data) {
  return res.status(status).json({
    status: status,
    data: data,
    error: null
  });
};

/* ====================================================== */

exports.handleError = function(res, status, error) {
  return res.status(status).json({
    status: status,
    data: null,
    error: error
  });
};