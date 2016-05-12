exports.status             = require('./status');

exports.auth               = require('./auth');

exports.user               = require('./user');
exports.post               = require('./post');
exports.group              = require('./group');
exports.playlist           = require('./playlist');
exports.track              = require('./track');

exports.aws                = require('./aws');

exports.sources            = require('./sources/index.js');
exports.soundcloudRedirect = exports.sources.soundcloud.redirect;

exports.email              = require('./email');
