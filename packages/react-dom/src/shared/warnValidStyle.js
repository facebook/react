/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import emptyFunction from 'fbjs/lib/emptyFunction';
import warning from 'fbjs/lib/warning';

let warnValidStyle = emptyFunction;

if (__DEV__) {
  // 'msTransform' is correct, but the other prefixes should be capitalized
  const badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;
  const msPattern = /^-ms-/;
  const hyphenPattern = /-(.)/g;

  // style values shouldn't contain a semicolon
  const badStyleValueWithSemicolonPattern = /;\s*$/;

  const warnedStyleNames = {};
  const warnedStyleValues = {};
  let warnedForNaNValue = false;
  let warnedForInfinityValue = false;

  const camelize = function(string) {
    return string.replace(hyphenPattern, function(_, character) {
      return character.toUpperCase();
    });
  };

  const warnHyphenatedStyleName = function(name, getStack) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported style property %s. Did you mean %s?%s',
      name,
      // As Andi Smith suggests
      // (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
      // is converted to lowercase `ms`.
      camelize(name.replace(msPattern, 'ms-')),
      getStack(),
    );
  };

  const warnBadVendoredStyleName = function(name, getStack) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    warning(
      false,
      'Unsupported vendor-prefixed style property %s. Did you mean %s?%s',
      name,
      name.charAt(0).toUpperCase() + name.slice(1),
      getStack(),
    );
  };

  const warnStyleValueWithSemicolon = function(name, value, getStack) {
    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
      return;
    }

    warnedStyleValues[value] = true;
    warning(
      false,
      "Style property values shouldn't contain a semicolon. " +
        'Try "%s: %s" instead.%s',
      name,
      value.replace(badStyleValueWithSemicolonPattern, ''),
      getStack(),
    );
  };

  const warnStyleValueIsNaN = function(name, value, getStack) {
    if (warnedForNaNValue) {
      return;
    }

    warnedForNaNValue = true;
    warning(
      false,
      '`NaN` is an invalid value for the `%s` css style property.%s',
      name,
      getStack(),
    );
  };

  const warnStyleValueIsInfinity = function(name, value, getStack) {
    if (warnedForInfinityValue) {
      return;
    }

    warnedForInfinityValue = true;
    warning(
      false,
      '`Infinity` is an invalid value for the `%s` css style property.%s',
      name,
      getStack(),
    );
  };

  warnValidStyle = function(name, value, getStack) {
    if (name.indexOf('-') > -1) {
      warnHyphenatedStyleName(name, getStack);
    } else if (badVendoredStyleNamePattern.test(name)) {
      warnBadVendoredStyleName(name, getStack);
    } else if (badStyleValueWithSemicolonPattern.test(value)) {
      warnStyleValueWithSemicolon(name, value, getStack);
    }

    if (typeof value === 'number') {
      if (isNaN(value)) {
        warnStyleValueIsNaN(name, value, getStack);
      } else if (!isFinite(value)) {
        warnStyleValueIsInfinity(name, value, getStack);
      }
    }
  };
}

export default warnValidStyle;
