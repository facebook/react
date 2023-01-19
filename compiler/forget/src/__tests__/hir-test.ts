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

      let items: Array<TestOutput> = [];
      let error: Error | null = null;
      if (options.debug) {
        toggleLogging(options.debug);
      }
      try {
        items.push({ js: runReactForgetBabelPlugin(input, file).code });
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
  // Babel outputs absolute paths of the filename in the error mesage, which means fixtures will
  // contain paths that only pertain to your local machine. Strip it just here because that info
  // is still useful in real world usage of the Babel plugin.
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
