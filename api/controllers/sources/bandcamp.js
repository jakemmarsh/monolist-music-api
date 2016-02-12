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
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.getDetails = function(req, res) {

  var url = decodeURIComponent(req.params.url);

  bandcamp.getDetails(url).then(function(details) {
    ResponseHandler.handleSuccess(res, 200, {
      source: 'bandcamp',
      title: details.title,
      artist: details.artist,
      album: details.album,
      imageUrl: details.image,
      sourceParam: url,
      sourceUrl: url
    });
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};
