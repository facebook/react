/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  registrationNameModules,
  possibleRegistrationNames,
} from 'events/EventPluginRegistry';
import warning from 'shared/warning';
import warningWithoutStack from 'shared/warningWithoutStack';

import {
  ATTRIBUTE_NAME_CHAR,
  RESERVED,
  shouldRemoveAttributeWithWarning,
  getPropertyInfo,
} from './DOMProperty';
import isCustomComponent from './isCustomComponent';
import possibleStandardNames from './possibleStandardNames';

let validateProperty = () => {};

if (__DEV__) {
  const warnedProperties = {};
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const EVENT_NAME_REGEX = /^on./;
  const INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;
  const rARIA = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
  const rARIACamel = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');

  validateProperty = function(tagName, name, value, canUseEventSystem) {
    if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
      return true;
    }

    const lowerCasedName = name.toLowerCase();
    if (lowerCasedName === 'onfocusin' || lowerCasedName === 'onfocusout') {
      warningWithoutStack(
        false,
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut. ' +
          'All React events are normalized to bubble, so onFocusIn and onFocusOut ' +
          'are not needed/supported by React.',
      );
      warnedProperties[name] = true;
      return true;
    }

    // We can't rely on the event system being injected on the server.
    if (canUseEventSystem) {
      if (registrationNameModules.hasOwnProperty(name)) {
        return true;
      }
      const registrationName = possibleRegistrationNames.hasOwnProperty(
        lowerCasedName,
      )
        ? possibleRegistrationNames[lowerCasedName]
        : null;
      if (registrationName != null) {
        warning(
          false,
          'Invalid event handler property `%s`. Did you mean `%s`?',
          name,
          registrationName,
        );
        warnedProperties[name] = true;
        return true;
      }
      if (EVENT_NAME_REGEX.test(name)) {
        warning(
          false,
          'Unknown event handler property `%s`. It will be ignored.',
          name,
        );
        warnedProperties[name] = true;
        return true;
      }
    } else if (EVENT_NAME_REGEX.test(name)) {
      // If no event plugins have been injected, we are in a server environment.
      // So we can't tell if the event name is correct for sure, but we can filter
      // out known bad ones like `onclick`. We can't suggest a specific replacement though.
      if (INVALID_EVENT_NAME_REGEX.test(name)) {
        warning(
          false,
          'Invalid event handler property `%s`. ' +
            'React events use the camelCase naming convention, for example `onClick`.',
          name,
        );
      }
      warnedProperties[name] = true;
      return true;
    }

    // Let the ARIA attribute hook validate ARIA attributes
    if (rARIA.test(name) || rARIACamel.test(name)) {
      return true;
    }

    if (lowerCasedName === 'innerhtml') {
      warningWithoutStack(
        false,
        'Directly setting property `innerHTML` is not permitted. ' +
          'For more information, lookup documentation on `dangerouslySetInnerHTML`.',
      );
      warnedProperties[name] = true;
      return true;
    }

    if (lowerCasedName === 'aria') {
      warningWithoutStack(
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
        'Received a `%s` for a string attribute `is`. If this is expected, cast ' +
          'the value to a string.',
        typeof value,
      );
      warnedProperties[name] = true;
      return true;
    }

    if (typeof value === 'number' && isNaN(value)) {
      warning(
        false,
        'Received NaN for the `%s` attribute. If this is expected, cast ' +
          'the value to a string.',
        name,
      );
      warnedProperties[name] = true;
      return true;
    }

    const propertyInfo = getPropertyInfo(name);
    const isReserved = propertyInfo !== null && propertyInfo.type === RESERVED;

    // Known attributes should match the casing specified in the property config.
    if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
      const standardName = possibleStandardNames[lowerCasedName];
      if (standardName !== name) {
        warning(
          false,
          'Invalid DOM property `%s`. Did you mean `%s`?',
          name,
          standardName,
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
          'it from the DOM element.',
        name,
        lowerCasedName,
      );
      warnedProperties[name] = true;
      return true;
    }

    if (
      typeof value === 'boolean' &&
      shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)
    ) {
      if (value) {
        warning(
          false,
          'Received `%s` for a non-boolean attribute `%s`.\n\n' +
            'If you want to write it to the DOM, pass a string instead: ' +
            '%s="%s" or %s={value.toString()}.',
          value,
          name,
          name,
          value,
          name,
        );
      } else {
        warning(
          false,
          'Received `%s` for a non-boolean attribute `%s`.\n\n' +
            'If you want to write it to the DOM, pass a string instead: ' +
            '%s="%s" or %s={value.toString()}.\n\n' +
            'If you used to conditionally omit it with %s={condition && value}, ' +
            'pass %s={condition ? value : undefined} instead.',
          value,
          name,
          name,
          value,
          name,
          name,
          name,
        );
      }
      warnedProperties[name] = true;
      return true;
    }

    // Now that we've validated casing, do not validate
    // data types for reserved props
    if (isReserved) {
      return true;
    }

    // Warn when a known attribute is a bad type
    if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
      warnedProperties[name] = true;
      return false;
    }

    return true;
  };
}

const warnUnknownProperties = function(type, props, canUseEventSystem) {
  const unknownProps = [];
  for (const key in props) {
    const isValid = validateProperty(type, key, props[key], canUseEventSystem);
    if (!isValid) {
      unknownProps.push(key);
    }
  }

  const unknownPropString = unknownProps
    .map(prop => '`' + prop + '`')
    .join(', ');
  if (unknownProps.length === 1) {
    warning(
      false,
      'Invalid value for prop %s on <%s> tag. Either remove it from the element, ' +
        'or pass a string or number value to keep it in the DOM. ' +
        'For details, see https://fb.me/react-attribute-behavior',
      unknownPropString,
      type,
    );
  } else if (unknownProps.length > 1) {
    warning(
      false,
      'Invalid values for props %s on <%s> tag. Either remove them from the element, ' +
        'or pass a string or number value to keep them in the DOM. ' +
        'For details, see https://fb.me/react-attribute-behavior',
      unknownPropString,
      type,
    );
  }
};

export function validateProperties(type, props, canUseEventSystem) {
  if (isCustomComponent(type, props)) {
    return;
  }
  warnUnknownProperties(type, props, canUseEventSystem);
}
