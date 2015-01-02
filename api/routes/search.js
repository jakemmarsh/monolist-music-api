'use strict';

var path       = require('path');
var when       = require('when');
var _          = require('lodash');
var bandcamp   = require(path.join(__dirname, 'sources/bandcamp'));
var soundcloud = require(path.join(__dirname, 'sources/soundcloud'));
var spotify    = require(path.join(__dirname, 'sources/spotify'));
var youtube    = require(path.join(__dirname, 'sources/youtube'));

/* ====================================================== */

module.exports = function(req, res) {

  var searchResults = [];
  var limit = req.query.limit || 20;

  /*
   * If user has specified `sources` in the query string,
   * split at commas and add each source's search promise to the
   * searchPromises (if it exists in the mapping). Otherwise,
   * add all 4 possible sources to the searchPromises.
   */
  var getSearchPromises = function() {
    var sourcePromisesMap = {
      'bandcamp': bandcamp.search,
      'soundcloud': soundcloud.search,
      'spotify': spotify.search,
      'youtube': youtube.search
    };
    var searchPromises = [];
    var sources;

    // Limit search if user specifies sources
    if ( req.query.sources ) {
      sources = req.query.sources.split(',');
      _.each(sources, function(searchSource) {
        if ( searchSource.toLowerCase() in sourcePromisesMap ) {
          searchPromises.push(sourcePromisesMap[searchSource.toLowerCase()](req.params.query, limit));
        }
      });
    } else {
      searchPromises = [
        sourcePromisesMap.bandcamp(req.params.query, limit),
        sourcePromisesMap.soundcloud(req.params.query, limit),
        sourcePromisesMap.spotify(req.params.query, limit),
        sourcePromisesMap.youtube(req.params.query, limit)
      ];
    }

    return searchPromises;
  };

  // Search all specified resources
  when.all(getSearchPromises()).then(function(results) {
    _.each(results, function(result) {
      searchResults = _.sortBy(searchResults.concat(result), 'title');
    });
    res.status(200).json(searchResults);
  }, function(err) {
    res.status(500).json({ error: err });
  });

};