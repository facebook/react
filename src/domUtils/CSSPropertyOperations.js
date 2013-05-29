/**
 * @providesModule CSSPropertyOperations
 * @typechecks
 */

"use strict";

var dangerousStyleValue = require('dangerousStyleValue');
var escapeTextForBrowser = require('escapeTextForBrowser');
var hyphenate = require('hyphenate');
var memoizeStringOnly = require('memoizeStringOnly');

var processStyleName = memoizeStringOnly(function(styleName) {
  return escapeTextForBrowser(hyphenate(styleName));
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

  /**
   * Sets the value for multiple styles on a node.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */
  setValueForStyles: function(node, styles) {
    var style = node.style;
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      style[styleName] = dangerousStyleValue(styleName, styleValue);
    }
  }

};

module.exports = CSSPropertyOperations;
