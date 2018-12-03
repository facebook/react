/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
export const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;
export const COMMENT_NODE = 8;
export const DOCUMENT_NODE = 9;
export const DOCUMENT_FRAGMENT_NODE = 11;
export const XLINK_NS = 'http://www.w3.org/1999/xlink';
export const XML_NS = 'http://www.w3.org/XML/1998/namespace';

export const DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
export const SUPPRESS_CONTENT_EDITABLE_WARNING =
  'suppressContentEditableWarning';
export const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
export const AUTOFOCUS = 'autoFocus';
export const CHILDREN = 'children';
export const STYLE = 'style';
export const HTML = '__html';
export const ROOT_ATTRIBUTE_NAME = 'data-reactroot';

export const interactiveEventNames = new Set([
  'blur',
  'cancel',
  'click',
  'close',
  'contextmenu',
  'copy',
  'cut',
  'auxclick',
  'dblclick',
  'dragend',
  'dragstart',
  'drop',
  'focus',
  'input',
  'invalid',
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseup',
  'paste',
  'pause',
  'play',
  'pointercancel',
  'pointerdown',
  'pointerup',
  'pointerchange',
  'reset',
  'seeked',
  'submit',
  'touchcancel',
  'touchend',
  'touchstart',
  'volumechange',
]);

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
export const isUnitlessNumber = new Set([
  'animationIterationCount',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'gridArea',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'fontWeight',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',

  // SVG-related properties
  'fillOpacity',
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
]);

/**
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */
function prefixKey(prefix, key) {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */
const prefixes = ['Webkit', 'ms', 'Moz', 'O'];

// Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.
Array.from(isUnitlessNumber).forEach(function(prop) {
  prefixes.forEach(function(prefix) {
    isUnitlessNumber.add(prefixKey(prefix, prop));
  });
});

/**
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
 */
export const supportedInputTypes = new Set([
  'color',
  'date',
  'datetime',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'range',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);
