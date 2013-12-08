/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule ReactDOMMountImage
 */

"use strict";

var PooledClass = require('PooledClass');

var mixInto = require('mixInto');

/**
 * A class to keep track of strings of markup alongside 
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `ReactDOMMountImage.getPooled()`.
 *
 * @param {?string} nodeName Tag name, '#text', or null if unknown
 * @param {string} markup HTML to be mounted into the DOM
 * @class ReactDOMMountImage
 * @implements PooledClass
 * @internal
 */
function ReactDOMMountImage(nodeName, markup) {
  this.nodeName = nodeName;
  this.markup = markup;
}

mixInto(ReactDOMMountImage, {
  toString: function() {
    // Allow using .join('') on an array of mount images
    return this.markup;
  },

  /**
   * `PooledClass` looks for this.
   */
  destructor: function() {
    this.nodeName = null;
    this.markup = null;
  }
});

PooledClass.addPoolingTo(ReactDOMMountImage, PooledClass.twoArgumentPooler);

module.exports = ReactDOMMountImage;
