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
 * @providesModule CustomPropertyOperations
 * @typechecks static-only
 */

"use strict";

// TODO: deprecate the old data-* way of setting data properties.
var hyphenate = require('hyphenate');
var memoizeStringOnly = require('memoizeStringOnly');

var hyphenateKey = memoizeStringOnly(function(key) {
  return hyphenate(key);
});

/**
 * Operations for dealing with data-* properties.
 */
var CustomPropertyOperations = {
  /**
   * Spread the hyphenated keys of `dataSet` onto the props
   *
   * props: {a: 'b'}. object: {fooBar: 'c'}
   * props then become {a: 'b', 'data-foo-bar': 'c'}
   *
   * @param {object} props The props to mutate
   * @param {object} object `dataSet`
   */
  spreadDataSetOntoPropsByMutating: function(props, object) {
    for (var key in object) {
      if (!object.hasOwnProperty(key)) {
        continue;
      }
      props[hyphenateKey('data-' + key)] = object[key];
    }
  },

  spreadAriaSetOntoPropsByMutating: function(props, object) {
    for (var key in object) {
      if (!object.hasOwnProperty(key)) {
        continue;
      }
      props[hyphenateKey('aria-' + key)] = object[key];
    }
  }
};

module.exports = CustomPropertyOperations;
