/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import {__PROFILE__} from './constants';

let loggers = [];

export const logEvent: ?LogFunction =
  __PROFILE__ === true
    ? function eventLogger(event: LogEvent): void {
        loggers.forEach(logger => {
          logger(event);
        });
      }
    : null;

export function registerEventLogger(eventLogger: LogFunction): () => void {
  if (__PROFILE__) {
    loggers.push(eventLogger);
    return () => {
      loggers = loggers.filter(logger => logger !== eventLogger);
    };
  }
  return () => {};
}

export type ParseHookNamesEvents =
  | 'loadSourceFiles'
  | 'extractAndLoadSourceMaps'
  | 'parseSourceAST'
  | 'findHookNames';

export type LogEvent =
  | {|
      +name: 'parseHookNames',
      +numberOfHooks: number,
      +durationMs: number,
    |}
  | {|
      +name: ParseHookNamesEvents,
      +durationMs: number,
      +hookName: string,
      +locationKey: string,
    |};

export type LogFunction = LogEvent => void;
