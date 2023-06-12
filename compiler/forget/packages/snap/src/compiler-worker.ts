/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from "fs/promises";
import { exists } from "./utils";

const originalConsoleError = console.error;

// Try to avoid clearing the entire require cache, which (as of this PR)
// contains ~1250 files. This assumes that no dependencies have global caches
// that may need to be invalidated across Forget reloads.
const invalidationSubpath = "packages/babel-plugin-react-forget/dist";
let version: number | null = null;
export function clearRequireCache() {
  Object.keys(require.cache).forEach(function (path) {
    if (path.includes(invalidationSubpath)) {
      delete require.cache[path];
    }
  });
}

export type TestResult = {
  inputPath: string;
  outputPath: string;
  actual: string | null; // null == input did not exist
  expected: string | null; // null == output did not exist
  unexpectedError: string | null;
};

export type TestFixture = {
  basename: string;
  inputPath: string;
  outputPath: string;
};

export async function compile(
  compilerPath: string,
  loggerPath: string,
  fixture: TestFixture,
  compilerVersion: number,
  isOnlyFixture: boolean
): Promise<TestResult> {
  const seenConsoleErrors: Array<string> = [];
  console.error = (...messages: Array<string>) => {
    seenConsoleErrors.push(...messages);
  };
  if (version !== null && compilerVersion !== version) {
    clearRequireCache();
  }
  version = compilerVersion;
  const { inputPath, outputPath, basename } = fixture;
  const input = (await exists(inputPath))
    ? await fs.readFile(inputPath, "utf8")
    : null;
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
      unexpectedError: null,
    };
  }

  let code: string | null = null;
  let error: Error | null = null;
  try {
    // NOTE: we intentionally require lazily here so that we can clear the require cache
    // and load fresh versions of the compiler when `compilerVersion` changes.
    const { runReactForgetBabelPlugin } = require(compilerPath);
    const { toggleLogging } = require(loggerPath);

    // only try logging if we filtered out all but one fixture,
    // since console log order is non-deterministic
    const shouldLogPragma = input.split("\n")[0].includes("@debug");
    toggleLogging(isOnlyFixture && shouldLogPragma);

    // Extract the first line to quickly check for custom test directives
    const firstLine = input.substring(0, input.indexOf("\n"));

    let enableOnlyOnUseForgetDirective = false;
    let gating = null;
    let instrumentForget = null;
    let panicOnBailout = true;
    let memoizeJsxElements = true;
    let enableAssumeHooksFollowRulesOfReact = false;
    let enableTreatHooksAsFunctions = true;
    let disableAllMemoization = false;
    let validateRefAccessDuringRender = true;
    let enableEmitFreeze = null;
    let enableOptimizeFunctionExpressions = false;
    if (firstLine.indexOf("@forgetDirective") !== -1) {
      enableOnlyOnUseForgetDirective = true;
    }
    if (firstLine.includes("@gating")) {
      gating = {
        source: "ReactForgetFeatureFlag",
        importSpecifierName: "isForgetEnabled_Fixtures",
      };
    }
    if (firstLine.includes("@instrumentForget")) {
      instrumentForget = {
        source: "react-forget-runtime",
        importSpecifierName: "useRenderCounter",
      };
    }
    if (firstLine.includes("@panicOnBailout false")) {
      panicOnBailout = false;
    }
    if (firstLine.includes("@memoizeJsxElements false")) {
      memoizeJsxElements = false;
    }
    if (firstLine.includes("@enableAssumeHooksFollowRulesOfReact true")) {
      enableAssumeHooksFollowRulesOfReact = true;
    }
    if (firstLine.includes("@enableTreatHooksAsFunctions false")) {
      enableTreatHooksAsFunctions = false;
    }
    if (firstLine.includes("@disableAllMemoization true")) {
      disableAllMemoization = true;
    }
    if (firstLine.includes("@validateRefAccessDuringRender false")) {
      validateRefAccessDuringRender = false;
    }
    if (firstLine.includes("@enableOptimizeFunctionExpressions")) {
      enableOptimizeFunctionExpressions = true;
    }
    if (firstLine.includes("@enableEmitFreeze")) {
      enableEmitFreeze = {
        source: "react-forget-runtime",
        importSpecifierName: "makeReadOnly",
      };
    }

    const language = parseLanguage(firstLine);

    code = runReactForgetBabelPlugin(input, basename, language, {
      enableOnlyOnUseForgetDirective,
      environment: {
        customHooks: new Map([
          [
            "useFreeze",
            {
              valueKind: "frozen",
              effectKind: "freeze",
            },
          ],
        ]),
        enableAssumeHooksFollowRulesOfReact,
        enableFunctionCallSignatureOptimizations: true,
        disableAllMemoization,
        enableTreatHooksAsFunctions,
        inlineUseMemo: true,
        memoizeJsxElements,
        validateHooksUsage: true,
        validateRefAccessDuringRender,
        validateFrozenLambdas: true,
        enableEmitFreeze,
        enableOptimizeFunctionExpressions,
      },
      logger: null,
      gating,
      instrumentForget,
      panicOnBailout,
      isDev: true,
    }).code;
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

  let output: string;
  const expectError = basename.startsWith("error.");
  if (expectError) {
    if (error === null) {
      return {
        inputPath,
        outputPath,
        actual: code,
        expected,
        unexpectedError: `Expected an error to be thrown for fixture: '${basename}', remove the 'error.' prefix if an error is not expected.`,
      };
    } else if (code != null) {
      output = `${formatOutput(code)}\n${formatErrorOutput(error)}`;
    } else {
      output = formatErrorOutput(error);
    }
  } else {
    if (error !== null) {
      return {
        inputPath,
        outputPath,
        actual: code,
        expected,
        unexpectedError: `Expected fixture '${basename}' to succeed but it failed with error:\n\n${error.message}`,
      };
    }
    if (code == null || code.length === 0) {
      return {
        inputPath,
        outputPath,
        actual: code,
        expected,
        unexpectedError: `Expected output for fixture '${basename}'.`,
      };
    }
    output = formatOutput(code);
  }

  // leading newline intentional
  const actual = `
## Input

${wrapWithTripleBackticks(input, "javascript")}

${output}
      `; // trailing newline + space internional

  console.error = originalConsoleError;

  return {
    inputPath,
    outputPath,
    actual,
    expected,
    unexpectedError: null,
  };
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
