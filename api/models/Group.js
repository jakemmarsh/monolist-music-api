'use strict';

var slug = require('slug');

module.exports = function(sequelize, DataTypes) {

  var Group = sequelize.define('Group', {
    title:       { type: DataTypes.STRING, allowNull: false, unique: true },
    slug:        { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    imageUrl:    { type: DataTypes.STRING },
    tags:        { type: DataTypes.STRING },
    privacy:     { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' },
    inviteLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 3
      }
    }
  },
  {
    setterMethods: {
      tags: function(v) {
        return this.setDataValue('tags', v.join(','));
      }
    },
    getterMethods: {
      tags: function() {
        return this.getDataValue('tags') ? this.getDataValue('tags').split(',') : null;
      }
    },
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
      }
    }
  });

  return Group;

};