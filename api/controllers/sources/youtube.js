'use strict';

var when     = require('when');
var qs       = require('querystring');
var request  = require('request');
var _        = require('lodash');
// var ytdl     = require('ytdl-core');
var fallback = require('fallback');

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

exports.search = function(query, limit, ip) {

  var mainDeferred = when.defer();

  var addVideoDurations = function(videos) {
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
  };

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

// exports.stream = function(req, res) {

//   var attemptRequest = function(videoInfo, cb) {
//     request(videoInfo.url)
//     .on('error', function(err) {
//       cb(err);
//     })
//     .on('response', function(resp) {
//       cb(null, resp);
//     });
//   };

//   var handleResult = function(err, result, item, array) {
//     if ( err ) {
//       res.status(500).json({ status: 500, message: err });
//     } else {
//       result.pipe(res);
//     }
//   };

//   var streamTrack = function(videoId) {
//     var requestUrl = 'http://youtube.com/watch?v=' + videoId;
//     var webmRegex = new RegExp('audio/webm', 'i');
//     var mp4Regex = new RegExp('audio/mp4', 'i');
//     var matches = null;

//     ytdl.getInfo(requestUrl, { downloadURL: true }, function(err, info) {
//       if ( err ) {
//         res.status(500).json({ status: 500, message: err.body || err });
//       } else {
//         if ( info.formats ) {
//           matches = _.filter(info.formats, function(format) {
//             return webmRegex.test(format.type) || mp4Regex.test(format.type);
//           });

//           if ( matches && matches.length ) {
//             fallback(matches, attemptRequest, handleResult);
//           } else {
//             res.status(500).json({ status: 500, message: 'No suitable audio file could be found for that video.' });
//           }
//         } else {
//           res.status(500).json({ status: 500, message: 'No available formats could be found for that video.' });
//         }
//       }
//     });
//   };

//   streamTrack(req.params.videoId);

// };