/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule warnValidStyle
 */

'use strict';

var emptyFunction = require('fbjs/lib/emptyFunction');

var warnValidStyle = emptyFunction;

if (__DEV__) {
  var camelizeStyleName = require('fbjs/lib/camelizeStyleName');
  var getComponentName = require('getComponentName');
  var warning = require('fbjs/lib/warning');
  var {getCurrentFiberOwnerName} = require('ReactDebugCurrentFiber');

  // 'msTransform' is correct, but the other prefixes should be capitalized
  var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;

  // style values shouldn't contain a semicolon
  var badStyleValueWithSemicolonPattern = /;\s*$/;

  var warnedStyleNames = {};
  var warnedStyleValues = {};
  var warnedForNaNValue = false;
  var warnedForInfinityValue = false;

  var warnHyphenatedStyleName = function(name, owner) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported style property %s. Did you mean %s?%s',
      name,
      camelizeStyleName(name),
      checkRenderMessage(owner),
    );
  };

  var warnBadVendoredStyleName = function(name, owner) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported vendor-prefixed style property %s. Did you mean %s?%s',
      name,
      name.charAt(0).toUpperCase() + name.slice(1),
      checkRenderMessage(owner),
    );
  };

  var warnStyleValueWithSemicolon = function(name, value, owner) {
    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
      return;
    }

    warnedStyleValues[value] = true;
    warning(
      false,
      "Style property values shouldn't contain a semicolon.%s " +
        'Try "%s: %s" instead.',
      checkRenderMessage(owner),
      name,
      value.replace(badStyleValueWithSemicolonPattern, ''),
    );
  };

  var warnStyleValueIsNaN = function(name, value, owner) {
    if (warnedForNaNValue) {
      return;
    }

    warnedForNaNValue = true;
    warning(
      false,
      '`NaN` is an invalid value for the `%s` css style property.%s',
      name,
      checkRenderMessage(owner),
    );
  };

  var warnStyleValueIsInfinity = function(name, value, owner) {
    if (warnedForInfinityValue) {
      return;
    }

    warnedForInfinityValue = true;
    warning(
      false,
      '`Infinity` is an invalid value for the `%s` css style property.%s',
      name,
      checkRenderMessage(owner),
    );
  };

  var checkRenderMessage = function(owner) {
    var ownerName;
    if (owner != null) {
      // Stack passes the owner manually all the way to CSSPropertyOperations.
      ownerName = getComponentName(owner);
    } else {
      // Fiber doesn't pass it but uses ReactDebugCurrentFiber to track it.
      // It is only enabled in development and tracks host components too.
      ownerName = getCurrentFiberOwnerName();
      // TODO: also report the stack.
    }
    if (ownerName) {
      return '\n\nCheck the render method of `' + ownerName + '`.';
    }
    return '';
  };

  warnValidStyle = function(name, value, component) {
    var owner;
    if (component) {
      // TODO: this only works with Stack. Seems like we need to add unit tests?
      owner = component._currentElement._owner;
    }
    if (name.indexOf('-') > -1) {
      warnHyphenatedStyleName(name, owner);
    } else if (badVendoredStyleNamePattern.test(name)) {
      warnBadVendoredStyleName(name, owner);
    } else if (badStyleValueWithSemicolonPattern.test(value)) {
      warnStyleValueWithSemicolon(name, value, owner);
    }

    if (typeof value === 'number') {
      if (isNaN(value)) {
        warnStyleValueIsNaN(name, value, owner);
      } else if (!isFinite(value)) {
        warnStyleValueIsInfinity(name, value, owner);
      }
    }
  };
}

module.exports = warnValidStyle;
