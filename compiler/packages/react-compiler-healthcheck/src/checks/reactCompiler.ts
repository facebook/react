/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as BabelCore from '@babel/core';
import {transformFromAstSync} from '@babel/core';
import * as BabelParser from '@babel/parser';
import BabelPluginReactCompiler, {
  ErrorSeverity,
  type PluginOptions,
} from 'babel-plugin-react-compiler/src';
import type {LoggerEvent as RawLoggerEvent} from 'babel-plugin-react-compiler/src/Entrypoint';
import chalk from 'chalk';

type LoggerEvent =
  | (Extract<RawLoggerEvent, {kind: 'CompileSuccess'}> & {
      filename: string | null;
    })
  | (Extract<RawLoggerEvent, {kind: 'CompileError'}> & {
      filename: string | null;
    })
  | (Extract<RawLoggerEvent, {kind: 'CompileDiagnostic'}> & {
      filename: string | null;
    })
  | (Extract<RawLoggerEvent, {kind: 'PipelineError'}> & {
      filename: string | null;
    });
type SuccessEvent = Extract<LoggerEvent, {kind: 'CompileSuccess'}>;
type FailureEvent = Extract<
  LoggerEvent,
  {kind: 'CompileError' | 'CompileDiagnostic' | 'PipelineError'}
>;

const SucessfulCompilation: Array<SuccessEvent> = [];
const ActionableFailures: Array<FailureEvent> = [];
const OtherFailures: Array<FailureEvent> = [];

const logger = {
  logEvent(filename: string | null, rawEvent: RawLoggerEvent) {
    const event = {...rawEvent, filename};
    switch (event.kind) {
      case 'CompileSuccess': {
        SucessfulCompilation.push(event);
        return;
      }
      case 'CompileError': {
        if (isActionableDiagnostic(event.detail)) {
          ActionableFailures.push(event);
          return;
        }
        OtherFailures.push(event);
        return;
      }
      case 'CompileDiagnostic':
      case 'PipelineError':
        OtherFailures.push(event);
        return;
      default:
        return;
    }
  },
};

const COMPILER_OPTIONS: PluginOptions = {
  noEmit: true,
  compilationMode: 'infer',
  panicThreshold: 'critical_errors',
  logger,
};

function isActionableDiagnostic(detail: {severity: ErrorSeverity}) {
  return detail.severity === ErrorSeverity.Error;
}

function runBabelPluginReactCompiler(
  text: string,
  file: string,
  language: 'flow' | 'typescript',
  options: PluginOptions | null,
): BabelCore.BabelFileResult {
  const ast = BabelParser.parse(text, {
    sourceFilename: file,
    plugins: [language, 'jsx'],
    sourceType: 'module',
  });
  const result = transformFromAstSync(ast, text, {
    filename: file,
    highlightCode: false,
    retainLines: true,
    plugins: [[BabelPluginReactCompiler, options]],
    sourceType: 'module',
    configFile: false,
    babelrc: false,
  });
  if (result?.code == null) {
    throw new Error(
      `Expected BabelPluginReactForget to codegen successfully, got: ${result}`,
    );
  }
  return result;
}

function compile(sourceCode: string, filename: string) {
  try {
    runBabelPluginReactCompiler(
      sourceCode,
      filename,
      'typescript',
      COMPILER_OPTIONS,
    );
  } catch {}
}

const JsFileExtensionRE = /(js|ts|jsx|tsx)$/;

/**
 * Counts unique source locations (filename + function definition location)
 * in source.
 * The compiler currently occasionally emits multiple error events for a
 * single file (e.g. to report multiple rules of react violations in the
 * same pass).
 * TODO: enable non-destructive `CompilerDiagnostic` logging in dev mode,
 * and log a "CompilationStart" event for every function we begin processing.
 */
function countUniqueLocInEvents(events: Array<FailureEvent>): number {
  const seenLocs = new Set<string>();
  let count = 0;
  for (const e of events) {
    if (e.filename != null && e.fnLoc != null) {
      seenLocs.add(`${e.filename}:${e.fnLoc.start}:${e.fnLoc.end}`);
    } else {
      // failed to dedup due to lack of source locations
      count++;
    }
  }
  return count + seenLocs.size;
}

function formatLoc(loc: FailureEvent['fnLoc']): string | null {
  if (loc == null) {
    return null;
  }
  return `${loc.start.line}:${loc.start.column}-${loc.end.line}:${loc.end.column}`;
}

function getFailureReason(event: FailureEvent): string {
  switch (event.kind) {
    case 'CompileError': {
      const description = event.detail.description;
      if (description == null || description.length === 0) {
        return event.detail.reason;
      }
      return `${event.detail.reason}: ${description}`;
    }
    case 'CompileDiagnostic': {
      if (
        event.detail.description == null ||
        event.detail.description.length === 0
      ) {
        return event.detail.reason;
      }
      return `${event.detail.reason}: ${event.detail.description}`;
    }
    case 'PipelineError':
      return event.data;
    default:
      return 'Unknown failure';
  }
}

type VerboseFailure = {
  group: 'ActionableFailure' | 'OtherFailure';
  filename: string;
  location: string | null;
  reason: string;
};

function getVerboseFailures(): Array<VerboseFailure> {
  const failures: Array<VerboseFailure> = [];
  for (const failure of ActionableFailures) {
    failures.push({
      group: 'ActionableFailure',
      filename: failure.filename ?? '<unknown file>',
      location: formatLoc(failure.fnLoc),
      reason: getFailureReason(failure),
    });
  }
  for (const failure of OtherFailures) {
    failures.push({
      group: 'OtherFailure',
      filename: failure.filename ?? '<unknown file>',
      location: formatLoc(failure.fnLoc),
      reason: getFailureReason(failure),
    });
  }
  failures.sort((a, b) => {
    return (
      a.group.localeCompare(b.group) ||
      a.filename.localeCompare(b.filename) ||
      (a.location ?? '').localeCompare(b.location ?? '') ||
      a.reason.localeCompare(b.reason)
    );
  });
  return failures;
}

export default {
  run(source: string, path: string): void {
    if (JsFileExtensionRE.exec(path) !== null) {
      compile(source, path);
    }
  },

  report(verbose: boolean = false): void {
    const totalComponents =
      SucessfulCompilation.length +
      countUniqueLocInEvents(OtherFailures) +
      countUniqueLocInEvents(ActionableFailures);
    console.log(
      chalk.green(
        `Successfully compiled ${SucessfulCompilation.length} out of ${totalComponents} components.`,
      ),
    );

    if (!verbose) {
      return;
    }

    const verboseFailures = getVerboseFailures();
    if (verboseFailures.length === 0) {
      console.log(chalk.green('No compiler failures found.'));
      return;
    }

    console.log(chalk.red('Compiler failures (verbose):'));
    for (const failure of verboseFailures) {
      const location = failure.location == null ? '' : `:${failure.location}`;
      console.log(
        `[${failure.group}] ${failure.filename}${location} ${failure.reason}`,
      );
    }
  },
};
