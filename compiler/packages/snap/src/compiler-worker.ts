/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import type { parseConfigPragma as ParseConfigPragma } from "babel-plugin-react-forget/src/HIR/Environment";
import {
  TestFixture,
  transformFixtureInput,
  writeOutputToString,
} from "fixture-test-utils";
import fs from "fs/promises";

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
  outputPath: string;
  actual: string | null; // null == input did not exist
  expected: string | null; // null == output did not exist
  unexpectedError: string | null;
};

export async function compile(
  compilerPath: string,
  loggerPath: string,
  parseConfigPragmaPath: string,
  fixture: TestFixture,
  compilerVersion: number,
  implicitDebugMode: boolean,
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
  const { inputPath, outputPath, outputExists, basename } =
    fixture;
  const input = inputPath != null ? await fs.readFile(inputPath, "utf8") : null;
  const expected = outputExists ? await fs.readFile(outputPath, "utf8") : null;

  // Input will be null if the input file did not exist, in which case the output file
  // is stale
  if (input === null) {
    return {
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
    const { runReactForgetBabelPlugin } = require(compilerPath) as {
      runReactForgetBabelPlugin: typeof RunReactForgetBabelPlugin;
    };
    const { toggleLogging } = require(loggerPath);
    const { parseConfigPragma } = require(parseConfigPragmaPath) as {
      parseConfigPragma: typeof ParseConfigPragma;
    };

    // only try logging if we filtered out all but one fixture,
    // since console log order is non-deterministic
    const shouldLogPragma = input.split("\n")[0].includes("@debug");
    toggleLogging(isOnlyFixture && (shouldLogPragma || implicitDebugMode));
    code =
      transformFixtureInput(
        input,
        basename,
        runReactForgetBabelPlugin,
        parseConfigPragma
      ).code ?? null;
  } catch (e) {
    e.message = e.message.replace(/\u001b[^m]*m/g, "");
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

  const output = writeOutputToString(input, code, error);
  const expectError = basename.startsWith("error.");
  let unexpectedError: string | null = null;
  if (expectError) {
    if (error === null) {
      unexpectedError = `Expected an error to be thrown for fixture: '${basename}', remove the 'error.' prefix if an error is not expected.`;
    }
  } else {
    if (error !== null) {
      unexpectedError = `Expected fixture '${basename}' to succeed but it failed with error:\n\n${error.message}`;
    } else if (code == null || code.length === 0) {
      unexpectedError = `Expected output for fixture '${basename}'.`;
    }
  }

  console.error = originalConsoleError;

  return {
    outputPath,
    actual: output,
    expected,
    unexpectedError,
  };
}
