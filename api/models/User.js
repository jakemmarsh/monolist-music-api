'use strict';

var bcrypt = require('bcrypt');

module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    username:         { type: DataTypes.STRING, unique: true, allowNull: false },
    role:             { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    email:            {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    imageUrl:         { type: DataTypes.STRING },
    hash:             { type: DataTypes.STRING, allowNull: false },
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
          cb('Unable to hash user\'s password.');
        }
      }
    },
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Playlist, { onDelete: 'cascade' });
        User.hasMany(models.Collaboration, { onDelete: 'cascade' });
        User.hasMany(models.PlaylistLike, { onDelete: 'cascade' });
        User.hasMany(models.PlaylistPlay);
        User.hasMany(models.StarredTrack, { onDelete: 'cascade' });
        User.hasMany(models.TrackPlay);
        User.hasMany(models.UserFollow, { as: 'UsersFollowing', foreignKey: 'FollowerId', onDelete: 'cascade' });
        User.hasMany(models.UserFollow, { as: 'Followers', foreignKey: 'UserId', onDelete: 'cascade' });
        User.hasMany(models.PlaylistFollow, { as: 'PlaylistsFollowing', foreignKey: 'UserId', onDelete: 'cascade' });
      }
    },
    instanceMethods: {
      toJSON: function() {
        // Delete hash and reset key from object before sending to frontend
        var res = this.values;
        delete res.hash;
        delete res.passwordResetKey;
        return res;
      },
      verifyPassword: function(password, cb) {
        bcrypt.compare(password, this.getDataValue('hash'), cb);
      }
    }
  });

  return User;

};