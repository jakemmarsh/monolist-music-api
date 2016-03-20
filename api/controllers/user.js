'use strict';

var when            = require('when');
var Sequelize       = require('sequelize');
var _               = require('lodash');
var models          = require('../models');
var awsRoutes       = require('./aws');
var ActivityManager = require('../utils/ActivityManager');
var ResponseHandler = require('../utils/ResponseHandler');

/* ====================================================== */

exports.get = function(req, res) {

  var getUser = function(identifier) {
    var deferred = when.defer();
    var query = { id: identifier };

    if ( isNaN(parseInt(identifier)) ) {
      query = { username: { ilike: identifier } };
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

  var addGroupsToUser = function(user) {
    var deferred = when.defer();
    var groupIds;

    user = user.toJSON();

    models.GroupMembership.findAll({
      where: { UserId: user.id },
      include: [
        {
          model: models.Group,
          as: 'Group',
          attributes: ['id']
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

  getUser(req.params.identifier)
  .then(addGroupsToUser)
  .then(function(user) {
    ResponseHandler.handleSuccess(res, 200, user);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    ResponseHandler.handleSuccess(res, 200, updatedUser);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.getNotifications = function(req, res) {

  var modelMap = {
    post: models.Post,
    user: models.User,
    group: models.Group,
    playlist: models.Playlist,
    track: models.Track
  };

  var getRelatedEntity = function(entityType, entityId) {
    var deferred = when.defer();

    if ( modelMap[entityType] ) {
      modelMap[entityType].find({
        where: { id: entityId }
      }).then(function(entity) {
        deferred.resolve(entity);
      }).catch(function() {
        deferred.reject({ status: 500, body: 'Related entity could not be found: ' + entityType + ', ' + entityId});
      });
    } else {
      deferred.resolve({});
    }

    return deferred.promise;
  };

  var fetchNotifications = function(userId) {
    var deferred = when.defer();

    models.Notification.findAll({
      where: {
        RecipientId: userId,
        read: false
      },
      include: [
        {
          model: models.User,
          as: 'Actor',
          attributes: ['id', 'username', 'imageUrl']
        }
      ]
    }).then(function(retrievedNotifications) {
      var promises = [];
      var notifications = [];

      _.each(retrievedNotifications, function(notification) {
        notification = notification.toJSON();
        delete notification.ActorId;
        notifications.push(notification);
        promises.push(getRelatedEntity(notification.entityType, notification.entityId));
      });

      when.all(promises).then(function(results) {
        _.each(results, function(result, index) {
          notifications[index].entity = result;
        });

        deferred.resolve(notifications);
      });
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchNotifications(req.params.id).then(function(notifications) {
    ResponseHandler.handleSuccess(res, 200, notifications);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    ResponseHandler.handleSuccess(res, 200, 'Notifications successfully marked as read.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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

  followUser(req.user.id, req.params.id)
  .then(function(result) {
    // Only create activity if a follow object was returned,
    // because otherwise a follow was deleted
    if ( _.isObject(result) ) {
      ActivityManager.queue('user', req.params.id, 'follow', req.user.id);
    }

    return when(result);
  })
  .then(function(following) {
    ResponseHandler.handleSuccess(res, 200, following);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.getPlaylists = function(req, res) {

  var fetchPlaylists = function(userId) {
    var deferred = when.defer();

    models.Playlist.findAll({
      where: Sequelize.and(
        { ownerType: 'user' },
        Sequelize.and(
          { ownerId: userId },
          Sequelize.or(
            { privacy: 'public' },
            Sequelize.or(
              Sequelize.and(
                { ownerType: 'user' },
                { ownerId: req.user ? req.user.id : null }
              ),
              Sequelize.and(
                { ownerType: 'group' },
                { ownerId: req.user ? req.user.groups : null }
              )
            )
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
    }).then(function(playlists) {
      deferred.resolve(playlists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchPlaylists(req.params.id).then(function(playlists) {
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    }).catch(function() {
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
      var membershipGroupIds = _.map(memberships, function(membership) {
        return membership.Group.id;
      });
      deferred.resolve(_.union(groupIds, membershipGroupIds));
    }).catch(function() {
      // Resolve to still pass
      deferred.resolve([]);
    });

    return deferred.promise;
  };

  var getUserCollaborations = function(groupIds) {
    var deferred = when.defer();

    models.Collaboration.findAll({
      where: { UserId: userId },
      include: [
        {
          model: models.Playlist,
          attributes: ['id']
        }
      ]
    }).then(function(collaborations) {
      var playlistIds = _.map(collaborations, function(collaboration) {
        return collaboration.Playlist.id;
      });
      deferred.resolve([playlistIds, groupIds]);
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

  getUserGroups()
  .then(getUserMemberships)
  .then(getUserCollaborations)
  .then(getPlaylists)
  .then(function(playlists) {
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    ResponseHandler.handleSuccess(res, 200, likedPlaylists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    ResponseHandler.handleSuccess(res, 200, starredTracks);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
          as: 'Group',
          include: [{
            model: models.GroupMembership,
            as: 'Memberships'
          }]
        }
      ]
    }).then(function(memberships) {
      deferred.resolve(_.pluck(memberships, 'Group'));
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroups(req.params.id)
  .then(function(groups) {
    ResponseHandler.handleSuccess(res, 200, groups);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
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
    ResponseHandler.handleSuccess(res, 200, 'User successfully deleted.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};
