'use strict';

module.exports = function(sequelize, DataTypes) {

  const PlaylistComment = sequelize.define('PlaylistComment', {
    body: { type: DataTypes.STRING, allowNull: false }
  },
  {
    indexes: [
      {
        fields: ['PlaylistId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        PlaylistComment.belongsTo(models.User);
        PlaylistComment.belongsTo(models.Playlist);
      }
    }
  });

  return PlaylistComment;

};
