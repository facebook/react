/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const minimatch = require('minimatch');
const {es5Path} = require('./esPath');

module.exports = function(jsFiles) {
  const es5Files = [];
  for (let index in jsFiles) {
    const file = jsFiles[index];
    for (let pathIndex in es5Path) {
      const pattern = es5Path[pathIndex];
      const isES5 = minimatch(file, pattern);
      if (isES5) {
        es5Files.push(file);
        break;
      }
    }
  }
  const es6Files = jsFiles.filter(function(val) {
    return !es5Files.includes(val);
  });

  return {es5Files, es6Files};
};
