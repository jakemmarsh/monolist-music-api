'use strict';

module.exports = function(sequelize, DataTypes) {

  var TrackComment = sequelize.define('TrackComment', {
    body: { type: DataTypes.STRING, allowNull: false }
  },
  {
    indexes: [
      {
        fields: ['TrackId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        TrackComment.belongsTo(models.User);
        TrackComment.belongsTo(models.Track, { as: 'Comments' });
      }
    }
  });

  return TrackComment;

};
