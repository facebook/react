/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {ServerOptions} from './ReactPartialRenderer';

import ReactPartialRenderer from './ReactPartialRenderer';

// This is a ReadableStream which wraps the ReactDOMPartialRenderer.
function ReactMarkupReadableStream(element, makeStaticMarkup, options) {
  let partialRenderer;
  return new ReadableStream({
    // Calls the ReadableStream(options). Consider exposing built-in
    // features like highWaterMark in the future.
    start() {
      partialRenderer = new ReactPartialRenderer(
        element,
        makeStaticMarkup,
        options,
      );
    },
    pull(controller) {
      try {
        const chunk = partialRenderer.read(controller.desiredSize);
        if (chunk === null) controller.close();
        controller.enqueue(chunk);
      } catch (e) {
        partialRenderer.destroy(e);
        controller.error(e);
      }
    },
    cancel(reason) {
      partialRenderer.destroy(reason);
    },
  });
}

/**
 * Render a ReactElement to its initial HTML.
 * See https://reactjs.org/docs/react-dom-server.html#rendertonodestream
 */
export function renderToBrowserStream(element, options?: ServerOptions) {
  return new ReactMarkupReadableStream(element, false, options);
}

/**
 * Similar to renderToStream, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostaticnodestream
 */
export function renderToStaticBrowserStream(element, options?: ServerOptions) {
  return new ReactMarkupReadableStream(element, true, options);
}
