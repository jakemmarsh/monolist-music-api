'use strict';

var $ = require('jquery');

$(document).ready(function() {

  var $header = $('header');
  var $hero = $('.hero');
  var $content = $('.content');
  var $scrollDownButton = $('.scroll-down-container');
  var $copyrightDateSpan = $('.year-span');
  var heroBottom = $hero.offset().top + $hero.outerHeight(true);
  var currentScrollPosition;

  $copyrightDateSpan.text((new Date().getFullYear()).toString());

  $(window).scroll(function() {
    currentScrollPosition = $(document).scrollTop();

    if ( currentScrollPosition > (heroBottom - 85) ) { // 85px = height of header
      $header.addClass('solid');
    } else {
      $header.removeClass('solid');
    }
  });

  $scrollDownButton.click(function() {
    $('html, body').animate({
      scrollTop: $content.offset().top
    }, 1500);
  });

});