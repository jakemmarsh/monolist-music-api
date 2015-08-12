'use strict';

var _           = require('lodash');
var ActionTypes = require('../utils/ActionTypes');

module.exports = function(sequelize, DataTypes) {

  var Notification = sequelize.define('Notification', {
    entityType: { type: DataTypes.ENUM('playlist', 'track', 'group', 'user') },
    entityId:   { type: DataTypes.INTEGER },
    read:       { type: DataTypes.BOOLEAN, defaultValue: false },
    action:     {
      type: DataTypes.ENUM,
      values: _([]).concat(
        ActionTypes.USER_ACTION_TYPES,
        ActionTypes.PLAYLIST_ACTION_TYPES,
        ActionTypes.TRACK_ACTION_TYPES,
        ActionTypes.GROUP_ACTION_TYPES
      ).uniq().value()
    }
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