/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import type {LoggerEvent} from 'react-devtools-shared/src/Logger';

import {registerEventLogger} from 'react-devtools-shared/src/Logger';
import {enableLogger} from 'react-devtools-feature-flags';

let loggingIFrame = null;
let missedEvents: Array<LoggerEvent> = [];

type LoggerContext = {
  page_url: ?string,
};

export function registerDevToolsEventLogger(
  surface: string,
  fetchAdditionalContext: ?() =>
    | LoggerContext
    | ?(() => Promise<LoggerContext>),
): void {
  async function logEvent(event: LoggerEvent) {
    if (enableLogger) {
      if (loggingIFrame != null) {
        let metadata = null;
        if (event.metadata != null) {
          metadata = event.metadata;
          // $FlowFixMe[cannot-write]: metadata is not writable and nullable
          // $FlowFixMe[prop-missing]
          delete event.metadata;
        }
        loggingIFrame.contentWindow.postMessage(
          {
            source: 'react-devtools-logging',
            event: event,
            context: {
              surface,
              version: process.env.DEVTOOLS_VERSION,
              metadata: metadata !== null ? JSON.stringify(metadata) : '',
              ...(fetchAdditionalContext != null
                ? // $FlowFixMe[not-an-object]
                  await fetchAdditionalContext()
                : {}),
            },
          },
          '*',
        );
      } else {
        missedEvents.push(event);
      }
    }
  }

  function handleLoggingIFrameLoaded(iframe: HTMLIFrameElement) {
    if (loggingIFrame != null) {
      return;
    }

    loggingIFrame = iframe;
    if (missedEvents.length > 0) {
      missedEvents.forEach(event => logEvent(event));
      missedEvents = [];
    }
  }

  // If logger is enabled, register a logger that captures logged events
  // and render iframe where the logged events will be reported to
  if (enableLogger) {
    const loggingUrl = process.env.LOGGING_URL;
    const body = document.body;
    if (
      typeof loggingUrl === 'string' &&
      loggingUrl.length > 0 &&
      body != null
    ) {
      registerEventLogger(logEvent);

      const iframe = document.createElement('iframe');
      iframe.src = loggingUrl;
      iframe.onload = function (...args) {
        handleLoggingIFrameLoaded(iframe);
      };
      body.appendChild(iframe);
    }
  }
}
