'use strict';

var gulp         = require('gulp');
var gulpif       = require('gulp-if');
var gutil        = require('gulp-util');
var source       = require('vinyl-source-stream');
var streamify    = require('gulp-streamify');
var rename       = require('gulp-rename');
var watchify     = require('watchify');
var browserify   = require('browserify');
var uglify       = require('gulp-uglify');
var handleErrors = require('../util/handle-errors');

// Based on: http://blog.avisi.nl/2014/04/25/how-to-keep-a-fast-build-with-browserify-and-reactjs/
function buildScript(file, watch) {

  var bundler = browserify({
    entries: ['./marketing/js/' + file],
    cache: {},
    packageCache: {},
    fullPaths: true
  });

  if ( watch ) {
    bundler = watchify(bundler);
    bundler.on('update', function() {
      rebundle();
      gutil.log('Rebundle...');
    });
  }

  function rebundle() {
    var stream = bundler.bundle();
    return stream.on('error', handleErrors)
    .pipe(source(file))
    .pipe(gulpif(global.isProd, streamify(uglify({
      compress: { drop_console: true }
    }))))
    .pipe(streamify(rename({
      basename: 'main',
      suffix: '.min'
    })))
    .pipe(gulp.dest('./build/js'));
  }

  return rebundle();

}

gulp.task('browserify', function() {

  // Only run watchify if NOT production
  return buildScript('main.js', !global.isProd);

});