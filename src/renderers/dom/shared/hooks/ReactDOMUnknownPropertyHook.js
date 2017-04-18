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
var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
var {ReactComponentTreeHook} = require('ReactGlobalSharedState');

var warning = require('fbjs/lib/warning');

function getStackAddendum(debugID) {
  if (debugID != null) {
    // This can only happen on Stack
    return ReactComponentTreeHook.getStackAddendumByID(debugID);
  } else {
    // This can only happen on Fiber
    return ReactDebugCurrentFiber.getCurrentFiberStackAddendum();
  }
}

if (__DEV__) {
  var reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true,

    autoFocus: true,
    defaultValue: true,
    defaultChecked: true,
    innerHTML: true,
    suppressContentEditableWarning: true,
    onFocusIn: true,
    onFocusOut: true,
  };
  var warnedProperties = {};

  var validateProperty = function(tagName, name, debugID) {
    if (
      DOMProperty.properties.hasOwnProperty(name) ||
      DOMProperty.isCustomAttribute(name)
    ) {
      return true;
    }
    if (
      (reactProps.hasOwnProperty(name) && reactProps[name]) ||
      (warnedProperties.hasOwnProperty(name) && warnedProperties[name])
    ) {
      return true;
    }
    if (EventPluginRegistry.registrationNameModules.hasOwnProperty(name)) {
      return true;
    }
    warnedProperties[name] = true;
    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = DOMProperty.isCustomAttribute(lowerCasedName)
      ? lowerCasedName
      : DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName)
          ? DOMProperty.getPossibleStandardName[lowerCasedName]
          : null;

    var registrationName = EventPluginRegistry.possibleRegistrationNames.hasOwnProperty(
      lowerCasedName,
    )
      ? EventPluginRegistry.possibleRegistrationNames[lowerCasedName]
      : null;

    if (standardName != null) {
      warning(
        false,
        'Unknown DOM property %s. Did you mean %s?%s',
        name,
        standardName,
        getStackAddendum(debugID),
      );
      return true;
    } else if (registrationName != null) {
      warning(
        false,
        'Unknown event handler property %s. Did you mean `%s`?%s',
        name,
        registrationName,
        getStackAddendum(debugID),
      );
      return true;
    } else {
      // We were unable to guess which prop the user intended.
      // It is likely that the user was just blindly spreading/forwarding props
      // Components should be careful to only render valid props/attributes.
      // Warning will be invoked in warnUnknownProperties to allow grouping.
      return false;
    }
  };
}

var warnUnknownProperties = function(type, props, debugID) {
  var unknownProps = [];
  for (var key in props) {
    var isValid = validateProperty(type, key, debugID);
    if (!isValid) {
      unknownProps.push(key);
    }
  }

  var unknownPropString = unknownProps.map(prop => '`' + prop + '`').join(', ');

  if (unknownProps.length === 1) {
    warning(
      false,
      'Unknown prop %s on <%s> tag. Remove this prop from the element. ' +
        'For details, see https://fb.me/react-unknown-prop%s',
      unknownPropString,
      type,
      getStackAddendum(debugID),
    );
  } else if (unknownProps.length > 1) {
    warning(
      false,
      'Unknown props %s on <%s> tag. Remove these props from the element. ' +
        'For details, see https://fb.me/react-unknown-prop%s',
      unknownPropString,
      type,
      getStackAddendum(debugID),
    );
  }
};

function validateProperties(type, props, debugID /* Stack only */) {
  if (type.indexOf('-') >= 0 || props.is) {
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
