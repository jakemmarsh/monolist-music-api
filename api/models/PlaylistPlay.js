'use strict';

module.exports = function(sequelize) {

  var PlaylistPlay = sequelize.define('PlaylistPlay', {},
  {
    methods: {
      associate: function(models) {
        PlaylistPlay.belongsTo(models.User);
        PlaylistPlay.belongsTo(models.Playlist, { as: 'Plays' });
      }
    }
  });

  return PlaylistPlay;

};