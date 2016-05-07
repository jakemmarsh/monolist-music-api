'use strict';

module.exports = function(sequelize) {

  var Collaboration = sequelize.define('Collaboration', {},
  {
    indexes: [
      {
        fields: ['PlaylistId'],
        method: 'BTREE'
      },
      {
        fields: ['UserId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        Collaboration.belongsTo(models.User);
        Collaboration.belongsTo(models.Playlist);
      }
    }
  });

  return Collaboration;

};
