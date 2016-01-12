'use strict';

module.exports = function(sequelize, DataTypes) {

  var StarredTrack = sequelize.define('StarredTrack', {
    title:       { type: DataTypes.STRING, allowNull: false },
    artist:      { type: DataTypes.STRING },
    source:      { type: DataTypes.ENUM('soundcloud', 'bandcamp', 'youtube', 'spotify'), allowNull: false },
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
    imageUrl:    { type: DataTypes.STRING }
  },
  {
    classMethods: {
      associate: function(models) {
        StarredTrack.belongsTo(models.User);
      }
    }
  });

  return StarredTrack;

};