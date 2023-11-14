/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { z } from "zod";
import { CompilerErrorDetailOptions } from "../CompilerError";
import { ExternalFunction, PartialEnvironmentConfig } from "../HIR/Environment";

const PanicThresholdOptionsSchema = z.enum([
  /*
   * Any errors will panic the compiler by throwing an exception, which will
   * bubble up to the nearest exception handler above the Forget transform.
   * If Forget is invoked through `ReactForgetBabelPlugin`, this will at the least
   * skip Forget compilation for the rest of current file.
   */
  "ALL_ERRORS",
  /*
   * Panic by throwing an exception only on critical or unrecognized errors.
   * For all other errors, skip the erroring function without inserting
   * a Forget-compiled version (i.e. same behavior as noEmit).
   */
  "CRITICAL_ERRORS",
  // Never panic by throwing an exception.
  "NONE",
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
  /*
   * Enables instrumentation codegen. This emits a dev-mode only call to an
   * instrumentation function, for components and hooks that Forget compiles.
   * For example:
   *   instrumentForget: {
   *     source: 'react-forget-runtime',
   *     importSpecifierName: 'useRenderCounter',
   *   }
   *
   * produces:
   *   import {useRenderCounter} from 'react-forget-runtime-pokes';
   *
   *   function Component(props) {
   *     if (__DEV__) {
   *        useRenderCounter();
   *     }
   *     // ...
   *   }
   *
   */
  instrumentForget: ExternalFunction | null;

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
};

export type CompilationMode =
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
  | "infer"
  // Compile only functions which are explicitly annotated with "use forget"
  | "annotation"
  // Compile all top-level functions
  | "all";

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
      kind: "CompileSuccess";
      fnLoc: t.SourceLocation | null;
      fnName: string | null;
      memoSlots: number;
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
  panicThreshold: "CRITICAL_ERRORS",
  environment: {},
  logger: null,
  gating: null,
  instrumentForget: null,
  noEmit: false,
  enableUseMemoCachePolyfill: false,
} as const;

export function parsePluginOptions(obj: unknown): PluginOptions {
  if (obj == null || typeof obj !== "object") {
    return defaultOptions;
  }
  let parsedOptions: Partial<PluginOptions> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (isCompilerFlag(key)) {
      parsedOptions[key] = value;
    }
  }
  return { ...defaultOptions, ...parsedOptions };
}

function isCompilerFlag(s: string): s is keyof typeof defaultOptions {
  return Object.prototype.hasOwnProperty.call(defaultOptions, s);
}
