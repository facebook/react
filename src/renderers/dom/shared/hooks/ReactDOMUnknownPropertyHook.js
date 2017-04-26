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
    // This can only happen on Fiber / Server
    var stack = ReactDebugCurrentFiber.getCurrentFiberStackAddendum();
    return stack != null ? stack : '';
  }
}

if (__DEV__) {
  var additionalProps = [
    'about',
    'accept',
    'acceptCharset',
    'accessKey',
    'action',
    'allowFullScreen',
    'allowTransparency',
    'alt',
    'as',
    'async',
    'autoCapitalize',
    'autoComplete',
    'autoCorrect',
    'autoPlay',
    'autoSave',
    'capture',
    'cellPadding',
    'cellSpacing',
    'challenge',
    'charSet',
    'checked',
    'cite',
    'classID',
    'className',
    'colSpan',
    'color',
    'cols',
    'content',
    'contentEditable',
    'contextMenu',
    'controls',
    'coords',
    'crossOrigin',
    'data',
    'datatype',
    'dateTime',
    'default',
    'defer',
    'dir',
    'disabled',
    'download',
    'draggable',
    'encType',
    'form',
    'formAction',
    'formEncType',
    'formMethod',
    'formNoValidate',
    'formTarget',
    'frameBorder',
    'headers',
    'height',
    'hidden',
    'high',
    'href',
    'hrefLang',
    'htmlFor',
    'httpEquiv',
    'id',
    'inlist',
    'inputMode',
    'integrity',
    'is',
    'itemID',
    'itemProp',
    'itemRef',
    'itemScope',
    'itemType',
    'keyParams',
    'keyType',
    'kind',
    'label',
    'lang',
    'list',
    'loop',
    'low',
    'manifest',
    'marginHeight',
    'marginWidth',
    'max',
    'maxLength',
    'media',
    'mediaGroup',
    'method',
    'min',
    'minLength',
    'multiple',
    'muted',
    'name',
    'noValidate',
    'nonce',
    'open',
    'optimum',
    'pattern',
    'placeholder',
    'playsInline',
    'poster',
    'prefix',
    'preload',
    'profile',
    'property',
    'radioGroup',
    'readOnly',
    'referrerPolicy',
    'rel',
    'required',
    'resource',
    'results',
    'reversed',
    'role',
    'rowSpan',
    'rows',
    'sandbox',
    'scope',
    'scoped',
    'scrolling',
    'seamless',
    'security',
    'selected',
    'shape',
    'size',
    'sizes',
    'slot',
    'span',
    'spellCheck',
    'src',
    'srcDoc',
    'srcLang',
    'srcSet',
    'start',
    'step',
    'style',
    'summary',
    'tabIndex',
    'target',
    'title',
    'type',
    'typeof',
    'unselectable',
    'useMap',
    'value',
    'vocab',
    'width',
    'wmode',
    'wrap',
  ];

  additionalProps.forEach(function(name) {
    var lowerCasedName = name.toLowerCase();

    // Do not warn if the casing will not change
    if (name !== lowerCasedName) {
      DOMProperty.getPossibleStandardName[lowerCasedName] = name;
    }
  });

  var warnedProperties = {};

  var validateProperty = function(tagName, name, debugID) {
    if (
      DOMProperty.properties.hasOwnProperty(name) ||
      DOMProperty.isReservedProp(name) ||
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
    var standardName = DOMProperty.getPossibleStandardName.hasOwnProperty(name)
      ? DOMProperty.getPossibleStandardName[name]
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
    }

    return true;
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
