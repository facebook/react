/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import type {LogEvent} from 'react-devtools-shared/src/Logger';

import {registerEventLogger} from 'react-devtools-shared/src/Logger';
import {enableLogger} from 'react-devtools-feature-flags';

let loggingIFrame = null;
let missedEvents = [];

export function registerDevToolsEventLogger(surface: string) {
  function logEvent(event: LogEvent) {
    if (enableLogger) {
      if (loggingIFrame != null) {
        loggingIFrame.contentWindow.postMessage(
          {
            source: 'react-devtools-logging',
            event: event,
            context: {
              surface,
              version: process.env.DEVTOOLS_VERSION,
            },
          },
          '*',
        );
      } else {
        missedEvents.push(event);
      }
    }
  }

  function handleLoggingIFrameLoaded(iframe) {
    if (loggingIFrame != null) {
      return;
    }

    loggingIFrame = iframe;
    if (missedEvents.length > 0) {
      missedEvents.forEach(logEvent);
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
      iframe.onload = function(...args) {
        handleLoggingIFrameLoaded(iframe);
      };
      body.appendChild(iframe);
    }
  }
}
