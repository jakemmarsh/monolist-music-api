'use strict';

var when           = require('when');
var path           = require('path');
var nodemailer     = require('nodemailer');
var emailTemplates = require('email-templates');
var templatesDir   = path.join(__dirname, 'templates');
var ses            = require('nodemailer-ses-transport');

/* ====================================================== */

var transport      = nodemailer.createTransport(ses({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET
}));

exports.transport = transport;
/* ====================================================== */

exports.sendContact = function(userEmail, body) {

  var deferred = when.defer();
  var mailOptions = {
    from: userEmail || 'Monolist <jake@monolist.co>',
    to: 'jake@monolist.co',
    subject: 'Message sent from monolist.co',
    html: body,
    text: body
  };

  exports.transport.sendMail(mailOptions, function(err/*, response*/) {
    if ( err ) {
      deferred.reject(err);
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;

};

/* ====================================================== */

exports.sendWelcome = function(user) {

  var deferred = when.defer();
  var mailOptions = {
    from: 'Monolist <jake@monolist.co>',
    to: user.email,
    subject: 'Welcome to Monolist!'
  };
  var mailData = {
    user: user
  };

  emailTemplates(templatesDir, function(err, template) {
    if ( err ) {
      console.log(err);
    } else {
      template('welcome', mailData, function(err, html, text) {
        mailOptions.html = html;
        mailOptions.text = text;

        transport.sendMail(mailOptions, function(err/*, response*/) {
          if ( err ) {
            // Still resolve since user was successfully registered before sending email
            deferred.resolve(user);
          } else {
            deferred.resolve(user);
          }
        });
      });
    }
  });

  return deferred.promise;

};

/* ====================================================== */

exports.sendReset = function(user, key) {

  var deferred = when.defer();
  var mailOptions = {
    from: 'Monolist <jake@monolist.co>',
    to: user.email,
    subject: 'Reset Your Monolist Password'
  };
  var mailData = {
    user: user,
    key: key,
    resetUrl: 'http://www.monolist.co/reset.html?user=' + user.id + '&key=' + key
  };

  emailTemplates(templatesDir, function(err, template) {
    if ( err ) {
      console.log(err);
    } else {
      template('reset', mailData, function(err, html, text) {
        mailOptions.html = html;
        mailOptions.text = text;

        transport.sendMail(mailOptions, function(err, response) {
          if ( err ) {
            deferred.reject({ status: 500, body: err });
          } else {
            deferred.resolve(response.message);
          }
        });
      });
    }
  });

  return deferred.promise;

};