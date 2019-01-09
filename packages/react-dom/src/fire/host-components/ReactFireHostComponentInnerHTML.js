/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {SVG_NAMESPACE} from '../ReactFireDOMConfig';

declare var MSApp: Object;

/**
 * Create a function which has 'unsafe' privileges (required by windows8 apps)
 */
const createMicrosoftUnsafeLocalFunction = function(func: any) {
  if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
    return function(arg0: any, arg1: any, arg2: any, arg3: any) {
      MSApp.execUnsafeLocalFunction(function() {
        return func(arg0, arg1, arg2, arg3);
      });
    };
  } else {
    return func;
  }
};

// SVG temp container for IE lacking innerHTML
let reusableSVGContainer;

export const setInnerHTML = createMicrosoftUnsafeLocalFunction(
  (node: Element, html: string) => {
    // IE does not have innerHTML for SVG nodes, so instead we inject the
    // new markup in a temp node and then move the child nodes across into
    // the target node

    if (node.namespaceURI === SVG_NAMESPACE && !('innerHTML' in node)) {
      reusableSVGContainer =
        reusableSVGContainer || document.createElement('div');
      reusableSVGContainer.innerHTML = '<svg>' + html + '</svg>';
      const svgNode = reusableSVGContainer.firstChild;
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
      while (svgNode.firstChild) {
        node.appendChild(svgNode.firstChild);
      }
    } else {
      node.innerHTML = html;
    }
  },
);
