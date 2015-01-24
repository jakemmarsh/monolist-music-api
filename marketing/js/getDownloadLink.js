'use strict';

var $ = require('jquery');
var when = require('when');

module.exports = function(os) {

  var deferred = when.defer();
  var returnString = 'https://assets.monolist.co/releases/' + (os === 'mac' ? 'mac/' : 'win/') + 'Monolist-';

  $.getJSON('https://assets.monolist.co/app/package.json', function(p) {
    returnString += p.version;

    if ( os === 'mac' ) {
      returnString += '-osx.dmg';
    } else if ( os === 'win' ) {
      returnString += '-win.zip';
    }

    deferred.resolve(returnString);
  });

  return deferred.promise;

};