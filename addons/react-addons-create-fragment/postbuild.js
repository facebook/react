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

// Inputs
// DEV:  root["createFragment"] = factory(root["React"])
// PROD: e.createFragment=t(e.React)
var find = /(\w+)(\["createFragment"\]|\.createFragment)\s*=\s*(\w+)\(\w+(\["React"\]|\.React)\)/;
// Outputs
// DEV:  (root.React ? (root.React.addons = root.React.addons || {}) : root).createFragment = factory(root.React);
// PROD: (e.React ? (e.React.addons = e.React.addons || {}) : e).createFragment = t(e.React)
var replace =
  '($1.React?($1.React.addons=$1.React.addons||{}):$1).createFragment=$3($1.React)';

console.log('Tweaking the development UMD...');
var devUMD = fs
  .readFileSync('./react-addons-create-fragment.js', 'utf8')
  .toString();
devUMD = devUMD.replace(find, replace);
fs.writeFileSync('./react-addons-create-fragment.js', devUMD);

console.log('Tweaking the production UMD...');
var prodUMD = fs
  .readFileSync('./react-addons-create-fragment.min.js', 'utf8')
  .toString();
prodUMD = prodUMD.replace(find, replace);
fs.writeFileSync('./react-addons-create-fragment.min.js', prodUMD);

console.log('Done.');
