/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMUnknownPropertyHook
 */

'use strict';

var DOMProperty = require('DOMProperty');
var EventPluginRegistry = require('EventPluginRegistry');
var isCustomComponent = require('isCustomComponent');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var {
    ReactComponentTreeHook,
    ReactDebugCurrentFrame,
  } = require('ReactGlobalSharedState');
  var {getStackAddendumByID} = ReactComponentTreeHook;
}

function getStackAddendum(debugID) {
  if (debugID != null) {
    // This can only happen on Stack
    return getStackAddendumByID(debugID);
  } else {
    // This can only happen on Fiber / Server
    var stack = ReactDebugCurrentFrame.getStackAddendum();
    return stack != null ? stack : '';
  }
}

if (__DEV__) {
  var warnedProperties = {};
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var EVENT_NAME_REGEX = /^on[A-Z]/;
  var rARIA = new RegExp('^(aria)-[' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$');
  var rARIACamel = new RegExp(
    '^(aria)[A-Z][' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$',
  );
  var possibleStandardNames = require('possibleStandardNames');

  var validateProperty = function(tagName, name, value, debugID) {
    if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
      return true;
    }

    if (EventPluginRegistry.registrationNameModules.hasOwnProperty(name)) {
      return true;
    }

    if (
      EventPluginRegistry.plugins.length === 0 &&
      EVENT_NAME_REGEX.test(name)
    ) {
      // If no event plugins have been injected, we might be in a server environment.
      // Don't check events in this case.
      return true;
    }

    var lowerCasedName = name.toLowerCase();
    var registrationName = EventPluginRegistry.possibleRegistrationNames.hasOwnProperty(
      lowerCasedName,
    )
      ? EventPluginRegistry.possibleRegistrationNames[lowerCasedName]
      : null;

    if (registrationName != null) {
      warning(
        false,
        'Unknown event handler property `%s`. Did you mean `%s`?%s',
        name,
        registrationName,
        getStackAddendum(debugID),
      );
      warnedProperties[name] = true;
      return true;
    }

    if (lowerCasedName.indexOf('on') === 0) {
      warning(
        false,
        'Unknown event handler property `%s`. It will be ignored.%s',
        name,
        getStackAddendum(debugID),
      );
      warnedProperties[name] = true;
      return true;
    }

    // Let the ARIA attribute hook validate ARIA attributes
    if (rARIA.test(name) || rARIACamel.test(name)) {
      return true;
    }

    if (lowerCasedName === 'onfocusin' || lowerCasedName === 'onfocusout') {
      warning(
        false,
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut. ' +
          'All React events are normalized to bubble, so onFocusIn and onFocusOut ' +
          'are not needed/supported by React.',
      );
      warnedProperties[name] = true;
      return true;
    }

    if (lowerCasedName === 'innerhtml') {
      warning(
        false,
        'Directly setting property `innerHTML` is not permitted. ' +
          'For more information, lookup documentation on `dangerouslySetInnerHTML`.',
      );
      warnedProperties[name] = true;
      return true;
    }

    if (lowerCasedName === 'aria') {
      warning(
        false,
        'The `aria` attribute is reserved for future use in React. ' +
          'Pass individual `aria-` attributes instead.',
      );
      warnedProperties[name] = true;
      return true;
    }

    if (
      lowerCasedName === 'is' &&
      value !== null &&
      value !== undefined &&
      typeof value !== 'string'
    ) {
      warning(
        false,
        'Received a `%s` for string attribute `is`. If this is expected, cast ' +
          'the value to a string.%s',
        typeof value,
        getStackAddendum(debugID),
      );
      warnedProperties[name] = true;
      return true;
    }

    if (typeof value === 'number' && isNaN(value)) {
      warning(
        false,
        'Received NaN for numeric attribute `%s`. If this is expected, cast ' +
          'the value to a string.%s',
        name,
        getStackAddendum(debugID),
      );
      warnedProperties[name] = true;
      return true;
    }

    const isReserved = DOMProperty.isReservedProp(name);

    // Known attributes should match the casing specified in the property config.
    if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
      var standardName = possibleStandardNames[lowerCasedName];
      if (standardName !== name) {
        warning(
          false,
          'Invalid DOM property `%s`. Did you mean `%s`?%s',
          name,
          standardName,
          getStackAddendum(debugID),
        );
        warnedProperties[name] = true;
        return true;
      }
    } else if (!isReserved && name !== lowerCasedName) {
      // Unknown attributes should have lowercase casing since that's how they
      // will be cased anyway with server rendering.
      warning(
        false,
        'React does not recognize the `%s` prop on a DOM element. If you ' +
          'intentionally want it to appear in the DOM as a custom ' +
          'attribute, spell it as lowercase `%s` instead. ' +
          'If you accidentally passed it from a parent component, remove ' +
          'it from the DOM element.%s',
        name,
        lowerCasedName,
        getStackAddendum(debugID),
      );
      warnedProperties[name] = true;
      return true;
    }

    if (typeof value === 'boolean') {
      warning(
        DOMProperty.shouldAttributeAcceptBooleanValue(name),
        'Received `%s` for non-boolean attribute `%s`. If this is expected, cast ' +
          'the value to a string.%s',
        value,
        name,
        getStackAddendum(debugID),
      );
      warnedProperties[name] = true;
      return true;
    }

    // Now that we've validated casing, do not validate
    // data types for reserved props
    if (isReserved) {
      return true;
    }

    // Warn when a known attribute is a bad type
    if (!DOMProperty.shouldSetAttribute(name, value)) {
      warnedProperties[name] = true;
      return false;
    }

    return true;
  };
}

var warnUnknownProperties = function(type, props, debugID) {
  var unknownProps = [];
  for (var key in props) {
    var isValid = validateProperty(type, key, props[key], debugID);
    if (!isValid) {
      unknownProps.push(key);
    }
  }

  var unknownPropString = unknownProps.map(prop => '`' + prop + '`').join(', ');
  if (unknownProps.length === 1) {
    warning(
      false,
      'Invalid prop %s on <%s> tag. Either remove this prop from the element, ' +
        'or pass a string or number value to keep it in the DOM. ' +
        'For details, see https://fb.me/react-unknown-prop%s',
      unknownPropString,
      type,
      getStackAddendum(debugID),
    );
  } else if (unknownProps.length > 1) {
    warning(
      false,
      'Invalid props %s on <%s> tag. Either remove these props from the element, ' +
        'or pass a string or number value to keep them in the DOM. ' +
        'For details, see https://fb.me/react-unknown-prop%s',
      unknownPropString,
      type,
      getStackAddendum(debugID),
    );
  }
};

function validateProperties(type, props, debugID /* Stack only */) {
  if (isCustomComponent(type, props)) {
    return;
  }
  warnUnknownProperties(type, props, debugID);
}

var ReactDOMUnknownPropertyHook = {
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

module.exports = ReactDOMUnknownPropertyHook;
