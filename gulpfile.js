'use strict';

// THIS CHECK SHOULD BE THE FIRST THING IN THIS FILE
// This is to ensure that we catch env issues before we error while requiring other dependencies.
require('./tools/check-environment')(
    {requiredNpmVersion: '>=3.5.3 <4.0.0', requiredNodeVersion: '>=5.4.1 <6.0.0'});


const gulp = require('gulp');
const path = require('path');

const srcsToFmt = ['tools/**/*.ts', 'modules/@angular/**/*.ts'];

gulp.task('format:enforce', () => {
  const format = require('gulp-clang-format');
  const clangFormat = require('clang-format');
  return gulp.src(srcsToFmt).pipe(
    format.checkFormat('file', clangFormat, {verbose: true, fail: true}));
});

gulp.task('format', () => {
  const format = require('gulp-clang-format');
  const clangFormat = require('clang-format');
  return gulp.src(srcsToFmt, { base: '.' }).pipe(
    format.format('file', clangFormat)).pipe(gulp.dest('.'));
});

gulp.task('lint', ['format:enforce', 'tools:build'], () => {
  const tslint = require('gulp-tslint');
  // Built-in rules are at
  // https://github.com/palantir/tslint#supported-rules
  const tslintConfig = require('./tslint.json');
  return gulp.src(['modules/@angular/**/*.ts', '!modules/@angular/*/test/**'])
    .pipe(tslint({
      tslint: require('tslint').default,
      configuration: tslintConfig,
      rulesDirectory: 'dist/tools/tslint'
    }))
    .pipe(tslint.report('prose', {emitError: true}));
});

gulp.task('tools:build', (done) => { tsc('tools/', done); });


gulp.task('serve', () => {
  let connect = require('gulp-connect');
  let cors = require('cors');

  connect.server({
    root: `${__dirname}/dist`,
    port: 8000,
    livereload: false,
    open: false,
    middleware: (connect, opt) => [cors()]
  });
});


function tsc(projectPath, done) {
  let child_process = require('child_process');

  child_process
      .spawn(
          `${__dirname}/node_modules/.bin/tsc`, ['-p', path.join(__dirname, projectPath)],
          {stdio: 'inherit'})
      .on('close', (errorCode) => done(errorCode));
}
