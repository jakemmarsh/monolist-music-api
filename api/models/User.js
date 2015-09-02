'use strict';

var bcrypt = require('bcrypt');

module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    username:         {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notContains: ' ' // don't allow spaces in username
      }
    },
    firstName:        { type: DataTypes.STRING },
    lastName:         { type: DataTypes.STRING },
    role:             { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    email:            {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    imageUrl:         { type: DataTypes.STRING },
    facebookId:       { type: DataTypes.STRING },
    hash:             { type: DataTypes.STRING },
    passwordResetKey: { type: DataTypes.STRING }
  },
  {
    hooks: {
      beforeValidate: function(user, model, cb) {
        if ( user.hash ) {
          bcrypt.hash(user.hash, 10, function(err, hash) {
            if ( err ) { throw err; }
            user.setDataValue('hash', hash);
            cb(null, user);
          });
        } else {
          cb(null, user);
        }
      }
    },
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Collaboration, { onDelete: 'cascade' });
        User.hasMany(models.PlaylistLike, { onDelete: 'cascade' });
        User.hasMany(models.PlaylistPlay);
        User.hasMany(models.StarredTrack, { onDelete: 'cascade' });
        User.hasMany(models.TrackPlay);
        User.hasMany(models.Post, { onDelete: 'cascade' });
        User.hasMany(models.UserFollow, { as: 'UsersFollowing', foreignKey: 'FollowerId', onDelete: 'cascade' });
        User.hasMany(models.UserFollow, { as: 'Followers', foreignKey: 'UserId', onDelete: 'cascade' });
        User.hasMany(models.PlaylistFollow, { as: 'PlaylistsFollowing', foreignKey: 'UserId', onDelete: 'cascade' });
        User.hasMany(models.Notification, { as: 'Notifications', foreignKey: 'RecipientId', onDelete: 'cascade' });
        User.hasMany(models.Group, { foreignKey: 'OwnerId' });
        User.hasMany(models.GroupMembership, { as: 'GroupMemberships', onDelete: 'cascade' });
        User.hasMany(models.GroupFollow, {
          as: 'GroupsFollowing',
          foreignKey: 'FollowerId',
          onDelete: 'cascade'
        });
      }
    },
    instanceMethods: {
      toJSON: function() {
        // Delete private values from object before sending to client
        // TODO: this isn't working (at least not in populations)
        var res = this.get();
        delete res.hash;
        delete res.passwordResetKey;
        delete res.facebookId;
        return res;
      },
      verifyPassword: function(password, cb) {
        bcrypt.compare(password, this.getDataValue('hash'), cb);
      }
    }
  });

  return User;

};