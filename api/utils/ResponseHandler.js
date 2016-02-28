'use strict';

var log4js = require('log4js');
var _      = require('lodash');

var CENSORED_FIELDS = ['password', 'hash'];
var CENSORED_VALUE  = '<< CENSORED >>';

/* ====================================================== */

log4js.configure({
  'replaceConsole': false,
  'appenders': [
    {
      type: 'console'
    },
    {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: {
        type: 'smtp',
        recipients: 'jakemmarsh@gmail.com',
        sender: 'jake@monolist.co',
        sendInterval: 60,
        transport: 'SMTP',
        SMTP: {
          host: 'email-smtp.us-east-1.amazonaws.com',
          port: 25,
          auth: {
            user: process.env.SES_SMTP_USER,
            pass: process.env.SES_SMTP_PASSWORD
          }
        }
      }
    }
  ]
});

exports.logger = log4js.getLogger();

/* ====================================================== */

exports.censorData = function(data) {
  var dataCopy = JSON.parse(JSON.stringify(data));

  _.forIn(dataCopy, function(val, key) {
    if ( _.isObject(val) ) {
      dataCopy[key] = exports.censorData(val);
    } else if ( _.indexOf(CENSORED_FIELDS, key) !== -1 ) {
      dataCopy[key] = CENSORED_VALUE;
    }
  });

  return dataCopy;
};

/* ====================================================== */

exports.handleSuccess = function(res, status, data) {
  return res.status(status).json({
    status: status,
    data: data,
    error: null
  });
};

/* ====================================================== */

exports.handleError = function(req, res, status, error, shouldLog) {
  shouldLog = typeof(shouldLog) === 'undefined' ? true : shouldLog;

  if ( shouldLog && process.env.NODE_ENV === 'production' ) {
    exports.logger.error(exports.censorData({
      error: error,
      url: req.url,
      method: req.method,
      referer: req.headers.referer,
      params: req.params,
      query: req.query,
      body: req.body,
      user: req.user || null
    }));
  }

  return res.status(status).json({
    status: status,
    data: null,
    error: error.message || error
  });
};