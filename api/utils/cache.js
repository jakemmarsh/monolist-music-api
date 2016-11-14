'use strict';

var url           = require('url');
var redisUrlParts = url.parse(process.env.REDISTOGO_URL);
var cache         = require('express-redis-cache')({
  port: redisUrlParts.port,
  host: redisUrlParts.hostname,
  auth_pass: redisUrlParts.auth.split(':')[1], // eslint-disable-line camelcase
  expires: 60 * 5 // cache responses for five minutes
});

module.exports = cache;
