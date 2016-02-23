/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CSSPropertyOperations
 */

'use strict';

const CSSProperty = require('CSSProperty');
const ExecutionEnvironment = require('ExecutionEnvironment');
const ReactPerf = require('ReactPerf');

const camelizeStyleName = require('camelizeStyleName');
const dangerousStyleValue = require('dangerousStyleValue');
const hyphenateStyleName = require('hyphenateStyleName');
const memoizeStringOnly = require('memoizeStringOnly');
const warning = require('warning');

const processStyleName = memoizeStringOnly(function(styleName) {
  return hyphenateStyleName(styleName);
});

let hasShorthandPropertyBug = false;
let styleFloatAccessor = 'cssFloat';
if (ExecutionEnvironment.canUseDOM) {
  const tempStyle = document.createElement('div').style;
  try {
    // IE8 throws "Invalid argument." if resetting shorthand style properties.
    tempStyle.font = '';
  } catch (e) {
    hasShorthandPropertyBug = true;
  }
  // IE8 only supports accessing cssFloat (standard) as styleFloat
  if (document.documentElement.style.cssFloat === undefined) {
    styleFloatAccessor = 'styleFloat';
  }
}

if (__DEV__) {
  // 'msTransform' is correct, but the other prefixes should be capitalized
  const badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;

  // style values shouldn't contain a semicolon
  const badStyleValueWithSemicolonPattern = /;\s*$/;

  const warnedStyleNames = {};
  const warnedStyleValues = {};
  let warnedForNaNValue = false;

  const warnHyphenatedStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported style property %s. Did you mean %s?',
      name,
      camelizeStyleName(name)
    );
  };

  const warnBadVendoredStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported vendor-prefixed style property %s. Did you mean %s?',
      name,
      name.charAt(0).toUpperCase() + name.slice(1)
    );
  };

  const warnStyleValueWithSemicolon = function(name, value) {
    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
      return;
    }

    warnedStyleValues[value] = true;
    warning(
      false,
      'Style property values shouldn\'t contain a semicolon. ' +
      'Try "%s: %s" instead.',
      name,
      value.replace(badStyleValueWithSemicolonPattern, '')
    );
  };

  const warnStyleValueIsNaN = function(name, value) {
    if (warnedForNaNValue) {
      return;
    }

    warnedForNaNValue = true;
    warning(
      false,
      '`NaN` is an invalid value for the `%s` css style property',
      name
    );
  };

  /**
   * @param {string} name
   * @param {*} value
   */
  var warnValidStyle = function(name, value) {
    if (name.indexOf('-') > -1) {
      warnHyphenatedStyleName(name);
    } else if (badVendoredStyleNamePattern.test(name)) {
      warnBadVendoredStyleName(name);
    } else if (badStyleValueWithSemicolonPattern.test(value)) {
      warnStyleValueWithSemicolon(name, value);
    }

    if (typeof value === 'number' && isNaN(value)) {
      warnStyleValueIsNaN(name, value);
    }
  };
}

/**
 * Operations for dealing with CSS properties.
 */
const CSSPropertyOperations = {

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
   * @param {ReactDOMComponent} component
   * @return {?string}
   */
  createMarkupForStyles: function(styles, component) {
    let serialized = '';
    for (const styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      const styleValue = styles[styleName];
      if (__DEV__) {
        warnValidStyle(styleName, styleValue);
      }
      if (styleValue != null) {
        serialized += processStyleName(styleName) + ':';
        serialized +=
          dangerousStyleValue(styleName, styleValue, component) + ';';
      }
    }
    return serialized || null;
  },

  /**
   * Sets the value for multiple styles on a node.  If a value is specified as
   * '' (empty string), the corresponding style property will be unset.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */
  setValueForStyles: function(node, styles, component) {
    const style = node.style;
    for (let styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      if (__DEV__) {
        warnValidStyle(styleName, styles[styleName]);
      }
      const styleValue = dangerousStyleValue(
        styleName,
        styles[styleName],
        component
      );
      if (styleName === 'float') {
        styleName = styleFloatAccessor;
      }
      if (styleValue) {
        style[styleName] = styleValue;
      } else {
        const expansion =
          hasShorthandPropertyBug &&
          CSSProperty.shorthandPropertyExpansions[styleName];
        if (expansion) {
          // Shorthand property that IE8 won't like unsetting, so unset each
          // component to placate it
          for (const individualStyleName in expansion) {
            style[individualStyleName] = '';
          }
        } else {
          style[styleName] = '';
        }
      }
    }
  },

};

ReactPerf.measureMethods(CSSPropertyOperations, 'CSSPropertyOperations', {
  setValueForStyles: 'setValueForStyles',
});

module.exports = CSSPropertyOperations;
