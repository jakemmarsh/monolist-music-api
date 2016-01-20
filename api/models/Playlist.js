'use strict';

var slug = require('slug');

module.exports = function(sequelize, DataTypes) {

  function processNewTitle(playlist, model, cb) {
    if ( playlist.changed('title') ) {
      var titleSlug = slug(playlist.title).toLowerCase();
      var query = {
        ownerType: playlist.ownerType,
        title: { ilike: playlist.title }
      };

      Playlist.count({
        where: query
      }).then(function(c) {
        if ( c > 0 ) {
          titleSlug += '-' + c;
        }
        playlist.setDataValue('slug', titleSlug);
        cb(null, playlist);
      });
    }
  }

  var Playlist = sequelize.define('Playlist', {
    title:     {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        not: {
          args: /^\d+$/i,
          msg: 'Playlist title cannot be only numbers.'
        }
      }
    },
    ownerType: { type: DataTypes.ENUM('user', 'group'), defaultValue: 'user' },
    ownerId:   { type: DataTypes.INTEGER, allowNull: false },
    slug:      { type: DataTypes.STRING, unique: true },
    imageUrl:  { type: DataTypes.STRING },
    tags:      { type: DataTypes.STRING },
    privacy:   { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' }
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
      beforeCreate: processNewTitle,
      beforeUpdate: processNewTitle
    },
    classMethods: {
      associate: function(models) {
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