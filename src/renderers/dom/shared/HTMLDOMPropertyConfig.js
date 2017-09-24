/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HTMLDOMPropertyConfig
 */

'use strict';

var HTMLDOMPropertyConfig = {
  // When adding attributes to this list, be sure to also add them to
  // the `possibleStandardNames` module to ensure casing and incorrect
  // name warnings.
  Properties: {
    allowFullScreen: 0,
    // IE only true/false iFrame attribute
    // https://msdn.microsoft.com/en-us/library/ms533072(v=vs.85).aspx
    allowTransparency: 0,
    // specifies target context for links with `preload` type
    async: 0,
    // autoFocus is polyfilled/normalized by AutoFocusUtils
    // autoFocus: 0,
    autoPlay: 0,
    capture: 0,
    checked: 0,
    cols: 0,
    contentEditable: 0,
    controls: 0,
    default: 0,
    defer: 0,
    disabled: 0,
    download: 0,
    draggable: 0,
    formNoValidate: 0,
    hidden: 0,
    loop: 0,
    multiple: 0,
    muted: 0,
    noValidate: 0,
    open: 0,
    playsInline: 0,
    readOnly: 0,
    required: 0,
    reversed: 0,
    rows: 0,
    rowSpan: 0,
    scoped: 0,
    seamless: 0,
    selected: 0,
    size: 0,
    start: 0,
    // support for projecting regular DOM Elements via V1 named slots ( shadow dom )
    span: 0,
    spellCheck: 0,
    // Style must be explicitly set in the attribute list. React components
    // expect a style object
    style: 0,
    itemScope: 0,
    // These attributes must stay in the white-list because they have
    // different attribute names (see DOMAttributeNames below)
    acceptCharset: 0,
    className: 0,
    htmlFor: 0,
    httpEquiv: 0,
    // Attributes with mutation methods must be specified in the whitelist
    // Set the string boolean flag to allow the behavior
    value: 0,
  },
};

module.exports = HTMLDOMPropertyConfig;
