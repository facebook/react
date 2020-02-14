/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TEXT_NODE} from '../shared/HTMLNodeType';

/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
function getEventTarget(nativeEvent) {
  // Fallback to nativeEvent.srcElement for IE9
  // https://github.com/facebook/react/issues/12506
  let target = nativeEvent.target || nativeEvent.srcElement || window;
  // This is for solve the webcomponent event not working issue. And it will works on all the browsers which are all support the shadowDom.
  // https://github.com/facebook/react/issues/9242
  let targetPath =
    nativeEvent.path ||
    (nativeEvent.composedPath && nativeEvent.composedPath());
  if (target.shadowRoot && targetPath && targetPath.length) {
    target = targetPath[0];
  }

  // Normalize SVG <use> element events #4963
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement;
  }

  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === TEXT_NODE ? target.parentNode : target;
}

export default getEventTarget;
