/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMProperty
 * @typechecks
 */

/*jslint bitwise: true */

"use strict";

var invariant = require('invariant');

var defaultValueCache = {};

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

  /**
   * Checks whether a property name is a standard property.
   * @type {Object}
   */
  isStandardName: {},

  /**
   * Mapping from normalized names to attribute names that differ. Attribute
   * names are used when rendering markup or with `*Attribute()`.
   * @type {Object}
   */
  getAttributeName: {},

  /**
   * Mapping from normalized names to properties on DOM node instances.
   * (This includes properties that mutate due to external factors.)
   * @type {Object}
   */
  getPropertyName: {},

  /**
   * Mapping from normalized names to mutation methods. This will only exist if
   * mutation cannot be set simply by the property or `setAttribute()`.
   * @type {Object}
   */
  getMutationMethod: {},

  /**
   * Whether the property must be accessed and mutated as an object property.
   * @type {Object}
   */
  mustUseAttribute: {},

  /**
   * Whether the property must be accessed and mutated using `*Attribute()`.
   * (This includes anything that fails `<propName> in <element>`.)
   * @type {Object}
   */
  mustUseProperty: {},

  /**
   * Whether the property should be removed when set to a falsey value.
   * @type {Object}
   */
  hasBooleanValue: {},

  /**
   * Whether or not setting a value causes side effects such as triggering
   * resources to be loaded or text selection changes. We must ensure that
   * the value is only set if it has changed.
   * @type {Object}
   */
  hasSideEffects: {},

  /**
   * Checks whether a property name is a custom attribute.
   * @method
   */
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  ),

  /**
   * Returns the default property value for a DOM property (i.e., not an
   * attribute). Most default values are '' or false, but not all. Worse yet,
   * some (in particular, `type`) vary depending on the type of element.
   *
   * TODO: Is it worth caching the test elements? Caching the properties
   * ourselves (as opposed to accessing from a cached test element every time)
   * looks probably worth it: http://jsperf.com/object-vs-element
   */
  getDefaultValueForProperty: function(nodeName, prop) {
    var nodeDefaults = defaultValueCache[nodeName];
    var testElement;
    if (!nodeDefaults) {
      defaultValueCache[nodeName] = nodeDefaults = {};
    }
    if (!(prop in nodeDefaults)) {
      testElement = document.createElement(nodeName);
      nodeDefaults[prop] = testElement[prop];
    }
    return nodeDefaults[prop];
  }
};

/**
 * Mapping from normalized, camelcased property names to a configuration that
 * specifies how the associated DOM property should be accessed or rendered.
 */
var MustUseAttribute  = 0x1;
var MustUseProperty   = 0x2;
var HasBooleanValue   = 0x4;
var HasSideEffects    = 0x8;

var Properties = {
  /**
   * Standard Properties
   */
  accept: null,
  action: null,
  ajaxify: MustUseAttribute,
  allowFullScreen: MustUseAttribute | HasBooleanValue,
  alt: null,
  autoComplete: null,
  autoplay: HasBooleanValue,
  cellPadding: null,
  cellSpacing: null,
  checked: MustUseProperty | HasBooleanValue,
  className: MustUseProperty,
  colSpan: null,
  contentEditable: null,
  controls: MustUseProperty | HasBooleanValue,
  data: null, // For `<object />` acts as `src`.
  dir: null,
  disabled: MustUseProperty | HasBooleanValue,
  enctype: null,
  height: MustUseAttribute,
  href: null,
  htmlFor: null,
  max: null,
  method: null,
  min: null,
  multiple: MustUseProperty | HasBooleanValue,
  name: null,
  poster: null,
  preload: null,
  placeholder: null,
  rel: null,
  required: HasBooleanValue,
  role: MustUseAttribute,
  scrollLeft: MustUseProperty,
  scrollTop: MustUseProperty,
  selected: MustUseProperty | HasBooleanValue,
  spellCheck: null,
  src: null,
  step: null,
  style: null,
  tabIndex: null,
  target: null,
  title: null,
  type: null,
  value: MustUseProperty | HasSideEffects,
  width: MustUseAttribute,
  wmode: MustUseAttribute,
  /**
   * SVG Properties
   */
  cx: MustUseProperty,
  cy: MustUseProperty,
  d: MustUseProperty,
  fill: MustUseProperty,
  fx: MustUseProperty,
  fy: MustUseProperty,
  points: MustUseProperty,
  r: MustUseProperty,
  stroke: MustUseProperty,
  strokeLinecap: MustUseProperty,
  strokeWidth: MustUseProperty,
  transform: MustUseProperty,
  x: MustUseProperty,
  x1: MustUseProperty,
  x2: MustUseProperty,
  version: MustUseProperty,
  viewBox: MustUseProperty,
  y: MustUseProperty,
  y1: MustUseProperty,
  y2: MustUseProperty,
  spreadMethod: MustUseProperty,
  offset: MustUseProperty,
  stopColor: MustUseProperty,
  stopOpacity: MustUseProperty,
  gradientUnits: MustUseProperty,
  gradientTransform: MustUseProperty
};

/**
 * Attribute names not specified use the **lowercase** normalized name.
 */
var DOMAttributeNames = {
  className: 'class',
  htmlFor: 'for',
  strokeLinecap: 'stroke-linecap',
  strokeWidth: 'stroke-width',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity'
};

/**
 * Property names not specified use the normalized name.
 */
var DOMPropertyNames = {
  autoComplete: 'autocomplete',
  spellCheck: 'spellcheck'
};

/**
 * Properties that require special mutation methods. If `value` is undefined,
 * the mutation method should unset the property.
 */
var DOMMutationMethods = {
  /**
   * Setting `className` to null may cause it to be set to the string "null".
   *
   * @param {DOMElement} node
   * @param {*} value
   */
  className: function(node, value) {
    node.className = value || '';
  }
};

for (var propName in Properties) {
  DOMProperty.isStandardName[propName] = true;

  DOMProperty.getAttributeName[propName] =
    DOMAttributeNames[propName] || propName.toLowerCase();

  DOMProperty.getPropertyName[propName] =
    DOMPropertyNames[propName] || propName;

  var mutationMethod = DOMMutationMethods[propName];
  if (mutationMethod) {
    DOMProperty.getMutationMethod[propName] = mutationMethod;
  }

  var propConfig = Properties[propName];
  DOMProperty.mustUseAttribute[propName] = propConfig & MustUseAttribute;
  DOMProperty.mustUseProperty[propName]  = propConfig & MustUseProperty;
  DOMProperty.hasBooleanValue[propName]  = propConfig & HasBooleanValue;
  DOMProperty.hasSideEffects[propName]   = propConfig & HasSideEffects;

  invariant(
    !DOMProperty.mustUseAttribute[propName] ||
    !DOMProperty.mustUseProperty[propName],
    'DOMProperty: Cannot use require using both attribute and property: %s',
    propName
  );
  invariant(
    DOMProperty.mustUseProperty[propName] ||
    !DOMProperty.hasSideEffects[propName],
    'DOMProperty: Properties that have side effects must use property: %s',
    propName
  );
}

module.exports = DOMProperty;
