'use strict';

module.exports = function(sequelize, DataTypes) {

  var Notification = sequelize.define('Notification', {
    activity:   { type: DataTypes.ENUM('addTrack', 'addCollaborator', 'addComment') },
    entityType: { type: DataTypes.ENUM('playlist', 'track', 'group') },
    entityId:   { type: DataTypes.INTEGER },
    read:       { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  {
    classMethods: {
      associate: function(models) {
        Notification.belongsTo(models.User, { as: 'Recipient' });
        Notification.belongsTo(models.User, { as: 'Actor' });
      }
    }
  });

  return Notification;

};