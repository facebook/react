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

const LOGGING_INTERVAL = 500;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// We need to create a queue to ensure an interval between sending events
// otherwise Meta's logging system will drop some of them.
function createLoggingQueue<T>(logFunc: T => void): {
  push: (T) => void,
  process: () => void,
} {
  const eventQueue: Array<T> = [];
  let pending = false;

  function processQueue() {
    if (eventQueue.length === 0) {
      pending = false;
      return;
    }
    // prevent multiple events from being sent at the same time
    if (pending) {
      return;
    }
    pending = true;
    const event = eventQueue.shift();
    logFunc(event);
    delay(LOGGING_INTERVAL).then(() => {
      // process the next event in the queue
      pending = false;
      processQueue();
    });
  }

  function pushEvent(event: T) {
    eventQueue.push(event);
  }

  return {
    push: pushEvent,
    process: processQueue
  }
}

export function registerDevToolsEventLogger(surface: string) {
  const queue = createLoggingQueue<LogEvent>(event => {
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
    }
  });

  function logEvent(event: LogEvent) {
    if (enableLogger) {
      if (loggingIFrame != null) {
        // push the event and start processing it
        queue.push(event);
        queue.process();
      } else {
        // push the event in queue and wait for the logging iframe to be created
        queue.push(event);
      }
    }
  }

  function handleLoggingIFrameLoaded(iframe) {
    if (loggingIFrame != null) {
      return;
    }

    loggingIFrame = iframe;
    // we might already have missed some events, so send them now
    queue.process();
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
