/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ResolvedOptions} from './options';
import type {ScopeInfo} from './scope';
import type * as t from '@babel/types';

export interface DebugLogEntry {
  kind: 'debug';
  name: string;
  value: string;
}

export interface BindingRenameInfo {
  original: string;
  renamed: string;
  declarationStart: number;
}

export interface CompileSuccess {
  kind: 'success';
  ast: t.File | null;
  events: Array<LoggerEvent>;
  debugLogs?: Array<DebugLogEntry>;
  renames?: Array<BindingRenameInfo>;
}

export interface CompileError {
  kind: 'error';
  error: {
    reason: string;
    description?: string;
    details: Array<unknown>;
  };
  events: Array<LoggerEvent>;
  debugLogs?: Array<DebugLogEntry>;
}

export type CompileResult = CompileSuccess | CompileError;

export type LoggerEvent = {
  kind: string;
  [key: string]: unknown;
};

// The napi-rs generated binding.
// This will be available once the native module is built.
// For now, we use a dynamic require that will be resolved at runtime.
let rustCompile:
  | ((ast: string, scope: string, options: string) => string)
  | null = null;

function getRustCompile(): (
  ast: string,
  scope: string,
  options: string,
) => string {
  if (rustCompile == null) {
    try {
      // Try to load the native module
      const native = require('../native');
      rustCompile = native.compile;
    } catch (e) {
      throw new Error(
        'babel-plugin-react-compiler-rust: Failed to load native module. ' +
          'Make sure the native addon is built. Error: ' +
          (e as Error).message,
      );
    }
  }
  return rustCompile;
}

export function compileWithRust(
  ast: t.File,
  scopeInfo: ScopeInfo,
  options: ResolvedOptions,
  code?: string | null,
): CompileResult {
  const compile = getRustCompile();

  const optionsWithCode =
    code != null ? {...options, __sourceCode: code} : options;
  const resultJson = compile(
    JSON.stringify(ast),
    JSON.stringify(scopeInfo),
    JSON.stringify(optionsWithCode),
  );

  return JSON.parse(resultJson) as CompileResult;
}

export interface TimingEntry {
  name: string;
  duration_us: number;
}

export interface BridgeTiming {
  jsStringifyAst_us: number;
  jsStringifyScope_us: number;
  jsStringifyOptions_us: number;
  napiCall_us: number;
  jsParseResult_us: number;
}

export interface ProfiledCompileResult {
  result: CompileResult;
  bridgeTiming: BridgeTiming;
  rustTiming: Array<TimingEntry>;
}

export function compileWithRustProfiled(
  ast: t.File,
  scopeInfo: ScopeInfo,
  options: ResolvedOptions,
  code?: string | null,
): ProfiledCompileResult {
  const compile = getRustCompile();

  const optionsWithCode =
    code != null
      ? {...options, __sourceCode: code, __profiling: true}
      : {...options, __profiling: true};

  const t0 = performance.now();
  const astJson = JSON.stringify(ast);
  const t1 = performance.now();
  const scopeJson = JSON.stringify(scopeInfo);
  const t2 = performance.now();
  const optionsJson = JSON.stringify(optionsWithCode);
  const t3 = performance.now();

  const resultJson = compile(astJson, scopeJson, optionsJson);
  const t4 = performance.now();

  const result = JSON.parse(resultJson) as CompileResult & {
    timing?: Array<TimingEntry>;
  };
  const t5 = performance.now();

  const rustTiming = result.timing ?? [];
  delete result.timing;

  return {
    result,
    bridgeTiming: {
      jsStringifyAst_us: Math.round((t1 - t0) * 1000),
      jsStringifyScope_us: Math.round((t2 - t1) * 1000),
      jsStringifyOptions_us: Math.round((t3 - t2) * 1000),
      napiCall_us: Math.round((t4 - t3) * 1000),
      jsParseResult_us: Math.round((t5 - t4) * 1000),
    },
    rustTiming,
  };
}
