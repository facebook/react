/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// These attributes should be all lowercase to allow for
// case insensitive checks
var RESERVED_PROPS = new Set([
  'children',
  'dangerouslySetInnerHTML',
  'defaultValue',
  'defaultChecked',
  'innerHTML',
  'suppressContentEditableWarning',
  'suppressHydrationWarning',
  'style',
]);

// A simple string attribute.
const STRING = 0;
// A simple string attribute that also accepts booleans from the user
// (but coerces them to string and doesn't have any special handling for them).
const STRING_BOOLEAN = 1;
// An attribute that should be removed when set to a falsey value.
const BOOLEAN = 2;
// An attribute that must be numeric or parse as a numeric and should be
// removed when set to a falsey value.
const NUMERIC = 3;
// An attribute that must be positive numeric or parse as a positive
// numeric and should be removed when set to a falsey value.
const POSITIVE_NUMERIC = 4;
// An attribute that can be used as a flag as well as with a value.
// Removed when strictly equal to false; present without a value when
// strictly equal to true; present with a value otherwise.
const OVERLOADED_BOOLEAN = 5;

type PropertyType = 0 | 1 | 2 | 3 | 4 | 5;

/* eslint-disable max-len */
export const ATTRIBUTE_NAME_START_CHAR =
  ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
/* eslint-enable max-len */
export const ATTRIBUTE_NAME_CHAR =
  ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';

export const ID_ATTRIBUTE_NAME = 'data-reactid';
export const ROOT_ATTRIBUTE_NAME = 'data-reactroot';

const propertyTypes: Map<string, PropertyType> = new Map([
  // When adding attributes to this list, be sure to also add them to
  // the `possibleStandardNames` module to ensure casing and incorrect
  // name warnings.
  ['allowFullScreen', BOOLEAN],
  // specifies target context for links with `preload` type
  ['async', BOOLEAN],
  // Note: there is a special case that prevents it from being written to the DOM
  // on the client side because the browsers are inconsistent. Instead we call focus().
  ['autoFocus', BOOLEAN],
  ['autoPlay', BOOLEAN],
  ['capture', OVERLOADED_BOOLEAN],
  ['checked', BOOLEAN],
  ['cols', POSITIVE_NUMERIC],
  ['contentEditable', STRING_BOOLEAN],
  ['controls', BOOLEAN],
  ['default', BOOLEAN],
  ['defer', BOOLEAN],
  ['disabled', BOOLEAN],
  ['download', OVERLOADED_BOOLEAN],
  ['draggable', STRING_BOOLEAN],
  ['formNoValidate', BOOLEAN],
  ['hidden', BOOLEAN],
  ['loop', BOOLEAN],
  // Caution; `option.selected` is not updated if `select.multiple` is
  // disabled with `removeAttribute`.
  ['multiple', BOOLEAN],
  ['muted', BOOLEAN],
  ['noValidate', BOOLEAN],
  ['open', BOOLEAN],
  ['playsInline', BOOLEAN],
  ['readOnly', BOOLEAN],
  ['required', BOOLEAN],
  ['reversed', BOOLEAN],
  ['rows', POSITIVE_NUMERIC],
  ['rowSpan', NUMERIC],
  ['scoped', BOOLEAN],
  ['seamless', BOOLEAN],
  ['selected', BOOLEAN],
  ['size', POSITIVE_NUMERIC],
  ['start', NUMERIC],
  // support for projecting regular DOM Elements via V1 named slots ( shadow dom )
  ['span', POSITIVE_NUMERIC],
  ['spellCheck', STRING_BOOLEAN],
  // Style must be explicitly set in the attribute list. React components
  // expect a style object
  ['style', STRING],
  // Keep it in the whitelist because it is case-sensitive for SVG.
  ['tabIndex', STRING],
  // itemScope is for for Microdata support.
  // See http://schema.org/docs/gs.html
  ['itemScope', BOOLEAN],
  // These attributes must stay in the white-list because they have
  // different attribute names (see `attributeNames`)
  // TODO: this doesn't seem great? Probably means we depend on
  // existence in the whitelist somewhere we shouldn't need to.
  ['acceptCharset', STRING],
  ['className', STRING],
  ['htmlFor', STRING],
  ['httpEquiv', STRING],
  // Set the string boolean flag to allow the behavior
  ['value', STRING_BOOLEAN],
  ['autoReverse', STRING_BOOLEAN],
  ['externalResourcesRequired', STRING_BOOLEAN],
  ['preserveAlpha', STRING_BOOLEAN],
]);

/**
 * Checks whether a property name is a writeable attribute.
 * @method
 */
export function shouldSetAttribute(name: string, value: mixed) {
  if (isReservedProp(name)) {
    return false;
  }
  if (
    name.length > 2 &&
    (name[0] === 'o' || name[0] === 'O') &&
    (name[1] === 'n' || name[1] === 'N')
  ) {
    return false;
  }
  if (value === null) {
    return true;
  }
  switch (typeof value) {
    case 'boolean':
      return shouldAttributeAcceptBooleanValue(name);
    case 'undefined':
    case 'number':
    case 'string':
    case 'object':
      return true;
    default:
      // function, symbol
      return false;
  }
}

// TODO: the fact that we rely on this in many code paths seems bad.
// It shouldn't be observable whether something is whitelisted if it
// doesn't have special behavior except being an alias. But at least
// we're explicit about this now.
export function isWhitelisted(name: string) {
  return propertyTypes.has(name);
}

export function shouldAttributeAcceptBooleanValue(name: string) {
  if (isReservedProp(name)) {
    return true;
  }
  if (propertyTypes.has(name)) {
    switch (propertyTypes.get(name)) {
      case BOOLEAN:
      case STRING_BOOLEAN:
      case OVERLOADED_BOOLEAN:
        return true;
    }
  }
  const prefix = name.toLowerCase().slice(0, 5);
  return prefix === 'data-' || prefix === 'aria-';
}

/**
 * Checks to see if a property name is within the list of properties
 * reserved for internal React operations. These properties should
 * not be set on an HTML element.
 *
 * @private
 * @param {string} name
 * @return {boolean} If the name is within reserved props
 */
export function isReservedProp(name: string) {
  return RESERVED_PROPS.has(name);
}

const attributeNames: Map<string, string> = new Map([
  ['acceptCharset', 'accept-charset'],
  ['className', 'class'],
  ['htmlFor', 'for'],
  ['httpEquiv', 'http-equiv'],

  ['autoReverse', 'autoReverse'],
  ['externalResourcesRequired', 'externalResourcesRequired'],
  ['preserveAlpha', 'preserveAlpha'],
]);

export function getAttributeName(name: string): string {
  let attributeName = attributeNames.get(name);
  if (typeof attributeName === 'string') {
    return attributeName;
  }
  attributeName = isWhitelisted(name) ? name.toLowerCase() : name;
  attributeNames.set(name, attributeName);
  return attributeName;
}

const NS_XLINK = 'http://www.w3.org/1999/xlink';
const NS_XML = 'http://www.w3.org/XML/1998/namespace';
const attributeNamespaces: Map<string, string> = new Map([
  ['xlinkActuate', NS_XLINK],
  ['xlinkArcrole', NS_XLINK],
  ['xlinkHref', NS_XLINK],
  ['xlinkRole', NS_XLINK],
  ['xlinkShow', NS_XLINK],
  ['xlinkTitle', NS_XLINK],
  ['xlinkType', NS_XLINK],
  ['xmlBase', NS_XML],
  ['xmlLang', NS_XML],
  ['xmlSpace', NS_XML],
]);

export function getAttributeNamespace(name: string): string | null {
  const attributeNamespace = attributeNamespaces.get(name);
  if (typeof attributeNamespace === 'string') {
    return attributeNamespace;
  }
  return null;
}

export function hasBooleanValue(name: string): boolean {
  return propertyTypes.get(name) === BOOLEAN;
}

export function hasOverloadedBooleanValue(name: string): boolean {
  return propertyTypes.get(name) === OVERLOADED_BOOLEAN;
}

export function shouldIgnoreValue(name: string, value: mixed): boolean {
  if (value == null) {
    return true;
  }
  if (!propertyTypes.has(name)) {
    return false;
  }
  const propertyType = propertyTypes.get(name);
  switch (propertyType) {
    case BOOLEAN:
      return !value;
    case OVERLOADED_BOOLEAN:
      return value === false;
    case POSITIVE_NUMERIC:
      // Intentional implicit coercion (e.g. '0' < 1)
      if ((value: any) < 1) {
        return true;
      }
    // intentional fallthrough
    case NUMERIC:
      return isNaN(value);
    default:
      return false;
  }
}

const usePropertiesFor: Set<string> = new Set([
  'checked',
  'multiple',
  'muted',
  'selected',
]);

export function shouldUseProperty(name: string): boolean {
  return usePropertiesFor.has(name);
}
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
var SVG_ATTRS = [
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
  'xlink:actuate',
  'xlink:arcrole',
  'xlink:href',
  'xlink:role',
  'xlink:show',
  'xlink:title',
  'xlink:type',
  'xml:base',
  'xmlns:xlink',
  'xml:lang',
  'xml:space',
];

var CAMELIZE = /[\-\:]([a-z])/g;
var capitalize = token => token[1].toUpperCase();

SVG_ATTRS.forEach(original => {
  var reactName = original.replace(CAMELIZE, capitalize);
  attributeNames.set(reactName, original);
  propertyTypes.set(reactName, STRING);
});
