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

  var createGroups = function() {
    var deferred = when.defer();

    models.Group.bulkCreate(fixtures.groups, {
      validate: true,
      individualHooks: true
    }).then(function(createdGroups) {
      deferred.resolve(createdGroups);
    }).catch(function(err) {
      console.log('error creating groups:', err);
    });

    return deferred.promise;
  };

  var createMemberships = function(group) {
    var deferred = when.defer();

    models.GroupMembership.bulkCreate(fixtures.groupMemberships, {
      validate: true,
      individualHooks: true
    }).then(function(createdMemberships) {
      deferred.resolve(createdMemberships);
    }).catch(function(err) {
      console.log('error creating group memberships:', err);
    });

    return deferred.promise;
  };

  var createGroupPlaylists = function() {
    var deferred = when.defer();

    models.Playlist.bulkCreate(fixtures.groupPlaylists, { validate: true, individualHooks: true }).then(function(createdPlaylists) {
      deferred.resolve(createdPlaylists);
    }).catch(function(err) {
      console.log('error creating group playlists:', err);
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
  .then(createGroups)
  .then(createMemberships)
  .then(createGroupPlaylists);

};