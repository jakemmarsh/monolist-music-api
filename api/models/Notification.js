'use strict';

module.exports = function(sequelize, DataTypes) {

  var Notification = sequelize.define('Notification', {
    activity:   { type: DataTypes.ENUM('addTrack', 'addCollaborator', 'addComment') },
    entityType: { type: DataTypes.ENUM('playlist', 'track') },
    entityId:   { type: DataTypes.INTEGER },
    read:       { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  {
    methods: {
      associate: function(models) {
        Notification.belongsTo(models.User, { as: 'Notifications' });
        Notification.hasOne(models.User, { as: 'Actor' });
      }
    }
  });

  return Notification;

};