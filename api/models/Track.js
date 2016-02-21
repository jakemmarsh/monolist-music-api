'use strict';

module.exports = function(sequelize, DataTypes) {

  var Track = sequelize.define('Track', {
    title:       { type: DataTypes.STRING, allowNull: false },
    artist:      { type: DataTypes.STRING },
    duration:    { type: DataTypes.DOUBLE },
    source:      { type: DataTypes.ENUM('audiomack', 'bandcamp', 'soundcloud', 'youtube'), allowNull: false },
    sourceParam: { type: DataTypes.STRING, allowNull: false },
    sourceUrl:   {
      type: DataTypes.STRING,
      validate: {
        isUrl: {
          args: true,
          msg: 'Track sourceUrl must be a valid URL.'
        }
      }
    },
    imageUrl:    { type: DataTypes.STRING },
    order:       { type: DataTypes.INTEGER, defaultValue: 0 }
  },
  {
    hooks: {
      beforeCreate: function(track, model, cb) {
        var playlistId = track.getDataValue('PlaylistId');

        if ( playlistId ) {
          var order = 0;

          Track.count({
            where: { PlaylistId: playlistId }
          }).then(function(c) {
            if ( c > 0 ) {
              order = c;
            }
            track.setDataValue('order', order);
            cb(null, track);
          });
        } else {
          cb(null, track);
        }
      }
    },
    classMethods: {
      associate: function(models) {
        Track.belongsTo(models.User);
        Track.belongsTo(models.Playlist);
        Track.hasMany(models.TrackDownvote, { as: 'Downvotes', onDelete: 'cascade' });
        Track.hasMany(models.TrackUpvote, { as: 'Upvotes', onDelete: 'cascade' });
        Track.hasMany(models.TrackComment, { as: 'Comments', onDelete: 'cascade' });
        Track.hasMany(models.TrackPlay, { as: 'Plays', onDelete: 'cascade' });
      }
    }
  });

  return Track;

};