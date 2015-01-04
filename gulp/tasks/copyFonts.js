'use strict';

var gulp = require('gulp');

gulp.task('copyFonts', function() {

  gulp.src('./marketingfonts/**/*').pipe(gulp.dest('./build/fonts/'));

});