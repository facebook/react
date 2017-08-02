/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMProperty
 */

'use strict';

var RESERVED_PROPS = {
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

var XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';

/* eslint-disable max-len */
var ATTRIBUTE_NAME_START_CHAR =
  ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
/* eslint-enable max-len */

/**
 * DOMProperty exports lookup objects that can be used like functions:
 *
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {
  ID_ATTRIBUTE_NAME: 'data-reactid',
  ROOT_ATTRIBUTE_NAME: 'data-reactroot',

  ATTRIBUTE_NAME_START_CHAR: ATTRIBUTE_NAME_START_CHAR,
  ATTRIBUTE_NAME_CHAR: ATTRIBUTE_NAME_START_CHAR +
    '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040',

  /**
   * Map from property "standard name" to an object with info about how to set
   * the property in the DOM. Each object contains:
   *
   * attributeName:
   *   Used when rendering markup or with `*Attribute()`.
   * attributeNamespace
   * mutationMethod:
   *   If non-null, used instead of the property or `setAttribute()` after
   *   initial render.
   * mustUseProperty:
   *   Whether the property must be accessed and mutated as an object property.
   * hasBooleanValue:
   *   Whether the property should be removed when set to a falsey value.
   * hasNumericValue:
   *   Whether the property must be numeric or parse as a numeric and should be
   *   removed when set to a falsey value.
   * hasPositiveNumericValue:
   *   Whether the property must be positive numeric or parse as a positive
   *   numeric and should be removed when set to a falsey value.
   * hasOverloadedBooleanValue:
   *   Whether the property can be used as a flag as well as with a value.
   *   Removed when strictly equal to false; present without a value when
   *   strictly equal to true; present with a value otherwise.
   */
  attributeName: {
    acceptCharset: 'accept-charset',
    allowFullScreen: 'allowfullscreen',
    autoPlay: 'autoplay',
    className: 'class',
    formNoValidate: 'formnovalidate',
    htmlFor: 'for',
    httpEquiv: 'http-equiv',
    noValidate: 'novalidate',
    playsInline: 'playsinline',
    readOnly: 'readonly',
    rowSpan: 'rowspan',
    itemScope: 'itemscope',
    accentHeight: 'accent-height',
    alignmentBaseline: 'alignment-baseline',
    arabicForm: 'arabic-form',
    baselineShift: 'baseline-shift',
    capHeight: 'cap-height',
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    dominantBaseline: 'dominant-baseline',
    enableBackground: 'enable-background',
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    filterRes: 'filterRes',
    filterUnits: 'filterUnits',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    glyphRef: 'glyphRef',
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    imageRendering: 'image-rendering',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pointerEvents: 'pointer-events',
    renderingIntent: 'rendering-intent',
    shapeRendering: 'shape-rendering',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    strokeDasharray: 'stroke-dasharray',
    strokeDashoffset: 'stroke-dashoffset',
    strokeLinecap: 'stroke-linecap',
    strokeLinejoin: 'stroke-linejoin',
    strokeMiterlimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    vectorEffect: 'vector-effect',
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    xHeight: 'x-height',
    xlinkActuate: 'xlink:actuate',
    xlinkArcrole: 'xlink:arcrole',
    xlinkHref: 'xlink:href',
    xlinkRole: 'xlink:role',
    xlinkShow: 'xlink:show',
    xlinkTitle: 'xlink:title',
    xlinkType: 'xlink:type',
    xmlBase: 'xml:base',
    xmlnsXlink: 'xmlns:xlink',
    xmlLang: 'xml:lang',
    xmlSpace: 'xml:space',
  },

  attributeNamespace: {
    xlinkActuate: XLINK_NAMESPACE,
    xlinkArcrole: XLINK_NAMESPACE,
    xlinkHref: XLINK_NAMESPACE,
    xlinkRole: XLINK_NAMESPACE,
    xlinkShow: XLINK_NAMESPACE,
    xlinkTitle: XLINK_NAMESPACE,
    xlinkType: XLINK_NAMESPACE,
    xmlBase: XML_NAMESPACE,
    xmlLang: XML_NAMESPACE,
    xmlSpace: XML_NAMESPACE,
  },

  mustUseProperty: {
    checked: true,
    multiple: true,
    muted: true,
    selected: true,
  },

  hasBooleanValue: {
    allowFullScreen: true,
    async: true,
    autoPlay: true,
    capture: true,
    checked: true,
    controls: true,
    default: true,
    defer: true,
    disabled: true,
    formNoValidate: true,
    hidden: true,
    loop: true,
    multiple: true,
    muted: true,
    noValidate: true,
    open: true,
    playsInline: true,
    readOnly: true,
    required: true,
    reversed: true,
    scoped: true,
    seamless: true,
    selected: true,
    itemScope: true,
  },

  hasOverloadedBooleanValue: {
    download: true,
  },

  hasNumericValue: {
    cols: true,
    rows: true,
    rowSpan: true,
    size: true,
    span: true,
    start: true,
  },

  hasPositiveNumericValue: {
    rows: true,
    size: true,
    span: true,
  },

  mutationMethod: {
    value: function(node, value) {
      if (value == null) {
        return node.removeAttribute('value');
      }

      // Number inputs get special treatment due to some edge cases in
      // Chrome. Let everything else assign the value attribute as normal.
      // https://github.com/facebook/react/issues/7253#issuecomment-236074326
      if (node.type !== 'number' || node.hasAttribute('value') === false) {
        node.setAttribute('value', '' + value);
      } else if (
        node.validity &&
        !node.validity.badInput &&
        node.ownerDocument.activeElement !== node
      ) {
        // Don't assign an attribute if validation reports bad
        // input. Chrome will clear the value. Additionally, don't
        // operate on inputs that have focus, otherwise Chrome might
        // strip off trailing decimal places and cause the user's
        // cursor position to jump to the beginning of the input.
        //
        // In ReactDOMInput, we have an onBlur event that will trigger
        // this function again when focus is lost.
        node.setAttribute('value', '' + value);
      }
    },
  },

  /**
   * Mapping from lowercase property names to the properly cased version, used
   * to warn in the case of missing properties. Available only in __DEV__.
   *
   * autofocus is predefined, because adding it to the property whitelist
   * causes unintended side effects.
   *
   * @type {Object}
   */
  getPossibleStandardName: __DEV__ ? {autofocus: 'autoFocus'} : null,

  /**
   * Checks to see if a property name is within the list of properties
   * reserved for internal React operations. These properties should
   * not be set on an HTML element.
   *
   * @private
   * @param {string} name
   * @return {boolean} If the name is within reserved props
   */
  isReservedProp(name) {
    return RESERVED_PROPS.hasOwnProperty(name);
  },

  hasAttributeName(name) {
    return DOMProperty.attributeName.hasOwnProperty(name);
  },

  hasAttributeNamespace(name) {
    return DOMProperty.attributeNamespace.hasOwnProperty(name);
  },

  getAttributeName(name) {
    return DOMProperty.hasAttributeName(name)
      ? DOMProperty.attributeName[name]
      : name;
  },

  getAttributeNamespace(name) {
    return DOMProperty.hasAttributeNamespace(name)
      ? DOMProperty.attributeNamespace[name]
      : null;
  },

  isBooleanValue(name) {
    return DOMProperty.hasBooleanValue.hasOwnProperty(name);
  },

  isOverloadedBooleanValue(name) {
    return DOMProperty.hasOverloadedBooleanValue.hasOwnProperty(name);
  },

  isNumericValue(name) {
    return DOMProperty.hasNumericValue.hasOwnProperty(name);
  },

  isPositiveNumericValue(name) {
    return DOMProperty.hasPositiveNumericValue.hasOwnProperty(name);
  },

  // Do not assign reserved properties or functions. Event handlers should
  // not exist in markup.
  isWriteable(name, value) {
    return !DOMProperty.isReservedProp(name) && typeof value !== 'function';
  },

  useProperty(name) {
    return DOMProperty.mustUseProperty.hasOwnProperty(name);
  },

  useMutationMethod(name) {
    return DOMProperty.mutationMethod.hasOwnProperty(name);
  },

  needsEmptyStringValue(name, value) {
    return (
      DOMProperty.isBooleanValue(name) ||
      (DOMProperty.isOverloadedBooleanValue(name) && value === true)
    );
  },
};

module.exports = DOMProperty;
