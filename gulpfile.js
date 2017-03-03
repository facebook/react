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
var merge = require('merge-stream');

var babelPluginModules = require('fbjs-scripts/babel-6/rewrite-modules');
var stripProvidesModule = require('fbjs-scripts/gulp/strip-provides-module');
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
      'src/umd/ReactUMDEntry.js',
      'src/umd/ReactWithAddonsUMDEntry.js',
      'src/umd/shims/**/*.js',

      'src/isomorphic/**/*.js',
      'src/addons/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
      '!src/**/__benchmarks__/**/*.js',
      '!src/**/__tests__/**/*.js',
      '!src/**/__mocks__/**/*.js',
    ],
    lib: 'build/node_modules/react/lib',
  },
  reactDOM: {
    src: [
      'src/umd/ReactDOMUMDEntry.js',
      'src/umd/ReactDOMServerUMDEntry.js',

      'src/renderers/dom/**/*.js',
      'src/renderers/shared/**/*.js',
      'src/test/**/*.js', // ReactTestUtils is currently very coupled to DOM.

      'src/ReactVersion.js',
      'src/shared/**/*.js',
      '!src/**/__benchmarks__/**/*.js',
      '!src/**/__tests__/**/*.js',
      '!src/**/__mocks__/**/*.js',
    ],
    lib: 'build/node_modules/react-dom/lib',
  },
  reactNative: {
    src: [
      'src/renderers/native/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
      '!src/**/__benchmarks__/**/*.js',
      '!src/**/__tests__/**/*.js',
      '!src/**/__mocks__/**/*.js',
    ],
    lib: 'build/node_modules/react-native/lib',
  },
  reactTestRenderer: {
    src: [
      'src/renderers/testing/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
      '!src/**/__benchmarks__/**/*.js',
      '!src/**/__tests__/**/*.js',
      '!src/**/__mocks__/**/*.js',
    ],
    lib: 'build/node_modules/react-test-renderer/lib',
  },
  reactNoopRenderer: {
    src: [
      'src/renderers/noop/**/*.js',
      'src/renderers/shared/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
      '!src/**/__benchmarks__/**/*.js',
      '!src/**/__tests__/**/*.js',
      '!src/**/__mocks__/**/*.js',
    ],
    lib: 'build/node_modules/react-noop-renderer/lib',
  },
};

var moduleMapBase = {'object-assign': 'object-assign'};

var fbjsModules = require('fbjs/module-map');
for (var key in fbjsModules) {
  var path = fbjsModules[key];
  moduleMapBase[path] = path;
}

var moduleMapReact = Object.assign(
  {
    // Addons needs to reach into DOM internals
    'react-dom': 'react-dom',
    'react-dom/lib/ReactInstanceMap': 'react-dom/lib/ReactInstanceMap',
    'react-dom/lib/ReactTestUtils': 'react-dom/lib/ReactTestUtils',
    'react-dom/lib/ReactPerf': 'react-dom/lib/ReactPerf',
    'react-dom/lib/getVendorPrefixedEventName': 'react-dom/lib/getVendorPrefixedEventName',

    // Alias
    'react': './React',
    // Shared state
    'react/lib/ReactCurrentOwner': './ReactCurrentOwner',
    'react/lib/checkPropTypes': './checkPropTypes',
    'react/lib/ReactComponentTreeHook': './ReactComponentTreeHook',
    'react/lib/ReactDebugCurrentFrame': './ReactDebugCurrentFrame',
  },
  moduleMapBase
);

var rendererSharedState = {
  // Alias
  'react': 'react/lib/React',
  // Shared state
  'react/lib/ReactCurrentOwner': 'react/lib/ReactCurrentOwner',
  'react/lib/checkPropTypes': 'react/lib/checkPropTypes',
  'react/lib/ReactComponentTreeHook': 'react/lib/ReactComponentTreeHook',
  'react/lib/ReactDebugCurrentFrame': 'react/lib/ReactDebugCurrentFrame',
};

var moduleMapReactDOM = Object.assign(
  {
    'react-dom': './ReactDOM',
    'react-dom/lib/ReactInstanceMap': './ReactInstanceMap',
    'react-dom/lib/ReactTestUtils': './ReactTestUtils',
    'react-dom/lib/ReactPerf': './ReactPerf',
    'react-dom/lib/getVendorPrefixedEventName': './getVendorPrefixedEventName',
  },
  rendererSharedState,
  moduleMapBase
);

var moduleMapReactNative = Object.assign(
  {
    // React Native Hooks
    deepDiffer: 'react-native/lib/deepDiffer',
    deepFreezeAndThrowOnMutationInDev: 'react-native/lib/deepFreezeAndThrowOnMutationInDev',
    flattenStyle: 'react-native/lib/flattenStyle',
    InitializeCore: 'react-native/lib/InitializeCore',
    RCTEventEmitter: 'react-native/lib/RCTEventEmitter',
    TextInputState: 'react-native/lib/TextInputState',
    UIManager: 'react-native/lib/UIManager',
    UIManagerStatTracker: 'react-native/lib/UIManagerStatTracker',
    View: 'react-native/lib/View',
  },
  rendererSharedState,
  moduleMapBase
);

var moduleMapReactTestRenderer = Object.assign(
  {},
  rendererSharedState,
  moduleMapBase
);

var moduleMapReactNoopRenderer = Object.assign(
  {},
  rendererSharedState,
  moduleMapBase
);


var errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

var babelOptsReact = {
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
    [babelPluginModules, {map: moduleMapReact}],
  ],
};

var babelOptsReactDOM = {
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
    [babelPluginModules, {map: moduleMapReactDOM}],
  ],
};

var babelOptsReactNative = {
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
    [babelPluginModules, {map: moduleMapReactNative}],
  ],
};

var babelOptsReactTestRenderer = {
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
    [babelPluginModules, {map: moduleMapReactTestRenderer}],
  ],
};

var babelOptsReactNoopRenderer = {
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
    [babelPluginModules, {map: moduleMapReactNoopRenderer}],
  ],
};

gulp.task('eslint', getTask('eslint'));

gulp.task('lint', ['eslint']);

gulp.task('flow', getTask('flow'));

gulp.task('version-check', getTask('version-check'));

gulp.task('react:clean', function() {
  return del([
    paths.react.lib,
    paths.reactDOM.lib,
    paths.reactNative.lib,
    paths.reactTestRenderer.lib,
    paths.reactNoopRenderer.lib,
  ]);
});

gulp.task('react:modules', function() {
  return merge(
    gulp
      .src(paths.react.src)
      .pipe(babel(babelOptsReact))
      .pipe(stripProvidesModule())
      .pipe(flatten())
      .pipe(gulp.dest(paths.react.lib)),

    gulp
      .src(paths.reactDOM.src)
      .pipe(babel(babelOptsReactDOM))
      .pipe(stripProvidesModule())
      .pipe(flatten())
      .pipe(gulp.dest(paths.reactDOM.lib)),

    gulp
      .src(paths.reactNative.src)
      .pipe(babel(babelOptsReactNative))
      .pipe(stripProvidesModule())
      .pipe(flatten())
      .pipe(gulp.dest(paths.reactNative.lib)),

    gulp
      .src(paths.reactTestRenderer.src)
      .pipe(stripProvidesModule())
      .pipe(babel(babelOptsReactTestRenderer))
      .pipe(flatten())
      .pipe(gulp.dest(paths.reactTestRenderer.lib)),

    gulp
      .src(paths.reactNoopRenderer.src)
      .pipe(stripProvidesModule())
      .pipe(babel(babelOptsReactNoopRenderer))
      .pipe(flatten())
      .pipe(gulp.dest(paths.reactNoopRenderer.lib))
  );
});

gulp.task('react:extract-errors', function() {
  return gulp.src([].concat(
    paths.react.src,
    paths.reactDOM.src,
    paths.reactNative.src,
    paths.reactTestRenderer.src
  )).pipe(extractErrors(errorCodeOpts));
});

gulp.task('default', ['react:modules']);
