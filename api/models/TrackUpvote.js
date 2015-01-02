'use strict';

module.exports = function(sequelize) {

  var TrackUpvote = sequelize.define('TrackUpvote', {},
  {
    classMethods: {
      associate: function(models) {
        TrackUpvote.belongsTo(models.User);
        TrackUpvote.belongsTo(models.Track, { as: 'Upvotes' });
      }
    }
  });

  return TrackUpvote;

};