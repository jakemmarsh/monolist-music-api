'use strict';

var path           = require('path');
var express        = require('express');
var api            = express.Router();
var setupPassport  = require('./utils/passport');
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
api.post('/auth/login/facebook', routes.auth.facebookLogin);
api.post('/auth/forgot/:username', routes.auth.forgotPassword);
api.post('/auth/reset/:id/:key', routes.auth.resetPassword);
api.post('/auth/logout', routes.auth.isAuthenticated, routes.auth.logout);

/* ====================================================== */

// User endpoints
api.get('/user/:identifier', routes.user.get);
api.get('/users/search/:query', routes.user.search);
api.patch('/user/:id', routes.auth.isAuthenticated, routes.user.update);
api.delete('/user/:id', routes.auth.isAuthenticated, routes.user.delete);
api.get('/user/:id/notifications', routes.auth.isAuthenticated, routes.user.getNotifications);
api.post('/user/:userId/notifications/:ids/read', routes.auth.isAuthenticated, routes.user.markNotificationsAsRead);
api.post('/user/:id/follow', routes.auth.isAuthenticated, routes.user.follow);
api.get('/user/:id/playlists', routes.user.getPlaylists);
api.get('/user/:id/editable', routes.auth.isAuthenticated, routes.user.getEditablePlaylists);
api.get('/user/:id/collaborations', routes.user.getCollaborations);
api.get('/user/:id/groups', routes.user.getGroups);
api.get('/user/:id/likes', routes.user.getLikes);
api.get('/user/:id/stars', routes.user.getStars);

/* ====================================================== */

// Group endpoints
api.get('/group/:identifier', routes.group.get);
api.get('/groups/popular', routes.group.getPopular);
api.get('/groups/search/:query', routes.group.search);
api.patch('/group/:id', routes.auth.isAuthenticated, routes.group.update);
api.post('/group/:groupId/member/:memberId', routes.auth.isAuthenticated, routes.group.addMember);
api.delete('/group/:groupId/member/:memberId', routes.auth.isAuthenticated, routes.group.removeMember);
api.delete('/group/:id', routes.auth.isAuthenticated, routes.group.delete);

/* ====================================================== */

// Playlist endpoints
api.get('/playlist/:owner/:slug', routes.playlist.get);
api.get('/playlists/search/:query', routes.playlist.search);
api.get('/playlists/trending', routes.playlist.getTrending);
api.get('/playlists/newest', routes.playlist.getNewest);
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
api.get('/tracks/search/:query', routes.search);
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
// api.get('/stream/youtube/:videoId', routes.streaming.youtube);
api.get('/stream/soundcloud/:trackId', routes.streaming.soundcloud);
api.get('/stream/spotify/:trackId', routes.streaming.spotify);
api.get('/stream/bandcamp/:trackUrl', routes.streaming.bandcamp);

/* ====================================================== */

module.exports = api;