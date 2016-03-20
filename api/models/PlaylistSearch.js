'use strict';

module.exports = function(sequelize, DataTypes) {

  var PlaylistSearch = sequelize.define('PlaylistSearch', {
    query:   { type: DataTypes.STRING, allowNull: false },
    results: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [] }
  },
  {
    classMethods: {
      associate: function(models) {
        PlaylistSearch.belongsTo(models.User);
      }
    }
  });

  return PlaylistSearch;

};
