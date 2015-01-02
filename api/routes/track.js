'use strict';

var when   = require('when');
var _      = require('lodash');
var models = require('../models');

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
    res.status(200).json(track);
  }, function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
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
      where: attributes
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
    res.status(200).json(star);
  }, function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
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

  createOrDeleteUpvote(req.params.id, req.user.id).then(function(resp) {
    res.status(200).json(resp);
  }, function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
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

  createOrDeleteDownvote(req.params.id, req.user.id).then(function(resp) {
    res.status(200).json(resp);
  }, function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
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

  createComment(req.params.id, req.body, req.user.id).then(function(comment) {
    res.status(200).json(comment);
  }, function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.removeComment = function(req, res) {

  var deleteComment = function(trackId, commentId, user) {
    var deferred = when.defer();

    models.TrackComment.find({
      where: { id: commentId, TrackId: trackId }
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
    res.status(200).json(resp);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};