'use strict';

module.exports = function(sequelize, DataTypes) {

  var TrackSearch = sequelize.define('TrackSearch', {
    query:   { type: DataTypes.STRING, allowNull: false },
    results: { type: DataTypes.ARRAY(DataTypes.JSON), defaultValue: [] }
  },
  {
    classMethods: {
      associate: function(models) {
        TrackSearch.belongsTo(models.User);
      }
    }
  });

  return TrackSearch;

};