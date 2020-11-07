/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ServerOptions} from './ReactPartialRenderer';
import ReactPartialRenderer from './ReactPartialRenderer';

/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostring
 */
export function renderToString(element, options?: ServerOptions) {
  const renderer = new ReactPartialRenderer(element, false, options);
  try {
    const markup = renderer.read(Infinity);
    return markup;
  } finally {
    renderer.destroy();
  }
}

/**
 * Similar to renderToString, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostaticmarkup
 */
export function renderToStaticMarkup(element, options?: ServerOptions) {
  const renderer = new ReactPartialRenderer(element, true, options);
  try {
    const markup = renderer.read(Infinity);
    return markup;
  } finally {
    renderer.destroy();
  }
}
