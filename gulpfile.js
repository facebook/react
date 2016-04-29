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

var paths = {
  react: {
    src: [
      'src/**/*.js',
      '!src/**/__benchmarks__/**/*.js',
      '!src/**/__tests__/**/*.js',
      '!src/**/__mocks__/**/*.js',
      '!src/shared/vendor/**/*.js',
    ],
    lib: 'build/modules',
  },
};

var fbjsModuleMap = require('fbjs/module-map');
var moduleMap = {};
for (var key in fbjsModuleMap) {
  moduleMap[key] = fbjsModuleMap[key];
}
var whiteListNames = [
  'deepDiffer',
  'deepFreezeAndThrowOnMutationInDev',
  'flattenStyle',
  'InitializeJavaScriptAppEngine',
  'JSTimersExecution',
  'RCTEventEmitter',
  'RCTLog',
  'TextInputState',
  'UIManager',
  'View',
];

whiteListNames.forEach(function(name) {
  moduleMap[name] = name;
});

moduleMap['object-assign'] = 'object-assign';

var babelOpts = {
  plugins: [
    [babelPluginModules, { map: moduleMap }],
  ],
};

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

gulp.task('default', ['react:modules']);
