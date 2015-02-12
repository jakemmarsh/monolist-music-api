'use strict';

var when    = require('when');
var qs      = require('querystring');
var request = require('request');
var _       = require('lodash');
var ytdl    = require('ytdl-core');
var fallback = require('fallback');
var config  = require('../../../config');

/* ====================================================== */

/*
 * Convert YouTube's duration format to seconds
 */
function parseYouTubeDuration(duration) {
    var a = duration.match(/\d+/g);

    if ( duration.indexOf('M') >= 0 && duration.indexOf('H') === -1 && duration.indexOf('S') === -1 ) {
      a = [0, a[0], 0];
    }
    if ( duration.indexOf('H') >= 0 && duration.indexOf('M') === -1 ) {
      a = [a[0], 0, a[1]];
    }
    if ( duration.indexOf('H') >= 0 && duration.indexOf('M') === -1 && duration.indexOf('S') === -1 ) {
      a = [a[0], 0, 0];
    }

    duration = 0;

    if ( a.length === 3 ) {
      duration = duration + parseInt(a[0]) * 3600;
      duration = duration + parseInt(a[1]) * 60;
      duration = duration + parseInt(a[2]);
    }
    if ( a.length === 2 ) {
      duration = duration + parseInt(a[0]) * 60;
      duration = duration + parseInt(a[1]);
    }
    if ( a.length === 1 ) {
      duration = duration + parseInt(a[0]);
    }

    return duration;
}

/* ====================================================== */

exports.search = function(query, limit) {

  var mainDeferred = when.defer();

  var getVideoDuration = function(infoUrl) {
    var deferred = when.defer();
    var duration;

    request(infoUrl, function(err, response, body) {
      if ( err ) {
        deferred.reject({ status: 500, body: err.toString() });
      } else {
        body = JSON.parse(body);

        duration = body.items ? parseYouTubeDuration(body.items[0].contentDetails.duration) : null;
        deferred.resolve(duration);
      }
    });

    return deferred.promise;
  };

  var addVideoDurations = function(videos) {
    var deferred = when.defer();
    var infoUrl = 'https://www.googleapis.com/youtube/v3/videos?';
    var infoParameters = {
      part: 'contentDetails',
      key: config.youtube.key
    };
    var promises = [];

    _.each(videos, function(videoObject) {
      infoParameters.id = videoObject.sourceParam;

      promises.push(getVideoDuration(infoUrl + qs.stringify(infoParameters)));
    });

    when.all(promises).then(function(durations) {
      _.each(durations, function(duration, index) {
        videos[index].duration = duration;
      });
      deferred.resolve(videos);
    }, function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  var getSearchResults = function(searchQuery) {
    var deferred = when.defer();
    var searchUrl = 'https://www.googleapis.com/youtube/v3/search?';
    var searchParameters = {
      type: 'video',
      part: 'snippet',
      q: searchQuery.replace(/(%20)|( )/gi, '+'),
      maxResults: limit,
      key: config.youtube.key
    };
    var searchResults;

    searchUrl += qs.stringify(searchParameters);

    request(searchUrl, function(err, response, body) {
      if ( err ) {
        deferred.reject(err);
      } else {
        body = JSON.parse(body);

        searchResults = _.map(body.items, function(item) {
          return {
            source: 'youtube',
            title: item.snippet.title,
            imageUrl: item.snippet.thumbnails.high.url,
            sourceParam: item.id.videoId.toString(),
            sourceUrl: 'http://youtube.com/watch?v=' + item.id.videoId
          };
        });

        deferred.resolve(addVideoDurations(searchResults));
      }
    });

    return deferred.promise;
  };

  getSearchResults(query).then(function(results) {
    mainDeferred.resolve(results);
  }, function(err) {
    mainDeferred.reject({ status: 500, body: err.toString() });
  });

  return mainDeferred.promise;

};

/* ====================================================== */

exports.stream = function(req, res) {

  var attemptRequest = function(videoInfo, cb) {
    console.log('trying:', videoInfo);

    request(videoInfo.url)
    .on('error', function(err) {
      cb(err);
    })
    .on('response', function(resp) {
      cb(null, resp);
    })
    .pipe(res);
  };

  var handleRequestError = function(err) {
    if ( err ) {
      res.status(500).json({ status: 500, message: err });
    }
  };

  var streamTrack = function(videoId) {
    var requestUrl = 'http://youtube.com/watch?v=' + videoId;
    var webmRegex = new RegExp('audio/webm', 'i');
    var matches = null;

    ytdl.getInfo(requestUrl, { downloadURL: true }, function(err, info) {
      if ( err ) {
        res.status(500).json({ status: 500, message: err });
      } else {
        if ( info.formats ) {
          matches = _.filter(info.formats, function(format) {
            return webmRegex.test(format.type);
          });

          if ( matches && matches.length ) {
            fallback(matches, attemptRequest, handleRequestError);
          } else {
            res.status(500).json({ status: 500, message: 'No suitable audio file could be found for that video.' });
          }
        } else {
          res.status(500).json({ status: 500, message: 'No available formats could be found for that video.' });
        }
      }
    });
  };

  streamTrack(req.params.videoId);

};