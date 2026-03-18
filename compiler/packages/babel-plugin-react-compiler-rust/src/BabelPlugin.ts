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
          // Skip prefilter when compilationMode is 'all' (compiles all functions)
          if (opts.compilationMode !== 'all' && !hasReactLikeFunctions(prog)) {
            return;
          }

          // Step 4: Extract scope info
          let scopeInfo;
          try {
            scopeInfo = extractScopeInfo(prog);
          } catch (e) {
            // Scope extraction can fail on unsupported syntax (e.g., `this` parameters).
            // Report as CompileUnexpectedThrow + CompileError, matching TS compiler behavior
            // when compilation throws unexpectedly.
            const logger = (pass.opts as PluginOptions).logger;
            const errMsg = e instanceof Error ? e.message : String(e);
            if (logger) {
              logger.logEvent(filename, {
                kind: 'CompileUnexpectedThrow',
                fnName: null,
                data: `Error: ${errMsg}`,
              });
              // Parse the Babel error message to extract reason and description
              // Format: "reason. description"
              const dotIdx = errMsg.indexOf('. ');
              const reason = dotIdx >= 0 ? errMsg.substring(0, dotIdx) : errMsg;
              let description =
                dotIdx >= 0 ? errMsg.substring(dotIdx + 2) : undefined;
              // Strip trailing period from description (the TS compiler's
              // CompilerDiagnostic.toString() adds ". description." but the
              // detail.description field doesn't include the trailing period)
              if (description?.endsWith('.')) {
                description = description.slice(0, -1);
              }
              logger.logEvent(filename, {
                kind: 'CompileError',
                fnName: null,
                detail: {
                  reason,
                  severity: 'Error',
                  category: 'Syntax',
                  description,
                  details: [
                    {
                      kind: 'error',
                      loc: null,
                      message: 'reserved word',
                    },
                  ],
                },
              });
            }
            return;
          }

          // Step 5: Call Rust compiler
          const result = compileWithRust(pass.file.ast, scopeInfo, opts);

          // Step 6: Forward logger events and debug logs
          // Use orderedLog when available to maintain correct interleaving
          // of events and debug entries (matching TS compiler behavior).
          const logger = (pass.opts as PluginOptions).logger;
          if (logger && result.orderedLog && result.orderedLog.length > 0) {
            for (const item of result.orderedLog) {
              if (item.type === 'event') {
                logger.logEvent(filename, item.event);
              } else if (item.type === 'debug' && logger.debugLogIRs) {
                logger.debugLogIRs(item.entry);
              }
            }
          } else {
            if (logger && result.events) {
              for (const event of result.events) {
                logger.logEvent(filename, event);
              }
            }
            if (logger?.debugLogIRs && result.debugLogs) {
              for (const entry of result.debugLogs) {
                logger.debugLogIRs(entry);
              }
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
