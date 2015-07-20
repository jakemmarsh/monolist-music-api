'use strict';

var when     = require('when');
var fixtures = require('./fixtures');

/* ====================================================== */

module.exports = function(models, mailer) {

  var createUser = function() {
    var deferred = when.defer();

    models.User.create(fixtures.users[0]).then(function(createdUser) {
      // mailer.sendWelcome(createdUser);
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating user:', err);
    });

    return deferred.promise;
  };

  var createSecondUser = function() {
    var deferred = when.defer();

    models.User.create(fixtures.users[1]).then(function(createdUser) {
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating second user:', err);
    });

    return deferred.promise;
  };

  var createThirdUser = function() {
    var deferred = when.defer();

    models.User.create(fixtures.users[2]).then(function(createdUser) {
      deferred.resolve(createdUser);
    }).catch(function(err) {
      console.log('error creating third user:', err);
    });

    return deferred.promise;
  };

  var createPlaylist = function() {
    var deferred = when.defer();

    models.Playlist.create(fixtures.playlists[0]).then(function(createdPlaylist) {
      deferred.resolve(createdPlaylist);
    }).catch(function(err) {
      console.log('error creating playlists:', err);
    });

    return deferred.promise;
  };

  var createSecondPlaylist = function() {
    var deferred = when.defer();

    models.Playlist.create(fixtures.playlists[1]).then(function(createdPlaylist) {
      deferred.resolve(createdPlaylist);
    }).catch(function(err) {
      console.log('error creating playlists:', err);
    });

    return deferred.promise;
  };

  var createCollaboration = function() {
    var deferred = when.defer();

    models.Collaboration.create(fixtures.collaborations[0]).then(function(createdCollaboration) {
      deferred.resolve(createdCollaboration);
    }).catch(function(err) {
      console.log('error creating collaboration:', err);
    });

    return deferred.promise;
  };

  var createPlaylistLikes = function() {
    var deferred = when.defer();

    models.PlaylistLike.bulkCreate(fixtures.playlistLikes, { hooks: false, individualHooks: true }).then(function(createdLikes) {
      deferred.resolve(createdLikes);
    }).catch(function(err) {
      console.log('error creating likes:', err);
    });

    return deferred.promise;
  };

  var createPlaylistPlays = function() {
    var deferred = when.defer();

    models.PlaylistPlay.bulkCreate(fixtures.playlistPlays, { hooks: false, individualHooks: true }).then(function(createdPlays) {
      deferred.resolve(createdPlays);
    }).catch(function(err) {
      console.log('error creating plays:', err);
    });

    return deferred.promise;
  };

  var addTrackToPlaylist = function() {
    var deferred = when.defer();

    models.Track.create(fixtures.tracks[0]).then(function(createdTrack) {
      deferred.resolve(createdTrack);
    }).catch(function(err) {
      deferred.reject('error creating track:', err);
    });
  };

  var createGroup = function() {
    var deferred = when.defer();

    models.Group.create(fixtures.groups[0]).then(function(createdGroup) {
      deferred.resolve(createdGroup);
    }).catch(function(err) {
      console.log(err);
      deferred.reject('error creating group:', err);
    });

    return deferred.promise;
  };

  var addUserToGroup = function(group) {
    var deferred = when.defer();

    models.GroupMembership.create(fixtures.groupMemberships[0]).then(function(createdMembership) {
      deferred.resolve(createdMembership);
    }).catch(function(err) {
      deferred.reject('error creating membership:', err);
    });

    return deferred.promise;
  };

  createUser()
  .then(createSecondUser)
  .then(createThirdUser)
  .then(createPlaylist)
  .then(createSecondPlaylist)
  .then(createCollaboration)
  .then(createPlaylistLikes)
  .then(createPlaylistPlays)
  .then(addTrackToPlaylist)
  .then(createGroup)
  .then(addUserToGroup);

};