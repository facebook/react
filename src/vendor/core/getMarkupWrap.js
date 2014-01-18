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
 * @providesModule getMarkupWrap
 */

var ExecutionEnvironment = require('ExecutionEnvironment');

var invariant = require('invariant');

/**
 * Dummy container used to detect which wraps are necessary.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 *
 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
 */
var shouldWrap = {
  // Force wrapping for SVG elements because if they get created inside a <div>,
  // they will be initialized in the wrong namespace (and will not display).
  'altGlyph': true,
  'altGlyphDef': true,
  'altGlyphItem': true,
  'animate': true,
  'animateColor': true,
  'animateMotion': true,
  'animateTransform': true,
  'circle': true,
  'clipPath': true,
  'color-profile': true,
  'cursor': true,
  'defs': true,
  'desc': true,
  'feBlend': true,
  'feColorMatrix': true,
  'feComponentTransfer': true,
  'feComposite': true,
  'feConvolveMatrix': true,
  'feDiffuseLighting': true,
  'feDisplacementMap': true,
  'feDistantLight': true,
  'feFlood': true,
  'feFuncA': true,
  'feFuncB': true,
  'feFuncG': true,
  'feFuncR': true,
  'feGaussianBlur': true,
  'feImage': true,
  'feMerge': true,
  'feMergeNode': true,
  'feMorphology': true,
  'feOffset': true,
  'fePointLight': true,
  'feSpecularLighting': true,
  'feSpotLight': true,
  'feTile': true,
  'feTurbulence': true,
  'filter': true,
  'font': true,
  'font-face': true,
  'font-face-format': true,
  'font-face-name': true,
  'font-face-src': true,
  'font-face-uri': true,
  'foreignObject': true,
  'g': true,
  'glyph': true,
  'glyphRef': true,
  'hkern': true,
  'image': true,
  'line': true,
  'linearGradient': true,
  'marker': true,
  'mask': true,
  'metadata': true,
  'missing-glyph': true,
  'mpath': true,
  'path': true,
  'pattern': true,
  'polygon': true,
  'polyline': true,
  'radialGradient': true,
  'rect': true,
  'set': true,
  'stop': true,
  'switch': true,
  'symbol': true,
  'text': true,
  'textPath': true,
  'tref': true,
  'tspan': true,
  'use': true,
  'view': true,
  'vkern': true
};

var selectWrap = [1, '<select multiple="true">', '</select>'];
var tableWrap = [1, '<table>', '</table>'];
var trWrap = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

var svgWrap = [1, '<svg>', '</svg>'];

var markupWrap = {
  '*': [1, '?<div>', '</div>'],

  'area': [1, '<map>', '</map>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'param': [1, '<object>', '</object>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],

  'optgroup': selectWrap,
  'option': selectWrap,

  'caption': tableWrap,
  'colgroup': tableWrap,
  'tbody': tableWrap,
  'tfoot': tableWrap,
  'thead': tableWrap,

  'td': trWrap,
  'th': trWrap,

  'altGlyph': svgWrap,
  'altGlyphDef': svgWrap,
  'altGlyphItem': svgWrap,
  'animate': svgWrap,
  'animateColor': svgWrap,
  'animateMotion': svgWrap,
  'animateTransform': svgWrap,
  'circle': svgWrap,
  'clipPath': svgWrap,
  'color-profile': svgWrap,
  'cursor': svgWrap,
  'defs': svgWrap,
  'desc': svgWrap,
  'feBlend': svgWrap,
  'feColorMatrix': svgWrap,
  'feComponentTransfer': svgWrap,
  'feComposite': svgWrap,
  'feConvolveMatrix': svgWrap,
  'feDiffuseLighting': svgWrap,
  'feDisplacementMap': svgWrap,
  'feDistantLight': svgWrap,
  'feFlood': svgWrap,
  'feFuncA': svgWrap,
  'feFuncB': svgWrap,
  'feFuncG': svgWrap,
  'feFuncR': svgWrap,
  'feGaussianBlur': svgWrap,
  'feImage': svgWrap,
  'feMerge': svgWrap,
  'feMergeNode': svgWrap,
  'feMorphology': svgWrap,
  'feOffset': svgWrap,
  'fePointLight': svgWrap,
  'feSpecularLighting': svgWrap,
  'feSpotLight': svgWrap,
  'feTile': svgWrap,
  'feTurbulence': svgWrap,
  'filter': svgWrap,
  'font': svgWrap,
  'font-face': svgWrap,
  'font-face-format': svgWrap,
  'font-face-name': svgWrap,
  'font-face-src': svgWrap,
  'font-face-uri': svgWrap,
  'foreignObject': svgWrap,
  'g': svgWrap,
  'glyph': svgWrap,
  'glyphRef': svgWrap,
  'hkern': svgWrap,
  'image': svgWrap,
  'line': svgWrap,
  'linearGradient': svgWrap,
  'marker': svgWrap,
  'mask': svgWrap,
  'metadata': svgWrap,
  'missing-glyph': svgWrap,
  'mpath': svgWrap,
  'path': svgWrap,
  'pattern': svgWrap,
  'polygon': svgWrap,
  'polyline': svgWrap,
  'radialGradient': svgWrap,
  'rect': svgWrap,
  'set': svgWrap,
  'stop': svgWrap,
  'switch': svgWrap,
  'symbol': svgWrap,
  'text': svgWrap,
  'textPath': svgWrap,
  'tref': svgWrap,
  'tspan': svgWrap,
  'use': svgWrap,
  'view': svgWrap,
  'vkern': svgWrap
};

/**
 * Gets the markup wrap configuration for the supplied `nodeName`.
 *
 * NOTE: This lazily detects which wraps are necessary for the current browser.
 *
 * @param {string} nodeName Lowercase `nodeName`.
 * @return {?array} Markup wrap configuration, if applicable.
 */
function getMarkupWrap(nodeName) {
  invariant(!!dummyNode, 'Markup wrapping node not initialized');
  if (!markupWrap.hasOwnProperty(nodeName)) {
    nodeName = '*';
  }
  if (!shouldWrap.hasOwnProperty(nodeName)) {
    if (nodeName === '*') {
      dummyNode.innerHTML = '<link />';
    } else {
      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    }
    shouldWrap[nodeName] = !dummyNode.firstChild;
  }
  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
}


module.exports = getMarkupWrap;
