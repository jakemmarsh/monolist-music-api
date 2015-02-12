'use strict';

var $               = require('jquery');
var getDownloadLink = require('./getDownloadLink');

module.exports = (function() {

  var os = 'Unknown OS';

  if ( navigator.appVersion.indexOf('Win') !== -1 ) {
    os = 'win';
  } else if ( navigator.appVersion.indexOf('Mac') !== -1 ) {
    os = 'mac';
  } else if ( navigator.appVersion.indexOf('X11') !== -1 ) {
    os = 'unix';
  } else if ( navigator.appVersion.indexOf('Linux') !== -1 ) {
    os = 'linux';
  }

  getDownloadLink(os).then(function(downloadLink) {
    $('.spinner').fadeOut(500);

    if ( os === 'mac' ) {
      $('.osx-download').attr('href', downloadLink).delay(500).fadeIn();
    } else if ( os === 'win' ) {
      $('.win-download').attr('href', downloadLink).delay(500).fadeIn();
    } else {
      $('.not-supported-download').delay(500).fadeIn();
    }
  });

})();