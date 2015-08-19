'use strict';

module.exports = function(sequelize, DataTypes) {

  var TrackSearch = sequelize.define('TrackSearch', {
    query:   { type: DataTypes.STRING, allowNull: false },
    // TODO: should this be an array of IDs or actual results?
    results: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [] }
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