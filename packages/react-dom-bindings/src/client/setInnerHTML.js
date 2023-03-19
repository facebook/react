/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* globals MSApp */

import {SVG_NAMESPACE} from './DOMNamespaces';
import {enableTrustedTypesIntegration} from 'shared/ReactFeatureFlags';

// SVG temp container for IE lacking innerHTML
let reusableSVGContainer: HTMLElement;

function setInnerHTMLImpl(
  node: Element,
  html: {valueOf(): {toString(): string, ...}, ...},
): void {
  if (node.namespaceURI === SVG_NAMESPACE) {
    if (__DEV__) {
      if (enableTrustedTypesIntegration) {
        // TODO: reconsider the text of this warning and when it should show
        // before enabling the feature flag.
        if (typeof trustedTypes !== 'undefined') {
          console.error(
            "Using 'dangerouslySetInnerHTML' in an svg element with " +
              'Trusted Types enabled in an Internet Explorer will cause ' +
              'the trusted value to be converted to string. Assigning string ' +
              "to 'innerHTML' will throw an error if Trusted Types are enforced. " +
              "You can try to wrap your svg element inside a div and use 'dangerouslySetInnerHTML' " +
              'on the enclosing div instead.',
          );
        }
      }
    }
    if (!('innerHTML' in node)) {
      // IE does not have innerHTML for SVG nodes, so instead we inject the
      // new markup in a temp node and then move the child nodes across into
      // the target node
      reusableSVGContainer =
        reusableSVGContainer || document.createElement('div');
      reusableSVGContainer.innerHTML =
        '<svg>' + html.valueOf().toString() + '</svg>';
      const svgNode = reusableSVGContainer.firstChild;
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
      // $FlowFixMe[incompatible-use]
      // $FlowFixMe[incompatible-type]
      while (svgNode.firstChild) {
        node.appendChild(svgNode.firstChild);
      }
      return;
    }
  }
  node.innerHTML = (html: any);
}

let setInnerHTML: (
  node: Element,
  html: {valueOf(): {toString(): string, ...}, ...},
) => void = setInnerHTMLImpl;
// $FlowFixMe[cannot-resolve-name]
if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
  /**
   * Create a function which has 'unsafe' privileges (required by windows8 apps)
   */
  setInnerHTML = function (
    node: Element,
    html: {valueOf(): {toString(): string, ...}, ...},
  ): void {
    // $FlowFixMe[cannot-resolve-name]
    return MSApp.execUnsafeLocalFunction(function () {
      return setInnerHTMLImpl(node, html);
    });
  };
}

export default setInnerHTML;
