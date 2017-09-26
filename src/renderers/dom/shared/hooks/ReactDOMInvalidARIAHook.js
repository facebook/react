/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactDOMInvalidARIAHook
 */

'use strict';

var DOMProperty = require('DOMProperty');
var ReactComponentTreeHook = require('ReactComponentTreeHook');

var warning = require('warning');

var warnedProperties = {};
var rARIA = new RegExp('^(aria)-[' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$');

function validateProperty(tagName, name, debugID) {
  if (warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
    return true;
  }

  if (rARIA.test(name)) {
    var lowerCasedName = name.toLowerCase();
    var standardName = DOMProperty.getPossibleStandardName.hasOwnProperty(
      lowerCasedName,
    )
      ? DOMProperty.getPossibleStandardName[lowerCasedName]
      : null;

    // If this is an aria-* attribute, but is not listed in the known DOM
    // DOM properties, then it is an invalid aria-* attribute.
    if (standardName == null) {
      warnedProperties[name] = true;
      return false;
    }
    // aria-* attributes should be lowercase; suggest the lowercase version.
    if (name !== standardName) {
      warning(
        false,
        'Unknown ARIA attribute %s. Did you mean %s?%s',
        name,
        standardName,
        ReactComponentTreeHook.getStackAddendumByID(debugID),
      );
      warnedProperties[name] = true;
      return true;
    }
  }

  return true;
}

function warnInvalidARIAProps(debugID, element) {
  const invalidProps = [];

  for (var key in element.props) {
    var isValid = validateProperty(element.type, key, debugID);
    if (!isValid) {
      invalidProps.push(key);
    }
  }

  const unknownPropString = invalidProps
    .map(prop => '`' + prop + '`')
    .join(', ');

  if (invalidProps.length === 1) {
    warning(
      false,
      'Invalid aria prop %s on <%s> tag. ' +
        'For details, see https://fb.me/invalid-aria-prop%s',
      unknownPropString,
      element.type,
      ReactComponentTreeHook.getStackAddendumByID(debugID),
    );
  } else if (invalidProps.length > 1) {
    warning(
      false,
      'Invalid aria props %s on <%s> tag. ' +
        'For details, see https://fb.me/invalid-aria-prop%s',
      unknownPropString,
      element.type,
      ReactComponentTreeHook.getStackAddendumByID(debugID),
    );
  }
}

function handleElement(debugID, element) {
  if (element == null || typeof element.type !== 'string') {
    return;
  }
  if (element.type.indexOf('-') >= 0 || element.props.is) {
    return;
  }

  warnInvalidARIAProps(debugID, element);
}

var ReactDOMInvalidARIAHook = {
  onBeforeMountComponent(debugID, element) {
    if (__DEV__) {
      handleElement(debugID, element);
    }
  },
  onBeforeUpdateComponent(debugID, element) {
    if (__DEV__) {
      handleElement(debugID, element);
    }
  },
};

module.exports = ReactDOMInvalidARIAHook;
