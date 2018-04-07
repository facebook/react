/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactPartialRenderer from './ReactPartialRenderer';

/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostring
 */
export function renderToString(element) {
  const renderer = new ReactPartialRenderer(element, false, false);
  const markup = renderer.read(Infinity);
  return markup;
}

/**
 * Similar to renderToString, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostaticmarkup
 */
export function renderToStaticMarkup(element) {
  const renderer = new ReactPartialRenderer(element, true, false);
  const markup = renderer.read(Infinity);
  return markup;
}

/**
 * Render a ReactElement to its initial non-standard HTML. This should only be
 * used on the server.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostring
 */
export function renderToStringNonStandard(element) {
  const renderer = new ReactPartialRenderer(element, false, true);
  const markup = renderer.read(Infinity);
  return markup;
}

/**
 * Similar to renderToStringNonStandard, except this doesn't create extra DOM
 * attributes such as data-react-id that React uses internally.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostaticmarkup
 */
export function renderToStaticMarkupNonStandard(element) {
  const renderer = new ReactPartialRenderer(element, true, true);
  const markup = renderer.read(Infinity);
  return markup;
}
