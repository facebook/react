/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warning from 'fbjs/lib/warning';

type PropertyType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// A reserved attribute.
// It is handled by React separately and shouldn't be written to the DOM.
export const RESERVED = 0;
// A simple string attribute.
// Attributes that aren't in the whitelist are presumed to have this type.
export const STRING = 1;
// A simple string attribute that also accepts booleans from the user
// (but coerces them to string and doesn't have any special handling for them).
export const STRING_BOOLEAN = 2;
// An attribute that should be removed when set to a falsey value.
export const BOOLEAN = 3;
// An attribute that can be used as a flag as well as with a value.
// Removed when strictly equal to false; present without a value when
// strictly equal to true; present with a value otherwise.
export const OVERLOADED_BOOLEAN = 4;
// An attribute that must be numeric or parse as a numeric and should be
// removed when set to a falsey value.
export const NUMERIC = 5;
// An attribute that must be positive numeric or parse as a positive
// numeric and should be removed when set to a falsey value.
export const POSITIVE_NUMERIC = 6;

export type PropertyInfo = {|
  +acceptsBooleans: boolean,
  +attributeName: string,
  +attributeNamespace: string | null,
  +mustUseProperty: boolean,
  +propertyName: string,
  +type: PropertyType,
|};

/* eslint-disable max-len */
export const ATTRIBUTE_NAME_START_CHAR =
  ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
/* eslint-enable max-len */
export const ATTRIBUTE_NAME_CHAR =
  ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';

export const ID_ATTRIBUTE_NAME = 'data-reactid';
export const ROOT_ATTRIBUTE_NAME = 'data-reactroot';
export const VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
  '^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$',
);

const illegalAttributeNameCache = {};
const validatedAttributeNameCache = {};

export function isAttributeNameSafe(attributeName: string): boolean {
  if (validatedAttributeNameCache.hasOwnProperty(attributeName)) {
    return true;
  }
  if (illegalAttributeNameCache.hasOwnProperty(attributeName)) {
    return false;
  }
  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true;
    return true;
  }
  illegalAttributeNameCache[attributeName] = true;
  if (__DEV__) {
    warning(false, 'Invalid attribute name: `%s`', attributeName);
  }
  return false;
}

export function shouldSkipAttribute(
  name: string,
  propertyInfo: PropertyInfo | null,
  isCustomComponentTag: boolean,
): boolean {
  if (propertyInfo !== null && propertyInfo.type === RESERVED) {
    return true;
  }
  if (isCustomComponentTag) {
    return false;
  }
  if (
    name.length > 2 &&
    (name[0] === 'o' || name[0] === 'O') &&
    (name[1] === 'n' || name[1] === 'N')
  ) {
    return true;
  }
  return false;
}

export function isBadlyTypedAttributeValue(
  name: string,
  value: mixed,
  propertyInfo: PropertyInfo | null,
  isCustomComponentTag: boolean,
): boolean {
  if (propertyInfo !== null && propertyInfo.type === RESERVED) {
    return false;
  }
  switch (typeof value) {
    case 'function':
    // $FlowIssue symbol is perfectly valid here
    case 'symbol': // eslint-disable-line
      return true;
    case 'boolean': {
      if (isCustomComponentTag) {
        return false;
      }
      if (propertyInfo !== null) {
        return !propertyInfo.acceptsBooleans;
      } else {
        const prefix = name.toLowerCase().slice(0, 5);
        return prefix !== 'data-' && prefix !== 'aria-';
      }
    }
    default:
      return false;
  }
}

export function shouldTreatAttributeValueAsNull(
  name: string,
  value: mixed,
  propertyInfo: PropertyInfo | null,
  isCustomComponentTag: boolean,
): boolean {
  if (value === null || typeof value === 'undefined') {
    return true;
  }
  if (
    isBadlyTypedAttributeValue(name, value, propertyInfo, isCustomComponentTag)
  ) {
    return true;
  }
  if (propertyInfo !== null) {
    switch (propertyInfo.type) {
      case BOOLEAN:
        return !value;
      case OVERLOADED_BOOLEAN:
        return value === false;
      case NUMERIC:
        return isNaN(value);
      case POSITIVE_NUMERIC:
        return isNaN(value) || (value: any) < 1;
    }
  }
  return false;
}

export function getPropertyInfo(name: string): PropertyInfo | null {
  return properties.hasOwnProperty(name) ? properties[name] : null;
}

function PropertyInfoRecord(
  name: string,
  type: PropertyType,
  mustUseProperty: boolean,
  attributeName: string,
  attributeNamespace: string | null,
) {
  this.acceptsBooleans =
    type === STRING_BOOLEAN || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
  this.attributeName = attributeName;
  this.attributeNamespace = attributeNamespace;
  this.mustUseProperty = mustUseProperty;
  this.propertyName = name;
  this.type = type;
}

// When adding attributes to this list, be sure to also add them to
// the `possibleStandardNames` module to ensure casing and incorrect
// name warnings.
const properties = {};
[
  'children',
  'dangerouslySetInnerHTML',
  // TODO: This prevents the assignment of defaultValue to regular
  // elements (not just inputs). Now that ReactDOMInput assigns to the
  // defaultValue property -- do we need this?
  'defaultValue',
  'defaultChecked',
  'innerHTML',
  'suppressContentEditableWarning',
  'suppressHydrationWarning',
  'style',
].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    RESERVED,
    false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
  );
});
new Map([
  ['acceptCharset', 'accept-charset'],
  ['className', 'class'],
  ['htmlFor', 'for'],
  ['httpEquiv', 'http-equiv'],
]).forEach((attributeName, name) => {
  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName, // attributeName
    null, // attributeNamespace
  );
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    STRING_BOOLEAN,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
  );
});
['autoReverse', 'externalResourcesRequired', 'preserveAlpha'].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    STRING_BOOLEAN,
    false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
  );
});
[
  'allowFullScreen',
  'async',
  'autoFocus',
  'autoPlay',
  'controls',
  'default',
  'defer',
  'disabled',
  'formNoValidate',
  'hidden',
  'loop',
  'noValidate',
  'open',
  'playsInline',
  'readOnly',
  'required',
  'reversed',
  'scoped',
  'seamless',
  'itemScope',
].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    BOOLEAN,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
  );
});
['checked', 'multiple', 'muted', 'selected'].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    BOOLEAN,
    true, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
  );
});
['capture', 'download'].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    OVERLOADED_BOOLEAN,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
  );
});
['cols', 'rows', 'size', 'span'].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    POSITIVE_NUMERIC,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
  );
});
['rowSpan', 'start'].forEach(name => {
  properties[name] = new PropertyInfoRecord(
    name,
    NUMERIC,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
  );
});

const CAMELIZE = /[\-\:]([a-z])/g;
const capitalize = token => token[1].toUpperCase();
/**
 * This is a list of all SVG attributes that need special casing,
 * namespacing, or boolean value assignment.
 *
 * When adding attributes to this list, be sure to also add them to
 * the `possibleStandardNames` module to ensure casing and incorrect
 * name warnings.
 *
 * SVG Attributes List:
 * https://www.w3.org/TR/SVG/attindex.html
 * SMIL Spec:
 * https://www.w3.org/TR/smil
 */
[
  'accent-height',
  'alignment-baseline',
  'arabic-form',
  'baseline-shift',
  'cap-height',
  'clip-path',
  'clip-rule',
  'color-interpolation',
  'color-interpolation-filters',
  'color-profile',
  'color-rendering',
  'dominant-baseline',
  'enable-background',
  'fill-opacity',
  'fill-rule',
  'flood-color',
  'flood-opacity',
  'font-family',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'glyph-name',
  'glyph-orientation-horizontal',
  'glyph-orientation-vertical',
  'horiz-adv-x',
  'horiz-origin-x',
  'image-rendering',
  'letter-spacing',
  'lighting-color',
  'marker-end',
  'marker-mid',
  'marker-start',
  'overline-position',
  'overline-thickness',
  'paint-order',
  'panose-1',
  'pointer-events',
  'rendering-intent',
  'shape-rendering',
  'stop-color',
  'stop-opacity',
  'strikethrough-position',
  'strikethrough-thickness',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'text-anchor',
  'text-decoration',
  'text-rendering',
  'underline-position',
  'underline-thickness',
  'unicode-bidi',
  'unicode-range',
  'units-per-em',
  'v-alphabetic',
  'v-hanging',
  'v-ideographic',
  'v-mathematical',
  'vector-effect',
  'vert-adv-y',
  'vert-origin-x',
  'vert-origin-y',
  'word-spacing',
  'writing-mode',
  'x-height',
].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    null, // attributeNamespace
  );
});
[
  'xlink:actuate',
  'xlink:arcrole',
  'xlink:href',
  'xlink:role',
  'xlink:show',
  'xlink:title',
  'xlink:type',
].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    'http://www.w3.org/1999/xlink',
  );
});
['xml:base', 'xml:lang', 'xml:space'].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    'http://www.w3.org/XML/1998/namespace',
  );
});
properties['xmlnsXlink'] = new PropertyInfoRecord(
  'xmlnsXlink',
  STRING,
  false, // mustUseProperty
  'xmlns:xlink', // attributeName
  null, // attributeNamespace
);
properties.tabIndex = new PropertyInfoRecord(
  'tabIndex',
  STRING,
  false, // mustUseProperty
  'tabindex', // attributeName
  null, // attributeNamespace
);
