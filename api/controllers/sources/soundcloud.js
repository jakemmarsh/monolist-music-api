'use strict';

var qs              = require('querystring');
var request         = require('request');
var _               = require('lodash');
var SC              = require('node-soundcloud');
var when            = require('when');
var ResponseHandler = require('../../utils/ResponseHandler');

/* ====================================================== */

SC.init({
  id: process.env.SOUNDCLOUD_ID,
  secret: process.env.SOUNDCLOUD_SECRET
});

/* ====================================================== */

exports.redirect = function(req, res) {

  var code = req.query.code;

  // authorize and get an access token
  SC.authorize(code);

  res.status(200);

};

/* ====================================================== */

exports.search = function(query, limit) {

  var mainDeferred = when.defer();

  var getSearchResults = function(searchQuery) {
    var deferred = when.defer();
    var queryUrl = '/tracks?';
    var searchParameters = {
      q: searchQuery.replace(/(%20)|( )/gi, '+'),
      limit: limit
    };
    var searchResults;

    queryUrl += qs.stringify(searchParameters);

    SC.get(queryUrl, function(err, results) {
      if ( err ) {
        deferred.reject(err);
      } else {
        // process each search result, only if streamable === true
        searchResults = _.map(_.where(results, { streamable: true }), function(item) {
          return {
            source: 'soundcloud',
            title: item.title,
            imageUrl: item.artwork_url ? item.artwork_url : null,
            duration: item.duration/1000,
            sourceParam: item.id.toString(),
            sourceUrl: item.permalink_url
          };
        });

        deferred.resolve(searchResults);
      }
    });

    return deferred.promise;
  };

  getSearchResults(query).then(function(results) {
    mainDeferred.resolve(results);
  }).catch(function() {
    mainDeferred.reject({ status: 500, body: 'Unable to retrieve Soundcloud search results.' });
  });

  return mainDeferred.promise;

};

/* ====================================================== */

exports.stream = function(req, res) {

  var getTrackUrl = function(trackId) {
    var deferred = when.defer();

    var queryUrl = '/tracks/' + trackId + '/stream';

    SC.get(queryUrl, function(err, trackInfo) {
      if ( err ) {
        deferred.reject({ status: 500, body: err.message || err });
      } else {
        deferred.resolve(request.get(trackInfo.location));
      }
    });

    return deferred.promise;
  };

  getTrackUrl(req.params.trackId).then(function(audioRes) {
    audioRes.pipe(res);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getDetails = function(req, res) {

  var getTrackDetails = function(trackUrl) {
    var deferred = when.defer();
    var scUrl = 'http://api.soundcloud.com/resolve.json?client_id=' + process.env.SOUNDCLOUD_ID + '&url=' + decodeURIComponent(trackUrl);

    // TODO: why won't this work via SC.get?
    request.get(scUrl, function(err, response, body) {
      body = JSON.parse(body);

      console.log('body:', body);

      deferred.resolve({
        source: 'soundcloud',
        title: body.title,
        imageUrl: body.artwork_url ? body.artwork_url : null,
        duration: body.duration/1000,
        sourceParam: body.id.toString(),
        sourceUrl: body.permalink_url
      });
    });

    return deferred.promise;
  };

  getTrackDetails(req.params.url).then(function(details) {
    ResponseHandler.handleSuccess(res, 200, details);
  }).catch(function(err) {
    ResponseHandler.handleError(res, err.status, err.body);
  });

};