/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import warning from 'fbjs/lib/warning';
import {ReactDebugCurrentFrame} from 'shared/ReactGlobalSharedState';

import {ATTRIBUTE_NAME_CHAR} from './DOMProperty';
import isCustomComponent from './isCustomComponent';
import validAriaProperties from './validAriaProperties';

const warnedProperties = {};
const rARIA = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
const rARIACamel = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');

const hasOwnProperty = Object.prototype.hasOwnProperty;

function getStackAddendum() {
  const stack = ReactDebugCurrentFrame.getStackAddendum();
  return stack != null ? stack : '';
}

function validateProperty(tagName, name) {
  if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
    return true;
  }

  if (rARIACamel.test(name)) {
    const ariaName = 'aria-' + name.slice(4).toLowerCase();
    const correctName = validAriaProperties.hasOwnProperty(ariaName)
      ? ariaName
      : null;

    // If this is an aria-* attribute, but is not listed in the known DOM
    // DOM properties, then it is an invalid aria-* attribute.
    if (correctName == null) {
      warning(
        false,
        'Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.%s',
        name,
        getStackAddendum(),
      );
      warnedProperties[name] = true;
      return true;
    }
    // aria-* attributes should be lowercase; suggest the lowercase version.
    if (name !== correctName) {
      warning(
        false,
        'Invalid ARIA attribute `%s`. Did you mean `%s`?%s',
        name,
        correctName,
        getStackAddendum(),
      );
      warnedProperties[name] = true;
      return true;
    }
  }

  if (rARIA.test(name)) {
    const lowerCasedName = name.toLowerCase();
    const standardName = validAriaProperties.hasOwnProperty(lowerCasedName)
      ? lowerCasedName
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
        'Unknown ARIA attribute `%s`. Did you mean `%s`?%s',
        name,
        standardName,
        getStackAddendum(),
      );
      warnedProperties[name] = true;
      return true;
    }
  }

  return true;
}

function warnInvalidARIAProps(type, props) {
  const invalidProps = [];

  for (const key in props) {
    const isValid = validateProperty(type, key);
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
      getStackAddendum(),
    );
  } else if (invalidProps.length > 1) {
    warning(
      false,
      'Invalid aria props %s on <%s> tag. ' +
        'For details, see https://fb.me/invalid-aria-prop%s',
      unknownPropString,
      type,
      getStackAddendum(),
    );
  }
}

export function validateProperties(type, props) {
  if (isCustomComponent(type, props)) {
    return;
  }
  warnInvalidARIAProps(type, props);
}
