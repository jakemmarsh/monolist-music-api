'use strict';

module.exports = function(sequelize, DataTypes) {

  var PostComment = sequelize.define('PostComment', {
    body: { type: DataTypes.STRING, allowNull: false }
  },
  {
    indexes: [
      {
        fields: ['PostId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        PostComment.belongsTo(models.User);
        PostComment.belongsTo(models.Post);
      }
    }
  });

  return PostComment;

};
