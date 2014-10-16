/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule merge
 */

"use strict";

var assign = require('Object.assign');

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
var merge = function(one, two) {
  return assign({}, one, two);
};

module.exports = merge;

// deprecation notice
console.warn(
  'react/lib/merge has been deprecated and will be removed in the ' +
  'next version of React. All uses can be replaced with ' +
  'Object.assign({}, a, b) or _.extend({}, a, b).'
);
