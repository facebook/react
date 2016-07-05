/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var flatten = require('gulp-flatten');
var del = require('del');

var babelPluginModules = require('fbjs-scripts/babel-6/rewrite-modules');
var extractErrors = require('./scripts/error-codes/gulp-extract-errors');
var devExpressionWithCodes = require('./scripts/error-codes/dev-expression-with-codes');

// Load all of the Gulp plugins.
var plugins = require('gulp-load-plugins')();

function getTask(name) {
  return require(`./gulp/tasks/${name}`)(gulp, plugins);
}

var paths = {
  react: {
    src: [
      'src/**/*.js',
      '!src/**/__benchmarks__/**/*.js',
      '!src/**/__tests__/**/*.js',
      '!src/**/__mocks__/**/*.js',
      '!src/renderers/art/**/*.js',
      '!src/renderers/shared/fiber/**/*.js',
      '!src/shared/vendor/**/*.js',
    ],
    lib: 'build/modules',
  },
};

var moduleMap = Object.assign(
  {'object-assign': 'object-assign'},
  require('fbjs/module-map'),
  {
    deepDiffer: 'react-native/lib/deepDiffer',
    deepFreezeAndThrowOnMutationInDev: 'react-native/lib/deepFreezeAndThrowOnMutationInDev',
    flattenStyle: 'react-native/lib/flattenStyle',
    InitializeJavaScriptAppEngine: 'react-native/lib/InitializeJavaScriptAppEngine',
    RCTEventEmitter: 'react-native/lib/RCTEventEmitter',
    TextInputState: 'react-native/lib/TextInputState',
    UIManager: 'react-native/lib/UIManager',
    UIManagerStatTracker: 'react-native/lib/UIManagerStatTracker',
    View: 'react-native/lib/View',
  }
);

var errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

var babelOpts = {
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
    [babelPluginModules, {map: moduleMap}],
  ],
};

gulp.task('eslint', getTask('eslint'));

gulp.task('lint', ['eslint']);

gulp.task('flow', getTask('flow'));

gulp.task('version-check', getTask('version-check'));

gulp.task('react:clean', function() {
  return del([paths.react.lib]);
});

gulp.task('react:modules', function() {
  return gulp
    .src(paths.react.src)
    .pipe(babel(babelOpts))
    .pipe(flatten())
    .pipe(gulp.dest(paths.react.lib));
});

gulp.task('react:extract-errors', function() {
  return gulp
    .src(paths.react.src)
    .pipe(extractErrors(errorCodeOpts));
});

gulp.task('default', ['react:modules']);
