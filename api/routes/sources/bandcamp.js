'use strict';

var when    = require('when');
var qs      = require('querystring');
var request = require('request');
var cheerio = require('cheerio');

/*
 * Remove leading and trailing whitespace,
 * remove any newlines or returns,
 * then remove any extra spaces.
 */
function formatText(text) {

  text = text.trim();
  text = text.replace(/\r?\n|\r/g, '');
  text = text.replace(/ +(?= )/g, '');

  return text;

}

/* ====================================================== */

exports.search = function(query, limit) {

  var mainDeferred = when.defer();

  /*
   * Web scraping must be used on bandcamp.com/search due to lack of public API.
   * 1. iterate over all results inside .results > .result-items
   * 2. only process results of class `searchresult track`
   *      - title of track is a link inside div of class `heading`
   *      - artist and album are inside div of class `subhead`, of the format
   *        "from <album name> by <artist>"
   *      - track URL is a link inside div of class `itemurl`
   *
   * @param {String} searchQuery
   * @param {Number} pageNumber
   * @param {Number} limit
   * @param {Array} searchResults
   */
  var getSearchResults = function(searchQuery, pageNumber, limit, searchResults) {
    if ( typeof searchResults === 'undefined' ) {
      searchResults = [];
    }
    var deferred = when.defer();
    var albumArtistRegex = /from (.+?) by (.+)/i;
    var searchUrl = 'http://bandcamp.com/search?';
    var searchParameters = {
      q: searchQuery.replace(/(%20)|( )/gi, '+'),
      page: pageNumber > 1 ? pageNumber : null
    };
    var $;
    var subheadText;
    var imageUrl;
    var regexResult;
    var trackResult;

    searchUrl += qs.stringify(searchParameters);

    // retrieve and scrape Bandcamp search results page
    request(searchUrl, function(err, response, body){
      if ( err ) {
        deferred.reject(err);
      } else {
        $ = cheerio.load(body);

        // process each search result
        if( $('.searchresult.track').length ) {
          $('.searchresult.track').each(function() {
            if ( searchResults.length < limit ) {
              subheadText = formatText($(this).find('.subhead').text());
              imageUrl = $(this).find('.art').children('img').first()[0].attribs.src;
              regexResult = albumArtistRegex.exec(subheadText);

              trackResult = {
                source: 'bandcamp',
                title: formatText($(this).find('.heading').text()),
                album: regexResult ? regexResult[1] : null,
                artist: regexResult ? regexResult[2] : null,
                imageUrl: imageUrl,
                sourceParam: formatText($(this).find('.itemurl').text()).toString(),
                sourceUrl: formatText($(this).find('.itemurl').text())
              };

              searchResults.push(trackResult);
            }
          });

          // Recurse as long as there are still results and we aren't at our result limit
          if ( searchResults.length < limit ) {
            deferred.resolve(getSearchResults(searchQuery, pageNumber + 1, limit, searchResults));
          }
        }
        // If no more results, return the results we've collected
        deferred.resolve(searchResults);
      }
    });

    return deferred.promise;
  };

  // Search Bandcamp starting at page 1, # of results limit, and with an empty array of results
  getSearchResults(query, 1, limit, []).then(function(results) {
    mainDeferred.resolve(results);
  }, function(err) {
    mainDeferred.reject(err);
  });

  return mainDeferred.promise;

};

/* ====================================================== */

exports.stream = function(req, res) {

  var bandcampUrl = decodeURIComponent(req.params.trackUrl);

  /*
   * parse the page loaded by bandcampUrl
   * direct link to the mp3 is in a script tag,
   * within an object called `TralbumData`,
   * a nested object called `trackinfo`,
   * at the key `mp3-128`
   *
   * @param {String} url
   */
  var getTrackFile = function(url) {
    var deferred = when.defer();
    var trackRegex = /{"mp3-128":"(.+?)"/ig;
    var urlResults;

    request(url, function(err, response, body) {
      if ( err ) {
        deferred.reject('Unable to retrieve the MP3 file for the specified URL.');
      } else {
        urlResults = trackRegex.exec(body);

        if ( urlResults !== null ) {
          deferred.resolve(request.get(urlResults[1]));
        } else {
          deferred.reject('Unable to retrieve the MP3 file for the specified URL.');
        }
      }
    });

    return deferred.promise;
  };

  getTrackFile(bandcampUrl).then(function(track) {
    track.pipe(res);
  }, function(err) {
    res.status(500).send(err);
  });

};