'use strict';

const Sequelize = require('sequelize');
const models    = require('../models');

const PLAYLIST_QUERY_ATTRIBUTES = Object.keys(models.Playlist.rawAttributes)
  .concat([[Sequelize.literal('(SELECT COUNT(*)::numeric FROM "PlaylistPlays" WHERE "PlaylistPlays"."PlaylistId" = "Playlist".id)'), 'playCount']])
  .concat([[Sequelize.literal('(SELECT COUNT(*)::numeric FROM "PlaylistLikes" WHERE "PlaylistLikes"."PlaylistId" = "Playlist".id)'), 'likeCount']]);

const QUERY_ATTRIBUTES = {
  playlist: PLAYLIST_QUERY_ATTRIBUTES
};

module.exports = QUERY_ATTRIBUTES;
