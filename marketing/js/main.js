'use strict';

var $ = require('jquery');

function route(path, cb) {
  var regex = new RegExp(path, 'i');
  cb = cb || function() {};

  if ( (path === 'index' || path === '' || path === '/') && window.location.pathname === '/' ) {
    cb();
  } else if ( path.length > 1 && regex.test(window.location.pathname) ) {
    cb();
  }
}

$(document).ready(function() {

  route('/', function() {
    var $content = $('.content');
    var $scrollDownButton = $('.scroll-down-container');
    var $copyrightDateSpan = $('.year-span');

    $copyrightDateSpan.text((new Date().getFullYear()).toString());

    $scrollDownButton.click(function() {
      $('html, body').animate({
        scrollTop: $content.offset().top
      }, 1500);
    });

    require('./operatingSystem');

    require('./scrollHandler');
  });

  route('/reset', function() {
    require('./passwordResetPage');
  });

});