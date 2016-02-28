'use strict';

var cache = require('express-redis-cache')({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  auth_pass: process.env.REDIS_AUTH, // eslint-disable-line camelcase
  expires: 60 * 5 // cache responses for five minutes
});

module.exports = cache;
