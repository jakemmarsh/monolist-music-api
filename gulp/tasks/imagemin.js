'use strict';

var gulp     = require('gulp');
var gulpif   = require('gulp-if');
var imagemin = require('gulp-imagemin');

gulp.task('imagemin', function() {

  return gulp.src('./marketing/images/**/*')
  .pipe(gulpif(global.isProd, imagemin()))
  .pipe(gulp.dest('./build/images/'));

});