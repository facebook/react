/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {codeFrameColumns} from '@babel/code-frame';
import type {PluginObj} from '@babel/core';
import type {parseConfigPragma as ParseConfigPragma} from 'babel-plugin-react-compiler/src/HIR/Environment';
import {TransformResult, transformFixtureInput} from './compiler';
import {
  COMPILER_PATH,
  COMPILER_INDEX_PATH,
  LOGGER_PATH,
  PARSE_CONFIG_PRAGMA_PATH,
} from './constants';
import {TestFixture, getBasename, isExpectError} from './fixture-utils';
import {TestResult, writeOutputToString} from './reporter';
import {runSprout} from './sprout';

const originalConsoleError = console.error;

// Try to avoid clearing the entire require cache, which (as of this PR)
// contains ~1250 files. This assumes that no dependencies have global caches
// that may need to be invalidated across Forget reloads.
const invalidationSubpath = 'packages/babel-plugin-react-compiler/dist';
let version: number | null = null;
export function clearRequireCache() {
  Object.keys(require.cache).forEach(function (path) {
    if (path.includes(invalidationSubpath)) {
      delete require.cache[path];
    }
  });
}

async function compile(
  input: string,
  fixturePath: string,
  compilerVersion: number,
  shouldLog: boolean,
  includeEvaluator: boolean,
): Promise<{
  error: string | null;
  compileResult: TransformResult | null;
}> {
  const seenConsoleErrors: Array<string> = [];
  console.error = (...messages: Array<string>) => {
    seenConsoleErrors.push(...messages);
  };
  if (version !== null && compilerVersion !== version) {
    clearRequireCache();
  }
  version = compilerVersion;

  let compileResult: TransformResult | null = null;
  let error: string | null = null;
  try {
    // NOTE: we intentionally require lazily here so that we can clear the require cache
    // and load fresh versions of the compiler when `compilerVersion` changes.
    const {default: BabelPluginReactCompiler} = require(COMPILER_PATH) as {
      default: PluginObj;
    };
    const {Effect: EffectEnum, ValueKind: ValueKindEnum} = require(
      COMPILER_INDEX_PATH,
    );
    const {toggleLogging} = require(LOGGER_PATH);
    const {parseConfigPragma} = require(PARSE_CONFIG_PRAGMA_PATH) as {
      parseConfigPragma: typeof ParseConfigPragma;
    };

    // only try logging if we filtered out all but one fixture,
    // since console log order is non-deterministic
    toggleLogging(shouldLog);
    const result = await transformFixtureInput(
      input,
      fixturePath,
      parseConfigPragma,
      BabelPluginReactCompiler,
      includeEvaluator,
      EffectEnum,
      ValueKindEnum,
    );

    if (result.kind === 'err') {
      error = result.msg;
    } else {
      compileResult = result.value;
    }
  } catch (e) {
    if (shouldLog) {
      console.error(e.stack);
    }
    error = e.message.replace(/\u001b[^m]*m/g, '');
    const loc = e.details?.[0]?.loc;
    if (loc != null) {
      try {
        error = codeFrameColumns(
          input,
          {
            start: {
              line: loc.start.line,
              column: loc.start.column + 1,
            },
            end: {
              line: loc.end.line,
              column: loc.end.column + 1,
            },
          },
          {
            message: e.message,
          },
        );
      } catch {
        // In case the location data isn't valid, skip printing a code frame.
      }
    }
  }

  // Promote console errors so they can be recorded in fixture output
  for (const consoleError of seenConsoleErrors) {
    if (error != null) {
      error = `${error}\n\n${consoleError}`;
    } else {
      error = `ConsoleError: ${consoleError}`;
    }
  }
  console.error = originalConsoleError;

  return {
    error,
    compileResult,
  };
}

export async function transformFixture(
  fixture: TestFixture,
  compilerVersion: number,
  shouldLog: boolean,
  includeEvaluator: boolean,
): Promise<TestResult> {
  const {input, snapshot: expected, snapshotPath: outputPath} = fixture;
  const basename = getBasename(fixture);
  const expectError = isExpectError(fixture);

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
  const {compileResult, error} = await compile(
    input,
    fixture.fixturePath,
    compilerVersion,
    shouldLog,
    includeEvaluator,
  );

  let unexpectedError: string | null = null;
  if (expectError) {
    if (error === null) {
      unexpectedError = `Expected an error to be thrown for fixture: \`${basename}\`, remove the 'error.' prefix if an error is not expected.`;
    }
  } else {
    if (error !== null) {
      unexpectedError = `Expected fixture \`${basename}\` to succeed but it failed with error:\n\n${error}`;
    } else if (compileResult == null) {
      unexpectedError = `Expected output for fixture \`${basename}\`.`;
    }
  }

  const snapOutput: string | null = compileResult?.forgetOutput ?? null;
  let sproutOutput: string | null = null;
  if (compileResult?.evaluatorCode != null) {
    const sproutResult = runSprout(
      compileResult.evaluatorCode.original,
      compileResult.evaluatorCode.forget,
    );
    if (sproutResult.kind === 'invalid') {
      unexpectedError ??= '';
      unexpectedError += `\n\n${sproutResult.value}`;
    } else {
      sproutOutput = sproutResult.value;
    }
  } else if (!includeEvaluator && expected != null) {
    sproutOutput = expected.split('\n### Eval output\n')[1];
  }

  const actualOutput = writeOutputToString(
    input,
    snapOutput,
    sproutOutput,
    compileResult?.logs ?? null,
    error,
  );

  return {
    outputPath,
    actual: actualOutput,
    expected,
    unexpectedError,
  };
}
