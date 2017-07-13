/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DOMPreventedEvents
 */

'use strict';

/**
* @param {object} tag
* @return {boolean}
*/
var isInteractive = function(tag) {
  return (
    tag === 'button' ||
    tag === 'input' ||
    tag === 'select' ||
    tag === 'textarea'
  );
};

/**
* @param {string} listenerName Name of listener (e.g. `onClick`).
* @param {object} tagName Tag name of the source instance.
* @param {object} props Properties of the source instance.
* @return {boolean} True if event should be prevented.
*/
var shouldBePrevented = function(listenerName, tagName, props) {
  switch (listenerName) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
      return !!(props.disabled && isInteractive(tagName));
    default:
      return false;
  }
};

/*
 */
var DOMPreventedEvents = {
  /**
  * @param {string} listenerName Name of listener (e.g. `onClick`).
  * @param {object} tagName Tag name of the source instance.
  * @param {object} props Properties of the source instance.
  * @return {boolean} True if event should be prevented.
  */
  shouldBePrevented: shouldBePrevented,
};

module.exports = DOMPreventedEvents;
