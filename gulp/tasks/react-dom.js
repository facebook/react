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
var gutil = require('gulp-util');
var fs = require('fs');
var merge = require('merge2');
var through = require('through2');
var UglifyJS = require('uglify-js');

var packageJson = require('../../package.json');

function build(name, filename) {
  var LICENSE_TEMPLATE =
    fs.readFileSync('./gulp/data/header-template-extended.txt', 'utf8');
  var header = LICENSE_TEMPLATE
    .replace('<%= package %>', name)
    .replace('<%= version %>', packageJson.version);

  var srcFile = `vendor/${filename}.js`;
  var src = fs.readFileSync(srcFile, 'utf8');
  var srcMin = UglifyJS.minify(src, {
    fromString: true,
  }).code;

  var destFile = new gutil.File({
    path: `${filename}.js`,
    contents: new Buffer(header + src),
  });
  var destFileMin = new gutil.File({
    path: `${filename}.min.js`,
    contents: new Buffer(header + srcMin),
  });

  var out = through.obj();
  out.push(destFile);
  out.push(destFileMin);

  return out
    .pipe(gulp.dest('build'));
}

gulp.task('build:react-dom', function() {
  var reactDom = build('ReactDOM', 'react-dom');
  var reactDomServer = build('ReactDOMServer', 'react-dom-server');

  merge([
    reactDom,
    reactDomServer,
  ]);
});
