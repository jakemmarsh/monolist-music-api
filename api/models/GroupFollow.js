'use strict';

module.exports = function(sequelize) {

  var GroupFollow = sequelize.define('GroupFollow', {},
  {
    classMethods: {
      associate: function(models) {
        GroupFollow.belongsTo(models.Group, { as: 'Group' });
        GroupFollow.belongsTo(models.User, { as: 'Follower' });
      }
    }
  });

  return GroupFollow;

};
