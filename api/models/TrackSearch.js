'use strict';

module.exports = function(sequelize, DataTypes) {

  var TrackSearch = sequelize.define('TrackSearch', {
    query: { type: DataTypes.STRING, allowNull: false }
  },
  {
    classMethods: {
      associate: function(models) {
        TrackSearch.hasOne(models.User);
        TrackSearch.hasMany(models.Track, { as: 'Results' });
      }
    }
  });

  return TrackSearch;

};