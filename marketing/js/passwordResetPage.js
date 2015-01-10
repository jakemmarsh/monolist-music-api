'use strict';

var $  = require('jquery');
var qs = require('querystring');

module.exports = (function() {

  var $resetForm        = $('#reset-form');
  var $successContainer = $('.success-container');
  var $passwordInput    = $('input#password');
  var $confirmInput     = $('input#confirm');
  var $submitButton     = $('input#submit');
  var $spinnerContainer = $('.spinner-container');
  var $errorContainer   = $('.error-container');
  var qsParams          = qs.parse(document.URL.split('?')[1]);

  $('#reset-form input').focus(function() {
    var labelId = '#' + $(this).attr('id') + '-label';
    $(labelId).addClass('active');
  });

  $('#reset-form input').blur(function() {
    var labelId = '#' + $(this).attr('id') + '-label';
    $(labelId).removeClass('active');
  });

  $('#reset-form input').keyup(function() {
    var password = $passwordInput.val();
    var confirmPassword = $confirmInput.val();

    if ( !password.length || !confirmPassword.length || password !== confirmPassword ) {
      $($submitButton).prop('disabled', true);
    } else {
      $($submitButton).prop('disabled', false);
    }
  });

  $('#reset-form').submit(function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    $errorContainer.hide();
    $spinnerContainer.show();

    $.ajax({
      type: 'POST',
      url: 'https://monolist.co/api/v1/auth/reset/' + qsParams.user + '/' + qsParams.key,
      data: {
        password: $passwordInput.val()
      }
    }).then(function() {
      $errorContainer.hide();
      $spinnerContainer.hide();
      $resetForm.hide();
      $successContainer.show();
    }).fail(function(err) {
      $spinnerContainer.hide();
      $errorContainer.text(JSON.parse(err.responseText).message);
      $errorContainer.show();
    });
  });

})();