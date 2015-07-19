'use strict';

var slug = require('slug');

module.exports = function(sequelize, DataTypes) {

  var Group = sequelize.define('Group', {
    title:       { type: DataTypes.STRING, allowNull: false },
    slug:        { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    imageUrl:    { type: DataTypes.STRING },
    privacy:     { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' }
  },
  {
    hooks: {
      beforeValidate: function(group, model, cb) {
        var titleSlug = slug(group.title).toLowerCase();

        Group.count({
          where: { title: { ilike: group.title } }
        }).then(function(c) {
          if ( c > 0 ) {
            titleSlug += '-' + c;
          }
          group.setDataValue('slug', titleSlug);
          cb(null, group);
        });
      }
    },
    methods: {
      associate: function(models) {
        Group.hasOne(models.User, { as: 'Creator' });
        Group.hasMany(models.GroupMembership, { as: 'Members', foreignKey: 'GroupId', onDelete: 'cascade' });
      }
    }
  });

  return Group;

};