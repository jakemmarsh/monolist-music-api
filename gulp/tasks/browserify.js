'use strict';

var gulp       = require('gulp');
var browserify = require('gulp-browserify');
var gulpif     = require('gulp-if');
var uglify     = require('gulp-uglify');
var rename     = require('gulp-rename');

gulp.task('browserify', function() {

  return gulp.src('./marketing/js/main.js')
  .pipe(browserify({
    insertGlobals: true,
    debug: true
  }))
  .pipe(gulpif(global.isProd, uglify()))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('./build/js'));

});