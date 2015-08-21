'use strict';

module.exports = function(sequelize) {

  var PostLike = sequelize.define('PostLike', {},
  {
    classMethods: {
      associate: function(models) {
        PostLike.belongsTo(models.User);
        PostLike.belongsTo(models.Post, { as: 'Likes' });
      }
    }
  });

  return PostLike;

};