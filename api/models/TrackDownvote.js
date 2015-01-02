'use strict';

module.exports = function(sequelize) {

  var TrackDownvote = sequelize.define('TrackDownvote', {},
  {
    classMethods: {
      associate: function(models) {
        TrackDownvote.belongsTo(models.User);
        TrackDownvote.belongsTo(models.Track, { as: 'Downvotes' });
      }
    }
  });

  return TrackDownvote;

};