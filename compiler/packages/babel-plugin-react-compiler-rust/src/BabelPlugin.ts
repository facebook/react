/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as BabelCore from '@babel/core';
import {hasReactLikeFunctions} from './prefilter';
import {compileWithRust} from './bridge';
import {extractScopeInfo} from './scope';
import {resolveOptions, type PluginOptions} from './options';

export default function BabelPluginReactCompilerRust(
  _babel: typeof BabelCore,
): BabelCore.PluginObj {
  return {
    name: 'react-compiler-rust',
    visitor: {
      Program: {
        enter(prog, pass): void {
          const filename = pass.filename ?? null;

          // Step 1: Resolve options (pre-resolve JS-only values)
          const opts = resolveOptions(
            pass.opts as PluginOptions,
            pass.file,
            filename,
          );

          // Step 2: Quick bail — should we compile this file at all?
          if (!opts.shouldCompile) {
            return;
          }

          // Step 3: Pre-filter — any potential React functions?
          if (!hasReactLikeFunctions(prog)) {
            return;
          }

          // Step 4: Extract scope info
          const scopeInfo = extractScopeInfo(prog);

          // Step 5: Call Rust compiler
          const result = compileWithRust(
            prog.node,
            scopeInfo,
            opts,
            pass.file.ast.comments ?? [],
          );

          // Step 6: Forward logger events
          const logger = (pass.opts as PluginOptions).logger;
          if (logger && result.events) {
            for (const event of result.events) {
              logger.logEvent(filename, event);
            }
          }

          // Step 7: Handle result
          if (result.kind === 'error') {
            // panicThreshold triggered — throw
            const err = new Error(result.error.reason);
            (err as any).details = result.error.details;
            throw err;
          }

          if (result.ast != null) {
            // Replace the entire program body with Rust's output
            prog.replaceWith(result.ast);
            prog.skip(); // Don't re-traverse
          }
        },
      },
    },
  };
}
