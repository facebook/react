/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMInvalidARIAHook
 */

'use strict';

var DOMProperty = require('DOMProperty');
var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');

var warning = require('fbjs/lib/warning');

var warnedProperties = {};
var rARIA = new RegExp('^(aria)-[' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$');
var allowed = [
  // Global States and Properties
  'aria-current',
  'aria-details',
  'aria-disabled',
  'aria-hidden',
  'aria-invalid',
  'aria-keyshortcuts',
  'aria-label',
  'aria-roledescription',
  // Widget Attributes
  'aria-autocomplete',
  'aria-checked',
  'aria-expanded',
  'aria-haspopup',
  'aria-level',
  'aria-modal',
  'aria-multiline',
  'aria-multiselectable',
  'aria-orientation',
  'aria-placeholder',
  'aria-pressed',
  'aria-readonly',
  'aria-required',
  'aria-selected',
  'aria-sort',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
  // Live Region Attributes
  'aria-atomic',
  'aria-busy',
  'aria-live',
  'aria-relevant',
  // Drag-and-Drop Attributes
  'aria-dropeffect',
  'aria-grabbed',
  // Relationship Attributes
  'aria-activedescendant',
  'aria-colcount',
  'aria-colindex',
  'aria-colspan',
  'aria-controls',
  'aria-describedby',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
  'aria-posinset',
  'aria-rowcount',
  'aria-rowindex',
  'aria-rowspan',
  'aria-setsize',
];

if (__DEV__) {
  var {ReactComponentTreeHook} = require('ReactGlobalSharedState');
  var {getStackAddendumByID} = ReactComponentTreeHook;
}

function getStackAddendum(debugID) {
  if (debugID != null) {
    // This can only happen on Stack
    return getStackAddendumByID(debugID);
  } else {
    // This can only happen on Fiber
    return ReactDebugCurrentFiber.getCurrentFiberStackAddendum();
  }
}

function validateProperty(tagName, name, debugID) {
  if (warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
    return true;
  }

  warnedProperties[name] = true;

  if (allowed.indexOf(name) >= 0) {
    return true;
  }

  if (rARIA.test(name)) {
    var lowerCasedName = name.toLowerCase();

    // If this is an aria-* attribute, but is not listed in the known DOM
    // DOM properties, then it is an invalid aria-* attribute.
    if (allowed.indexOf(lowerCasedName) >= 0) {
      // aria-* attributes should be lowercase; suggest the lowercase version.
      warning(
        false,
        'Unknown ARIA attribute %s. Did you mean %s?%s',
        name,
        lowerCasedName,
        getStackAddendum(debugID),
      );
      return true;
    }

    return false;
  }

  return true;
}

function warnInvalidARIAProps(type, props, debugID) {
  const invalidProps = [];

  for (var key in props) {
    var isValid = validateProperty(type, key, debugID);
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
      type,
      getStackAddendum(debugID),
    );
  } else if (invalidProps.length > 1) {
    warning(
      false,
      'Invalid aria props %s on <%s> tag. ' +
        'For details, see https://fb.me/invalid-aria-prop%s',
      unknownPropString,
      type,
      getStackAddendum(debugID),
    );
  }
}

function validateProperties(type, props, debugID /* Stack only */) {
  if (type.indexOf('-') >= 0 || props.is) {
    return;
  }
  warnInvalidARIAProps(type, props, debugID);
}

var ReactDOMInvalidARIAHook = {
  // Fiber
  validateProperties,
  // Stack
  onBeforeMountComponent(debugID, element) {
    if (__DEV__ && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  },
  onBeforeUpdateComponent(debugID, element) {
    if (__DEV__ && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  },
};

module.exports = ReactDOMInvalidARIAHook;
