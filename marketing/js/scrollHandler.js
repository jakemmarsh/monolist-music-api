'use strict';

var $ = require('jquery');

module.exports = function() {

  var $header = $('header');
  var $hero = $('.hero');
  var heroBottom = $hero.offset().top + $hero.outerHeight(true);
  var headerHeight = $header.outerHeight(true);
  var currentScrollPosition = $(document).scrollTop();

  if ( currentScrollPosition > (heroBottom - headerHeight) ) {
    $header.addClass('solid');
  } else {
    $header.removeClass('solid');
  }

};