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

import emptyFunction from 'fbjs/lib/emptyFunction';
import camelizeStyleName from 'fbjs/lib/camelizeStyleName';
import warning from 'fbjs/lib/warning';
import {getCurrentFiberOwnerName} from 'ReactDebugCurrentFiber';

var warnValidStyle = emptyFunction;

export default warnValidStyle;

if (__DEV__) {
  // 'msTransform' is correct, but the other prefixes should be capitalized
  var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;

  // style values shouldn't contain a semicolon
  var badStyleValueWithSemicolonPattern = /;\s*$/;

  var warnedStyleNames = {};
  var warnedStyleValues = {};
  var warnedForNaNValue = false;
  var warnedForInfinityValue = false;

  var warnHyphenatedStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported style property %s. Did you mean %s?%s',
      name,
      camelizeStyleName(name),
      checkRenderMessage(),
    );
  };

  var warnBadVendoredStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported vendor-prefixed style property %s. Did you mean %s?%s',
      name,
      name.charAt(0).toUpperCase() + name.slice(1),
      checkRenderMessage(),
    );
  };

  var warnStyleValueWithSemicolon = function(name, value) {
    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
      return;
    }

    warnedStyleValues[value] = true;
    warning(
      false,
      "Style property values shouldn't contain a semicolon.%s " +
        'Try "%s: %s" instead.',
      checkRenderMessage(),
      name,
      value.replace(badStyleValueWithSemicolonPattern, ''),
    );
  };

  var warnStyleValueIsNaN = function(name, value) {
    if (warnedForNaNValue) {
      return;
    }

    warnedForNaNValue = true;
    warning(
      false,
      '`NaN` is an invalid value for the `%s` css style property.%s',
      name,
      checkRenderMessage(),
    );
  };

  var warnStyleValueIsInfinity = function(name, value) {
    if (warnedForInfinityValue) {
      return;
    }

    warnedForInfinityValue = true;
    warning(
      false,
      '`Infinity` is an invalid value for the `%s` css style property.%s',
      name,
      checkRenderMessage(),
    );
  };

  var checkRenderMessage = function() {
    var ownerName;
    // Fiber doesn't pass it but uses ReactDebugCurrentFiber to track it.
    // It is only enabled in development and tracks host components too.
    ownerName = getCurrentFiberOwnerName();
    // TODO: also report the stack.
    if (ownerName) {
      return '\n\nCheck the render method of `' + ownerName + '`.';
    }
    return '';
  };

  warnValidStyle = function(name, value, component) {
    if (name.indexOf('-') > -1) {
      warnHyphenatedStyleName(name);
    } else if (badVendoredStyleNamePattern.test(name)) {
      warnBadVendoredStyleName(name);
    } else if (badStyleValueWithSemicolonPattern.test(value)) {
      warnStyleValueWithSemicolon(name, value);
    }

    if (typeof value === 'number') {
      if (isNaN(value)) {
        warnStyleValueIsNaN(name, value);
      } else if (!isFinite(value)) {
        warnStyleValueIsInfinity(name, value);
      }
    }
  };
}
