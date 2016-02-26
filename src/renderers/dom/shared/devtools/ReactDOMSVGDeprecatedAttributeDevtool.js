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

const DOMProperty = require('DOMProperty');

const warning = require('warning');

if (__DEV__) {
  const reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true,
  };
  const warnedSVGAttributes = {};

  var warnDeprecatedSVGAttribute = function(name) {
    if (!DOMProperty.properties.hasOwnProperty(name)) {
      return;
    }

    if (reactProps.hasOwnProperty(name) && reactProps[name] ||
        warnedSVGAttributes.hasOwnProperty(name) && warnedSVGAttributes[name]) {
      return;
    }

    const { attributeName, attributeNamespace } = DOMProperty.properties[name];
    if (attributeNamespace || name === attributeName) {
      return;
    }

    warning(
      false,
      'SVG property %s is deprecated. Use the original attribute name ' +
      '%s for SVG tags instead.',
      name,
      attributeName
    );
  };
}

const ReactDOMSVGDeprecatedAttributeDevtool = {
  onCreateMarkupForSVGAttribute(name, value) {
    warnDeprecatedSVGAttribute(name);
  },
  onSetValueForSVGAttribute(node, name, value) {
    warnDeprecatedSVGAttribute(name);
  },
};

module.exports = ReactDOMSVGDeprecatedAttributeDevtool;
