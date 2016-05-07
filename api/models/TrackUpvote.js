'use strict';

module.exports = function(sequelize) {

  var TrackUpvote = sequelize.define('TrackUpvote', {},
  {
    indexes: [
      {
        fields: ['TrackId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        TrackUpvote.belongsTo(models.User);
        TrackUpvote.belongsTo(models.Track);
      }
    }
  });

  return TrackUpvote;

};
