'use strict';

var when     = require('when');
var _        = require('lodash');
var passport = require('passport');
var crypto   = require('crypto');
var models   = require('../models');
var mailer   = require('../mailer');

/* ====================================================== */

exports.isAuthenticated = function(req, res, next) {

  if ( req.isAuthenticated() || (req.session && req.session.user) ) {
    return next();
  } else {
    return res.status(401).json({ status: 401, message: 'User must be logged in.' });
  }

};

/* ====================================================== */

exports.isAdmin = function(req, res, next) {

  if ( req.user && req.user.role === 'admin' ) {
    return next();
  } else {
    return res.status(401).json({ error: 'User must be an admin.' });
  }

};

/* ====================================================== */

exports.register = function(req, res) {

  var createUser = function(user) {
    var deferred = when.defer();

    user = {
      username: user.username || user.Username,
      email: user.email || user.Email,
      imageUrl: user.imageUrl || user.ImageUrl,
      hash: user.password || user.Password
    };

    models.User.create(user).then(function(createdUser) {
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating user:', err);
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  createUser(req.body)
  .then(mailer.sendWelcome)
  .then(function(user) {
    res.status(200).json(user);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.login = function(req, res, next) {

  passport.authenticate('local', function(err, user, info) {
    if ( err ) {
      return next(err);
    } else if ( _.isEmpty(user) ) {
      return res.status(401).json({ status: 401, message: info.message || 'Authentication failed.' });
    } else {
      req.login(user, function(err) {
        if ( err ) {
          return next(err);
        } else {
          req.session.cookie.maxAge = 1000*60*60*24*7; // seven days
          return res.status(200).json(user);
        }
      });
    }
  })(req, res, next);

};

/* ====================================================== */

exports.forgotPassword = function(req, res) {

  var fetchUser = function(username) {
    var deferred = when.defer();

    models.User.find({
      where: { username: username }
    }).then(function(retrievedUser) {
      if ( !_.isEmpty(retrievedUser) ) {
        deferred.resolve(retrievedUser);
      } else {
        deferred.reject({ status: 404, body: 'User could not be found matching that username.' });
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var updateUser = function(user) {
    var deferred = when.defer();
    var key = crypto.randomBytes(16).toString('hex');

    user.updateAttributes({
      passwordResetKey: key
    }).then(function(user) {
      deferred.resolve({ user: user, key: key });
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var sendEmail = function(data) {
    var deferred = when.defer();
    var user = data.user;
    var key = data.key;

    mailer.sendReset(user, key).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchUser(req.params.username)
  .then(updateUser)
  .then(sendEmail)
  .then(function() {
    res.status(200).json({ message: 'Password reset email successfully sent.' });
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.resetPassword = function(req, res) {

  var fetchUser = function(userId, resetKey, password) {
    var deferred = when.defer();

    models.User.find({
      where: { id: userId }
    }).then(function(retrievedUser) {
      if ( !_.isEmpty(retrievedUser) ) {
        if ( retrievedUser.passwordResetKey === resetKey ) {
          deferred.resolve({ user: retrievedUser, password: password });
        } else {
          deferred.reject({ status: 401, body: 'That password reset key is invalid.' });
        }
      } else {
        deferred.reject({ status: 404, body: 'User could not be found matching that user ID and password reset key.' });
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var updateUser = function(data) {
    var deferred = when.defer();
    var retrievedUser = data.user;
    var password = data.password;

    retrievedUser.updateAttributes({
      passwordResetKey: null,
      hash: password
    }).then(function(user) {
      deferred.resolve(user);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchUser(req.params.id, req.params.key, req.body.password)
  .then(updateUser)
  .then(function(resp) {
    res.status(200).json(resp);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.logout = function(req, res) {

  req.logout();
  res.status(200).json({ message: 'User successfully logged out.' });

};