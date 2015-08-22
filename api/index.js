'use strict';

var path          = require('path');
var express       = require('express');
var api           = express.Router();
var setupPassport = require('./utils/passport');
var controllers   = require(path.join(__dirname, 'controllers'));

/* ====================================================== */

setupPassport();

/* ====================================================== */

// Auth endpoints
api.post('/auth/register', controllers.auth.register);
api.get('/auth/check', controllers.auth.isAuthenticated, function(req, res) {
  res.status(200).json(req.user);
});
api.post('/auth/login', controllers.auth.login);
api.post('/auth/login/facebook', controllers.auth.facebookLogin);
api.post('/auth/forgot/:username', controllers.auth.forgotPassword);
api.post('/auth/reset/:id/:key', controllers.auth.resetPassword);
api.post('/auth/logout', controllers.auth.isAuthenticated, controllers.auth.logout);

/* ====================================================== */

// User endpoints
api.get('/user/:identifier', controllers.user.get);
api.get('/users/search/:query', controllers.user.search);
api.patch('/user/:id', controllers.auth.isAuthenticated, controllers.user.update);
api.delete('/user/:id', controllers.auth.isAuthenticated, controllers.user.delete);
api.get('/user/:id/notifications', controllers.auth.isAuthenticated, controllers.user.getNotifications);
api.post('/user/:userId/notifications/:ids/read', controllers.auth.isAuthenticated, controllers.user.markNotificationsAsRead);
api.post('/user/:id/follow', controllers.auth.isAuthenticated, controllers.user.follow);
api.get('/user/:id/playlists', controllers.user.getPlaylists);
api.get('/user/:id/editable', controllers.auth.isAuthenticated, controllers.user.getEditablePlaylists);
api.get('/user/:id/collaborations', controllers.user.getCollaborations);
api.get('/user/:id/groups', controllers.user.getGroups);
api.get('/user/:id/likes', controllers.user.getLikes);
api.get('/user/:id/stars', controllers.user.getStars);

/* ====================================================== */

// Post endpoints
api.post('/post', controllers.auth.isAuthenticated, controllers.post.create);
api.get('/post/:id', controllers.post.get);
api.get('/posts/newest', controllers.post.getNewest);
api.post('/post/:id/like', controllers.auth.isAuthenticated, controllers.post.like);
api.post('/post/:id/comment', controllers.auth.isAuthenticated, controllers.post.addComment);
api.delete('/post/:id/comment/:commentId', controllers.auth.isAuthenticated, controllers.post.removeComment);
api.delete('/post/:id', controllers.post.delete);

/* ====================================================== */

// Group endpoints
api.post('/group', controllers.auth.isAuthenticated, controllers.group.create);
api.get('/group/:identifier', controllers.group.get);
api.get('/group/:id/playlists', controllers.group.getPlaylists);
api.get('/groups/trending', controllers.group.getTrending);
api.get('/groups/search/:query', controllers.group.search);
api.patch('/group/:id', controllers.auth.isAuthenticated, controllers.group.update);
api.post('/group/:id/follow', controllers.auth.isAuthenticated, controllers.group.follow);
api.post('/group/:groupId/member/:memberId', controllers.auth.isAuthenticated, controllers.group.addMember);
api.delete('/group/:groupId/member/:memberId', controllers.auth.isAuthenticated, controllers.group.removeMember);
api.post('/group/:groupId/member/:memberId/level/:newLevel', controllers.auth.isAuthenticated, controllers.group.updateMemberLevel);
api.delete('/group/:id', controllers.auth.isAuthenticated, controllers.group.delete);

/* ====================================================== */

// Playlist endpoints
api.get('/playlist/:slug', controllers.playlist.get);
api.get('/playlists/search/:query', controllers.playlist.search);
api.get('/playlists/trending', controllers.playlist.getTrending);
api.get('/playlists/newest', controllers.playlist.getNewest);
api.post('/playlist', controllers.auth.isAuthenticated, controllers.playlist.create);
api.post('/playlist/:id/play', controllers.playlist.recordPlay);
api.post('/playlist/:id/follow', controllers.auth.isAuthenticated, controllers.playlist.follow);
api.post('/playlist/:id/like', controllers.auth.isAuthenticated, controllers.playlist.like);
api.delete('/playlist/:id', controllers.auth.isAuthenticated, controllers.playlist.delete);
api.post('/playlist/:playlistId/collaborator/:userId', controllers.auth.isAuthenticated, controllers.playlist.addCollaborator);
api.delete('/playlist/:playlistId/collaborator/:userId', controllers.auth.isAuthenticated, controllers.playlist.removeCollaborator);
api.post('/playlist/:id/track', controllers.auth.isAuthenticated, controllers.playlist.addTrack);
api.delete('/playlist/:playlistId/track/:trackId', controllers.auth.isAuthenticated, controllers.playlist.removeTrack);

/* ====================================================== */

// Track endpoints
api.get('/track/:id', controllers.track.get);
api.get('/tracks/search/:query', controllers.track.search);
api.post('/track/star', controllers.auth.isAuthenticated, controllers.track.star);
api.post('/track/:id/upvote', controllers.auth.isAuthenticated, controllers.track.upvote);
api.post('/track/:id/downvote', controllers.auth.isAuthenticated, controllers.track.downvote);
api.post('/track/:id/comment', controllers.auth.isAuthenticated, controllers.track.addComment);
api.delete('/track/:id/comment/:commentId', controllers.auth.isAuthenticated, controllers.track.removeComment);

/* ====================================================== */

// AWS upload endpoints
api.post('/upload/:type/:id', controllers.auth.isAuthenticated, controllers.aws.upload);

/* ====================================================== */

// SoundCloud redirect URI endpoint
api.get('/sc_redirect', controllers.soundcloudRedirect);

/* ====================================================== */

// mp3 streaming endpoints
// api.get('/stream/youtube/:videoId', controllers.streaming.youtube);
api.get('/stream/soundcloud/:trackId', controllers.streaming.soundcloud);
// api.get('/stream/spotify/:trackId', controllers.streaming.spotify);
api.get('/stream/bandcamp/:trackUrl', controllers.streaming.bandcamp);

/* ====================================================== */

module.exports = api;