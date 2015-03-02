'use strict';

var when     = require('when');
var qs       = require('querystring');
var request  = require('request');
var _        = require('lodash');
var ytdl     = require('ytdl-core');
var fallback = require('fallback');

/* ====================================================== */

exports.search = function(query, limit) {

  var mainDeferred = when.defer();

  var getVideoInfo = function(videoId) {
    var deferred = when.defer();
    var requestUrl = 'http://youtube.com/watch?v=' + videoId;
    var matches = [];
    var webmRegex = new RegExp('audio/webm', 'i');
    var returnInfo = null;

    ytdl.getInfo(requestUrl, { downloadURL: true }, function(err, info) {
      if ( err ) {
        deferred.resolve(null);
      } else {
        if ( info.formats ) {
          matches = _.filter(info.formats, function(format) {
            return webmRegex.test(format.type);
          });

          if ( matches && matches.length ) {
            returnInfo = {
              duration: parseInt(info.length_seconds)
            };
          }
        }
      }
      deferred.resolve(returnInfo);
    });

    return deferred.promise;
  };

  var filterAndAddVideoInfo = function(videos) {
    var deferred = when.defer();
    var promises = [];

    _.each(videos, function(videoObject) {
      promises.push(getVideoInfo(videoObject.sourceParam));
    });

    when.all(promises).then(function(videoInfos) {
      _.each(videoInfos, function(info, index) {
        if ( !info ) {
          videos[index] = null;
        } else {
          videos[index].duration = info.duration;
        }
      });
      videos = _.reject(videos, function(video) { return _.isEmpty(video); });
      deferred.resolve(videos);
    }, function(err) {
      deferred.reject(err.body || err);
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
      key: process.env.YOUTUBE_KEY
    };
    var searchResults;

    searchUrl += qs.stringify(searchParameters);

    request(searchUrl, function(err, response, body) {
      if ( err ) {
        deferred.reject(err.body || err);
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

        deferred.resolve(searchResults);
      }
    });

    return deferred.promise;
  };

  getSearchResults(query)
  .then(filterAndAddVideoInfo)
  .then(function(results) {
    mainDeferred.resolve(results);
  }, function(err) {
    mainDeferred.reject({ status: 500, body: err.toString() });
  });

  return mainDeferred.promise;

};

/* ====================================================== */

exports.stream = function(req, res) {

  var attemptRequest = function(videoInfo, cb) {
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