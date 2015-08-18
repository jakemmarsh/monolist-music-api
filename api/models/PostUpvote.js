'use strict';

module.exports = function(sequelize) {

  var PostUpvote = sequelize.define('PostUpvote', {},
  {
    classMethods: {
      associate: function(models) {
        PostUpvote.hasOne(models.User);
        PostUpvote.belongsTo(models.Post, { as: 'Upvotes' });
      }
    }
  });

  return PostUpvote;

};