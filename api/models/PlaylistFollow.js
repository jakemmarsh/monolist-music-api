'use strict';

module.exports = function(sequelize) {

  var PlaylistFollow = sequelize.define('PlaylistFollow', {},
  {
    classMethods: {
      associate: function(models) {
        PlaylistFollow.belongsTo(models.Playlist, { as: 'Playlist' });
        PlaylistFollow.belongsTo(models.User, { as: 'User' });
      }
    }
  });

  return PlaylistFollow;

};
