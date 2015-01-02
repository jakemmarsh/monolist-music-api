'use strict';

var when = require('when');

/* ====================================================== */

module.exports = function(models, mailer) {

  var createUser = function() {
    var deferred = when.defer();
    var user = {
      username: 'jakemmarsh',
      email: 'jakemmarsh@gmail.com',
      hash: 'kenneth',
      role: 'admin'
    };

    models.User.create(user).then(function(createdUser) {
      mailer.sendWelcome(createdUser);
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating user:', err);
    });

    return deferred.promise;
  };

  var createSecondUser = function() {
    var deferred = when.defer();
    var user = {
      username: 'test',
      email: 'test@gmail.com',
      hash: 'test'
    };

    models.User.create(user).then(function(createdUser) {
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating second user:', err);
    });

    return deferred.promise;
  };

  var createThirdUser = function() {
    var deferred = when.defer();
    var user = {
      username: 'testTwo',
      email: 'testTwo@gmail.com',
      hash: 'test'
    };

    models.User.create(user).then(function(createdUser) {
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating third user:', err);
    });

    return deferred.promise;
  };

  var createPlaylist = function() {
    var deferred = when.defer();
    var playlist = {
      UserId: 1,
      title: 'Test Playlist',
      privacy: 'public',
      tags: ['test', 'hip hop', 'rap']
    };

    models.Playlist.create(playlist).then(function(createdPlaylist) {
      deferred.resolve(createdPlaylist);
    }).catch(function(err) {
      console.log('error creating playlist:', err);
    });

    return deferred.promise;
  };

  var createCollaboration = function() {
    var deferred = when.defer();
    var collaboration = {
      PlaylistId: 1,
      UserId: 2
    };

    models.Collaboration.create(collaboration).then(function(createdCollaboration) {
      deferred.resolve(createdCollaboration);
    }).catch(function(err) {
      console.log('error creating collaboration:', err);
    });

    return deferred.promise;
  };

  var createPlaylistLike = function() {
    var deferred = when.defer();
    var like = {
      UserId: 1,
      PlaylistId: 1
    };

    models.PlaylistLike.create(like).then(function(createdLike) {
      deferred.resolve(createdLike);
    }).catch(function(err) {
      console.log('error creating like:', err);
    });

    return deferred.promise;
  };

  var addTrackToPlaylist = function() {
    var deferred = when.defer();
    var track = {
      imageUrl: "https://i1.sndcdn.com/artworks-000086001473-mw7dye-large.jpg",
      PlaylistId: 1,
      UserId: 1,
      source: "soundcloud",
      sourceParam: "159945668",
      sourceUrl: "http://soundcloud.com/rustie/attak-feat-danny-brown",
      title: "Attak (feat. Danny Brown)"
    };

    models.Track.create(track).then(function(createdTrack) {
      deferred.resolve(createdTrack);
    }).catch(function(err) {
      deferred.reject('error creating track:', err);
    });
  };

  var createSecondPlaylist = function() {
    var deferred = when.defer();
    var playlist = {
      UserId: 1,
      title: 'Second Playlist That Is Private',
      privacy: 'private'
    };

    models.Playlist.create(playlist).then(function(createdPlaylist) {
      deferred.resolve(createdPlaylist);
    }).catch(function(err) {
      console.log('error creating second playlist:', err);
    });

    return deferred.promise;
  };

  createUser()
  .then(createSecondUser)
  .then(createThirdUser)
  .then(createPlaylist)
  .then(createCollaboration)
  .then(createPlaylistLike)
  .then(addTrackToPlaylist)
  .then(createSecondPlaylist);

};