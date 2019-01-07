/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  isCustomComponent,
  isPropAnEvent,
  normalizeEventName,
} from './ReactFireUtils';
import {BOOLEAN, RESERVED} from '../shared/DOMProperty';
import {
  interactiveEvents,
  nonInteractiveEvents,
} from './events/ReactFireEventTypes';
import {
  ATTRIBUTE_NAME_CHAR,
  possibleStandardNames,
  shorthandToLonghand,
  validAriaProperties,
  voidElementTags,
} from './ReactFireDevOnly';
import {
  getPropertyInfo,
  shouldRemoveAttributeWithWarning,
} from '../shared/DOMProperty';

import invariant from 'shared/invariant';
import warning from 'shared/warning';
// TODO: We can remove this if we add invariantWithStack()
// or add stack by default to invariants where possible.
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {warnAboutShorthandPropertyCollision} from 'shared/ReactFeatureFlags';

const warnedProperties = {};
const rARIA = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
const rARIACamel = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');
const hasOwnProperty = Object.prototype.hasOwnProperty;
const EVENT_NAME_REGEX = /^on./;
const INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;

let didWarnValueNull = false;
let validateUnknownProperty = () => {};

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
        'Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.',
        name,
      );
      warnedProperties[name] = true;
      return true;
    }
    // aria-* attributes should be lowercase; suggest the lowercase version.
    if (name !== correctName) {
      warning(
        false,
        'Invalid ARIA attribute `%s`. Did you mean `%s`?',
        name,
        correctName,
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
        'Unknown ARIA attribute `%s`. Did you mean `%s`?',
        name,
        standardName,
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
        'For details, see https://fb.me/invalid-aria-prop',
      unknownPropString,
      type,
    );
  } else if (invalidProps.length > 1) {
    warning(
      false,
      'Invalid aria props %s on <%s> tag. ' +
        'For details, see https://fb.me/invalid-aria-prop',
      unknownPropString,
      type,
    );
  }
}

export function validateARIAProperties(type: string, props: Object) {
  if (isCustomComponent(type, props)) {
    return;
  }
  warnInvalidARIAProps(type, props);
}

export function validateInputProperties(type, props) {
  if (type !== 'input' && type !== 'textarea' && type !== 'select') {
    return;
  }

  if (props != null && props.value === null && !didWarnValueNull) {
    didWarnValueNull = true;
    if (type === 'select' && props.multiple) {
      warning(
        false,
        '`value` prop on `%s` should not be null. ' +
          'Consider using an empty array when `multiple` is set to `true` ' +
          'to clear the component or `undefined` for uncontrolled components.',
        type,
      );
    } else {
      warning(
        false,
        '`value` prop on `%s` should not be null. ' +
          'Consider using an empty string to clear the component or `undefined` ' +
          'for uncontrolled components.',
        type,
      );
    }
  }
}

validateUnknownProperty = function(tagName, name, value, canUseEventSystem) {
  if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
    return true;
  }

  const lowerCasedName = name.toLowerCase();
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

  if (canUseEventSystem) {
    // If no event plugins have been injected, we are in a server environment.
    // So we can't tell if the event name is correct for sure, but we can filter
    // out known bad ones like `onclick`. We can't suggest a specific replacement though.
    if (name.toLowerCase() === 'onclick' && name !== 'onClick') {
      warning(
        false,
        'Invalid event handler property `%s`. Did you mean `onClick`?',
        name,
      );
      return true;
    }
    if (name.toLowerCase() === 'ondblclick') {
      warning(
        false,
        'Invalid event handler property `%s`. Did you mean `onDoubleClick`?',
        name,
      );
      return true;
    }
    const eventName = normalizeEventName(name);

    if (isPropAnEvent(name)) {
      return true;
    }
    if (
      nonInteractiveEvents.has(eventName) ||
      interactiveEvents.has(eventName)
    ) {
      warning(
        false,
        'Invalid event handler property `%s`. ' +
          'React events use the camelCase naming convention, for example `onClick`.',
        name,
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
    if (INVALID_EVENT_NAME_REGEX.test(name)) {
      if (name.toLowerCase() === 'onclick' && name !== 'onClick') {
        warning(
          false,
          'Invalid event handler property `%s`. Did you mean `onClick`?',
          name,
        );
        return true;
      }
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

  // Warn when passing the strings 'false' or 'true' into a boolean prop
  if (
    (value === 'false' || value === 'true') &&
    propertyInfo !== null &&
    propertyInfo.type === BOOLEAN
  ) {
    warning(
      false,
      'Received the string `%s` for the boolean attribute `%s`. ' +
        '%s ' +
        'Did you mean %s={%s}?',
      value,
      name,
      value === 'false'
        ? 'The browser will interpret it as a truthy value.'
        : 'Although this works, it will not work as expected if you pass the string "false".',
      name,
      value,
    );
    warnedProperties[name] = true;
    return true;
  }

  return true;
};

const warnUnknownProperties = function(type, props, canUseEventSystem) {
  const unknownProps = [];
  for (const key in props) {
    const isValid = validateUnknownProperty(
      type,
      key,
      props[key],
      canUseEventSystem,
    );
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

export function validateUnknownProperties(type, props, canUseEventSystem) {
  if (isCustomComponent(type, props)) {
    return;
  }
  warnUnknownProperties(type, props, canUseEventSystem);
}

const HTML = '__html';

let ReactDebugCurrentFrame = null;
if (__DEV__) {
  ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
}

export function assertValidProps(tag: string, props: ?Object) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (voidElementTags.has(tag)) {
    invariant(
      props.children == null && props.dangerouslySetInnerHTML == null,
      '%s is a void element tag and must neither have `children` nor ' +
        'use `dangerouslySetInnerHTML`.%s',
      tag,
      __DEV__ ? ReactDebugCurrentFrame.getStackAddendum() : '',
    );
  }
  if (props.dangerouslySetInnerHTML != null) {
    invariant(
      props.children == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
    );
    invariant(
      typeof props.dangerouslySetInnerHTML === 'object' &&
        HTML in props.dangerouslySetInnerHTML,
      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit https://fb.me/react-invariant-dangerously-set-inner-html ' +
        'for more information.',
    );
  }
  if (__DEV__) {
    warning(
      props.suppressContentEditableWarning ||
        !props.contentEditable ||
        props.children == null,
      'A component is `contentEditable` and contains `children` managed by ' +
        'React. It is now your responsibility to guarantee that none of ' +
        'those nodes are unexpectedly modified or duplicated. This is ' +
        'probably not intentional.',
    );
  }
  invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
      "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
      'using JSX.%s',
    __DEV__ ? ReactDebugCurrentFrame.getStackAddendum() : '',
  );
}

function isValueEmpty(value) {
  return value == null || typeof value === 'boolean' || value === '';
}

/**
 * Given {color: 'red', overflow: 'hidden'} returns {
 *   color: 'color',
 *   overflowX: 'overflow',
 *   overflowY: 'overflow',
 * }. This can be read as "the overflowY property was set by the overflow
 * shorthand". That is, the values are the property that each was derived from.
 */
function expandShorthandMap(styles) {
  const expanded = {};
  for (const key in styles) {
    const longhands = shorthandToLonghand[key] || [key];
    for (let i = 0; i < longhands.length; i++) {
      expanded[longhands[i]] = key;
    }
  }
  return expanded;
}

/**
 * When mixing shorthand and longhand property names, we warn during updates if
 * we expect an incorrect result to occur. In particular, we warn for:
 *
 * Updating a shorthand property (longhand gets overwritten):
 *   {font: 'foo', fontVariant: 'bar'} -> {font: 'baz', fontVariant: 'bar'}
 *   becomes .style.font = 'baz'
 * Removing a shorthand property (longhand gets lost too):
 *   {font: 'foo', fontVariant: 'bar'} -> {fontVariant: 'bar'}
 *   becomes .style.font = ''
 * Removing a longhand property (should revert to shorthand; doesn't):
 *   {font: 'foo', fontVariant: 'bar'} -> {font: 'foo'}
 *   becomes .style.fontVariant = ''
 */
export function validateShorthandPropertyCollisionInDev(
  styleUpdates,
  nextStyles,
) {
  if (!warnAboutShorthandPropertyCollision) {
    return;
  }

  if (!nextStyles) {
    return;
  }

  const expandedUpdates = expandShorthandMap(styleUpdates);
  const expandedStyles = expandShorthandMap(nextStyles);
  const warnedAbout = {};
  for (const key in expandedUpdates) {
    const originalKey = expandedUpdates[key];
    const correctOriginalKey = expandedStyles[key];
    if (correctOriginalKey && originalKey !== correctOriginalKey) {
      const warningKey = originalKey + ',' + correctOriginalKey;
      if (warnedAbout[warningKey]) {
        continue;
      }
      warnedAbout[warningKey] = true;
      warning(
        false,
        '%s a style property during rerender (%s) when a ' +
          'conflicting property is set (%s) can lead to styling bugs. To ' +
          "avoid this, don't mix shorthand and non-shorthand properties " +
          'for the same value; instead, replace the shorthand with ' +
          'separate values.',
        isValueEmpty(styleUpdates[originalKey]) ? 'Removing' : 'Updating',
        originalKey,
        correctOriginalKey,
      );
    }
  }
}
