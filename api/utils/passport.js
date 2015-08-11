'use strict';

var passport              = require('passport');
var _                     = require('lodash');
var LocalStrategy         = require('passport-local').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token').Strategy;
var models                = require('../models');

/* ====================================================== */

module.exports = function() {

  var getUser = function(username) {
    var deferred = when.defer();

    models.User.find({
      where: { username: username },
      include: [
        {
          models: models.StarredTrack,
          as: 'StarredTracks'
        },
        {
          model: models.UserFollow,
          as: 'Followers'
        },
        {
          model: models.UserFollow,
          as: 'UsersFollowing'
        },
        {
          model: models.PlaylistFollow,
          as: 'PlaylistsFollowing'
        }
      ]
    }).then(function(user) {
      deferred.resolve(user);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var addGroupsToUser = function(user) {
    var deferred = when.defer();
    var groupIds;

    user = user.toJSON();

    models.GroupMembership.findAll({
      where: { UserId: user.id },
      include: [
        {
          model: models.Group,
          as: 'Group'
        }
      ]
    }).then(function(memberships) {
      groupIds = _.pluck(memberships, 'Group');
      groupIds = _.pluck(groupIds, 'id');
      user.groups = groupIds;
      deferred.resolve(user);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  passport.use(new LocalStrategy(function(username, password, done) {
    getUser(username).then(function(user) {
      if ( _.isEmpty(user) ) {
        return done(null, false, { message: 'No user could be found with that username.' });
      } else {
        user.verifyPassword(password, function(err, result) {
          if ( err || !result ) {
            return done(null, false, { message: 'Incorrect password.' });
          } else {
            addGroupsToUser(user).then(function(updatedUser) {
              return done(null, updatedUser);
            });
          }
        });
      }
    }).catch(function(err) {
      return done(err);
    });
  }));

  /* ====================================================== */

  passport.use(new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET
  }, function(accessToken, refreshToken, profile, done) {
    models.User.find({
      where: { facebookId: profile.id },
      include: [models.StarredTrack]
    }).then(function(retrievedUser) {
      if ( !_.isEmpty(retrievedUser) ) {
        return done(null, retrievedUser);
      } else {
        return done(null, false, { message: 'No user could be found for that Facebook account.' });
      }
    }).catch(function(err) {
      return done(err);
    });
  }));

  /* ====================================================== */

  passport.serializeUser(function(user, done) {
    done(null, user.username);
  });

  /* ====================================================== */

  passport.deserializeUser(function(username, done) {
    getUser(username)
    .then(addGroupsToUser)
    .then(function(user) {
      done(null, user);
    }).catch(done);
  });

};