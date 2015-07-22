'use strict';

module.exports = function(sequelize) {

  var TrackPlay = sequelize.define('TrackPlay', {},
  {
    classMethods: {
      associate: function(models) {
        TrackPlay.belongsTo(models.User);
        TrackPlay.belongsTo(models.Track, { as: 'Plays' });
      }
    }
  });

  return TrackPlay;

};