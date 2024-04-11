/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { runReactForgetBabelPlugin } from "../Babel/RunReactForgetBabelPlugin";
import type { Logger, LoggerEvent } from "../Entrypoint";

it("logs succesful compilation", () => {
  const logs: [string | null, LoggerEvent][] = [];
  const logger: Logger = {
    logEvent(filename, event) {
      logs.push([filename, event]);
    },
  };

  const _ = runReactForgetBabelPlugin(
    "function Component(props) { return <div>{props}</div> }",
    "test.js",
    "flow",
    { logger, panicThreshold: "all_errors" }
  );

  const [filename, event] = logs.at(0)!;
  expect(filename).toContain("test.js");
  expect(event.kind).toEqual("CompileSuccess");
  invariant(event.kind === "CompileSuccess", "typescript be smarter");
  expect(event.fnName).toEqual("Component");
  expect(event.fnLoc).toEqual({
    end: { column: 55, line: 1 },
    start: { column: 0, line: 1 },
  });
});

it("logs failed compilation", () => {
  const logs: [string | null, LoggerEvent][] = [];
  const logger: Logger = {
    logEvent(filename, event) {
      logs.push([filename, event]);
    },
  };

  expect(() => {
    runReactForgetBabelPlugin(
      "function Component(props) { props.foo = 1; return <div>{props}</div> }",
      "test.js",
      "flow",
      { logger, panicThreshold: "all_errors" }
    );
  }).toThrow();

  const [filename, event] = logs.at(0)!;
  expect(filename).toContain("test.js");
  expect(event.kind).toEqual("CompileError");
  invariant(event.kind === "CompileError", "typescript be smarter");

  expect(event.detail.severity).toEqual("InvalidReact");
  expect(event.detail.loc).toEqual({
    end: { column: 33, line: 1 },
    identifierName: "props",
    start: { column: 28, line: 1 },
  });

  // Make sure event.fnLoc is different from event.detail.loc
  expect(event.fnLoc).toEqual({
    end: { column: 70, line: 1 },
    start: { column: 0, line: 1 },
  });
});
