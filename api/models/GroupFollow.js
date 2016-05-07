'use strict';

module.exports = function(sequelize) {

  var GroupFollow = sequelize.define('GroupFollow', {},
  {
    indexes: [
      {
        fields: ['GroupId'],
        method: 'BTREE'
      },
      {
        fields: ['FollowerId'],
        method: 'BTREE'
      }
    ],
    classMethods: {
      associate: function(models) {
        GroupFollow.belongsTo(models.Group, { as: 'Group' });
        GroupFollow.belongsTo(models.User, { as: 'Follower' });
      }
    }
  });

  return GroupFollow;

};
