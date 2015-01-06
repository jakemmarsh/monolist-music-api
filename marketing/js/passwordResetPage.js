'use strict';

var $  = require('jquery');
var qs = require('querystring');

module.exports = (function() {

  var $resetForm = $('#reset-form');
  var $successMessage = $('.success-message-container');
  var $passwordInput = $('input#password');
  var $confirmInput = $('input#confirm');
  var $submitButton = $('input#submit');
  var $spinnerContainer = $('.spinner-container');
  var $errorContainer = $('.error-container');
  var qsParams = qs.parse(document.URL.split('?')[1]);

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
    var password = $passwordInput.val();
    var confirmPassword = $confirmInput.val();

    evt.preventDefault();
    evt.stopPropagation();

    $errorContainer.hide();
    $spinnerContainer.show();

    $.ajax({
      type: 'POST',
      url: 'https://monolist.co/api/v1/auth/reset/' + qsParams.user + '/' + qsParams.key,
    }).then(function(resp) {
      console.log('success:', resp);
      $errorContainer.hide();
      $spinnerContainer.hide();
      $resetForm.hide();
      $successMessage.show();
    }).fail(function(err) {
      console.log('error:', err);
      $spinnerContainer.hide();
      $errorContainer.text(JSON.parse(err.responseText).message);
      $errorContainer.show();
    });

    console.log(qsParams);
    console.log(password);
    console.log(confirmPassword);
  });

})();