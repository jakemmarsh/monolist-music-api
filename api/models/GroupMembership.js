'use strict';

module.exports = function(sequelize) {

  var GroupMembership = sequelize.define('GroupMembership', {},
  {
    methods: {
      associate: function(models) {
        GroupMembership.belongsTo(models.Group, { as: 'Group' });
        GroupMembership.belongsTo(models.User, { as: 'User' });
      }
    }
  });

  return GroupMembership;

};