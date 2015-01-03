'use strict';

var gulp   = require('gulp');
var sass   = require('gulp-sass');
var rename = require('gulp-rename');

gulp.task('sass', function() {

  return gulp.src('./marketing/styles/main.scss')
  // The onerror handler prevents Gulp from crashing when you make a mistake in your SASS
  .pipe(sass({
    style: global.isProd ? 'compressed' : 'nested',
    onError: function(e) { console.log(e); }
  }))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('./build/css/'));

});