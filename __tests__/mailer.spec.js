'use strict';

var emailTemplates = require('email-templates');
var mailer         = require('../api/mailer');
var fixtures       = require('../utils/fixtures');

describe('Mailer', function() {

  var user = fixtures.users[0];
  var from = 'Monolist <jake@monolist.co>';

  beforeEach(function(done) {
    this.templateStub = sandbox.stub().yields(null, '', '')
    this.emailTemplatesSpy = sandbox.spy(emailTemplates);
    this.sendMailStub = sandbox.stub(mailer.transport, 'sendMail').yields(null, {});
    done();
  });

  it('sends a contact email', function(done) {
    var messageBody = 'this is the body of the message.';

    mailer.sendContact(user.email, messageBody).then(function() {
      sinon.assert.calledWith(this.sendMailStub.firstCall, sinon.match({
        from: from,
        to: 'jake@monolist.co',
        subject: 'Message sent from monolist.co - ' + user.email,
        html: messageBody,
        text: messageBody
      }), sinon.match.any);
      done();
    }.bind(this));
  });

  it('sends a welcome email provided a user', function(done) {
    mailer.sendWelcome(user).then(function() {
      sinon.assert.calledWith(this.sendMailStub.firstCall, sinon.match({
        from: from,
        to: user.email,
        subject: 'Welcome to Monolist!'
      }), sinon.match.any);
      done();
    }.bind(this));
  });

  it('send a reset password email provided a key and user', function(done) {
    mailer.sendReset(user, user.passwordResetKey).then(function() {
      sinon.assert.calledWith(this.sendMailStub.firstCall, sinon.match({
        from: from,
        to: user.email,
        subject: 'Reset Your Monolist Password'
      }), sinon.match.any);
      done();
    }.bind(this));
  });

});