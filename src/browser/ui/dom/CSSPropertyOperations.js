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
 * @providesModule CSSPropertyOperations
 * @typechecks static-only
 */

"use strict";

var CSSProperty = require('CSSProperty');

var dangerousStyleValue = require('dangerousStyleValue');
var hyphenateStyleName = require('hyphenateStyleName');
var memoizeStringOnly = require('memoizeStringOnly');

var processStyleName = memoizeStringOnly(function(styleName) {
  return hyphenateStyleName(styleName);
});

/**
 * Operations for dealing with CSS properties.
 */
var CSSPropertyOperations = {

  /**
   * Serializes a mapping of style properties for use as inline styles:
   *
   *   > createMarkupForStyles({width: '200px', height: 0})
   *   "width:200px;height:0;"
   *
   * Undefined values are ignored so that declarative programming is easier.
   * The result should be HTML-escaped before insertion into the DOM.
   *
   * @param {object} styles
   * @return {?string}
   */
  createMarkupForStyles: function(styles) {
    var serialized = '';
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      if (styleValue != null) {
        serialized += processStyleName(styleName) + ':';
        serialized += dangerousStyleValue(styleName, styleValue) + ';';
      }
    }
    return serialized || null;
  },

  deleteStyle: function(node, styleName) {
    var style = node.style;
    var expansion = CSSProperty.shorthandPropertyExpansions[styleName];
    if (expansion) {
      // Shorthand property that IE8 won't like unsetting, so unset each
      // component to placate it
      for (var individualStyleName in expansion) {
        style[individualStyleName] = '';
      }
    } else {
      style[styleName] = '';
    }
  },

  setValueForStyle: function(node, value, styleName) {
    node.style[styleName] = dangerousStyleValue(styleName, value);
  }

};

module.exports = CSSPropertyOperations;
