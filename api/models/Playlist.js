'use strict';

var slug = require('slug');

module.exports = function(sequelize, DataTypes) {

  var Playlist = sequelize.define('Playlist', {
    title:    { type: DataTypes.STRING, allowNull: false },
    slug:     { type: DataTypes.STRING, allowNull: false, unique: true },
    imageUrl: { type: DataTypes.STRING },
    tags:     { type: DataTypes.STRING },
    privacy:  { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' }
  },
  {
    setterMethods: {
      tags: function(v) {
        return this.setDataValue('tags', v.join(','));
      }
    },
    getterMethods: {
      tags: function() {
        return this.getDataValue('tags') ? this.getDataValue('tags').split(',') : null;
      }
    },
    hooks: {
      beforeValidate: function(playlist, model, cb) {
        var titleSlug = slug(playlist.title).toLowerCase();

        Playlist.count({
          where: { slug: titleSlug }
        }).then(function(c) {
          // TODO: fix this dirty fix. When operating on prod DB (Amazon RDS Postgres),
          // even the first playlist with a unique slug is appended '-1'
          if ( process.env.NODE_ENV === 'production' && c > 1 ) {
            titleSlug += '-' + c;
          } else if ( process.env.NODE_ENV !== 'production' && c > 0 ) {
            titleSlug += '-' + c;
          }
          playlist.setDataValue('slug', titleSlug);
          cb(null, playlist);
        });
      }
    },
    classMethods: {
      associate: function(models) {
        Playlist.belongsTo(models.User);
        Playlist.hasMany(models.Collaboration, { onDelete: 'cascade' });
        Playlist.hasMany(models.Track, { onDelete: 'cascade' });
        Playlist.hasMany(models.PlaylistLike, { as: 'Likes', onDelete: 'cascade' });
        Playlist.hasMany(models.PlaylistPlay, { as: 'Plays', onDelete: 'cascade' });
        Playlist.hasMany(models.PlaylistFollow, { as: 'Followers', foreignKey: 'PlaylistId', onDelete: 'cascade' });
      }
    }
  });

  return Playlist;

};