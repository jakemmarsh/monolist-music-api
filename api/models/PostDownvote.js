'use strict';

module.exports = function(sequelize) {

  var PostDownvote = sequelize.define('PostDownvote', {},
  {
    classMethods: {
      associate: function(models) {
        PostDownvote.hasOne(models.User);
        PostDownvote.belongsTo(models.Post, { as: 'Downvotes' });
      }
    }
  });

  return PostDownvote;

};