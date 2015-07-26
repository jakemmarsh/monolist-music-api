'use strict';

module.exports = function(sequelize, DataTypes) {

  var GroupMembership = sequelize.define('GroupMembership', {
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 3
      }
    }
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