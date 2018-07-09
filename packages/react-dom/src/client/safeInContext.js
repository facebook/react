/**
 * Copyright (c) 2018-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {getSafeInContext, setSafeInContext};
export type {SafeInContext};

/**
 * Called before React uses a value in a non-DOM-structure altering way.
 *
 * This function should not manipulate the DOM or have side effects visible
 * outside the scope of its call except where necessary to log policy violations.
 *
 * It is the implementor's responsibility to ensure that repeated calls in
 * a tight loop do not deny service, including bounding memory and network
 * usage for frequent policy violations.
 *
 * @param node A node such in the scope of `window.customElements`.
 *    I.e. any implicit adoption ( https://www.w3.org/TR/dom/#dom-core ) should
 *    happen before calling this function.
 * @param attributeOrPropertyName The name of the HTML attribute or JS property.
 *    Null iff value specifies textContent/nodeValue for a character data node.
 *    If value specifies, for example, the text content of a text node under a
 *    `<script>` element then node.parentNode should reach that script.
 * @param value the value before any coercion to DOMString so that safeInContext
 *    may treat values as privileged based on their runtime type.
 *
 * @return value or a suitable alternative.  Should not throw.
 */
type SafeInContext = (
  node: Node,
  attributeOrPropertyName: string,
  value: any,
) => any;

let safeInContext: SafeInContext | null = null;

function getSafeInContext(): SafeInContext | null {
  return safeInContext;
}

function setSafeInContext(newSafeInContext: SafeInContext | null) {
  safeInContext = newSafeInContext;
}
