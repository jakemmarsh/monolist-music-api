'use strict';

module.exports = function(sequelize) {

  var PostUpvote = sequelize.define('PostUpvote', {},
  {
    classMethods: {
      associate: function(models) {
        PostUpvote.belongsTo(models.User);
        PostUpvote.belongsTo(models.Post, { as: 'Upvotes' });
      }
    }
  });

  return PostUpvote;

};