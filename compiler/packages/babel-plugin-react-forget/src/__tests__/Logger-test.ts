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
    { logger, panicThreshold: "ALL_ERRORS" } as any
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
