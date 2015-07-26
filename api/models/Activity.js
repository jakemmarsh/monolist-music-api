'use strict';

var slug = require('slug');

module.exports = function(sequelize, DataTypes) {

  var Activity = sequelize.define('Activity', {
    actionType: { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' },
    entityType: { type: DataTypes.ENUM('member', 'admin', 'owner'), defaultValue: 'member' },
    entityId:   { type: DataTypes.INTEGER }
  },
  {
    hooks: {},
    classMethods: {
      associate: function(models) {
        Activity.belongsTo(models.User, { as: 'Actor' });
      }
    }
  });

  return Activity;

};