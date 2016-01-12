'use strict';

var when            = require('when');
var mailer          = require('../mailer');
var ResponseHandler = require('../utils/ResponseHandler');

/* ====================================================== */

exports.contact = function(req, res) {

  var sendContactEmail = function(userEmail, body) {
    var deferred = when.defer();

    userEmail = req.body.email || null;

    // if ( req.hostname !== 'monolist.co' ) {
    //   deferred.reject({ status: 401, body: 'Contact requests can not be made from outside domains.' });
    // } else

    if ( body ) {
      mailer.sendContact(userEmail, body).then(function() {
        deferred.resolve();
      }).catch(function(err) {
        deferred.reject({ status: 500, body: err });
      });
    } else {
      deferred.reject({ status: 400, body: 'A body is required to send a contact email.' });
    }

    return deferred.promise;
  };

  sendContactEmail(req.body.email, req.body.body).then(function() {
    ResponseHandler.handleSuccess(res, 200, 'Contact email successfully sent.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};