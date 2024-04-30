/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { z } from "zod";
import { CompilerErrorDetailOptions } from "../CompilerError";
import { ExternalFunction, PartialEnvironmentConfig } from "../HIR/Environment";
import { hasOwnProperty } from "../Utils/utils";

const PanicThresholdOptionsSchema = z.enum([
  /*
   * Any errors will panic the compiler by throwing an exception, which will
   * bubble up to the nearest exception handler above the Forget transform.
   * If Forget is invoked through `ReactForgetBabelPlugin`, this will at the least
   * skip Forget compilation for the rest of current file.
   */
  "all_errors",
  /*
   * Panic by throwing an exception only on critical or unrecognized errors.
   * For all other errors, skip the erroring function without inserting
   * a Forget-compiled version (i.e. same behavior as noEmit).
   */
  "critical_errors",
  // Never panic by throwing an exception.
  "none",
]);

export type PanicThresholdOptions = z.infer<typeof PanicThresholdOptionsSchema>;

export type PluginOptions = {
  environment: PartialEnvironmentConfig | null;

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

  /*
   * If enabled, Forget will import `useMemoCache` from a polyfill instead of React. Use this if
   * you are for whatever reason unable to use an experimental version of React.
   *
   * ```
   * // If specified:
   * import {unstable_useMemoCache} from 'react-forget-runtime';
   * ```
   */
  enableUseMemoCachePolyfill: boolean;

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
};

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
  "infer",
  // Compile only functions which are explicitly annotated with "use forget"
  "annotation",
  // Compile all top-level functions
  "all",
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
      kind: "CompileError";
      fnLoc: t.SourceLocation | null;
      detail: CompilerErrorDetailOptions;
    }
  | {
      kind: "CompileDiagnostic";
      fnLoc: t.SourceLocation | null;
      detail: Omit<Omit<CompilerErrorDetailOptions, "severity">, "suggestions">;
    }
  | {
      kind: "CompileSuccess";
      fnLoc: t.SourceLocation | null;
      fnName: string | null;
      memoSlots: number;
      memoBlocks: number;
    }
  | {
      kind: "PipelineError";
      fnLoc: t.SourceLocation | null;
      data: string;
    };

export type Logger = {
  logEvent: (filename: string | null, event: LoggerEvent) => void;
};

export const defaultOptions: PluginOptions = {
  compilationMode: "infer",
  panicThreshold: "none",
  environment: {},
  logger: null,
  gating: null,
  noEmit: false,
  enableUseMemoCachePolyfill: false,
  eslintSuppressionRules: null,
  flowSuppressions: false,
  ignoreUseNoForget: false,
} as const;

export function parsePluginOptions(obj: unknown): PluginOptions {
  if (obj == null || typeof obj !== "object") {
    return defaultOptions;
  }
  const parsedOptions = Object.create(null);
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // normalize string configs to be case insensitive
      value = value.toLowerCase();
    }
    if (isCompilerFlag(key)) {
      parsedOptions[key] = value;
    }
  }
  return { ...defaultOptions, ...parsedOptions };
}

function isCompilerFlag(s: string): s is keyof PluginOptions {
  return hasOwnProperty(defaultOptions, s);
}
