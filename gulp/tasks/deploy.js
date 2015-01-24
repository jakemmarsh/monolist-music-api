'use strict';

var gulp         = require('gulp');
var rename       = require('gulp-rename');
var awspublish   = require('gulp-awspublish');
var config       = require('../../config');

gulp.task('deploy', function() {

  var publisher = awspublish.create({
    key: config.aws.key,
    secret: config.aws.secret,
    bucket: config.aws.bucket
  });
  var oneWeekInSeconds = 60*60*24*7;
  var headers = {
    'Cache-Control': 'max-age=' + oneWeekInSeconds + ', no-transform, public'
  };

  // Assets
  return gulp.src('./build/**/*.{json,js,css,eot,svg,ttf,woff,otf,png,jpg,jpeg}')
  .pipe(rename(function(path) {
    path.dirname = 'marketing/' + path.dirname;
  }))
  .pipe(awspublish.gzip())
  .pipe(publisher.publish(headers))
  .pipe(awspublish.reporter());

});