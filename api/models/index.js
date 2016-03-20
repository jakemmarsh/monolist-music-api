'use strict';

var fs            = require('fs');
var path          = require('path');
var _             = require('lodash');
var Sequelize     = require('sequelize');
var dotenv        = require('dotenv');
var db            = {};
var connectString;
var sequelize;

/* ====================================================== */

dotenv.load();

connectString = 'postgres://' + process.env.PG_USER + ':' + process.env.PG_PASSWORD + '@' + process.env.PG_HOST + ':' + process.env.PG_PORT + '/' + process.env.PG_NAME;

sequelize = new Sequelize(connectString, {
  dialect: 'postgres',
  native: true
});

/* ====================================================== */

fs.readdirSync(__dirname)
.filter(function(file) {
  return (file.indexOf('.') !== 0) && (file !== 'index.js');
})
.forEach(function(file) {
  var model = sequelize['import'](path.join(__dirname, file));
  db[model.name] = model;
});

_.forEach(Object.keys(db), function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
