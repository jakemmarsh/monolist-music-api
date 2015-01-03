'use strict';

var gulp = require('gulp');

gulp.task('watch', function() {

  // Watch our scripts
  gulp.watch('./marketing/js/**/*.js',[
    'lint',
    'browserify'
  ]);
  // Watch our styles
  gulp.watch('./marketing/styles/**/*.scss', [
    'styles'
  ]);
  // Watch our templates, helpers, and data files
  gulp.watch(['./marketing/pages/**/*.hbs', './marketing/templates/**/*.hbs', './marketing/data/*.json', './marketing/helpers/*.js'], [
    'assemble'
  ]);

});