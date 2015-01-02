'use strict';

var when      = require('when');
var Sequelize = require('sequelize');
var _         = require('lodash');
var models    = require('../models');
var awsRoutes = require('./aws');

/* ====================================================== */

exports.get = function(req, res) {

  var getUser = function(identifier) {
    var deferred = when.defer();
    var query = { id: identifier };

    if ( isNaN(parseInt(identifier)) ) {
      query = { username: identifier };
    }

    models.User.find({
      where: query,
      include: [
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
      if ( _.isEmpty(user) ) {
        deferred.reject({ status: 404, body: 'User could not be found at identifier: ' + identifier });
      } else {
        deferred.resolve(user);
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getUser(req.params.identifier).then(function(user) {
    res.status(200).json(user);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.search = function(req, res) {

  var searchUsers = function(query, currentUserId) {
    var deferred = when.defer();

    models.User.findAll({
      where: { username: { ilike: '%' + query + '%' } }
    }).then(function(retrievedUsers) {
      // Don't return the user that is doing the search
      retrievedUsers = _.reject(retrievedUsers, function(user) { return user.id === currentUserId; });
      deferred.resolve(retrievedUsers);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  searchUsers(req.params.query, req.user.id).then(function(playlists) {
    res.status(200).json(playlists);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.update = function(req, res) {

  var fetchUser = function(id, updates) {
    var deferred = when.defer();

    models.User.find({
      where: { id: id }
    }).then(function(user) {
      if ( !_.isEmpty(user) ) {
        deferred.resolve([user, updates]);
      } else {
        deferred.reject({ status: 404, body: 'User could not be found at the ID: ' + id });
      }
    });

    return deferred.promise;
  };

  var updateUser = function(data) {
    var deferred = when.defer();
    var retrievedUser = data[0];
    var updates = data[1];
    var sanitizedUpdates = {};

    if ( updates.email || updates.Email ) {
      sanitizedUpdates.email = updates.email || updates.Email;
    }

    if ( updates.password || updates.Password ) {
      sanitizedUpdates.hash = updates.password || updates.Password;
    }

    retrievedUser.updateAttributes(sanitizedUpdates).then(function(updatedUser) {
      deferred.resolve(updatedUser);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchUser(req.params.id, req.body)
  .then(updateUser)
  .then(function(updatedUser) {
    res.status(200).json(updatedUser);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.follow = function(req, res) {

  var followUser = function(currentUserId, targetUserId) {
    var deferred = when.defer();
    var attributes = {
      FollowerId: currentUserId,
      UserId: targetUserId
    };

    models.UserFollow.find({
      where: attributes
    }).then(function(retrievedFollowing) {
      if ( _.isEmpty(retrievedFollowing) ) {
        models.UserFollow.create(attributes).then(function(savedFollow) {
          deferred.resolve(savedFollow);
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      } else {
        retrievedFollowing.destroy().then(function() {
          deferred.resolve('Following successfully removed.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      }
    });

    return deferred.promise;
  };

  followUser(req.user.id, req.params.id).then(function(following) {
    res.status(200).json(following);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getPlaylists = function(req, res) {

  var fetchPlaylists = function(id) {
    var deferred = when.defer();

    models.Playlist.findAll({
      where: Sequelize.and(
        { UserId: id },
        Sequelize.or(
          { privacy: 'public' },
          { UserId: req.user ? req.user.id : null }
        )
      ),
      include: [
        {
          model: models.PlaylistLike,
          as: 'Likes'
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays'
        }
      ]
    }).then(function(playlists) {
      deferred.resolve(playlists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchPlaylists(req.params.id).then(function(playlists) {
    res.status(200).json(playlists);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getEditablePlaylists = function(req, res) {

  var fetchCollaborations = function(userId) {
    var deferred = when.defer();

    models.Collaboration.findAll({
      where: { UserId: userId }
    }).then(function(collaborations) {
      deferred.resolve({ userId: userId, collaborations: collaborations });
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var fetchEditablePlaylists = function(data) {
    var deferred = when.defer();
    var userId = data.userId;
    var collaborations = data.collaborations;

    models.Playlist.findAll({
      where: Sequelize.or(
        { id: _.pluck(collaborations, 'PlaylistId') },
        { UserId: userId }
      ),
      include: [
        {
          model: models.PlaylistLike,
          as: 'Likes'
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays'
        }
      ]
    }).then(function(editablePlaylists) {
      deferred.resolve(editablePlaylists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchCollaborations(req.params.id)
  .then(fetchEditablePlaylists)
  .then(function(playlists) {
    res.status(200).json(playlists);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getCollaborations = function(req, res) {

  var fetchCollaborations = function(userId) {
    var deferred = when.defer();

    models.Collaboration.findAll({
      where: { UserId: userId }
    }).then(function(collaborations) {
      deferred.resolve(collaborations);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var fetchCollaborationPlaylists = function(collaborations) {
    var deferred = when.defer();

    models.Playlist.findAll({
      where: Sequelize.and(
        { id: _.pluck(collaborations, 'PlaylistId') },
        Sequelize.or(
          { privacy: 'public' },
          { UserId: req.user ? req.user.id : null }
        )
      ),
      include: [
        {
          model: models.PlaylistLike,
          as: 'Likes'
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays'
        }
      ]
    }).then(function(collaborationPlaylists) {
      deferred.resolve(collaborationPlaylists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchCollaborations(req.params.id)
  .then(fetchCollaborationPlaylists)
  .then(function(playlists) {
    res.status(200).json(playlists);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getLikes = function(req, res) {

  var fetchLikes = function(id) {
    var deferred = when.defer();

    models.PlaylistLike.findAll({
      where: { UserId: id }
    }).then(function(likes) {
      deferred.resolve(likes);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var fetchPlaylists = function(likes) {
    var deferred = when.defer();

    models.Playlist.findAll({
      where: Sequelize.and(
        { id: _.pluck(likes, 'PlaylistId') },
        Sequelize.or(
          { privacy: 'public' },
          { UserId: req.user ? req.user.id : null }
        )
      ),
      include: [
        {
          model: models.PlaylistLike,
          as: 'Likes'
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays'
        }
      ]
    }).then(function(likedPlaylists) {
      deferred.resolve(likedPlaylists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchLikes(req.params.id)
  .then(fetchPlaylists)
  .then(function(likedPlaylists) {
    res.status(200).json(likedPlaylists);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getStars = function(req, res) {

  var fetchStarredTracks = function(id) {
    var deferred = when.defer();

    models.StarredTrack.findAll({
      where: { UserId: id }
    }).then(function(starredTracks) {
      deferred.resolve(starredTracks);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchStarredTracks(req.params.id).then(function(starredTracks) {
    res.status(200).json(starredTracks);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.delete = function(req, res) {

  var originalImageUrl;

  var ensureUserCanDelete = function(currentUser, userIdToDelete) {
    var deferred = when.defer();

    if ( currentUser.role === 'admin' || userIdToDelete === currentUser.id ) {
      deferred.resolve(userIdToDelete);
    } else {
      deferred.reject({ status: 401, body: 'You do not have permission to delete another user\'s account.' });
    }

    return deferred.promise;
  };

  var findUser = function(userId) {
    var deferred = when.defer();

    models.User.find({
      where: {
        id: userId
      }
    }).then(function(user) {
      originalImageUrl = user.imageUrl || null;
      deferred.resolve(user);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var deleteUser = function(user) {
    var deferred = when.defer();

    user.destroy().then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var deleteOriginalImage = function() {
    var deferred = when.defer();

    if ( !_.isEmpty(originalImageUrl) ) {
      awsRoutes.delete(originalImageUrl).then(function(res) {
        deferred.resolve(res);
      }).catch(function() {
        // Still resolve since user was successfully deleted
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }

    return deferred.promise;
  };

  ensureUserCanDelete(req.user, parseInt(req.params.id))
  .then(findUser)
  .then(deleteUser)
  .then(deleteOriginalImage)
  .then(function() {
    res.status(200).json({ status: 200, message: 'User successfully deleted.' });
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};