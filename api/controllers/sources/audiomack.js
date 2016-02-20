'use strict';

var qs              = require('querystring');
var when            = require('when');
var _               = require('lodash');
var request         = require('request');
var OAuth           = require('oauth');

var ResponseHandler = require('../../utils/ResponseHandler');

var API_ROOT        = 'https://www.audiomack.com/v1/';

/* ====================================================== */

var oauth = new OAuth.OAuth(
  'https://audiomack.com/v1/debug',
  'https://audiomack.com/v1/debug',
  process.env.AUDIOMACK_KEY,
  process.env.AUDIOMACK_SECRET,
  '1.0',
  null,
  'HMAC-SHA1'
);

/* ====================================================== */

function getTrackDetails(url) {
  var deferred = when.defer();
  var urlParts = url.split('/');
  var track = urlParts[urlParts.length - 1];
  var artist = urlParts[urlParts.length - 2];

  oauth.get(
    API_ROOT + 'music/song/' + artist + '/' + track,
    null,
    null,
    function(err, data) {
      if ( err ) {
        deferred.reject(err);
      } else {
        data = JSON.parse(data);

        deferred.resolve({
          source: 'audiomack',
            title: data.results.title,
            artist: data.results.artist,
            imageUrl: data.results.image,
            sourceParam: data.results.id,
            sourceUrl: 'http://audiomack.com/song/' + data.results.uploader.url_slug + '/' + data.results.url_slug,
            streamUrl: data.results.streaming_url
        });
      }
    }
  )

  return deferred.promise;
}

/* ====================================================== */

exports.search = function(query, limit) {

  var mainDeferred = when.defer();

  var getSearchResults = function(searchQuery, queryLimit) {
    var deferred = when.defer();
    var scRegex = new RegExp('soundcloud.com', 'i');
    var searchParameters = {
      q: searchQuery,
      show: 'songs',
      limit: queryLimit
    };
    var searchResults = [];

    oauth.get(
      API_ROOT + 'search?' + qs.stringify(searchParameters),
      null,
      null,
      function(err, data) {
        if ( err ) {
          deferred.reject(err);
        } else {
          data = JSON.parse(data);

           _.forEach(data.results, function(track) {
            if ( !scRegex.test(track.streaming_url) ) {
              searchResults.push({
                source: 'audiomack',
                title: track.title,
                artist: track.artist,
                imageUrl: track.image,
                sourceParam: track.id,
                sourceUrl: 'http://audiomack.com/song/' + track.uploader.url_slug + '/' + track.url_slug
              });
            }
          });

          deferred.resolve(searchResults);
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

  return mainDeferred.promise;

};

/* ====================================================== */

exports.stream = function(req, res) {

  var url = decodeURIComponent(req.params.trackUrl);

  getTrackDetails(url).then(function(details) {
    var stream = request.get(details.streamUrl);

    stream.on('error', function(err) {
      ResponseHandler.handleError(req, res, 500, err);
    });

    stream.pipe(res);
  });

};

/* ====================================================== */

exports.getDetails = function(req, res) {

  getTrackDetails(decodeURIComponent(req.params.url)).then(function(details) {
    delete details.streamUrl;
    ResponseHandler.handleSuccess(res, 200, details);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};
