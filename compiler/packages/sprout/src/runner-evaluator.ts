/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { render } from "@testing-library/react";
import { PROJECT_ROOT } from "fixture-test-utils";
import { JSDOM } from "jsdom";
import util from "util";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { initFbt, toJSON } from "./shared-runtime";
const React = require("react");

/**
 * Set up the global environment for JSDOM tests.
 * This is a hack to let us share code and setup between the test
 * and runner environments. As an alternative, we could evaluate all setup
 * in the jsdom test environment (which provides more isolation), but that
 * may be slower.
 */
const { window: testWindow } = new JSDOM(undefined);
(globalThis as any).document = testWindow.document;
(globalThis as any).window = testWindow.window;
(globalThis as any).React = React;
(globalThis as any).render = render;
initFbt();

(globalThis as any).placeholderFn = function (..._args: Array<any>) {
  throw new Error("Fixture not implemented!");
};

export type EvaluatorResult = {
  kind: "ok" | "exception" | "UnexpectedError";
  value: string;
  logs: Array<string>;
};

/**
 * Define types and schemas for fixture entrypoint
 */
const EntrypointSchema = z.strictObject({
  fn: z.union([z.function(), z.object({})]),
  params: z.array(z.any()),

  // DEPRECATED, unused
  isComponent: z.optional(z.boolean()),

  // if enabled, the `fn` is assumed to be a component and this is assumed
  // to be an array of props. the component is mounted once and rendered
  // once per set of props in this array.
  sequentialRenders: z.optional(z.nullable(z.array(z.any()))).default(null),
});
const ExportSchema = z.object({
  FIXTURE_ENTRYPOINT: EntrypointSchema,
});

function WrapperTestComponent(props: { fn: any; params: Array<any> }) {
  const result = props.fn(...props.params);
  // Hacky solution to determine whether the fixture returned jsx (which
  // needs to passed through to React's runtime as-is) or a non-jsx value
  // (which should be converted to a string).
  if (typeof result === "object" && result != null && "$$typeof" in result) {
    return result;
  } else {
    return toJSON(result);
  }
}

function renderComponentSequentiallyForEachProps(
  fn: any,
  sequentialRenders: Array<any>
): string {
  if (sequentialRenders.length === 0) {
    throw new Error(
      "Expected at least one set of props when using `sequentialRenders`"
    );
  }
  const initialProps = sequentialRenders[0]!;
  const results = [];
  const { rerender, container } = render(
    React.createElement(WrapperTestComponent, { fn, params: [initialProps] })
  );
  results.push(container.innerHTML);

  for (let i = 1; i < sequentialRenders.length; i++) {
    rerender(
      React.createElement(WrapperTestComponent, {
        fn,
        params: [sequentialRenders[i]],
      })
    );
    results.push(container.innerHTML);
  }
  return results.join("\n");
}

type FixtureEvaluatorResult = Omit<EvaluatorResult, "logs">;
(globalThis as any).evaluateFixtureExport = function (
  exports: unknown
): FixtureEvaluatorResult {
  const parsedExportResult = ExportSchema.safeParse(exports);
  if (!parsedExportResult.success) {
    const exportDetail =
      typeof exports === "object" && exports != null
        ? `object ${util.inspect(exports)}`
        : `${exports}`;
    return {
      kind: "UnexpectedError",
      value: `${fromZodError(parsedExportResult.error)}\nFound ` + exportDetail,
    };
  }
  const entrypoint = parsedExportResult.data.FIXTURE_ENTRYPOINT;
  if (entrypoint.sequentialRenders !== null) {
    const result = renderComponentSequentiallyForEachProps(
      entrypoint.fn,
      entrypoint.sequentialRenders
    );

    return {
      kind: "ok",
      value: result ?? "null",
    };
  } else if (typeof entrypoint.fn === "object") {
    // Try to run fixture as a react component. This is necessary because not
    // all components are functions (some are ForwardRef or Memo objects).
    const result = render(
      React.createElement(entrypoint.fn, entrypoint.params[0])
    ).container.innerHTML;

    return {
      kind: "ok",
      value: result ?? "null",
    };
  } else {
    const result = render(React.createElement(WrapperTestComponent, entrypoint))
      .container.innerHTML;

    return {
      kind: "ok",
      value: result ?? "null",
    };
  }
};

export function doEval(source: string): EvaluatorResult {
  "use strict";

  const originalConsole = globalThis.console;
  const logs: Array<string> = [];
  const mockedLog = (...args: Array<any>) => {
    // Some hackery: React will use the JS engine to log source location,
    // which doesn't play well with snapshot files.
    logs.push(
      `${args.map((arg) =>
        util.inspect(arg).replaceAll(PROJECT_ROOT, "<project_root>")
      )}`
    );
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
        return evaluateFixtureExport(exports);
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
