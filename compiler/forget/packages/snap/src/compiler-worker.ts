/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from "fs/promises";
import path from "path";
import { exists } from "./utils";

let version: number | null = null;
export function clearRequireCache() {
  Object.keys(require.cache).forEach(function (key) {
    delete require.cache[key];
  });
}

export type TestResult = {
  inputPath: string;
  outputPath: string;
  actual: string | null; // null == input did not exist
  expected: string | null; // null == output did not exist
};

export async function compile(
  compilerPath: string,
  fixturesDir: string,
  fixture: string,
  compilerVersion: number
): Promise<TestResult> {
  if (version !== null && compilerVersion !== version) {
    clearRequireCache();
  }
  version = compilerVersion;
  const inputPath = path.join(fixturesDir, `${fixture}.js`);
  const input = (await exists(inputPath))
    ? await fs.readFile(inputPath, "utf8")
    : null;
  const outputPath = path.join(fixturesDir, `${fixture}.expect.md`);
  const expected = (await exists(outputPath))
    ? await fs.readFile(outputPath, "utf8")
    : null;

  // Input will be null if the input file did not exist, in which case the output file
  // is stale
  if (input === null) {
    return {
      inputPath,
      outputPath,
      actual: null,
      expected,
    };
  }

  let code: string | null = null;
  let error: Error | null = null;
  try {
    // NOTE: we intentionally require lazily here so that we can clear the require cache
    // and load fresh versions of the compiler when `compilerVersion` changes.
    const { runReactForgetBabelPlugin } = require(compilerPath);

    // Extract the first line to quickly check for custom test directives
    const firstLine = input.substring(0, input.indexOf("\n"));

    let enableOnlyOnUseForgetDirective = false;
    if (firstLine.indexOf("@forgetDirective") !== -1) {
      enableOnlyOnUseForgetDirective = true;
    }

    let gating = null;
    if (firstLine.indexOf("@gating") !== -1) {
      gating = {
        source: "ReactForgetFeatureFlag",
        importSpecifierName: "isForgetEnabled_Fixtures",
      };
    }

    const language = parseLanguage(firstLine);

    code = runReactForgetBabelPlugin(input, fixture, language, {
      enableOnlyOnUseForgetDirective,
      environment: {
        customHooks: new Map([
          [
            "useFreeze",
            {
              name: "useFreeze",
              kind: "Custom",
              valueKind: "frozen",
              effectKind: "freeze",
            },
          ],
        ]),
        inlineUseMemo: true,
      },
      logger: null,
      gating,
    }).code;
  } catch (e) {
    error = e;
  }

  let output: string;
  const expectError = fixture.startsWith("error.");
  if (expectError) {
    if (error === null) {
      console.log(code);
      throw new Error(
        `Expected an error to be thrown for fixture: '${fixture}', remove the 'error.' prefix if an error is not expected.`
      );
    } else {
      output = formatErrorOutput(error);
    }
  } else {
    if (error !== null) {
      error.message = `Expected fixture '${fixture}' to succeed but it failed with error:\n\n${error.message}`;
      throw error;
    }
    if (code == null || code.length === 0) {
      throw new Error(`Expected output for fixture '${fixture}'.`);
    }
    output = formatOutput(code);
  }

  // leading newline intentional
  const actual = `
## Input

${wrapWithTripleBackticks(input, "javascript")}

${output}
      `; // trailing newline + space internional

  return { inputPath, outputPath, actual, expected };
}

function formatErrorOutput(error: Error): string {
  error.message = error.message.replace(/^\/.*?:\s/, "");
  return `
## Error

${wrapWithTripleBackticks(error.message)}
          `;
}

function formatOutput(code: string): string {
  return `
## Code

${wrapWithTripleBackticks(code, "javascript")}
        `.trim();
}

function wrapWithTripleBackticks(s: string, ext: string | null = null): string {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}

const FlowPragmas = [/\/\/\s@flow$/gm, /\*\s@flow$/gm];
function parseLanguage(source: string): "flow" | "typescript" {
  let useFlow = false;
  for (const flowPragma of FlowPragmas) {
    useFlow ||= !!source.match(flowPragma);
  }
  return useFlow ? "flow" : "typescript";
}
