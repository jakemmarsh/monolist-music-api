'use strict';

var gulp     = require('gulp');
var assemble = require('gulp-assemble');
var gulpif   = require('gulp-if');
var htmlmin  = require('gulp-htmlmin');

gulp.task('assemble', function() {

  // Run assemble on static pages
  return gulp.src('./marketing/pages/**/*.hbs')
  .pipe(assemble({
    data:      './marketing/data/**/*.json',
    helpers:   './marketing/helpers/**/*.js',
    partials:  './marketing/templates/partials/**/*.hbs',
    layoutdir: './marketing/templates/layouts/'
  }))
  .pipe(gulpif(global.isProd, htmlmin()))
  .pipe(gulp.dest('./build/'));

});