'use strict';

var $ = require('jquery');
var when = require('when');

module.exports = function(os) {

  var deferred = when.defer();
  var returnString = 'Monolist-';

  $.getJSON('http://assets.monolist.co/app/package.json', function(p) {
    returnString += p.version;

    if ( os === 'mac' ) {
      deferred.resolve(returnString + '-osx.dmg');
    } else if ( os === 'win' ) {
      deferred.resolve(returnString + '-win.zip');
    }
  });

  return deferred.promise;

};