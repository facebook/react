/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { ErrorCode } from "./Diagnostic";
import * as IR from "./IR";

/**
 * Interface to log from the Babel plugin. In environments where we cannot
 * log to stdout/stderr this makes it easy to disable.
 */
export interface Logger {
  warn(message: string): void;
  error(message: string): void;
  logEvent(event: LogEvent): void;
}

/**
 * Define events that need to be logged
 */
type LogEvent =
  | {
      name: "bailout";
      reason: string;
    }
  | {
      name: "registerReactFunc";
      flags: { name: IR.Name; kind: IR.FuncKind };
    }
  | {
      name: "diagnostics";
      opts: {
        code: ErrorCode;
        loc: t.SourceLocation | null;
      };
    }
  | {
      name: "matchHookCall";
      kind: IR.HookKind;
    };

/**
 * Logs to `console`.
 */
export const consoleLogger: Logger = {
  warn(message: string) {
    console.warn(message);
  },
  error(message: string) {
    console.error(message);
  },
  logEvent(_event: LogEvent) {},
};

/**
 * Logs to an in memory array.
 *
 * @param logs Logs are written to this array.
 */
export function createArrayLogger(logs: Array<string>): Logger {
  return {
    warn(message: string) {
      logs.push(`[WARNING] ${message}`);
    },

    error(message: string) {
      logs.push(`[ERROR] ${message}`);
    },

    logEvent(_event: LogEvent) {},
  };
}

/**
 * Does not log anything.
 */
export const noopLogger: Logger = {
  warn(_message: string) {},
  error(_message: string) {},
  logEvent(_event: LogEvent) {},
};
