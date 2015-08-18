'use strict';

module.exports = function(sequelize) {

  var PlaylistSearch = sequelize.define('PlaylistSearch', {
    query: { type: DataTypes.STRING, allowNull: false }
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