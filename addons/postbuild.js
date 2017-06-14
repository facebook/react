/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var fs = require('fs');
var path = require('path');

// This lets us import Webpack config without crashing
process.env.NODE_ENV = 'development';

// This script runs from the addon folder
var exportName = require(path.resolve(process.cwd(), './webpack.config')).output
  .library;
var packageName = path.basename(process.cwd());

if (packageName.indexOf('react-addons') !== 0) {
  throw new Error(
    'Only run this script for packages that used to be published as addons.'
  );
}

// Inputs
// DEV:  root["exportName"] = factory(root["React"])
// PROD: e.exportName=t(e.React)
var find = new RegExp(
  '((?!exports)\\b\\w+)(\\["' +
    exportName +
    '"\\]|\\.' +
    exportName +
    ')\\s*=\\s*(\\w+)\\((.*)\\)'
);
// Outputs
// DEV:  (root.React ? (root.React.addons = root.React.addons || {}) : /* throw */).exportName = factory(/* ... */);
// PROD: (e.React ? (e.React.addons = e.React.addons || {}) : /* throw */).exportName = t(/* ... */)
var throwIIFE = [
  '(function(){',
  'throw new Error("' +
    packageName +
    ' could not find the React object. If you are using script tags, make sure that React is being loaded before ' +
    packageName +
    '.")',
  '})()'
].join('');
var replace =
  '($1.React?($1.React.addons=$1.React.addons||{}):' +
  throwIIFE +
  ').' +
  exportName +
  '=$3($4)';

console.log('Tweaking the development UMD...');
var devUMD = fs.readFileSync('./' + packageName + '.js', 'utf8').toString();
devUMD = devUMD.replace(find, replace);
fs.writeFileSync('./' + packageName + '.js', devUMD);

console.log('Tweaking the production UMD...');
var prodUMD = fs
  .readFileSync('./' + packageName + '.min.js', 'utf8')
  .toString();
prodUMD = prodUMD.replace(find, replace);
fs.writeFileSync('./' + packageName + '.min.js', prodUMD);

console.log('Done.');
console.log('Note that you need to manually test the UMD builds.');
