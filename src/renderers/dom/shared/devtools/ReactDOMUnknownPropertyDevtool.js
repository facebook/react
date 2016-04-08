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

var warning = require('warning');

if (__DEV__) {
  var additionalProps = [
    // Case sensitive properties not included in properties list
    'acceptCharset', 'accessKey', 'allowTransparency', 'autoComplete',
    'autoFocus', 'cellPadding', 'cellSpacing', 'charSet', 'classID',
    'colSpan', 'contentEditable', 'contextMenu', 'crossOrigin',
    'dateTime', 'encType', 'formAction', 'formEncType', 'formMethod',
    'formTarget', 'frameBorder', 'hrefLang', 'htmlFor', 'httpEquiv',
    'inputMode', 'keyParam', 'keyType', 'marginHeight', 'marginWidth',
    'maxLength', 'mediaGroup', 'minLength', 'radioGroup',
    'spellCheck', 'srcDoc', 'srcLang', 'srcSet', 'tabIndex', 'useMap',
    'autoCapitalize', 'autoCorrect', 'autoSave', 'itemProp',
    'itemType', 'itemID', 'itemRef'
  ];

  additionalProps.forEach(function(name) {
    DOMProperty.getPossibleStandardName[name.toLowerCase()] = name;
  });

  var warnedProperties = {};

  var warnUnknownProperty = function(name) {
    if (DOMProperty.isReservedProp(name) || DOMProperty.properties.hasOwnProperty(name)) {
      return;
    }
    if (warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
      return;
    }

    warnedProperties[name] = true;
    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = DOMProperty.getPossibleStandardName.hasOwnProperty(name) ?
        DOMProperty.getPossibleStandardName[name] : null;

    // For now, only warn when we have a suggested correction. This prevents
    // logging too much when using transferPropsTo.
    warning(
      standardName == null,
      'Unknown DOM property %s. Did you mean %s?',
      name,
      standardName
    );

    var registrationName = (
      EventPluginRegistry.possibleRegistrationNames.hasOwnProperty(
        lowerCasedName
      ) ?
      EventPluginRegistry.possibleRegistrationNames[lowerCasedName] :
      null
    );

    warning(
      registrationName == null,
      'Unknown event handler property %s. Did you mean `%s`?',
      name,
      registrationName
    );
  };
}

var ReactDOMUnknownPropertyDevtool = {
  onCreateMarkupForProperty(name, value) {
    warnUnknownProperty(name);
  },
  onSetValueForProperty(node, name, value) {
    warnUnknownProperty(name);
  },
  onDeleteValueForProperty(node, name) {
    warnUnknownProperty(name);
  },
};

module.exports = ReactDOMUnknownPropertyDevtool;
