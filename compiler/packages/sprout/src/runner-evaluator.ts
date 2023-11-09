/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { JSDOM } from "jsdom";
import util from "util";
import { initFbt, toJSON } from "./shared-runtime";
const React = require("react");
const render = require("@testing-library/react").render;

const { window: testWindow } = new JSDOM(undefined);

(globalThis as any).document = testWindow.document;
(globalThis as any).window = testWindow.window;
(globalThis as any).navigator = testWindow.navigator;
(globalThis as any).React = React;
(globalThis as any).render = render;
initFbt();

export type EvaluatorResult = {
  kind: "ok" | "exception" | "UnexpectedError";
  value: string;
  logs: Array<string>;
};

const PLACEHOLDER_VALUE = Symbol();
(globalThis as any).placeholderFn = function (..._args: Array<any>) {
  throw PLACEHOLDER_VALUE;
};
(globalThis as any).WrapperTestComponent = function (props: {
  fn: any;
  params: Array<any>;
}) {
  const result = props.fn(...props.params);
  // Hacky solution to determine whether the fixture returned jsx (which
  // needs to passed through to React's runtime as-is) or a non-jsx value
  // (which should be converted to a string).
  if (typeof result === "object" && result != null && "$$typeof" in result) {
    return result;
  } else {
    return toJSON(result);
  }
};

function validateEntrypoint(entrypoint: object) {
  if (!("params" in entrypoint)) {
    return "missing `params` property";
  } else if (!Array.isArray(entrypoint.params)) {
    return "unexpected type for `params` property";
  } else if (!(`fn` in entrypoint) || entrypoint == null) {
    return "missing `fn` property";
  } else if (
    typeof entrypoint.fn !== "function" &&
    typeof entrypoint.fn !== "object"
  ) {
    return "expected `fn` property to be a function or React object";
  } else {
    return null;
  }
}

export function doEval(source: string): EvaluatorResult {
  "use strict";

  const originalConsole = globalThis.console;
  const logs: Array<string> = [];
  const mockedLog = (...args: Array<any>) => {
    logs.push(`${args.map((arg) => util.inspect(arg))}`);
  };

  (globalThis.console as any) = {
    info: mockedLog,
    log: mockedLog,
    warn: mockedLog,
    error: mockedLog,
    table: mockedLog,
    trace: () => {},
  };
  try {
    // source needs to be evaluated in the same scope as invoke
    const evalResult: any = eval(`
    (() => {
      // Exports should be overwritten by source
      let exports = {
        FIXTURE_ENTRYPOINT: {
          fn: globalThis.placeholderFn,
          params: [],
        },
      };
      let reachedInvoke = false;
      try {
        // run in an iife to avoid naming collisions
        (() => {${source}})();
        reachedInvoke = true;
        if (exports.FIXTURE_ENTRYPOINT == null ||
          exports.FIXTURE_ENTRYPOINT.fn === globalThis.placeholderFn
        ) {
          return {
            kind: "UnexpectedError",
            value: 'FIXTURE_ENTRYPOINT not exported! Found {'
              + Object.keys(exports).filter(e => e !== 'FIXTURE_ENTRYPOINT').toString()
              + '}',
          };
        }
        const validationError = validateEntrypoint(exports.FIXTURE_ENTRYPOINT);
        if (validationError) {
          return {
            kind: "UnexpectedError",
            value: 'Bad shape for FIXTURE_ENTRYPOINT (' + validationError + ').',
          };
        }

        if (typeof exports.FIXTURE_ENTRYPOINT.fn === 'object') {
          // try to run fixture as a react component
          const result = render(
            React.createElement(
              exports.FIXTURE_ENTRYPOINT.fn,
              exports.FIXTURE_ENTRYPOINT.params[0])
          ).container.innerHTML;

          return {
            kind: "ok",
            value: result ?? 'null',
          };
        } else {
          const result = render(
            React.createElement(
              WrapperTestComponent,
              exports.FIXTURE_ENTRYPOINT
            )
          ).container.innerHTML;

          return {
            kind: "ok",
            value: result ?? 'null',
          };
        }
      } catch (e) {
        if (!reachedInvoke) {
          return {
            kind: "UnexpectedError",
            value: e.message,
          };
        } else {
          return {
            kind: "exception",
            value: e.message,
          };
        }
      }
    })()`);

    const result = {
      ...evalResult,
      logs,
    };
    return result;
  } catch (e) {
    // syntax errors will cause the eval to throw and bubble up here
    return {
      kind: "UnexpectedError",
      value:
        "Unexpected error during eval, possible syntax error?\n" + e.message,
      logs,
    };
  } finally {
    globalThis.console = originalConsole;
  }
}
