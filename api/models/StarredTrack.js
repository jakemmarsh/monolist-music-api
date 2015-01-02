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
        isUrl: true
      }
    },
    imageUrl:    { type: DataTypes.STRING }
  },
  {
    methods: {
      associate: function(models) {
        StarredTrack.belongsTo(models.User);
      }
    }
  });

  return StarredTrack;

};