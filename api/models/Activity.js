'use strict';

var _           = require('lodash');
var ActionTypes = require('../utils/ActionTypes');

module.exports = function(sequelize, DataTypes) {

  var Activity = sequelize.define('Activity', {
    entityType:  { type: DataTypes.ENUM('user', 'playlist', 'group', 'track' ) },
    entityId:    { type: DataTypes.INTEGER },
    recipientId: { type: DataTypes.INTEGER },
    action:      {
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
    hooks: {},
    classMethods: {
      associate: function(models) {
        Activity.belongsTo(models.User, { as: 'Actor' });
      }
    }
  });

  return Activity;

};