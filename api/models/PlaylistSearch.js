'use strict';

module.exports = function(sequelize, DataTypes) {

  var PlaylistSearch = sequelize.define('PlaylistSearch', {
    query: { type: DataTypes.STRING, allowNull: false },
    // TODO: should this be an array of IDs or actual results?
    results: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [] }
  },
  {
    classMethods: {
      associate: function(models) {
        PlaylistSearch.hasOne(models.User);
      }
    }
  });

  return PlaylistSearch;

};