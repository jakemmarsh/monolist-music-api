'use strict';

var ResponseHandler = require('../../api/utils/ResponseHandler');

describe('Util: ActivityManager', function() {

  it('#handleSuccess should respond accordingly', function() {
    var jsonStub = sandbox.stub();
    var testRes = {
      status: function() {
        return {
          json: jsonStub
        };
      }
    };
    var statusSpy = sandbox.spy(testRes, 'status');
    var status = 200;
    var data = {
      test: 'test'
    };

    ResponseHandler.handleSuccess(testRes, status, data);

    sinon.assert.calledWith(statusSpy, status);
    sinon.assert.calledWith(jsonStub, {
      status: status,
      data: data,
      error: null
    });
  });

  it('#handleError should log the error', function() {
    var testRes = {
      status: function() {
        return {
          json: function() {}
        };
      }
    };
    var error = {
      test: 'test'
    };

    sandbox.mock(ResponseHandler.logger).expects('error').withArgs(error);

    ResponseHandler.handleError(testRes, 400, error);
  });

  it('#handleError should respond accordingly', function() {
    var jsonStub = sandbox.stub();
    var testRes = {
      status: function() {
        return {
          json: jsonStub
        };
      }
    };
    var statusSpy = sandbox.spy(testRes, 'status');
    var status = 400;
    var error = {
      test: 'test'
    };

    ResponseHandler.handleError(testRes, status, error);

    sinon.assert.calledWith(statusSpy, status);
    sinon.assert.calledWith(jsonStub, {
      status: status,
      data: null,
      error: error
    });
  });

});