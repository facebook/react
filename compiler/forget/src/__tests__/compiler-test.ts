/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import path from "path";
import { runReactForgetBabelPlugin } from "../Babel/RunReactForgetBabelPlugin";
import { toggleLogging } from "../Utils/logger";
import { Effect, ValueKind } from "../index";
import generateTestsFromFixtures from "./test-utils/generateTestsFromFixtures";

type TestOutput = {
  js: string;
};

function wrapWithTripleBackticks(s: string, ext?: string) {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}

describe("React Forget", () => {
  const originalConsoleError = console.error;
  generateTestsFromFixtures(
    path.join(__dirname, "fixtures", "compiler"),
    (input, file, options) => {
      const seenConsoleErrors: Array<string> = [];
      let items: Array<TestOutput> = [];
      let error: Error | null = null;
      if (options.debug) {
        toggleLogging(options.debug);
      }
      // Mock console.error so we can record it in test output
      console.error = jest.fn((...messages: Array<string>) => {
        seenConsoleErrors.push(...messages);
      });
      try {
        items.push({
          js: runReactForgetBabelPlugin(input, file, options.language, {
            enableOnlyOnUseForgetDirective:
              options.enableOnlyOnUseForgetDirective,
            environment: {
              memoizeJsxElements:
                options.environment?.memoizeJsxElements ?? true,
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
              validateHooksUsage: true,
              inlineUseMemo: options.environment?.inlineUseMemo ?? false,
            },
            logger: null,
            gating: options.gating,
            panicOnBailout: options.panicOnBailout,
            isDev: true,
          }).code,
        });
      } catch (e) {
        error = e;
      }

      // Promote console errors so they can be recorded in fixture output
      for (const consoleError of seenConsoleErrors) {
        if (error != null) {
          error.message = `${error.message}\n\n${consoleError}`;
        } else {
          error = new Error(consoleError);
          error.name = "ConsoleError";
        }
      }

      let outputs: Array<string>;

      const expectError = file.startsWith("error.");
      if (expectError) {
        if (error === null) {
          throw new Error(
            `Expected an error to be thrown for fixture: '${file}', remove the 'error.' prefix if an error is not expected.`
          );
        } else {
          outputs = [...formatOutput(items), formatErrorOutput(error)];
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
  console.error = originalConsoleError;
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
