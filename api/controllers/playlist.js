'use strict';

var when            = require('when');
var _               = require('lodash');
var Sequelize       = require('sequelize');
var changeCase      = require('change-case');
var models          = require('../models');
var awsRoutes       = require('./aws');
var ActivityManager = require('../utils/ActivityManager');
var ResponseHandler = require('../utils/ResponseHandler');

/* ====================================================== */

const WINDOW_TYPES = ['day', 'week', 'month', 'year'];
const WINDOW_IN_DAYS = {
  day: 1,
  week: 7,
  month: 30,
  year: 365
};

function getQueryWindow(win, fallback) {
  win = win || fallback;
  const windowIndex = WINDOW_TYPES.indexOf(win.toLowerCase());

  return windowIndex === -1 ? WINDOW_TYPES[1] : WINDOW_TYPES[windowIndex];
}

/* ====================================================== */

function ensureCurrentUserCanEdit(req, playlistId) {

  var mainDeferred = when.defer();

  var getUserGroups = function(userId) {
    var deferred = when.defer();

    models.Group.findAll({
      where: {
        OwnerId: userId
      }
    }).then(function(groups) {
      deferred.resolve([userId, _.pluck(groups, 'id')]);
    }).catch(function() {
      // Resolve to still pass
      deferred.resolve([userId, []]);
    });

    return deferred.promise;
  };

  var getUserMemberships = function(data) {
    var deferred = when.defer();
    var userId = data[0];
    var groupIds = data[1];

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

  var checkUserPlaylists = function(groupIds) {
    var deferred = when.defer();

    models.Playlist.find({
      where: Sequelize.and(
        { id: playlistId },
        Sequelize.or(
          Sequelize.and(
            { ownerId: req.user.id },
            { ownerType: 'user' }
          ),
          Sequelize.and(
            { ownerId: groupIds },
            { ownerType: 'group' }
          )
        )
      )
    }).then(function(playlist) {
      if ( !_.isEmpty(playlist) ) {
        deferred.resolve(true);
      } else {
        // Resolve to still pass to checkCollaborations
        deferred.resolve(false);
      }
    }).catch(function() {
      deferred.reject();
    });

    return deferred.promise;
  };

  var checkCollaborations = function(userPlaylistsResult) {
    var deferred = when.defer();

    if ( userPlaylistsResult ) {
      // Already been confirmed that user can edit the playlist
      deferred.resolve();
    } else {
      models.Collaboration.findAll({
        where: { PlaylistId: playlistId, UserId: req.user.id }
      }).then(function(collaborations) {
        if ( !_.isEmpty(collaborations) ) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }).catch(function() {
        deferred.reject();
      });
    }

    return deferred.promise;
  };

  getUserGroups(req.user.id)
  .then(getUserMemberships)
  .then(checkUserPlaylists)
  .then(checkCollaborations)
  .then(function() {
    mainDeferred.resolve();
  }).catch(function() {
    mainDeferred.reject({ status: 401, body: 'Current user does not have permission to edit playlist: ' + req.params.id });
  });

  return mainDeferred.promise;

}

/* ====================================================== */

exports.get = function(req, res) {

  var getPlaylist = function(slug, currentUser) {
    var deferred = when.defer();
    var currentUserIsCreator;
    var currentUserIsCollaborator;
    var includes;
    var query;
    var ownerModel;

    currentUser = currentUser || {};

    // if only passed an ID
    if ( isFinite(slug) ) {
      query = { id: slug };
    } else {
      query = { slug: { ilike: slug } };
    }

    models.Playlist.find({
      where: query,
      include: [
        {
          model: models.Collaboration,
          include: [
            {
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
            }
          ]
        },
        {
          model: models.Track,
          include: [
            {
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
            },
            {
              model: models.TrackComment,
              as: 'Comments',
              include: [{
                model: models.User,
                attributes: ['id', 'username', 'imageUrl']
              }]
            },
            {
              model: models.TrackUpvote,
              as: 'Upvotes',
              attributes: ['id', 'UserId']
            },
            {
              model: models.TrackDownvote,
              as: 'Downvotes',
              attributes: ['id', 'UserId']
            }
          ]
        },
        {
          model: models.PlaylistFollow,
          as: 'Followers'
        },
        {
          model: models.PlaylistLike,
          as: 'Likes',
          attributes: ['id', 'UserId']
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays',
          attributes: ['id']
        }
      ],
      order: [
        [models.Track, 'order', 'ASC'],
        [models.Track, { model: models.TrackComment, as: 'Comments' }, 'createdAt', 'DESC']
      ]
    }).then(function(playlist) {
      if ( _.isEmpty(playlist) ) {
        deferred.reject({ status: 404, body: 'Playlist could not be found.' });
      } else {
        currentUserIsCreator = currentUser.id === playlist.ownerId && playlist.ownerType === 'user';
        currentUserIsCollaborator = !!_.where(playlist.Collaborations, { UserId: currentUser.id }).length;
        ownerModel = playlist.ownerType === 'user' ? models.User : models.Group;
        includes = [];

        if ( playlist.ownerType === 'group' ) {
          includes = [
            {
              model: models.GroupMembership,
              as: 'Memberships'
            }
          ];
        }

        if ( currentUserIsCreator || currentUserIsCollaborator || playlist.privacy === 'public' ) {
          ownerModel.find({
            where: { id: playlist.ownerId },
            include: includes
          }).then(function(owner) {
            playlist = playlist.toJSON();
            playlist.owner = owner;
            delete playlist.ownerId;
            playlist.collaborators = _.pluck(playlist.Collaborations, 'User');
            delete playlist.Collaborations;
            deferred.resolve(playlist);
          });
        } else {
          deferred.reject({
            status: 401,
            body: 'Current user does not have permission to view that playlist.'
          });
        }
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getPlaylist(req.params.slug, req.user).then(function(playlist) {
    ResponseHandler.handleSuccess(res, 200, playlist);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.search = function(req, res) {

  var searchPlaylists = function(query, limit, offset) {
    var deferred = when.defer();

    limit = ( limit && limit < 50 ) ? limit : 20;
    offset = offset || 0;

    models.Playlist.findAll({
      where: Sequelize.and(
        Sequelize.or(
          { title: { ilike: '%' + query + '%' } },
          { tags: { ilike: '%' + query + '%' } }
        ),
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
      ),
      limit: limit,
      offset: offset
    }).then(function(retrievedPlaylists) {
      deferred.resolve(retrievedPlaylists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var recordSearch = function(currentUser, query, results) {
    var deferred = when.defer();
    var attributes = {
      UserId: currentUser ? currentUser.id : null,
      query: query,
      results: _.pluck(results, 'id')
    };

    models.PlaylistSearch.create(attributes).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  searchPlaylists(req.params.query, req.query.limit, req.query.offset).then(function(playlists) {
    recordSearch(req.user, req.params.query, playlists).then(function() {
      ResponseHandler.handleSuccess(res, 200, playlists);
    });
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.getTrending = function(req, res) {

  const window = getQueryWindow(req.query.window, 'week');
  const previousDate = new Date();
  previousDate.setDate(previousDate.getDate() - WINDOW_IN_DAYS[window]);

  var getLikes = function() {
    var deferred = when.defer();

    models.PlaylistLike.findAll({
      where: { createdAt: { $gte: previousDate } },
      attributes: ['PlaylistId'],
      order: [['createdAt', 'DESC']],
      limit: 1000
    }).then(function(likes) {
      deferred.resolve(likes);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var getPlays = function(likes) {
    var deferred = when.defer();

    models.PlaylistPlay.findAll({
      where: { createdAt: { $gte: previousDate } },
      attributes: ['PlaylistId'],
      order: [['createdAt', 'DESC']],
      limit: 1000
    }).then(function(plays) {
      deferred.resolve([likes, plays]);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var getFollows = function(data) {
    var deferred = when.defer();
    var likes = data[0];
    var plays = data[1];

    models.PlaylistFollow.findAll({
      where: { createdAt: { $gte: previousDate } },
      attributes: ['PlaylistId'],
      order: [['createdAt', 'DESC']],
      limit: 1000
    }).then(function(follows) {
      deferred.resolve([likes, plays, follows]);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var process = function(data) {
    var deferred = when.defer();
    var likes = _.countBy(data[0], function(like) { return like.PlaylistId; });
    var plays = _.countBy(data[1], function(play) { return play.PlaylistId; });
    var follows = _.countBy(data[2], function(follow) { return follow.PlaylistId; });
    var merged = _.merge(likes, plays, follows, function(a, b) { return a + b; });
    var formatted = [];
    var limit = ( req.query.limit && req.query.limit < 50 ) ? req.query.limit : 30;
    var results;

    _.forOwn(merged, function(num, key) {
      formatted.push({
        PlaylistId: parseInt(key),
        NumInteractions: num
      });
    });

    results = _.sortBy(formatted, function(item) { return -item.NumInteractions; }).slice(0, limit);

    deferred.resolve(_.pluck(results, 'PlaylistId'));

    return deferred.promise;
  };

  var getPlaylists = function(playlistIds) {
    var deferred = when.defer();

    models.Playlist.findAll({
      where: Sequelize.and(
        { id: playlistIds },
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

  getLikes()
  .then(getPlays)
  .then(getFollows)
  .then(process)
  .then(getPlaylists)
  .then(function(playlists) {
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.getNewest = function(req, res) {

  var getPlaylists = function(limit) {
    var deferred = when.defer();

    limit = ( limit && limit < 50 ) ? limit : 30;

    models.Playlist.findAll({
      where: Sequelize.or(
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
      ),
      limit: limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: models.PlaylistLike,
          as: 'Likes',
          attributes: ['id', 'UserId']
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays',
          attributes: ['id']
        }
      ]
    }).then(function(playlists) {
      deferred.resolve(playlists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getPlaylists(req.query.limit).then(function(playlists) {
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.getSearches = function(req, res) {

  var fetchSearches = function(limit, offset) {
    var deferred = when.defer();

    limit = ( limit && limit < 50 ) ? limit : 20;
    offset = offset || 0;

    models.PlaylistSearch.findAll({
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset
    }).then(function(searches) {
      deferred.resolve(searches);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchSearches(req.query.limit, req.query.offset).then(function(searches) {
    ResponseHandler.handleSuccess(res, 200, searches);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.getRecentlyPlayed = function(req, res) {

  const userId = !isNaN(req.query.userId) ? parseInt(req.query.userId) : null;
  const window = getQueryWindow(req.query.window, 'week');
  const previousDate = new Date();
  previousDate.setDate(previousDate.getDate() - WINDOW_IN_DAYS[window]);
  const query = {
    createdAt: {
      $gte: previousDate
    }
  };

  if ( userId ) {
    query['UserId'] = userId;
  }

  var getRecentPlays = function() {
    var deferred = when.defer();

    models.PlaylistPlay.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      limit: 500
    }).then(function(plays) {
      deferred.resolve(plays);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var getPlaylists = function(plays) {
    var deferred = when.defer();
    var limit = ( req.query.limit && req.query.limit < 50 ) ? req.query.limit : 20;
    var playlistIds = _.pluck(plays, 'PlaylistId');

    models.Playlist.findAll({
      where: {
        id: playlistIds,
        privacy: 'public'
      },
      limit: limit,
      include: [
        {
          model: models.PlaylistLike,
          as: 'Likes'
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays'
        }
      ],
      order: [[{ model: models.PlaylistPlay, as: 'Plays' }, 'createdAt', 'DESC']]
    }).then(function(playlists) {
      deferred.resolve(playlists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getRecentPlays()
  .then(getPlaylists)
  .then(function(playlists) {
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.create = function(req, res) {

  var createPlaylist = function(playlist) {
    var deferred = when.defer();

    playlist = {
      ownerId: playlist.ownerId || playlist.OwnerId,
      ownerType: playlist.ownerType || playlist.OwnerType,
      title: playlist.title || playlist.Title,
      tags: playlist.tags || playlist.Tags,
      privacy: playlist.privacy || playlist.Privacy
    };

    models.Playlist.create(playlist).then(function(savedPlaylist) {
      var model = models[changeCase.pascal(savedPlaylist.ownerType)];

      model.find({
        where: { id: savedPlaylist.ownerId }
      }).then(function(retrievedEntity) {
        savedPlaylist = savedPlaylist.toJSON();
        savedPlaylist.owner = retrievedEntity;
        deferred.resolve(savedPlaylist);
      }).catch(function() {
        // Still resolve
        deferred.resolve(savedPlaylist);
      });
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  createPlaylist(req.body)
  .then(ActivityManager.queue.bind(null, 'playlist', null, 'create', req.user.id))
  .then(function(createdPlaylist) {
    ResponseHandler.handleSuccess(res, 200, createdPlaylist);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.update = function(req, res) {

  var fetchPlaylist = function() {
    var deferred = when.defer();
    var id = req.params.id;
    var updates = req.body;

    models.Playlist.find({
      where: { id: id },
      include: [
        {
          model: models.Collaboration,
          include: [
            {
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
            }
          ]
        },
        {
          model: models.Track,
          include: [
            {
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
            },
            {
              model: models.TrackComment,
              as: 'Comments',
              include: [{
                model: models.User,
                attributes: ['id', 'username', 'imageUrl']
              }]
            },
            {
              model: models.TrackUpvote,
              as: 'Upvotes',
              attributes: ['id', 'UserId']
            },
            {
              model: models.TrackDownvote,
              as: 'Downvotes',
              attributes: ['id', 'UserId']
            }
          ]
        },
        {
          model: models.PlaylistFollow,
          as: 'Followers'
        },
        {
          model: models.PlaylistLike,
          as: 'Likes',
          attributes: ['id', 'UserId']
        },
        {
          model: models.PlaylistPlay,
          as: 'Plays',
          attributes: ['id']
        }
      ],
      order: [
        [models.Track, 'order', 'ASC'],
        [models.Track, { model: models.TrackComment, as: 'Comments' }, 'createdAt', 'DESC']
      ]
    }).then(function(playlist) {
      if ( !_.isEmpty(playlist) ) {
        var ownerModel = playlist.ownerType === 'user' ? models.User : models.Group;
        var includes = [];

        if ( playlist.ownerType === 'group' ) {
          includes.push({
            model: models.GroupMembership,
            as: 'Memberships'
          });
        }

        ownerModel.find({
          where: { id: playlist.ownerId },
          include: includes
        }).then(function(owner) {
          var collaborators = _.pluck(playlist.Collaborations, 'User');
          deferred.resolve([playlist, updates, owner, collaborators]);
        });
      } else {
        deferred.reject({ status: 404, body: 'Playlist could not be found at the ID: ' + id });
      }
    });

    return deferred.promise;
  };

  var updatePlaylist = function(data) {
    var deferred = when.defer();
    var retrievedPlaylist = data[0];
    var updates = data[1];
    var owner = data[2];
    var collaborators = data[3];
    var sanitizedUpdates = {};

    if ( updates.title || updates.Title ) {
      sanitizedUpdates.title = updates.title || updates.Title;
    }

    if ( updates.privacy || updates.Privacy ) {
      sanitizedUpdates.privacy = updates.privacy || updates.Privacy;
    }

    if ( updates.tags || updates.Tags ) {
      sanitizedUpdates.tags = updates.tags || updates.Tags;
    }

    retrievedPlaylist.updateAttributes(sanitizedUpdates).then(function() {
      retrievedPlaylist  = retrievedPlaylist.toJSON();
      retrievedPlaylist.Owner = owner;
      retrievedPlaylist.Collaborators = collaborators;

      deferred.resolve(_.assign(retrievedPlaylist, sanitizedUpdates));
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  ensureCurrentUserCanEdit(req, req.params.id)
  .then(fetchPlaylist)
  .then(updatePlaylist)
  .then(function(updatedPlaylist) {
    ResponseHandler.handleSuccess(res, 200, updatedPlaylist);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.reorderTracks = function(req, res) {

  var updateIndividualTrack = function(track, newIndex) {
    var deferred = when.defer();

    models.Track.update(
      { order: newIndex },
      {
        where: {
          id: track.id,
          PlaylistId: req.params.id
        }
      }
    ).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var updateTracks = function() {
    var deferred = when.defer();
    var updates = req.body;
    var promises = _.map(updates, function(update) {
      return updateIndividualTrack(update.track, update.newIndex);
    });

    when.all(promises).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var retrieveAllTracksForPlaylist = function() {
    var playlistId = req.params.id;
    var deferred = when.defer();

    models.Track.findAll({
      where: { PlaylistId: playlistId },
      include: [
        {
          model: models.User,
          attributes: ['id', 'username', 'imageUrl']
        },
        {
          model: models.TrackComment,
          as: 'Comments',
          include: [{
            model: models.User,
            attributes: ['id', 'username', 'imageUrl']
          }]
        },
        {
          model: models.TrackUpvote,
          as: 'Upvotes',
          attributes: ['id', 'UserId']
        },
        {
          model: models.TrackDownvote,
          as: 'Downvotes',
          attributes: ['id', 'UserId']
        }
      ],
      order: [['order', 'ASC']]
    }).then(function(tracks) {
      deferred.resolve(tracks);
    }).catch(function() {
      // Still resolve
      deferred.resolve([]);
    });

    return deferred.promise;
  };

  ensureCurrentUserCanEdit(req, req.params.id)
  .then(updateTracks)
  .then(retrieveAllTracksForPlaylist)
  .then(function(allTracks) {
    ResponseHandler.handleSuccess(res, 200, allTracks);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.recordPlay = function(req, res) {

  var userId = req.user ? req.user.id : null;

  var createPlay = function(currentUserId, playlistId) {
    var deferred = when.defer();
    var attributes = {
      PlaylistId: playlistId,
      UserId: currentUserId
    };

    models.PlaylistPlay.create(attributes).then(function(createdPlay) {
      deferred.resolve(createdPlay);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  createPlay(userId, req.params.id).then(function(createdPlay) {
    ResponseHandler.handleSuccess(res, 200, createdPlay);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.follow = function(req, res) {

  var followPlaylist = function(playlistId, currentUserId) {
    var deferred = when.defer();
    var attributes = {
      UserId: currentUserId,
      PlaylistId: playlistId
    };

    models.PlaylistFollow.find({
      where: attributes
    }).then(function(retrievedFollowing) {
      if ( _.isEmpty(retrievedFollowing) ) {
        models.PlaylistFollow.create(attributes).then(function(savedFollow) {
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

  followPlaylist(req.params.id, req.user.id)
  .then(function(result) {
    // Only create activity if a follow object was returned,
    // because otherwise a follow was deleted
    if ( _.isObject(result) ) {
      ActivityManager.queue('playlist', req.params.id, 'follow', req.user.id);
    }

    return when(result);
  })
  .then(function(playlistFollow) {
    ResponseHandler.handleSuccess(res, 200, playlistFollow);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.like = function(req, res) {

  var likePlaylist = function(playlistId, userId) {
    var deferred = when.defer();
    var attributes = {
      PlaylistId: playlistId,
      UserId: userId
    };

    models.PlaylistLike.find({
      where: attributes
    }).then(function(retrievedLike) {
      if ( _.isEmpty(retrievedLike) ) {
        models.PlaylistLike.create(attributes).then(function(savedLike) {
          deferred.resolve(savedLike);
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      } else {
        retrievedLike.destroy().then(function() {
          deferred.resolve('Like successfully removed.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      }
    });

    return deferred.promise;
  };

  likePlaylist(req.params.id, req.user.id)
  .then(function(result) {
    // Only create activity if a like object was returned,
    // because otherwise a like was deleted
    if ( _.isObject(result) ) {
      ActivityManager.queue('playlist', req.params.id, 'like', req.user.id);
    }

    return when(result);
  })
  .then(function(like) {
    ResponseHandler.handleSuccess(res, 200, like);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.addCollaborator = function(req, res) {

  var addCollaboration = function() {
    var deferred = when.defer();
    var collaboration = {
      PlaylistId: req.params.playlistId,
      UserId: req.params.userId
    };

    models.Collaboration.create(collaboration).then(function(createdCollaboration) {
      deferred.resolve(createdCollaboration);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  ensureCurrentUserCanEdit(req, req.params.playlistId)
  .then(addCollaboration)
  .then(ActivityManager.queue.bind(null, 'playlist', req.params.playlistId, 'addCollaborator', req.user.id))
  .then(function(collaboration) {
    ResponseHandler.handleSuccess(res, 200, collaboration);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.removeCollaborator = function(req, res) {

  var removeCollaboration = function() {
    var deferred = when.defer();

    models.Collaboration.destroy({
      where: {
        PlaylistId: req.params.playlistId,
        UserId: req.params.userId
      }
    }).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  ensureCurrentUserCanEdit(req, req.params.playlistId)
  .then(removeCollaboration)
  .then(ActivityManager.queue.bind(null, 'playlist', req.params.playlistId, 'removeCollaborator', req.user.id, req.params.userId))
  .then(function() {
    ResponseHandler.handleSuccess(res, 200, 'Collaborator successfully removed.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.addTrack = function(req, res) {

  var createTrack = function() {
    var deferred = when.defer();
    var track = {
      PlaylistId: req.params.id || req.body.playlistId || req.body.PlaylistId,
      UserId: req.user.id || req.body.userId || req.body.UserId,
      title: req.body.title || req.body.Title,
      artist: req.body.artist || req.body.Artist,
      duration: req.body.duration || req.body.Duration,
      source: req.body.source || req.body.Source,
      sourceParam: req.body.sourceParam || req.body.SourceParam,
      sourceUrl: req.body.sourceUrl || req.body.SourceUrl,
      imageUrl: req.body.imageUrl || req.body.ImageUrl
    };

    models.Track.create(track).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var fetchPlaylist = function() {
    var deferred = when.defer();

    models.Playlist.find({
      where: { id: req.params.id },
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
    }).then(function(playlist) {
      deferred.resolve(playlist);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  ensureCurrentUserCanEdit(req, req.params.id)
  .then(createTrack)
  .then(fetchPlaylist)
  .then(ActivityManager.queue.bind(null, 'playlist', req.params.id, 'addTrack', req.user.id))
  .then(function(modifiedPlaylist) {
    ResponseHandler.handleSuccess(res, 200, modifiedPlaylist);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.removeTrack = function(req, res) {

  var deleteTrack = function() {
    var deferred = when.defer();

    models.Track.destroy({
      where: { id: req.params.trackId }
    }).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  ensureCurrentUserCanEdit(req, req.params.playlistId)
  .then(deleteTrack)
  .then(function() {
    ResponseHandler.handleSuccess(res, 200, 'Track successfully deleted.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.delete = function(req, res) {

  var originalImageUrl;

  var findAndEnsureUserCanDelete = function(currentUser, playlistIdToDelete) {
    var deferred = when.defer();

    models.Playlist.find({
      where: { id: playlistIdToDelete }
    }).then(function(playlist) {
      if ( currentUser.role !== 'admin' || playlist.ownerId === currentUser.id ) {
        deferred.resolve(playlist);
      } else {
        deferred.reject({ status: 401, body: 'You do not have permission to delete another user\'s playlist.'});
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var deletePlaylist = function(playlist) {
    var deferred = when.defer();

    playlist.destroy().then(function() {
      deferred.resolve(playlist.id);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var deleteOriginalImage = function(playlistId) {
    var deferred = when.defer();

    if ( !_.isEmpty(originalImageUrl) ) {
      awsRoutes.delete(originalImageUrl).then(function() {
        deferred.resolve(playlistId);
      }).catch(function() {
        // Still resolve since playlist was successfully deleted
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }

    return deferred.promise;
  };

  var deleteNotifications = function(playlistId) {
    var deferred = when.defer();

    models.Notification.destroy({
      where: {
        entityType: 'playlist',
        entityId: playlistId
      }
    }).then(function() {
      deferred.resolve();
    }).catch(function() {
      // Still resolve since playlist was successfully deleted
      deferred.resolve();
    });

    return deferred.promise;
  };

  findAndEnsureUserCanDelete(req.user, parseInt(req.params.id))
  .then(deletePlaylist)
  .then(deleteOriginalImage)
  .then(deleteNotifications)
  .then(function() {
    ResponseHandler.handleSuccess(res, 200, 'Playlist successfully deleted.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};
