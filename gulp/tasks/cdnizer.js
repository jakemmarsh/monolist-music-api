'use strict';

var gulp    = require('gulp');
var cdnizer = require('gulp-cdnizer');

gulp.task('cdnizer', function() {

  var cdnBase = 'https://assets.monolist.co/marketing/';

  gulp.src('./build/css/**/*.css')
  .pipe(cdnizer({
      defaultCDNBase: cdnBase,
      relativeRoot: 'css',
      files: ['**/*.{gif,png,jpg,jpeg,eot,svg,ttf,woff}']
  }))
  .pipe(gulp.dest('./build/css/'));

  return gulp.src('./build/index.html')
  .pipe(cdnizer({
    defaultCDNBase: cdnBase,
    files: ['**/*.{js,css}']
  }))
  .pipe(gulp.dest('./build/'));

});