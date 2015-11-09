'use strict';

var log4js = require('log4js');
var logger;

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
logger = log4js.getLogger();
exports.logger = logger;

/* ====================================================== */

exports.handleSuccess = function(res, status, data) {
  return res.status(status).json({
    status: status,
    data: data,
    error: null
  });
};

/* ====================================================== */

exports.handleError = function(req, res, status, error) {
  var logObject = {
    request: req,
    error: error
  };

  logger.error(logObject);

  return res.status(status).json({
    status: status,
    data: null,
    error: error
  });
};