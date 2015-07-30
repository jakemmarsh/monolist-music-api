'use strict';

var when            = require('when');
var Sequelize       = require('sequelize');
var _               = require('lodash');
var models          = require('../models');
var awsRoutes       = require('./aws');
// var ActivityManager = require('../utils/ActivityManager');

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

  var currentUserId = req.user ? req.user.id : null;

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

  searchUsers(req.params.query, currentUserId).then(function(playlists) {
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

exports.getNotifications = function(req, res) {

  var fetchNotifications = function(userId) {
    var deferred = when.defer();

    models.Notification.findAll({
      where: { RecipientId: userId }
    }).then(function(retrievedNotifications) {
      deferred.resolve(retrievedNotifications);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchNotifications(req.params.id).then(function(notifications) {
    res.status(200).json(notifications);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.markNotificationsAsRead = function(req, res) {

  var modifyNotifications = function(userId, notificationIds) {
    var deferred = when.defer();

    if ( notificationIds.indexOf(',') !== -1 ) {
      notificationIds = notificationIds.split(',');
    } else {
      notificationIds = [notificationIds];
    }

    models.Notification.update(
      { read: true },
      { where: {
        id: notificationIds,
        RecipientId: userId
      }}
    ).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  modifyNotifications(req.params.userId, req.params.ids).then(function() {
    res.status(200).json('Notifications successfully marked as read.');
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

  var fetchPlaylists = function(userId) {
    var deferred = when.defer();

    models.Playlist.findAll({
      where: {
        ownerType: 'user',
        ownerId: userId
      },
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

  var mainDeferred = when.defer();
  var userId = req.params.id;

  var getUserGroups = function() {
    var deferred = when.defer();

    models.Group.findAll({
      where: {
        OwnerId: userId
      }
    }).then(function(groups) {
      deferred.resolve(_.pluck(groups, 'id'));
    }).catch(function(err) {
      // Resolve to still pass
      deferred.resolve([]);
    });

    return deferred.promise;
  };

  var getUserMemberships = function(groupIds) {
    var deferred = when.defer();

    models.GroupMembership.findAll({
      where: { UserId: userId },
      include: [
        {
          model: models.Group,
          attributes: ['id']
        }
      ]
    }).then(function(memberships) {
      deferred.resolve(_.union(groupIds, _.pluck(memberships, 'Group.id')));
    }).catch(function(err) {
      // Resolve to still pass
      deferred.resolve([]);
    });

    return deferred.promise;
  };

  var getUserCollaborations = function(groupIds) {
    var deferred = when.defer();

    models.Collaboration.findAll({
      where: { UserId: userId },
      include: [models.Playlist]
    }).then(function(collaborations) {
      deferred.resolve([_.pluck(collaborations, 'Playlist.id'), groupIds]);
    }).catch(function() {
      // still resolve
      deferred.resolve([[], groupIds]);
    });

    return deferred.promise;
  };

  var getPlaylists = function(data) {
    var deferred = when.defer();
    var playlistIds = data[0];
    var groupIds = data[1];

    models.Playlist.findAll({
      where: Sequelize.or(
        { id: playlistIds },
        Sequelize.or(
          Sequelize.and(
            { ownerId: userId },
            { ownerType: 'user' }
          ),
          Sequelize.and(
            { ownerId: groupIds },
            { ownerType: 'group' }
          )
        )
      )
    }).then(function(playlists) {
      deferred.resolve(playlists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getUserGroups()
  .then(getUserMemberships)
  .then(getUserCollaborations)
  .then(getPlaylists)
  .then(function(playlists) {
    res.status(200).json(playlists);
  }).catch(function(err) {
    console.log('error:', err);
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

  return mainDeferred.promise;

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
          Sequelize.and(
            { ownerId: req.user ? req.user.id : null },
            { ownerType: 'user' }
          )
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
          Sequelize.and(
            { ownerId: req.user ? req.user.id : null },
            { ownerType: 'user' }
          )
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

exports.getGroups = function(req, res) {

  var fetchGroups = function(userId) {
    var deferred = when.defer();

    models.GroupMembership.findAll({
      where: { UserId: userId },
      include: [
        {
          model: models.Group,
          as: 'Group'
        }
      ]
    }).then(function(memberships) {
      deferred.resolve(_.pluck(memberships, 'Group'));
    }).catch(function(err) {
      console.log('error:', err);
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroups(req.params.id)
  .then(function(groups) {
    res.status(200).json(groups);
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