(function() {
  'use strict';

  var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    watch = require('gulp-watch'),
    jshint = require('gulp-jshint'),
    livereload = require('gulp-livereload'),
    _paths = [ "routes/*.js"];


  //register nodemon task
  gulp.task('nodemon', function() {
    nodemon({
      script: 'bin/www',
      env: {
        'NODE_ENV': 'development'
      }
    })
      .on('restart');
  });

  // Rerun the task when a file changes
  gulp.task('watch', function() {
    livereload.listen();
    gulp.src(_paths, {
      read: false
    })
      .pipe(watch({
        emit: 'all'
      }))
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
    watch(_paths, livereload.changed);
  });

  // The default task (called when you run `gulp` from terminal )
  gulp.task('default', ['nodemon', 'watch']);

}());
