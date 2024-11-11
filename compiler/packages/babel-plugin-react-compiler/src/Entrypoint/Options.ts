/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {z} from 'zod';
import {CompilerError, CompilerErrorDetailOptions} from '../CompilerError';
import {
  EnvironmentConfig,
  ExternalFunction,
  parseEnvironmentConfig,
} from '../HIR/Environment';
import {hasOwnProperty} from '../Utils/utils';
import {fromZodError} from 'zod-validation-error';

const PanicThresholdOptionsSchema = z.enum([
  /*
   * Any errors will panic the compiler by throwing an exception, which will
   * bubble up to the nearest exception handler above the Forget transform.
   * If Forget is invoked through `BabelPluginReactCompiler`, this will at the least
   * skip Forget compilation for the rest of current file.
   */
  'all_errors',
  /*
   * Panic by throwing an exception only on critical or unrecognized errors.
   * For all other errors, skip the erroring function without inserting
   * a Forget-compiled version (i.e. same behavior as noEmit).
   */
  'critical_errors',
  // Never panic by throwing an exception.
  'none',
]);

export type PanicThresholdOptions = z.infer<typeof PanicThresholdOptionsSchema>;

export type PluginOptions = {
  environment: EnvironmentConfig;

  logger: Logger | null;

  /*
   * Specifying a `gating` config, makes Forget compile and emit a separate
   * version of the function gated by importing the `gating.importSpecifierName` from the
   * specified `gating.source`.
   *
   * For example:
   *   gating: {
   *     source: 'ReactForgetFeatureFlag',
   *     importSpecifierName: 'isForgetEnabled_Pokes',
   *   }
   *
   * produces:
   *   import {isForgetEnabled_Pokes} from 'ReactForgetFeatureFlag';
   *
   *   Foo_forget()   {}
   *
   *   Foo_uncompiled() {}
   *
   *   var Foo = isForgetEnabled_Pokes() ? Foo_forget : Foo_uncompiled;
   */
  gating: ExternalFunction | null;

  panicThreshold: PanicThresholdOptions;

  /*
   * When enabled, Forget will continue statically analyzing and linting code, but skip over codegen
   * passes.
   *
   * Defaults to false
   */
  noEmit: boolean;

  /*
   * Determines the strategy for determining which functions to compile. Note that regardless of
   * which mode is enabled, a component can be opted out by adding the string literal
   * `"use no forget"` at the top of the function body, eg.:
   *
   * ```
   * function ComponentYouWantToSkipCompilation(props) {
   *    "use no forget";
   *    ...
   * }
   * ```
   */
  compilationMode: CompilationMode;

  /**
   * By default React Compiler will skip compilation of code that suppresses the default
   * React ESLint rules, since this is a strong indication that the code may be breaking React rules
   * in some way.
   *
   * Use eslintSuppressionRules to pass a custom set of rule names: any code which suppresses the
   * provided rules will skip compilation. To disable this feature (never bailout of compilation
   * even if the default ESLint is suppressed), pass an empty array.
   */
  eslintSuppressionRules?: Array<string> | null | undefined;

  flowSuppressions: boolean;
  /*
   * Ignore 'use no forget' annotations. Helpful during testing but should not be used in production.
   */
  ignoreUseNoForget: boolean;

  sources?: Array<string> | ((filename: string) => boolean) | null;

  /**
   * The compiler has customized support for react-native-reanimated, intended as a temporary workaround.
   * Set this flag (on by default) to automatically check for this library and activate the support.
   */
  enableReanimatedCheck: boolean;

  /**
   * The minimum major version of React that the compiler should emit code for. If the target is 19
   * or higher, the compiler emits direct imports of React runtime APIs needed by the compiler. On
   * versions prior to 19, an extra runtime package react-compiler-runtime is necessary to provide
   * a userspace approximation of runtime APIs.
   */
  target: CompilerReactTarget;
};

const CompilerReactTargetSchema = z.enum(['17', '18', '19']);
export type CompilerReactTarget = z.infer<typeof CompilerReactTargetSchema>;

const CompilationModeSchema = z.enum([
  /*
   * Compiles functions annotated with "use forget" or component/hook-like functions.
   * This latter includes:
   * * Components declared with component syntax.
   * * Functions which can be inferred to be a component or hook:
   *   - Be named like a hook or component. This logic matches the ESLint rule.
   *   - *and* create JSX and/or call a hook. This is an additional check to help prevent
   *     false positives, since compilation has a greater impact than linting.
   * This is the default mode
   */
  'infer',
  // Compile only components using Flow component syntax and hooks using hook syntax.
  'syntax',
  // Compile only functions which are explicitly annotated with "use forget"
  'annotation',
  // Compile all top-level functions
  'all',
]);

export type CompilationMode = z.infer<typeof CompilationModeSchema>;

/**
 * Represents 'events' that may occur during compilation. Events are only
 * recorded when a logger is set (through the config).
 * These are the different types of events:
 * CompileError:
 *   Forget skipped compilation of a function / file due to a known todo,
 *   invalid input, or compiler invariant being broken.
 * CompileSuccess:
 *   Forget successfully compiled a function.
 * PipelineError:
 *   Unexpected errors that occurred during compilation (e.g. failures in
 *   babel or other unhandled exceptions).
 */
export type LoggerEvent =
  | {
      kind: 'CompileError';
      fnLoc: t.SourceLocation | null;
      detail: CompilerErrorDetailOptions;
    }
  | {
      kind: 'CompileDiagnostic';
      fnLoc: t.SourceLocation | null;
      detail: Omit<Omit<CompilerErrorDetailOptions, 'severity'>, 'suggestions'>;
    }
  | {
      kind: 'CompileSkip';
      fnLoc: t.SourceLocation | null;
      reason: string;
      loc: t.SourceLocation | null;
    }
  | {
      kind: 'CompileSuccess';
      fnLoc: t.SourceLocation | null;
      fnName: string | null;
      memoSlots: number;
      memoBlocks: number;
      memoValues: number;
      prunedMemoBlocks: number;
      prunedMemoValues: number;
    }
  | {
      kind: 'PipelineError';
      fnLoc: t.SourceLocation | null;
      data: string;
    };

export type Logger = {
  logEvent: (filename: string | null, event: LoggerEvent) => void;
};

export const defaultOptions: PluginOptions = {
  compilationMode: 'infer',
  panicThreshold: 'none',
  environment: parseEnvironmentConfig({}).unwrap(),
  logger: null,
  gating: null,
  noEmit: false,
  eslintSuppressionRules: null,
  flowSuppressions: true,
  ignoreUseNoForget: false,
  sources: filename => {
    return filename.indexOf('node_modules') === -1;
  },
  enableReanimatedCheck: true,
  target: '19',
} as const;

export function parsePluginOptions(obj: unknown): PluginOptions {
  if (obj == null || typeof obj !== 'object') {
    return defaultOptions;
  }
  const parsedOptions = Object.create(null);
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // normalize string configs to be case insensitive
      value = value.toLowerCase();
    }
    if (isCompilerFlag(key)) {
      switch (key) {
        case 'environment': {
          const environmentResult = parseEnvironmentConfig(value);
          if (environmentResult.isErr()) {
            CompilerError.throwInvalidConfig({
              reason:
                'Error in validating environment config. This is an advanced setting and not meant to be used directly',
              description: environmentResult.unwrapErr().toString(),
              suggestions: null,
              loc: null,
            });
          }
          parsedOptions[key] = environmentResult.unwrap();
          break;
        }
        case 'target': {
          parsedOptions[key] = parseTargetConfig(value);
          break;
        }
        default: {
          parsedOptions[key] = value;
        }
      }
    }
  }
  return {...defaultOptions, ...parsedOptions};
}

export function parseTargetConfig(value: unknown): CompilerReactTarget {
  const parsed = CompilerReactTargetSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  } else {
    CompilerError.throwInvalidConfig({
      reason: 'Not a valid target',
      description: `${fromZodError(parsed.error)}`,
      suggestions: null,
      loc: null,
    });
  }
}

function isCompilerFlag(s: string): s is keyof PluginOptions {
  return hasOwnProperty(defaultOptions, s);
}
