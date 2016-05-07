'use strict';

module.exports = function(sequelize) {

  var PlaylistFollow = sequelize.define('PlaylistFollow', {},
  {
    indexes: [
      {
        fields: ['PlaylistId'],
        method: 'BTREE'
      },
      {
        fields: ['createdAt'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        PlaylistFollow.belongsTo(models.Playlist, { as: 'Playlist' });
        PlaylistFollow.belongsTo(models.User, { as: 'User' });
      }
    }
  });

  return PlaylistFollow;

};
