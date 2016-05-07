'use strict';

module.exports = function(sequelize) {

  var TrackDownvote = sequelize.define('TrackDownvote', {},
  {
    indexes: [
      {
        fields: ['TrackId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        TrackDownvote.belongsTo(models.User);
        TrackDownvote.belongsTo(models.Track);
      }
    }
  });

  return TrackDownvote;

};
