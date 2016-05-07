'use strict';

module.exports = function(sequelize) {

  var TrackPlay = sequelize.define('TrackPlay', {},
  {
    indexes: [
      {
        fields: ['TrackId'],
        method: 'BTREE'
      },
    ],
    classMethods: {
      associate: function(models) {
        TrackPlay.belongsTo(models.User);
        TrackPlay.belongsTo(models.Track);
      }
    }
  });

  return TrackPlay;

};
