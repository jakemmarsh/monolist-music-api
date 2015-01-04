'use strict';

var $ = require('jquery');

var determineOS = require('./operatingSystem');
var scrollHandler = require('./scrollHandler');

$(document).ready(function() {

  var $content = $('.content');
  var $scrollDownButton = $('.scroll-down-container');
  var $copyrightDateSpan = $('.year-span');

  $copyrightDateSpan.text((new Date().getFullYear()).toString());

  $scrollDownButton.click(function() {
    $('html, body').animate({
      scrollTop: $content.offset().top
    }, 1500);
  });

  determineOS();

  $(window).scroll(scrollHandler);

});