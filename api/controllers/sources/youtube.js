'use strict';

var when            = require('when');
var qs              = require('querystring');
var request         = require('request');
var _               = require('lodash');
var url             = require('url');

var ResponseHandler = require('../../utils/ResponseHandler');

/* ====================================================== */

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

function addVideoDurations(videos) {
  if ( videos.constructor !== Array ) {
    videos = [videos];
  }

  var deferred = when.defer();
  var infoUrl = 'https://www.googleapis.com/youtube/v3/videos?';
  var infoParameters = {
    part: 'contentDetails',
    key: process.env.YOUTUBE_KEY,
    id: _.pluck(videos, 'sourceParam').join(',')
  };

  infoUrl += qs.stringify(infoParameters);

  request(infoUrl, function(err, response, body) {
    if ( err ) {
      deferred.reject({ status: 500, body: err.toString() });
    } else {
      body = JSON.parse(body);

      _.each(_.pluck(body.items, 'contentDetails'), function(contentDetails, index) {
        videos[index].duration = parseYouTubeDuration(contentDetails.duration);
      });

      deferred.resolve(videos);
    }
  });

  return deferred.promise;
}

/* ====================================================== */

exports.search = function(query, limit, ip) {

  var mainDeferred = when.defer();

  var getSearchResults = function(searchQuery, userIP) {
    var deferred = when.defer();
    var searchUrl = 'https://www.googleapis.com/youtube/v3/search?';
    var searchParameters = {
      type: 'video',
      part: 'snippet',
      q: searchQuery.replace(/(%20)|( )/gi, '+'),
      restriction: userIP,
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

  getSearchResults(query, ip)
  .then(addVideoDurations)
  .then(function(results) {
    mainDeferred.resolve(results);
  }, function(err) {
    mainDeferred.reject({ status: 500, body: err.toString() });
  });

  return mainDeferred.promise;

};

/* ====================================================== */

exports.getDetails = function(req, res) {

  var getTrackDetails = function(videoUrl) {
    var deferred = when.defer();
    var infoUrl = 'https://www.googleapis.com/youtube/v3/videos?';
    var videoId = qs.parse(url.parse(videoUrl).query).v;

    // Video ID was not found in normal format, may be shortened URL
    if ( !videoId ) {
      var urlParts = videoUrl.split('/');
      videoId = urlParts[urlParts.length - 1];
    }

    var infoParameters = {
      part: 'snippet',
      key: process.env.YOUTUBE_KEY,
      id: videoId
    };

    infoUrl += qs.stringify(infoParameters);

    request(infoUrl, function(err, response, body) {
      if ( err ) {
        deferred.reject({ status: 500, body: err.toString() });
      } else {
        body = JSON.parse(body);

        if ( body.items && body.items.length > 0 ) {
          deferred.resolve({
            source: 'youtube',
            title: body.items[0].snippet.title,
            imageUrl: body.items[0].snippet.thumbnails.high.url,
            sourceParam: body.items[0].id,
            sourceUrl: 'http://youtube.com/watch?v=' + body.items[0].id
          });
        } else {
          deferred.reject({ status: 404, body: 'Details for that video could not be found.' });
        }
      }
    });

    return deferred.promise;
  };

  getTrackDetails(req.params.url)
  .then(addVideoDurations)
  .then(function(videos) {
    var video = videos[0]; // addVideoDurations returns an array by default
    ResponseHandler.handleSuccess(res, 200, video);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};