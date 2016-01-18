'use strict';

var when            = require('when');
var _               = require('lodash');
var bandcamp        = require('./sources/bandcamp');
var soundcloud      = require('./sources/soundcloud');
var spotify         = require('./sources/spotify');
var youtube         = require('./sources/youtube');
var models          = require('../models');
// var ActivityManager = require('../utils/ActivityManager');
var ResponseHandler = require('../utils/ResponseHandler');

/* ====================================================== */

exports.get = function(req, res) {

  var getTrack = function(id) {
    var deferred = when.defer();

    models.Track.find({
      where: { id: id },
      include: [
        {
          model: models.TrackUpvote,
          as: 'Upvotes'
        },
        {
          model: models.TrackDownvote,
          as: 'Downvotes'
        },
        {
          model: models.TrackComment,
          as: 'Comments'
        }
      ]
    }).then(function(track) {
      if( _.isEmpty(track) ) {
        deferred.reject({ status: 404, body: 'Track could not be found at id: ' + id });
      } else {
        deferred.resolve(track);
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getTrack(req.params.id).then(function(track) {
    ResponseHandler.handleSuccess(res, 200, track);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });
};

/* ====================================================== */

exports.search = function(req, res) {

  var searchResults = [];
  var limit = req.query.limit || 20;
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  /*
   * If user has specified `sources` in the query string,
   * split at commas and add each source's search promise to the
   * searchPromises (if it exists in the mapping). Otherwise,
   * add all 4 possible sources to the searchPromises.
   */
  var getSearchPromises = function() {
    var sourcePromisesMap = {
      'bandcamp': bandcamp.search,
      'soundcloud': soundcloud.search,
      'spotify': spotify.search,
      'youtube': youtube.search
    };
    var searchPromises = [];
    var sources;

    // Limit search if user specifies sources
    if ( req.query.sources ) {
      sources = req.query.sources.split(',');
      _.each(sources, function(searchSource) {
        if ( searchSource.toLowerCase() in sourcePromisesMap ) {
          searchPromises.push(sourcePromisesMap[searchSource.toLowerCase()](req.params.query, limit, ip));
        }
      });
    } else {
      searchPromises = [
        sourcePromisesMap.bandcamp(req.params.query, limit, ip),
        sourcePromisesMap.soundcloud(req.params.query, limit, ip),
        sourcePromisesMap.spotify(req.params.query, limit, ip),
        sourcePromisesMap.youtube(req.params.query, limit, ip)
      ];
    }

    return searchPromises;
  };

  var recordSearch = function(currentUser, query, results) {
    var attributes = {
      UserId: currentUser ? currentUser.id : null,
      query: query,
      results: results
    };

    models.TrackSearch.create(attributes);
  };

  when.all(getSearchPromises()).then(function(results) {
    _.each(results, function(result) {
      searchResults = _.sortBy(searchResults.concat(result), 'title');
    });
    recordSearch(req.user, req.params.query, searchResults);
    ResponseHandler.handleSuccess(res, 200,  searchResults);
  }, function(err) {
    res.status(err.status).json({ status: err.status, message: err.body });
  });

};

/* ====================================================== */

exports.getSearches = function(req, res) {

  var fetchSearches = function(limit, offset) {
    var deferred = when.defer();

    limit = ( limit && limit < 50 ) ? limit : 20;
    offset = offset || 0;

    models.TrackSearch.findAll({
      order: ['createdAt'],
      limit: limit,
      offset: offset
    }).then(function(searches) {
      deferred.resolve(searches);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err })
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

exports.star = function(req, res) {

  var starTrack = function(track, userId) {
    var deferred = when.defer();
    var attributes =  {
      UserId: userId,
      title: track.title || track.Title,
      artist: track.artist || track.Artist,
      source: track.source || track.Source,
      sourceParam: track.sourceParam.toString() || track.SourceParam.toString(),
      sourceUrl: track.sourceUrl || track.SourceUrl,
      imageUrl: track.imageUrl || track.ImageUrl
    };

    models.StarredTrack.find({
      where: {
        UserId: attributes.UserId,
        source: attributes.source,
        sourceParam: attributes.sourceParam
      }
    }).then(function(retrievedStar) {
      if ( _.isEmpty(retrievedStar) ) {
        models.StarredTrack.create(attributes).then(function(savedTrack) {
          deferred.resolve(savedTrack);
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      } else {
        retrievedStar.destroy().then(function() {
          deferred.resolve('Starred track successfully deleted.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      }
    });

    return deferred.promise;
  };

  starTrack(req.body, req.user.id).then(function(star) {
    ResponseHandler.handleSuccess(res, 200, star);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.upvote = function(req, res) {

  var createOrDeleteUpvote = function(trackId, userId) {
    var deferred = when.defer();
    var attributes = {
      UserId: userId,
      TrackId: trackId
    };

    models.TrackDownvote.destroy({ where: attributes });

    models.TrackUpvote.find({
      where: attributes
    }).then(function(retrievedUpvote) {
      if ( _.isEmpty(retrievedUpvote) ) {
        models.TrackUpvote.create(attributes).then(function(savedUpvote) {
          deferred.resolve(savedUpvote);
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      } else {
        retrievedUpvote.destroy().then(function() {
          deferred.resolve('Upvote successfully removed.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      }
    });

    return deferred.promise;
  };

  createOrDeleteUpvote(req.params.id, req.user.id)
  //.then(ActivityManager.queue.bind(null, 'track', req.params.id, 'upvote', req.user.id))
  .then(function(resp) {
    ResponseHandler.handleSuccess(res, 200, resp);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.downvote = function(req, res) {

  var createOrDeleteDownvote = function(trackId, userId) {
    var deferred = when.defer();
    var attributes = {
      TrackId: trackId,
      UserId: userId
    };

    models.TrackUpvote.destroy({ where: attributes });

    models.TrackDownvote.find({
      where: attributes
    }).then(function(retrievedDownvote) {
      if ( _.isEmpty(retrievedDownvote) ) {
        models.TrackDownvote.create(attributes).then(function(savedDownvote) {
          deferred.resolve(savedDownvote);
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      } else {
        retrievedDownvote.destroy().then(function() {
          deferred.resolve('Downvote successfully removed.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      }
    });

    return deferred.promise;
  };

  createOrDeleteDownvote(req.params.id, req.user.id)
  //.then(ActivityManager.queue.bind(null, 'track', req.params.id, 'downvote', req.user.id))
  .then(function(resp) {
    ResponseHandler.handleSuccess(res, 200, resp);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.addComment = function(req, res) {

  var createComment = function(trackId, comment, userId) {
    var deferred = when.defer();

    comment = {
      body: comment.body,
      TrackId: trackId,
      UserId: userId
    };

    models.TrackComment.create(comment).then(function(savedComment) {
      deferred.resolve(savedComment);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  createComment(req.params.id, req.body, req.user.id)
  //.then(ActivityManager.queue.bind(null, 'track', req.params.id, 'addComment', req.user.id))
  .then(function(comment) {
    ResponseHandler.handleSuccess(res, 200, comment);
  }, function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.removeComment = function(req, res) {

  var deleteComment = function(trackId, commentId, user) {
    var deferred = when.defer();

    models.TrackComment.find({
      where: {
        id: commentId,
        TrackId: trackId
      }
    }).then(function(retrievedComment) {
      if ( user.role === 'admin' || retrievedComment.UserId === user.id ) {
        retrievedComment.destroy().then(function() {
          deferred.resolve('Comment successfully removed.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      } else {
        deferred.reject({ status: 401, body: 'Current user does not have permission to delete comment: ' + user.id });
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  deleteComment(req.params.id, req.params.commentId, req.user).then(function(resp) {
    ResponseHandler.handleSuccess(res, 200, resp);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};
