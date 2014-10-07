/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule flattenStyle
 */

"use strict";

var merge = require('merge');
var mergeInto = require('mergeInto');

/**
 * flattenStyle is a merge function that allows nested arrays with holes.
 *
 * For example,
 *   flattenStyle([ {color: 'red'}, null, [ {fontWeight: 'bold'} ] ])
 *     -> {color: 'red', fontWeight: 'bold'}
 */
function flattenStyle(style) {
  if (!style) {
    return undefined;
  }

  if (!Array.isArray(style)) {
    return merge(style);
  }

  var result = {};
  for (var i = 0; i < style.length; ++i) {
    var computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      mergeInto(result, computedStyle);
    }
  }
  return result;
}

module.exports = flattenStyle;
