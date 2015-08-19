'use strict';

var when       = require('when');
var _          = require('lodash');
var models     = require('../models');
var bandcamp   = require('./sources/bandcamp');
var soundcloud = require('./sources/soundcloud');
var spotify    = require('./sources/spotify');
var youtube    = require('./sources/youtube');

/* ====================================================== */

module.exports = function(req, res) {

  var searchResults = [];
  var limit = req.query.limit || 20;
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

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
          searchPromises.push(sourcePromisesMap[searchSource.toLowerCase()](req.params.query, limit, ip));
        }
      });
    } else {
      searchPromises = [
        sourcePromisesMap.bandcamp(req.params.query, limit, ip),
        sourcePromisesMap.soundcloud(req.params.query, limit, ip),
        sourcePromisesMap.spotify(req.params.query, limit, ip),
        sourcePromisesMap.youtube(req.params.query, limit, ip)
      ];
    }

    return searchPromises;
  };

  var recordSearch = function(currentUser, query, results) {
    var attributes = {
      UserId: currentUser ? currentUser.id : null,
      query: query,
      results: results
    };
  };

  when.all(getSearchPromises()).then(function(results) {
    _.each(results, function(result) {
      searchResults = _.sortBy(searchResults.concat(result), 'title');
    });
    recordSearch(req.user, req.params.query, searchResults);
    res.status(200).json(searchResults);
  }, function(err) {
    res.status(err.status).json({ status: err.status, message: err.body });
  });

};