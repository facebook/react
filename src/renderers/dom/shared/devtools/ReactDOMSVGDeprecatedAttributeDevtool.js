/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMSVGDeprecatedAttributeDevtool
 */

'use strict';

var DOMProperty = require('DOMProperty');

var warning = require('warning');

if (__DEV__) {
  var reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true,
  };
  var warnedSVGAttributes = {};

  var warnDeprecatedSVGAttribute = function(name) {
    if (reactProps.hasOwnProperty(name) && reactProps[name]) {
      return;
    }

    if (!DOMProperty.properties.hasOwnProperty(name)) {
      return;
    }
    var { attributeName, attributeNamespace } = DOMProperty.properties[name];
    if (attributeNamespace || name === attributeName) {
      return;
    }

    if (warnedSVGAttributes.hasOwnProperty(name) && warnedSVGAttributes[name]) {
      return;
    }
    warnedSVGAttributes[name] = true;

    warning(
      false,
      'SVG property %s is deprecated. Use the original attribute name ' +
      '%s for SVG tags instead.',
      name,
      attributeName
    );
  };
}

var ReactDOMSVGDeprecatedAttributeDevtool = {
  onCreateMarkupForSVGAttribute(name, value) {
    warnDeprecatedSVGAttribute(name);
  },
  onSetValueForSVGAttribute(node, name, value) {
    warnDeprecatedSVGAttribute(name);
  },
};

module.exports = ReactDOMSVGDeprecatedAttributeDevtool;
