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

var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;
var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
var HAS_SIDE_EFFECTS = DOMProperty.injection.HAS_SIDE_EFFECTS;

var DefaultDOMPropertyConfig = {
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  ),
  Properties: {
    /**
     * Standard Properties
     */
    accessKey: null,
    accept: null,
    action: null,
    ajaxify: MUST_USE_ATTRIBUTE,
    allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    allowTransparency: MUST_USE_ATTRIBUTE,
    alt: null,
    autoComplete: null,
    autoFocus: HAS_BOOLEAN_VALUE,
    autoPlay: HAS_BOOLEAN_VALUE,
    cellPadding: null,
    cellSpacing: null,
    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    className: MUST_USE_PROPERTY,
    colSpan: null,
    contentEditable: null,
    contextMenu: MUST_USE_ATTRIBUTE,
    controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    data: null, // For `<object />` acts as `src`.
    dateTime: MUST_USE_ATTRIBUTE,
    dir: null,
    disabled: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    draggable: null,
    encType: null,
    frameBorder: MUST_USE_ATTRIBUTE,
    height: MUST_USE_ATTRIBUTE,
    hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    href: null,
    htmlFor: null,
    icon: null,
    id: MUST_USE_PROPERTY,
    label: null,
    lang: null,
    list: null,
    max: null,
    maxLength: MUST_USE_ATTRIBUTE,
    method: null,
    min: null,
    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    name: null,
    pattern: null,
    poster: null,
    preload: null,
    placeholder: null,
    radioGroup: null,
    rel: null,
    readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    required: HAS_BOOLEAN_VALUE,
    role: MUST_USE_ATTRIBUTE,
    scrollLeft: MUST_USE_PROPERTY,
    scrollTop: MUST_USE_PROPERTY,
    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    size: null,
    spellCheck: null,
    src: null,
    step: null,
    style: null,
    tabIndex: null,
    target: null,
    title: null,
    type: null,
    value: MUST_USE_PROPERTY | HAS_SIDE_EFFECTS,
    width: MUST_USE_ATTRIBUTE,
    wmode: MUST_USE_ATTRIBUTE,
    /**
     * SVG Properties
     */
    cx: MUST_USE_PROPERTY,
    cy: MUST_USE_PROPERTY,
    d: MUST_USE_PROPERTY,
    fill: MUST_USE_PROPERTY,
    fx: MUST_USE_PROPERTY,
    fy: MUST_USE_PROPERTY,
    points: MUST_USE_PROPERTY,
    r: MUST_USE_PROPERTY,
    stroke: MUST_USE_PROPERTY,
    strokeLinecap: MUST_USE_PROPERTY,
    strokeWidth: MUST_USE_PROPERTY,
    transform: MUST_USE_PROPERTY,
    x: MUST_USE_PROPERTY,
    x1: MUST_USE_PROPERTY,
    x2: MUST_USE_PROPERTY,
    version: MUST_USE_PROPERTY,
    viewBox: MUST_USE_PROPERTY,
    y: MUST_USE_PROPERTY,
    y1: MUST_USE_PROPERTY,
    y2: MUST_USE_PROPERTY,
    spreadMethod: MUST_USE_PROPERTY,
    offset: MUST_USE_PROPERTY,
    stopColor: MUST_USE_PROPERTY,
    stopOpacity: MUST_USE_PROPERTY,
    gradientUnits: MUST_USE_PROPERTY,
    gradientTransform: MUST_USE_PROPERTY
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
    autoFocus: 'autofocus',
    autoPlay: 'autoplay',
    encType: 'enctype',
    radioGroup: 'radiogroup',
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
