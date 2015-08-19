'use strict';

var when                = require('when');
var kue                 = require('kue');
var _                   = require('lodash');
var ActivityManager     = require('./ActivityManager');
var NotificationManager = require('./NotificationManager');
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

process.once('exit', shutdownQueue);
process.once('SIGINT', shutdownQueue);

/* ====================================================== */

function clearAllJobs() {
  kue.Job.rangeByState('complete', 0, -1, 'asc', function(err, selectedJobs) {
    _.each(selectedJobs, function(job) {
      job.remove();
    });
  });
}

/* ====================================================== */

jobQueue.process('activity', function(job, done) {
  console.log('now processing activity:', job.data);
  ActivityManager.create(job.data).then(done);
});

/* ====================================================== */

jobQueue.process('notification', function(job, done) {
  console.log('now processing notification:', job.data);
  NotificationManager.create(job.data).then(done);
});

/* ====================================================== */

exports.activity = function(activity) {

  var deferred = when.defer();

  console.log('create activity job for:', activity);

  // Can be assumed activity is sanitized since coming from ActivityManager
  var job = jobQueue.create('activity', activity)
  .removeOnComplete(true)
  .save(function(err){
    if( err ) {
      console.log('Error saving activity job:', err);
      deferred.reject(err);
    } else {
      console.log('activity job saved');
      deferred.resolve(null, activity);
    }
  });

  return deferred.promise;

};

  /* ====================================================== */

exports.notifications = function(notifications) {

  console.log('create notification jobs for:', notifications);

  var mainDeferred = when.defer();

  var queueNotification = function(notification) {
    var deferred = when.defer();

    var job = jobQueue.create('notification', notification)
    .removeOnComplete(true)
    .save(function(err){
      if( err ) {
        console.log('Error saving notification job:', err);
        deferred.reject(err);
      } else {
        console.log('notification job saved');
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
