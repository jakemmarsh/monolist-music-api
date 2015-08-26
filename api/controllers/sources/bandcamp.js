'use strict';

var when            = require('when');
var _               = require('lodash');
var bandcamp        = require('node-bandcamp');

var ResponseHandler = require('../../utils/ResponseHandler');

/* ====================================================== */

exports.search = function(query, limit) {

  var deferred = when.defer();

  bandcamp.trackSearch(query, limit).then(function(results) {
    deferred.resolve(_.map(results, function(result) {
      return {
        source: 'bandcamp',
        title: result.title,
        album: result.album,
        artist: result.artist,
        imageUrl: result.image,
        sourceParam: result.url,
        sourceUrl: result.url
      };
    }));
  }).catch(function(err) {
    deferred.reject({ status: 500, body: err.toString() });
  });

  return deferred.promise;

};

/* ====================================================== */

exports.stream = function(req, res) {

  var url = decodeURIComponent(req.params.trackUrl);

  bandcamp.getTrack(url).then(function(stream) {
    stream.pipe(res);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getDetails = function(req, res) {

  var getTrackDetails = function(url) {
    var deferred = when.defer();

    url = decodeURIComponent(url);

    // TODO: get track details
    deferred.resolve();

    return deferred.promise;
  };

  getTrackDetails(req.params.url).then(function(details) {
    ResponseHandler.handleSuccess(res, 200, details);
  }).catch(function(err) {
    ResponseHandler.handleError(res, err.status, err.body);
  });

};