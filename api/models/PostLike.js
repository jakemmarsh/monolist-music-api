'use strict';

module.exports = function(sequelize) {

  var PostLike = sequelize.define('PostLike', {},
  {
    indexes: [
      {
        fields: ['PostId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        PostLike.belongsTo(models.User);
        PostLike.belongsTo(models.Post);
      }
    }
  });

  return PostLike;

};
