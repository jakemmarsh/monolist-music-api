'use strict';

var qs      = require('querystring');
var when    = require('when');
var request = require('superagent');
var OAuth   = require('oauth');

var API_ROOT = 'https://www.audiomack.com/v1/';

/* ====================================================== */

exports.oauth = new OAuth.OAuth(
  'https://audiomack.com/v1/debug',
  'https://audiomack.com/v1/debug',
  process.env.AUDIOMACK_KEY,
  process.env.AUDIOMACK_SECRET,
  '1.0A',
  null,
  'HMAC-SHA1'
);

/* ====================================================== */

function authorize() {

  var deferred = when.defer();

  exports.oauth.getOAuthAccessToken('', { grant_type: 'client_credentials' }, function(err, accessToken, refreshToken, results) {
    console.log('\n\n==================================================================================');
    if ( err ) {
      console.log('error:', err);
      deferred.reject(err);
    } else {
      console.log('accessToken:', accessToken);
      console.log('\n');
      console.log('refreshToken:', refreshToken);
      console.log('\n');
      console.log('results:', results);
      deferred.resolve(accessToken);
    }
    console.log('==================================================================================\n\n');
  });

  return deferred.promise;

};

// authorize();

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

    exports.oauth.get(
      'https://audiomack.com/v1/search?' + qs.stringify(searchParameters),
      null,
      null,
      function(err, data, res) {
        if ( err ) {
          console.log('error:', err);
          deferred.reject(err);
        } else {
          console.log('data:', data);
          deferred.resolve(data);
        }
      }
    );

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
