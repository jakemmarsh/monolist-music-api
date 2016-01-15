'use strict';

var qs      = require('querystring');
var when    = require('when');
var request = require('superagent');

var API_ROOT = 'https://www.audiomack.com/v1/';

/* ====================================================== */

function authorize() {

  var deferred = when.defer();

  request.post(API_ROOT + 'access_token', {
    x_auth_username: 'test'
  });

  return deferred.promise;

};

/* ====================================================== */

exports.search = function(query, limit) {

  var mainDeferred = when.defer();

  var getSearchResults = function(searchQuery, queryLimit) {
    var deferred = when.defer();
    var searchParameters = {
      q: searchQuery,
      show: 'songs',
      limit: queryLimit
    };

    request.get(API_ROOT + 'search?' + qs.stringify(searchParameters))
    .end(function(res) {
      if ( !res.ok || res.body.errorcode !== 200 ) {
        console.log('failed res:', res.body.message);
        deferred.reject(res.body.message);
      } else {
        console.log('successful res:', res.body);
        deferred.resolve(res.body);
      }
    });

    return deferred.promise;
  };

  getSearchResults(query, limit).then(function(results) {
    mainDeferred.resolve(results);
  }, function(err) {
    mainDeferred.reject({ status: 500, body: err.toString() });
  });

}

/* ====================================================== */

exports.stream = function(req, res) {

};

/* ====================================================== */

exports.getDetails = function(req, res) {

};
