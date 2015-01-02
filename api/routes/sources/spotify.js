'use strict';

var when    = require('when');
var request = require('superagent');
var _       = require('lodash');

/* ====================================================== */

exports.search = function(query, limit) {

  var mainDeferred = when.defer();

  var getSearchResults = function(searchQuery) {
    var deferred = when.defer();
    var searchUrl = 'https://api.spotify.com/v1/search?q=';
    var searchResults;

    searchQuery = searchQuery.replace(/(%20)|( )/gi, '+');

    searchUrl += searchQuery;
    searchUrl += '&type=track';
    searchUrl += '&limit=' + limit;

    request.get(searchUrl).end(function(res) {
      if ( res.err ) {
        deferred.reject(res.err);
      } else if ( res.body.tracks ) {
        searchResults = _.map(res.body.tracks.items, function(item) {
          return {
            source: 'spotify',
            title: item.name,
            album: item.album ? item.album.name : null,
            artist: (item.artists && item.artists[0]) ? item.artists[0].name : null,
            imageUrl: (item.album && item.album.images[0]) ? item.album.images[0].url : null,
            id: item.id,
            uri: item.uri
          };
        });

        deferred.resolve(searchResults);
      }
    });

    return deferred.promise;
  };

  getSearchResults(query).then(function(results) {
    mainDeferred.resolve(results);
  }, function(err) {
    mainDeferred.reject(err);
  });

  return mainDeferred.promise;

};

/* ====================================================== */

exports.stream = function(req, res) {

  res.status(200).send('Spotify track ID: ' + req.params.trackId);

};