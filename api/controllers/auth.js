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

  var checkUsername = function(user) {
    var deferred = when.defer();
    var username = user.username || user.Username;

    models.User.find({
      where: { username: username }
    }).then(function(retrievedUser) {
      if ( !_.isEmpty(retrievedUser) ) {
        deferred.reject({ status: 400, body: 'That username is already taken.' });
      } else {
        deferred.resolve(user);
      }
    });

    return deferred.promise;
  };

  var checkEmail = function(user) {
    var deferred = when.defer();
    var email = user.email || user.Email;

    models.User.find({
      where: { email: email }
    }).then(function(retrievedUser) {
      if ( !_.isEmpty(retrievedUser) ) {
        deferred.reject({ status: 400, body: 'That email address is already registered.' });
      } else {
        deferred.resolve(user);
      }
    });

    return deferred.promise;
  };

  var checkFacebookId = function(user) {
    var deferred = when.defer();
    var facebookId = user.facebookId || user.FacebookId;

    if ( facebookId ) {
      models.User.find({
        where: { facebookId: facebookId }
      }).then(function(retrievedUser) {
        if ( !_.isEmpty(retrievedUser) ) {
          deferred.reject({ status: 400, body: 'An account is already registered to that Facebook profile.' });
        } else {
          deferred.resolve(user);
        }
      });
    } else {
      deferred.resolve(user);
    }

    return deferred.promise;
  };

  var createUser = function(user) {
    var deferred = when.defer();
    var newUser = {
      username: user.username || user.Username,
      email: user.email || user.Email,
      imageUrl: user.imageUrl || user.ImageUrl
    };

    if ( user.password || user.Password ) {
      newUser.hash = user.password || user.Password;
    } else if ( user.facebookId || user.FacebookId ) {
      newUser.facebookId = user.facebookId || user.FacebookId;
    }

    models.User.create(newUser).then(function(createdUser) {
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating user:', err);
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  checkUsername(req.body)
  .then(checkEmail)
  .then(checkFacebookId)
  .then(createUser)
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
          req.session.cookie.maxAge = 1000*60*60*24*7*4; // four weeks
          return res.status(200).json(user);
        }
      });
    }
  })(req, res, next);

};

/* ====================================================== */

exports.facebookLogin = function(req, res, next) {

  passport.authenticate('facebook-token', {
    scope: ['email', 'public_profile', 'user_friends']
  }, function(err, user, info) {
    if ( err ) {
      return next(err);
    } else if ( _.isEmpty(user) ) {
      return res.status(401).json({ status: 401, message: info.message || 'Authentication failed.' });
    } else {
      req.login(user, function(err) {
        if ( err ) {
          return next(err);
        } else {
          req.session.cookie.maxAge = 1000*60*60*24*7*4; // four weeks
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
        deferred.reject({ status: 404, body: 'No user could not be found matching that username.' });
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
        deferred.reject({ status: 404, body: 'No user could not be found matching the user ID and password reset key.' });
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