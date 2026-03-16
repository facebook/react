/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ResolvedOptions} from './options';
import type {ScopeInfo} from './scope';
import type * as t from '@babel/types';

export interface CompileSuccess {
  kind: 'success';
  ast: t.File | null;
  events: Array<LoggerEvent>;
}

export interface CompileError {
  kind: 'error';
  error: {
    reason: string;
    description?: string;
    details: Array<unknown>;
  };
  events: Array<LoggerEvent>;
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
): CompileResult {
  const compile = getRustCompile();

  const resultJson = compile(
    JSON.stringify(ast),
    JSON.stringify(scopeInfo),
    JSON.stringify(options),
  );

  return JSON.parse(resultJson) as CompileResult;
}
