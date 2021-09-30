/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import {enableLogger} from 'react-devtools-feature-flags';

type LoadHookNamesEvent = {|
  +event_name: 'loadHookNames',
  +event_status: 'success' | 'error' | 'timeout' | 'unknown',
  +duration_ms: number,
  +inspected_element_display_name: string | null,
  +inspected_element_number_of_hooks: number | null,
|};

// prettier-ignore
export type LogEvent =
  | LoadHookNamesEvent;

export type LogFunction = LogEvent => void;

let logFunctions: Array<LogFunction> = [];
export const logEvent: LogFunction =
  enableLogger === true
    ? function logEvent(event: LogEvent): void {
        logFunctions.forEach(log => {
          log(event);
        });
      }
    : function logEvent() {};

export const registerEventLogger =
  enableLogger === true
    ? function registerEventLogger(logFunction: LogFunction): () => void {
        if (enableLogger) {
          logFunctions.push(logFunction);
          return function unregisterEventLogger() {
            logFunctions = logFunctions.filter(log => log !== logFunction);
          };
        }
        return () => {};
      }
    : function registerEventLogger(logFunction: LogFunction) {
        return () => {};
      };
