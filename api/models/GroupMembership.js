'use strict';

module.exports = function(sequelize, DataTypes) {

  var GroupMembership = sequelize.define('GroupMembership', {
    level: { type: DataTypes.ENUM('member', 'admin'), defaultValue: 'member' }
  },
  {
    classMethods: {
      associate: function(models) {
        GroupMembership.belongsTo(models.Group);
        GroupMembership.belongsTo(models.User);
      }
    }
  });

  return GroupMembership;

};