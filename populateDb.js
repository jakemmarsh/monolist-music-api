'use strict';

var when = require('when');

/* ====================================================== */

module.exports = function(models, mailer) {

  var createUser = function() {
    var deferred = when.defer();
    var user = {
      username: 'jakemmarsh',
      email: 'jakemmarsh@gmail.com',
      facebookId: '621883172',
      hash: 'pass',
      role: 'admin'
    };

    models.User.create(user).then(function(createdUser) {
      // mailer.sendWelcome(createdUser);
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
      creatorName: 'jakemmarsh',
      title: 'Test Playlist',
      privacy: 'public',
      tags: ['test', 'hip hop', 'rap'],
      imageUrl: 'http://franthony.com/wp-content/uploads/2015/04/record-player.jpg'
    };

    models.Playlist.create(playlist).then(function(createdPlaylist) {
      deferred.resolve(createdPlaylist);
    }).catch(function(err) {
      console.log('error creating playlists:', err);
    });

    return deferred.promise;
  };

  var createSecondPlaylist = function() {
    var deferred = when.defer();
    var playlist = {
      UserId: 1,
      creatorName: 'jakemmarsh',
      title: 'Second Playlist That Is Private',
      privacy: 'private'
    };

    models.Playlist.create(playlist).then(function(createdPlaylist) {
      deferred.resolve(createdPlaylist);
    }).catch(function(err) {
      console.log('error creating playlists:', err);
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

  var createPlaylistLikes = function() {
    var deferred = when.defer();
    var likes = [
      {
        UserId: 1,
        PlaylistId: 1
      },
      {
        UserId: 2,
        PlaylistId: 1
      },
      {
        UserId: 1,
        PlaylistId: 2
      }
    ];

    models.PlaylistLike.bulkCreate(likes, { hooks: false, individualHooks: true }).then(function(createdLikes) {
      deferred.resolve(createdLikes);
    }).catch(function(err) {
      console.log('error creating likes:', err);
    });

    return deferred.promise;
  };

  var createPlaylistPlays = function() {
    var deferred = when.defer();
    var plays = [
      {
        UserId: 1,
        PlaylistId: 1
      },
      {
        UserId: 2,
        PlaylistId: 1
      },
      {
        UserId: 2,
        PlaylistId: 2
      }
    ];

    models.PlaylistPlay.bulkCreate(plays, { hooks: false, individualHooks: true }).then(function(createdPlays) {
      deferred.resolve(createdPlays);
    }).catch(function(err) {
      console.log('error creating plays:', err);
    });

    return deferred.promise;
  };

  var addTrackToPlaylist = function() {
    var deferred = when.defer();
    var track = {
      imageUrl: 'https://i1.sndcdn.com/artworks-000086001473-mw7dye-large.jpg',
      PlaylistId: 1,
      UserId: 1,
      source: 'soundcloud',
      sourceParam: '159945668',
      sourceUrl: 'http://soundcloud.com/rustie/attak-feat-danny-brown',
      title: 'Attak (feat. Danny Brown)',
      duration: 181
    };

    models.Track.create(track).then(function(createdTrack) {
      deferred.resolve(createdTrack);
    }).catch(function(err) {
      deferred.reject('error creating track:', err);
    });
  };

  createUser()
  .then(createSecondUser)
  .then(createThirdUser)
  .then(createPlaylist)
  .then(createSecondPlaylist)
  .then(createCollaboration)
  .then(createPlaylistLikes)
  .then(createPlaylistPlays)
  .then(addTrackToPlaylist);

};