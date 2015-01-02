'use strict';

module.exports = function(sequelize) {

  var PlaylistLike = sequelize.define('PlaylistLike', {},
  {
    methods: {
      associate: function(models) {
        PlaylistLike.belongsTo(models.User);
        PlaylistLike.belongsTo(models.Playlist, { as: 'Likes' });
      }
    }
  });

  return PlaylistLike;

};