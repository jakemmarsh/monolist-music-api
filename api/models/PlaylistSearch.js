'use strict';

module.exports = function(sequelize, DataTypes) {

  var PlaylistSearch = sequelize.define('PlaylistSearch', {
    query: { type: DataTypes.STRING, allowNull: false }
  },
  {
    classMethods: {
      associate: function(models) {
        PlaylistSearch.hasOne(models.User);
        PlaylistSearch,hasMany(models.Playlist, { as: 'Results' });
      }
    }
  });

  return PlaylistSearch;

};