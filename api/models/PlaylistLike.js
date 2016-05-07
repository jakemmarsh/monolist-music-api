'use strict';

module.exports = function(sequelize) {

  var PlaylistLike = sequelize.define('PlaylistLike', {},
  {
    indexes: [
      {
        fields: ['PlaylistId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        PlaylistLike.belongsTo(models.User);
        PlaylistLike.belongsTo(models.Playlist);
      }
    }
  });

  return PlaylistLike;

};
