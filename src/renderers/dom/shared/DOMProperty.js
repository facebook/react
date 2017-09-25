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

// These attributes should be all lowercase to allow for
// case insensitive checks
var RESERVED_PROPS = {
  children: true,
  dangerouslySetInnerHTML: true,
  autoFocus: true,
  defaultValue: true,
  defaultChecked: true,
  innerHTML: true,
  suppressContentEditableWarning: true,
  style: true,
};

function setDOMValueAttribute(node, value) {
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
}

/* eslint-disable max-len */
var ATTRIBUTE_NAME_START_CHAR =
  ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
/* eslint-enable max-len */

var attributeNames = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
};

var CAMELIZE = /[\-\:]([a-z])/g;
var capitalize = token => token[1].toUpperCase();

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
].forEach(svgAttributeName => {
  var reactName = svgAttributeName.replace(CAMELIZE, capitalize);
  attributeNames[reactName] = svgAttributeName;
});

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
   * Checks whether a property name is a writeable attribute.
   * @method
   */
  shouldSetAttribute: function(name, value) {
    if (name !== 'style' && DOMProperty.isReservedProp(name)) {
      return false;
    }
    if (
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
        return DOMProperty.shouldAttributeAcceptBooleanValue(name);
      case 'undefined':
      case 'number':
      case 'string':
      case 'object':
        return true;
      default:
        // function, symbol
        return false;
    }
  },

  getAttributeName(propName) {
    return attributeNames.hasOwnProperty(propName)
      ? attributeNames[propName]
      : propName;
  },

  getAttributeNamespace(propName) {
    switch (propName) {
      case 'xmlBase':
      case 'xmlLang':
      case 'xmlSpace':
        return 'http://www.w3.org/XML/1998/namespace';
      case 'xlinkActuate':
      case 'xlinkArcrole':
      case 'xlinkHref':
      case 'xlinkRole':
      case 'xlinkShow':
      case 'xlinkTitle':
      case 'xlinkType':
        return 'http://www.w3.org/1999/xlink';
      default:
        return null;
    }
  },

  // If non-null, used instead of the property or `setAttribute()`.
  getMutationMethod(propName) {
    switch (propName) {
      case 'value':
        return setDOMValueAttribute;
      default:
        return null;
    }
  },

  getExpectedValueType(propName) {
    switch (propName) {
      // Numeric properties.
      // TODO: add an explanation.
      case 'rowSpan':
      case 'start':
        return 'number';
      // Positive numeric properties.
      // TODO: add an explanation.
      case 'cols':
      case 'rows':
      case 'size':
      case 'span':
        return 'positiveNumber';
      // Booleans.
      // The property should be removed when set to a falsey value.
      // case 'autoFocus': (Intentionally handled elsewhere.)
      case 'allowFullScreen':
      case 'async': // Specifies target context for links with `preload` type.
      case 'autoPlay':
      case 'capture':
      case 'checked':
      case 'controls':
      case 'default':
      case 'defer':
      case 'disabled':
      case 'formNoValidate':
      case 'hidden':
      case 'itemScope': // For Microdata. http://schema.org/docs/gs.html
      case 'loop':
      case 'multiple':
      case 'muted':
      case 'noValidate':
      case 'open':
      case 'playsInline':
      case 'readOnly':
      case 'required':
      case 'reversed':
      case 'scoped':
      case 'seamless':
      case 'selected':
        return 'boolean';
      // "String" booleans (TODO: explain the difference).
      case 'allowTransparency':
      case 'contentEditable':
      case 'draggable':
      case 'spellCheck':
      case 'value':
      case 'autoReverse':
      case 'externalResourcesRequired':
      case 'preserveAlpha':
        return 'stringBoolean';
      // Booleans or strings.
      // The property can be used as a flag as well as with a value.
      // Removed when strictly equal to false; present without a value when
      // strictly equal to true; present with a value otherwise.
      case 'download':
        return 'overloadedBoolean';
      // Unknown.
      default:
        return 'string';
    }
  },

  shouldIgnoreValue(name, value) {
    if (value == null) {
      return true;
    }
    switch (DOMProperty.getExpectedValueType(name)) {
      case 'number':
        return isNaN(value);
      case 'positiveNumber':
        return isNaN(value) || value < 1;
      case 'boolean':
        return !value;
      case 'overloadedBoolean':
        return value === false;
      default:
        return false;
    }
  },

  shouldUseProperty(propName) {
    switch (propName) {
      case 'checked':
      case 'multiple':
      case 'muted':
      case 'selected':
        // Caution; `option.selected` is not updated if `select.multiple` is
        // disabled with `removeAttribute`.
        return true;
      default:
        return false;
    }
  },

  shouldAttributeAcceptBooleanValue(name) {
    if (DOMProperty.isReservedProp(name)) {
      return true;
    }
    switch (DOMProperty.getExpectedValueType(name)) {
      case 'boolean':
      case 'overloadedBoolean':
      case 'stringBoolean':
        return true;
      default:
        var prefix = name.toLowerCase().slice(0, 5);
        return prefix === 'data-' || prefix === 'aria-';
    }
  },

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
};

module.exports = DOMProperty;
