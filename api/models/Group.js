'use strict';

var slug = require('slug');

module.exports = function(sequelize, DataTypes) {

  var Group = sequelize.define('Group', {
    title:       { type: DataTypes.STRING, allowNull: false, unique: true },
    slug:        { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    imageUrl:    { type: DataTypes.STRING },
    privacy:     { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' },
    inviteLevel: { type: DataTypes.ENUM('member', 'admin', 'owner'), defaultValue: 'member' }
  },
  {
    hooks: {
      beforeValidate: function(group, model, cb) {
        var titleSlug = slug(group.title).toLowerCase();

        group.setDataValue('slug', titleSlug);
        cb(null, group);
      }
    },
    classMethods: {
      associate: function(models) {
        Group.belongsTo(models.User, { as: 'Owner' });
        Group.hasMany(models.GroupMembership, { as: 'Memberships', onDelete: 'cascade' });
        Group.hasMany(models.GroupFollow, { as: 'Followers', foreignKey: 'GroupId', onDelete: 'cascade' });
        Group.hasMany(models.Playlist);
      }
    }
  });

  return Group;

};