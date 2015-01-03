'use strict';

var gulp = require('gulp');

gulp.task('watch', function() {

  gulp.watch('./marketing/styles/**/*.scss', ['styles']);
  gulp.watch(['./marketing/pages/**/*.hbs', './marketing/templates/**/*.hbs', './marketing/data/*.json', './marketing/helpers/*.js'], [
    'assemble'
  ]);

});