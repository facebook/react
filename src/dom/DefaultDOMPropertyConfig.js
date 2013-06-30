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
 * @providesModule DefaultDOMPropertyConfig
 */

"use strict";

var DOMProperty = require('DOMProperty');

var DefaultDOMPropertyConfig = {
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  ),
  Properties: {
    /**
     * Standard Properties
     */
    accept: null,
    action: null,
    ajaxify: DOMProperty.injection.MUST_USE_ATTRIBUTE,
    allowFullScreen: DOMProperty.injection.MUST_USE_ATTRIBUTE |
      DOMProperty.injection.HAS_BOOLEAN_VALUE,
    alt: null,
    autoComplete: null,
    autoplay: DOMProperty.injection.HAS_BOOLEAN_VALUE,
    cellPadding: null,
    cellSpacing: null,
    checked: DOMProperty.injection.MUST_USE_PROPERTY |
      DOMProperty.injection.HAS_BOOLEAN_VALUE,
    className: DOMProperty.injection.MUST_USE_PROPERTY,
    colSpan: null,
    contentEditable: null,
    controls: DOMProperty.injection.MUST_USE_PROPERTY |
      DOMProperty.injection.HAS_BOOLEAN_VALUE,
    data: null, // For `<object />` acts as `src`.
    dir: null,
    disabled: DOMProperty.injection.MUST_USE_PROPERTY |
      DOMProperty.injection.HAS_BOOLEAN_VALUE,
    draggable: null,
    enctype: null,
    height: DOMProperty.injection.MUST_USE_ATTRIBUTE,
    href: null,
    htmlFor: null,
    max: null,
    method: null,
    min: null,
    multiple: DOMProperty.injection.MUST_USE_PROPERTY |
      DOMProperty.injection.HAS_BOOLEAN_VALUE,
    name: null,
    poster: null,
    preload: null,
    placeholder: null,
    rel: null,
    required: DOMProperty.injection.HAS_BOOLEAN_VALUE,
    role: DOMProperty.injection.MUST_USE_ATTRIBUTE,
    scrollLeft: DOMProperty.injection.MUST_USE_PROPERTY,
    scrollTop: DOMProperty.injection.MUST_USE_PROPERTY,
    selected: DOMProperty.injection.MUST_USE_PROPERTY |
      DOMProperty.injection.HAS_BOOLEAN_VALUE,
    spellCheck: null,
    src: null,
    step: null,
    style: null,
    tabIndex: null,
    target: null,
    title: null,
    type: null,
    value: DOMProperty.injection.MUST_USE_PROPERTY |
      DOMProperty.injection.HAS_SIDE_EFFECTS,
    width: DOMProperty.injection.MUST_USE_ATTRIBUTE,
    wmode: DOMProperty.injection.MUST_USE_ATTRIBUTE,
    /**
     * SVG Properties
     */
    cx: DOMProperty.injection.MUST_USE_PROPERTY,
    cy: DOMProperty.injection.MUST_USE_PROPERTY,
    d: DOMProperty.injection.MUST_USE_PROPERTY,
    fill: DOMProperty.injection.MUST_USE_PROPERTY,
    fx: DOMProperty.injection.MUST_USE_PROPERTY,
    fy: DOMProperty.injection.MUST_USE_PROPERTY,
    points: DOMProperty.injection.MUST_USE_PROPERTY,
    r: DOMProperty.injection.MUST_USE_PROPERTY,
    stroke: DOMProperty.injection.MUST_USE_PROPERTY,
    strokeLinecap: DOMProperty.injection.MUST_USE_PROPERTY,
    strokeWidth: DOMProperty.injection.MUST_USE_PROPERTY,
    transform: DOMProperty.injection.MUST_USE_PROPERTY,
    x: DOMProperty.injection.MUST_USE_PROPERTY,
    x1: DOMProperty.injection.MUST_USE_PROPERTY,
    x2: DOMProperty.injection.MUST_USE_PROPERTY,
    version: DOMProperty.injection.MUST_USE_PROPERTY,
    viewBox: DOMProperty.injection.MUST_USE_PROPERTY,
    y: DOMProperty.injection.MUST_USE_PROPERTY,
    y1: DOMProperty.injection.MUST_USE_PROPERTY,
    y2: DOMProperty.injection.MUST_USE_PROPERTY,
    spreadMethod: DOMProperty.injection.MUST_USE_PROPERTY,
    offset: DOMProperty.injection.MUST_USE_PROPERTY,
    stopColor: DOMProperty.injection.MUST_USE_PROPERTY,
    stopOpacity: DOMProperty.injection.MUST_USE_PROPERTY,
    gradientUnits: DOMProperty.injection.MUST_USE_PROPERTY,
    gradientTransform: DOMProperty.injection.MUST_USE_PROPERTY
  },
  DOMAttributeNames: {
    className: 'class',
    htmlFor: 'for',
    strokeLinecap: 'stroke-linecap',
    strokeWidth: 'stroke-width',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity'
  },
  DOMPropertyNames: {
    autoComplete: 'autocomplete',
    spellCheck: 'spellcheck'
  },
  DOMMutationMethods: {
    /**
     * Setting `className` to null may cause it to be set to the string "null".
     *
     * @param {DOMElement} node
     * @param {*} value
     */
    className: function(node, value) {
      node.className = value || '';
    }
  }
};

module.exports = DefaultDOMPropertyConfig;