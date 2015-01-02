'use strict';

var path           = require('path');
var express        = require('express');
var api            = express.Router();
var setupPassport  = require('./passport');
var routes         = require(path.join(__dirname, 'routes'));

/* ====================================================== */

setupPassport();

/* ====================================================== */

// Auth endpoints
api.post('/auth/register', routes.auth.register);
api.get('/auth/check', routes.auth.isAuthenticated, function(req, res) {
  res.status(200).json(req.user);
});
api.post('/auth/login', routes.auth.login);
api.post('/auth/forgot/:username', routes.auth.forgotPassword);
api.post('/auth/reset/:id/:key', routes.auth.resetPassword);
api.post('/auth/logout', routes.auth.isAuthenticated, routes.auth.logout);

/* ====================================================== */

// User endpoints
api.get('/user/:identifier', routes.user.get);
api.get('/user/search/:query', routes.auth.isAuthenticated, routes.user.search);
api.patch('/user/:id', routes.auth.isAuthenticated, routes.user.update);
api.delete('/user/:id', routes.auth.isAuthenticated, routes.user.delete);
api.post('/user/:id/follow', routes.auth.isAuthenticated, routes.user.follow);
api.get('/user/:id/playlists', routes.user.getPlaylists);
api.get('/user/:id/editable', routes.auth.isAuthenticated, routes.user.getEditablePlaylists);
api.get('/user/:id/collaborations', routes.user.getCollaborations);
api.get('/user/:id/likes', routes.user.getLikes);
api.get('/user/:id/stars', routes.user.getStars);

/* ====================================================== */

// Playlist endpoints
api.get('/playlist/:identifier', routes.playlist.get);
api.get('/playlist/search/:query', routes.playlist.search);
api.post('/playlist', routes.auth.isAuthenticated, routes.playlist.create);
api.post('/playlist/:id/play', routes.playlist.recordPlay);
api.post('/playlist/:id/follow', routes.auth.isAuthenticated, routes.playlist.follow);
api.post('/playlist/:id/like', routes.auth.isAuthenticated, routes.playlist.like);
api.delete('/playlist/:id', routes.auth.isAuthenticated, routes.playlist.delete);
api.post('/playlist/:playlistId/collaborator/:userId', routes.auth.isAuthenticated, routes.playlist.addCollaborator);
api.delete('/playlist/:playlistId/collaborator/:userId', routes.auth.isAuthenticated, routes.playlist.removeCollaborator);
api.post('/playlist/:id/track', routes.auth.isAuthenticated, routes.playlist.addTrack);
api.delete('/playlist/:playlistId/track/:trackId', routes.auth.isAuthenticated, routes.playlist.removeTrack);

/* ====================================================== */

// Track endpoints
api.get('/track/:id', routes.track.get);
api.get('/track/search/:query', routes.search);
api.post('/track/star', routes.auth.isAuthenticated, routes.track.star);
api.post('/track/:id/upvote', routes.auth.isAuthenticated, routes.track.upvote);
api.post('/track/:id/downvote', routes.auth.isAuthenticated, routes.track.downvote);
api.post('/track/:id/comment', routes.auth.isAuthenticated, routes.track.addComment);
api.delete('/track/:id/comment/:commentId', routes.auth.isAuthenticated, routes.track.removeComment);

/* ====================================================== */

// AWS upload endpoints
api.post('/upload/:type/:id', routes.aws.upload);

/* ====================================================== */

// SoundCloud redirect URI endpoint
api.get('/sc_redirect', routes.soundcloudRedirect);

/* ====================================================== */

// mp3 streaming endpoints
api.get('/stream/youtube/:videoId', routes.streaming.youtube);
api.get('/stream/soundcloud/:trackId', routes.streaming.soundcloud);
api.get('/stream/spotify/:trackId', routes.streaming.spotify);
api.get('/stream/bandcamp/:trackUrl', routes.streaming.bandcamp);

/* ====================================================== */

module.exports = api;