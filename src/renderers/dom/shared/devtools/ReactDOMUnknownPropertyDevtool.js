/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMUnknownPropertyDevtool
 */

'use strict';

var DOMProperty = require('DOMProperty');
var EventPluginRegistry = require('EventPluginRegistry');
var ReactComponentTreeDevtool = require('ReactComponentTreeDevtool');

var warning = require('warning');

if (__DEV__) {
  var reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true,

    defaultValue: true,
    valueLink: true,
    defaultChecked: true,
    checkedLink: true,
    innerHTML: true,
    suppressContentEditableWarning: true,
    onFocusIn: true,
    onFocusOut: true,
  };
  var warnedProperties = {};

  var warnUnknownProperty = function(tagName, name, debugID) {
    if (DOMProperty.properties.hasOwnProperty(name) || DOMProperty.isCustomAttribute(name)) {
      return;
    }
    if (reactProps.hasOwnProperty(name) && reactProps[name] ||
        warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
      return;
    }
    if (EventPluginRegistry.registrationNameModules.hasOwnProperty(name)) {
      return;
    }
    warnedProperties[name] = true;
    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = (
      DOMProperty.isCustomAttribute(lowerCasedName) ?
        lowerCasedName :
      DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName) ?
        DOMProperty.getPossibleStandardName[lowerCasedName] :
        null
    );

    var registrationName = (
      EventPluginRegistry.possibleRegistrationNames.hasOwnProperty(
        lowerCasedName
      ) ?
      EventPluginRegistry.possibleRegistrationNames[lowerCasedName] :
      null
    );

    if (standardName != null) {
      warning(
        standardName == null,
        'Unknown DOM property %s. Did you mean %s?%s',
        name,
        standardName,
        ReactComponentTreeDevtool.getStackAddendumByID(debugID)
      );
    } else if (registrationName != null) {
      warning(
        registrationName == null,
        'Unknown event handler property %s. Did you mean `%s`?%s',
        name,
        registrationName,
        ReactComponentTreeDevtool.getStackAddendumByID(debugID)
      );
    } else {
      // We were unable to guess which prop the user intended.
      // It is likely that the user was just blindly spreading/forwarding props
      // Components should be careful to only render valid props/attributes.
      warning(
        false,
        'Unknown prop `%s` on <%s> tag. Remove this prop from the element. ' +
        'For details, see https://fb.me/react-unknown-prop%s',
        name,
        tagName,
        ReactComponentTreeDevtool.getStackAddendumByID(debugID)
      );
    }
  };
}

function handleElement(debugID, element) {
  if (element == null || typeof element.type !== 'string') {
    return;
  }
  if (element.type.indexOf('-') >= 0 || element.props.is) {
    return;
  }
  for (var key in element.props) {
    warnUnknownProperty(element.type, key, debugID);
  }
}

var ReactDOMUnknownPropertyDevtool = {
  onBeforeMountComponent(debugID, element) {
    handleElement(debugID, element);
  },
  onBeforeUpdateComponent(debugID, element) {
    handleElement(debugID, element);
  },
};

module.exports = ReactDOMUnknownPropertyDevtool;
