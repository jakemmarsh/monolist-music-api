'use strict';

var log4js = require('log4js');

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

  if ( shouldLog && (process.env.NODE_ENV === 'production' || process.env.NODE_ENV  === 'test') ) {
    var logObject = {
      error: error,
      request: req
    };

    exports.logger.error(logObject);
  }

  return res.status(status).json({
    status: status,
    data: null,
    error: error
  });
};