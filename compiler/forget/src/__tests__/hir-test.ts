/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import { wasmFolder } from "@hpcc-js/wasm";
import path from "path";
import runReactForgetBabelPlugin from "../Babel/RunReactForgetBabelPlugin";
import { Effect, ValueKind } from "../index";
import { toggleLogging } from "../Utils/logger";
import generateTestsFromFixtures from "./test-utils/generateTestsFromFixtures";

type TestOutput = {
  js: string;
};

function wrapWithTripleBackticks(s: string, ext?: string) {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}

wasmFolder(
  path.join(__dirname, "..", "..", "node_modules", "@hpcc-js", "wasm", "dist")
);

const Pragma_RE = /\/\/\s*@enable\((\w+)\)$/gm;
const FlowPragmas = [/\/\/\s@flow$/gm, /\*\s@flow$/gm];

describe("React Forget (HIR version)", () => {
  generateTestsFromFixtures(
    path.join(__dirname, "fixtures", "hir"),
    (input, file, options) => {
      const matches = input.matchAll(Pragma_RE);

      for (const match of matches) {
        const [, key, value] = match;
        switch (key) {
          case "Pass":
            // do something with value;
            break;
          default:
            throw new Error(`unknown pragma: ${key}`);
        }
      }

      let useFlow: boolean = false;
      for (const flowPragma of FlowPragmas) {
        useFlow ||= !!input.match(flowPragma);
      }

      let language: "flow" | "typescript" = useFlow ? "flow" : "typescript";
      let items: Array<TestOutput> = [];
      let error: Error | null = null;
      if (options.debug) {
        toggleLogging(options.debug);
      }
      try {
        items.push({
          js: runReactForgetBabelPlugin(input, file, language, {
            enableOnlyOnUseForgetDirective:
              options.enableOnlyOnUseForgetDirective,
            environment: {
              customHooks: new Map([
                [
                  "useFreeze",
                  {
                    name: "useFreeze",
                    kind: "Custom",
                    valueKind: ValueKind.Frozen,
                    effectKind: Effect.Freeze,
                  },
                ],
              ]),
            },
            logger: null,
            gatingModule: options.gatingModule,
          }).code,
        });
      } catch (e) {
        error = e;
      }
      let outputs: Array<string>;

      const expectError = file.startsWith("error.");
      if (expectError) {
        if (error === null) {
          throw new Error(
            `Expected an error to be thrown for fixture: '${file}', remove the 'error.' prefix if an error is not expected.`
          );
        } else {
          outputs = [formatErrorOutput(error)];
        }
      } else {
        if (error !== null) {
          error.message = `Expected fixture '${file}' to succeed but it failed with error:\n\n${error.message}`;
          throw error;
        }
        if (items === null || items.length === 0) {
          throw new Error(`Expected at least one output for file '${file}'.`);
        }
        outputs = formatOutput(items);
      }
      return `
## Input

${wrapWithTripleBackticks(input, "javascript")}

${outputs.join("\n")}
      `;
    }
  );
});

function formatErrorOutput(error: Error): string {
  error.message = error.message.replace(/^\/.*?:\s/, "");
  return `
## Error

${wrapWithTripleBackticks(error.message)}
          `;
}

function formatOutput(items: Array<TestOutput>): Array<string> {
  return items.map(({ js }) => {
    return `
## Code

${wrapWithTripleBackticks(js, "javascript")}
        `.trim();
  });
}
