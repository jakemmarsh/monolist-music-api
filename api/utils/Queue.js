'use strict';

var when                = require('when');
var kue                 = require('kue');
var _                   = require('lodash');
var ActivityManager     = require('./ActivityManager');
var NotificationManager = require('./NotificationManager');
var trackRecognition    = require('./trackRecognition');
var jobQueue            = kue.createQueue({
                            redis: {
                              port: process.env.REDIS_PORT,
                              host: process.env.REDIS_HOST,
                              auth: process.env.REDIS_AUTH
                            }
                          });

/* ====================================================== */

exports.jobQueue = jobQueue;

/* ====================================================== */

function shutdownQueue() {
  jobQueue.shutdown(5000, function() {
    process.exit(0);
  });
}

function clearAllJobs() {
  kue.Job.rangeByState('inactive', 0, -1, 'asc', function(err, inactiveJobs) {
    kue.Job.rangeByState('active', 0, -1, 'asc', function(err, activeJobs) {
      _.each(inactiveJobs, function(job) { job.remove(); });
      _.each(activeJobs, function(job) { job.remove(); });
      process.exit(0);
    });
  });
}

if ( process.env.NODE_ENV === 'development' ) {
  process.on('SIGINT', clearAllJobs);
} else {
  process.once('SIGINT', shutdownQueue);
}

/* ====================================================== */

jobQueue.process('activity', function(job, done) {
  ActivityManager.create(job.data).then(done).catch(done);
});

/* ====================================================== */

jobQueue.process('trackIdentification', function(job, done) {
  trackRecognition.processTrack(job.data).then(done).catch(done);
});

/* ====================================================== */

jobQueue.process('notification', function(job, done) {
  NotificationManager.create(job.data).then(done).catch(done);
});

/* ====================================================== */

exports.activity = function(activity) {

  var deferred = when.defer();

  // Can be assumed activity is sanitized since coming from ActivityManager
  jobQueue.create('activity', activity)
  .removeOnComplete(true)
  .save(function(err){
    if( err ) {
      deferred.reject(err);
    } else {
      deferred.resolve(null, activity);
    }
  });

  return deferred.promise;

};

/* ====================================================== */

exports.trackIdentification = function(track) {

  return new Promise((resolve, reject) => {
    jobQueue.create('trackIdentification', track)
    .removeOnComplete(true)
    .save((err) => {
      if ( err ) {
        reject(err);
      } else {
        resolve(track);
      }
    });
  });

};

/* ====================================================== */

exports.notifications = function(notifications) {

  var mainDeferred = when.defer();

  var queueNotification = function(notification) {
    var deferred = when.defer();

    jobQueue.create('notification', notification)
    .removeOnComplete(true)
    .save(function(err){
      if( err ) {
        deferred.reject(err);
      } else {
        deferred.resolve(notification);
      }
    });

    return deferred.promise;
  };
  var promises = _.map(notifications, queueNotification);

  when.join(promises)
  .then(mainDeferred.resolve.bind(null, null, notifications))
  .catch(mainDeferred.reject);

  return mainDeferred.promise;

};
