/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule validateDOMTag
 */

'use strict';

var emptyFunction = require('emptyFunction');
var warning = require('warning');

var validateDOMTag = emptyFunction;

//
// - DOM default namespace
// - SVG namespace
// - MATHMl namespace
//
if (__DEV__) {
  // https://www.w3.org/TR/SVG11/eltindex.html
  //
  // NOTE: We lowercase all elements here to match the behaviour in
  // ReactDOMComponent
  var svgTags = [
    'a', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
    'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
    'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer',
    'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', ,
    'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
    'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology',
    'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
    'feTurbulence', 'filter', 'font', 'font-face', 'font-face-format',
    'font-face-name', 'font-face-src', 'font-face-uri', 'foreignObject', 'g',
    'glyph', 'glyphRef', 'hkern', 'image', 'line', 'linearGradient', 'marker',
    'mask', 'metadata', 'missing-glyph', 'mpath', 'path', 'pattern', 'polygon', 'polyline',
    'radialGradient', 'rect', 'script', 'set', 'stop', 'style', 'svg', 'switch',
    'symbol', 'text', 'textPath', 'title', 'tref', 'tspan', 'use', 'view', 'vkern'
  ].map(e => e.toLowerCase());

  var UnknownConstructor = typeof HTMLGenericElement !== "undefined"
    ? HTMLGenericElement
    : HTMLUnknownElement;

  validateDOMTag = function(tag, parentInfo) {
    var knownTag = null;

    if (parentInfo.svgTagInScope || tag === 'svg') {
      knownTag = !(svgTags.indexOf(tag) === -1);
    } else {
      /**
       * This will also handle custom elements instead of checking whether the tag
       * is registered in the CustomElementRegistry.
       *
       * https://www.w3.org/TR/custom-elements/#custom-elements-api
       */
      knownTag = !(document.createElement(tag) instanceof UnknownConstructor)
    }

    warning(
      knownTag,
      'Warning: The tag <%s> is unrecognized in this browser. If you meant to' +
      ' render a React component, start its name with an uppercase letter.',
      tag
    );
  }
}

module.exports = validateDOMTag;
