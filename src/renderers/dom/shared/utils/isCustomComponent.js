/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule isCustomComponent
 * @flow
 */

'use strict';

var DOMNamespaces = require('DOMNamespaces');
var invariant = require('invariant');
var HTML_NAMESPACE = DOMNamespaces.Namespaces.html;

function isCustomComponent(
  tagName: string,
  props: Object,
  domElement: Element | null,
  namespaceURI: string | null,
) {
  if (domElement !== null && namespaceURI !== null) {
    invariant(
      false,
      'Either pass domElement or namespaceURI, but not both. This error is likely ' +
        'caused by a bug in React. Please file an issue.',
    );
  }
  if (tagName.indexOf('-') >= 0 || typeof props.is === 'string') {
    if (domElement === null) {
      // TODO: We always have a namespace with fiber. Drop the first
      // check when Stack is removed.
      return namespaceURI === null || namespaceURI === HTML_NAMESPACE;
    }
    return domElement.namespaceURI === HTML_NAMESPACE;
  }

  return false;
}

module.exports = isCustomComponent;
