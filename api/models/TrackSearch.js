'use strict';

module.exports = function(sequelize) {

  var TrackSearch = sequelize.define('TrackSearch', {
    query: { type: DataTypes.STRING, allowNull: false }
  },
  {
    classMethods: {
      associate: function(models) {
        TrackSearch.hasOne(models.User);
        TrackSearch.hasOne(models.Track);
      }
    }
  });

  return TrackSearch;

};