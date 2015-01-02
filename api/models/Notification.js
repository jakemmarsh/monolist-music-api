'use strict';

module.exports = function(sequelize, DataTypes) {

  var Notification = sequelize.define('Notification', {
    activity:   { type: DataTypes.ENUM('addTrack', 'addCollaborator', 'addComment') },
    entityType: { type: DataTypes.ENUM('playlist', 'track') },
    entityId:   { type: DataTypes.INTEGER }
  },
  {
    methods: {
      associate: function(models) {
        Notification.hasOne(models.User, { as: 'Actor' });
        Notification.hasOne(models.User, { as: 'Recipient' });
      }
    }
  });

  return Notification;

};