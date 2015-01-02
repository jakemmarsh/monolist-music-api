'use strict';

module.exports = function(sequelize) {

  var Collaboration = sequelize.define('Collaboration', {},
  {
    methods: {
      associate: function(models) {
        Collaboration.belongsTo(models.User);
        Collaboration.belongsTo(models.Playlist);
      }
    }
  });

  return Collaboration;

};