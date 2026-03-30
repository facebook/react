/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as BabelCore from '@babel/core';
import {codeFrameColumns} from '@babel/code-frame';
import {hasReactLikeFunctions} from './prefilter';
import {compileWithRust, type BindingRenameInfo} from './bridge';
import {extractScopeInfo} from './scope';
import {resolveOptions, type PluginOptions} from './options';

export default function BabelPluginReactCompilerRust(
  _babel: typeof BabelCore,
): BabelCore.PluginObj {
  let compiledProgram = false;
  return {
    name: 'react-compiler-rust',
    visitor: {
      Program: {
        enter(prog, pass): void {
          // Guard against re-entry: replaceWith() below causes Babel
          // to re-traverse the new Program, which would re-trigger this
          // handler. Skip if we've already compiled.
          if (compiledProgram) {
            return;
          }
          compiledProgram = true;
          const filename = pass.filename ?? null;

          // Step 1: Resolve options (pre-resolve JS-only values)
          const opts = resolveOptions(
            pass.opts as PluginOptions,
            pass.file,
            filename,
            pass.file.ast,
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
          const logger = (pass.opts as PluginOptions).logger;
          let scopeInfo;
          try {
            scopeInfo = extractScopeInfo(prog);
          } catch (e) {
            // Scope extraction can fail on unsupported syntax (e.g., `this` parameters).
            // Report as CompileUnexpectedThrow + CompileError, matching TS compiler behavior
            // when compilation throws unexpectedly.
            const errMsg = e instanceof Error ? e.message : String(e);
            // Parse the Babel error message to extract reason and description
            // Format: "reason. description"
            const dotIdx = errMsg.indexOf('. ');
            const reason = dotIdx >= 0 ? errMsg.substring(0, dotIdx) : errMsg;
            let description: string | undefined =
              dotIdx >= 0 ? errMsg.substring(dotIdx + 2) : undefined;
            // Strip trailing period from description (the TS compiler's
            // CompilerDiagnostic.toString() adds ". description." but the
            // detail.description field doesn't include the trailing period)
            if (description?.endsWith('.')) {
              description = description.slice(0, -1);
            }
            if (logger) {
              logger.logEvent(filename, {
                kind: 'CompileUnexpectedThrow',
                fnName: null,
                data: `Error: ${errMsg}`,
              });
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
            // Respect panicThreshold: if set to 'all_errors', throw to match TS behavior.
            // Format the error like TS CompilerError.printErrorMessage() would:
            // "Found 1 error:\n\nHeading: reason\n\ndescription."
            const panicThreshold = (pass.opts as PluginOptions).panicThreshold;
            if (
              panicThreshold === 'all_errors' ||
              panicThreshold === 'critical_errors'
            ) {
              const heading = 'Error';
              const parts = [`${heading}: ${reason}`];
              if (description != null) {
                parts.push(`\n\n${description}.`);
              }
              const formatted = `Found 1 error:\n\n${parts.join('')}`;
              const err = new Error(formatted);
              (err as any).details = [];
              throw err;
            }
            return;
          }

          // Step 5: Call Rust compiler
          const optsForRust =
            (logger as any)?.debugLogIRs != null
              ? {...opts, __debug: true}
              : opts;
          const result = compileWithRust(
            pass.file.ast,
            scopeInfo,
            optsForRust,
            pass.file.code ?? null,
          );

          // Step 6: Forward logger events and debug logs via orderedLog
          if (logger && result.orderedLog && result.orderedLog.length > 0) {
            for (const item of result.orderedLog) {
              if (item.type === 'event') {
                logger.logEvent(filename, item.event);
              } else if (item.type === 'debug' && logger.debugLogIRs) {
                logger.debugLogIRs(item.entry);
              }
            }
          } else if (logger && result.events) {
            for (const event of result.events) {
              logger.logEvent(filename, event);
            }
          }

          // Step 7: Handle result
          if (result.kind === 'error') {
            // panicThreshold triggered — throw with formatted message
            // matching the TS compiler's CompilerError.printErrorMessage()
            const source = pass.file.code ?? '';
            // If the error has a rawMessage, use it directly (e.g., simulated
            // unknown exceptions from throwUnknownException__testonly which in
            // the TS compiler are plain Error objects, not CompilerErrors)
            const message = (result.error as any).rawMessage != null
              ? (result.error as any).rawMessage
              : formatCompilerError(result.error as any, source);
            const err = new Error(message);
            (err as any).details = result.error.details;
            throw err;
          }

          // Apply variable renames from lowering to the Babel AST.
          // This matches the TS compiler's scope.rename() calls in HIRBuilder,
          // which rename shadowed variables in the original AST even when the
          // compiled function is not inserted (e.g., lint mode).
          if (result.renames != null && result.renames.length > 0) {
            applyRenames(prog, result.renames);
          }

          if (result.ast != null) {
            // Replace the program with Rust's compiled output.
            const newFile = result.ast as any;
            const newProgram = newFile.program ?? newFile;

            // After JSON round-tripping through Rust, comment objects that were
            // shared by reference in Babel's AST (e.g., a comment between two
            // statements appears as trailingComments on stmt A and leadingComments
            // on stmt B, sharing the same JS object) become separate objects.
            // Babel's generator uses reference identity to avoid printing the
            // same comment twice. We restore sharing by deduplicating: for each
            // unique comment position, we keep one canonical object and replace
            // all duplicates with references to it.
            deduplicateComments(newProgram);

            // Ensure all AST nodes from the Rust output have a `loc`
            // property. Downstream Babel plugins (e.g., babel-plugin-fbt)
            // may read `node.loc.end` without null-checking. Nodes
            // created during Rust codegen may lack `loc` because the HIR
            // source location was not available.
            ensureNodeLocs(newProgram);

            // Use Babel's replaceWith() API so that subsequent plugins
            // (babel-plugin-fbt, babel-plugin-fbt-runtime, babel-plugin-idx)
            // properly traverse the new AST. Direct assignment to
            // pass.file.ast.program bypasses Babel's traversal tracking,
            // and prog.skip() would prevent all merged plugin visitors from
            // running on the new children.
            pass.file.ast.comments = [];
            prog.replaceWith(newProgram);
          }
        },
      },
    },
  };
}

/**
 * Deduplicate comments across AST nodes after JSON round-tripping.
 *
 * Babel's parser attaches the same comment object to multiple nodes
 * (e.g., as trailingComments on node A and leadingComments on node B).
 * The code generator uses reference identity (`===`) to avoid printing
 * a comment twice. After JSON serialization/deserialization through Rust,
 * these shared references become separate objects with identical content.
 *
 * This function walks the AST, finds comments with the same (start, end)
 * position, and replaces duplicates with references to a single canonical
 * object, restoring the sharing that Babel expects.
 */
/**
 * Apply variable renames from the Rust compiler's lowering phase to the Babel AST.
 *
 * During lowering, the Rust compiler renames variables that shadow outer bindings
 * (e.g., an inner function parameter `ref` that shadows an outer `ref` becomes `ref_0`).
 * In the TS compiler, this is done via Babel's `scope.rename()` during HIRBuilder.
 * Since the Rust compiler doesn't have access to Babel's scope API, it records the
 * renames and returns them here for the Babel plugin to apply.
 */
function applyRenames(
  prog: BabelCore.NodePath<BabelCore.types.Program>,
  renames: Array<BindingRenameInfo>,
): void {
  // Build a map from declaration start position to rename info
  const renamesByPos = new Map<number, BindingRenameInfo>();
  for (const rename of renames) {
    renamesByPos.set(rename.declarationStart, rename);
  }

  // Traverse all scopes to find bindings that match
  prog.traverse({
    Scope(path: BabelCore.NodePath) {
      const scope = path.scope;
      for (const [name, binding] of Object.entries(
        scope.bindings as Record<string, any>,
      )) {
        const start = binding.identifier.start;
        if (start != null) {
          const rename = renamesByPos.get(start);
          if (rename != null && name === rename.original) {
            scope.rename(rename.original, rename.renamed);
            renamesByPos.delete(start);
          }
        }
      }
    },
  } as BabelCore.Visitor);
}

function deduplicateComments(node: any): void {
  // Map from "start:end" to canonical comment object
  const canonical = new Map<string, any>();

  function dedup(comments: any[]): any[] {
    return comments.map(c => {
      const key = `${c.start}:${c.end}`;
      const existing = canonical.get(key);
      if (existing != null) {
        return existing;
      }
      canonical.set(key, c);
      return c;
    });
  }

  function visit(n: any): void {
    if (n == null || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      for (const item of n) {
        visit(item);
      }
      return;
    }
    if (n.leadingComments) {
      n.leadingComments = dedup(n.leadingComments);
    }
    if (n.trailingComments) {
      n.trailingComments = dedup(n.trailingComments);
    }
    if (n.innerComments) {
      n.innerComments = dedup(n.innerComments);
    }
    for (const key of Object.keys(n)) {
      if (
        key === 'leadingComments' ||
        key === 'trailingComments' ||
        key === 'innerComments' ||
        key === 'start' ||
        key === 'end' ||
        key === 'loc'
      ) {
        continue;
      }
      visit(n[key]);
    }
  }

  visit(node);
}

/**
 * Ensure JSX attribute value nodes have a `loc` property.
 *
 * Downstream Babel plugins (e.g., babel-plugin-fbt) access
 * `node.loc.end` on JSX attribute values without null-checking.
 * The Rust compiler may produce StringLiteral attribute values
 * without `loc`. This function adds a synthetic `loc` only to
 * JSX attribute value nodes that need it, inheriting from the
 * parent JSXAttribute node's loc.
 */
function ensureNodeLocs(node: any): void {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) {
      ensureNodeLocs(item);
    }
    return;
  }
  if (typeof node.type !== 'string') return;

  // For JSXAttribute nodes, ensure the value child has a loc
  if (node.type === 'JSXAttribute' && node.value != null) {
    if (node.value.loc == null && node.loc != null) {
      node.value.loc = node.loc;
    } else if (node.value.loc == null && node.name?.loc != null) {
      node.value.loc = node.name.loc;
    }
  }

  for (const key of Object.keys(node)) {
    if (
      key === 'loc' ||
      key === 'start' ||
      key === 'end' ||
      key === 'leadingComments' ||
      key === 'trailingComments' ||
      key === 'innerComments'
    ) {
      continue;
    }
    ensureNodeLocs(node[key]);
  }
}

const CODEFRAME_LINES_ABOVE = 2;
const CODEFRAME_LINES_BELOW = 3;

/**
 * Map a category string from the Rust compiler to the heading used
 * by the TS compiler's printErrorSummary().
 */
function categoryToHeading(category: string): string {
  switch (category) {
    case 'Invariant':
      return 'Invariant';
    case 'Todo':
      return 'Todo';
    case 'EffectDependencies':
    case 'IncompatibleLibrary':
    case 'PreserveManualMemo':
    case 'UnsupportedSyntax':
      return 'Compilation Skipped';
    default:
      return 'Error';
  }
}

/**
 * Format a code frame from source code and a location, matching
 * the TS compiler's printCodeFrame().
 */
function printCodeFrame(
  source: string,
  loc: {start: {line: number; column: number}; end: {line: number; column: number}},
  message: string,
): string {
  try {
    return codeFrameColumns(
      source,
      {
        start: {line: loc.start.line, column: loc.start.column + 1},
        end: {line: loc.end.line, column: loc.end.column + 1},
      },
      {
        message,
        linesAbove: CODEFRAME_LINES_ABOVE,
        linesBelow: CODEFRAME_LINES_BELOW,
      },
    );
  } catch {
    return '';
  }
}

/**
 * Format a CompilerErrorInfo into a message string matching the TS
 * compiler's CompilerError.printErrorMessage() format.
 *
 * For CompilerDiagnostic (has `details` sub-items):
 *   "Heading: reason\n\ndescription.\n\nfilename:line:col\ncodeFrame"
 *
 * For legacy CompilerErrorDetail (has `loc` directly):
 *   "Heading: reason\n\ndescription.\n\nfilename:line:col\ncodeFrame"
 */
function formatCompilerError(
  errorInfo: {
    reason: string;
    description?: string;
    details: Array<{
      category: string;
      reason: string;
      description?: string | null;
      severity: string;
      details?: Array<{kind: string; loc?: any; message?: string}> | null;
      loc?: any;
    }>;
  },
  source: string,
): string {
  const detailMessages = errorInfo.details.map(detail => {
    const heading = categoryToHeading(detail.category);
    const buffer: string[] = [`${heading}: ${detail.reason}`];

    if (detail.description != null) {
      // Check if this detail has sub-items (CompilerDiagnostic style)
      if (detail.details != null && detail.details.length > 0) {
        buffer.push('\n\n', `${detail.description}.`);
        for (const item of detail.details) {
          if (item.kind === 'error' && item.loc != null) {
            const frame = printCodeFrame(source, item.loc, item.message ?? '');
            buffer.push('\n\n');
            if (item.loc.filename != null) {
              buffer.push(`${item.loc.filename}:${item.loc.start.line}:${item.loc.start.column}\n`);
            }
            buffer.push(frame);
          } else if (item.kind === 'hint') {
            buffer.push('\n\n');
            buffer.push(item.message ?? '');
          }
        }
      } else {
        // Legacy CompilerErrorDetail style
        buffer.push(`\n\n${detail.description}.`);
        if (detail.loc != null) {
          const frame = printCodeFrame(source, detail.loc, detail.reason);
          buffer.push('\n\n');
          if (detail.loc.filename != null) {
            buffer.push(`${detail.loc.filename}:${detail.loc.start.line}:${detail.loc.start.column}\n`);
          }
          buffer.push(frame);
          buffer.push('\n\n');
        }
      }
    } else {
      // No description — check for sub-items or loc
      if (detail.details != null && detail.details.length > 0) {
        for (const item of detail.details) {
          if (item.kind === 'error' && item.loc != null) {
            const frame = printCodeFrame(source, item.loc, item.message ?? '');
            buffer.push('\n\n');
            if (item.loc.filename != null) {
              buffer.push(`${item.loc.filename}:${item.loc.start.line}:${item.loc.start.column}\n`);
            }
            buffer.push(frame);
          } else if (item.kind === 'hint') {
            buffer.push('\n\n');
            buffer.push(item.message ?? '');
          }
        }
      } else if (detail.loc != null) {
        const frame = printCodeFrame(source, detail.loc, detail.reason);
        buffer.push('\n\n');
        if (detail.loc.filename != null) {
          buffer.push(`${detail.loc.filename}:${detail.loc.start.line}:${detail.loc.start.column}\n`);
        }
        buffer.push(frame);
        buffer.push('\n\n');
      }
    }

    return buffer.join('');
  });

  const count = errorInfo.details.length;
  return (
    `Found ${count} error${count === 1 ? '' : 's'}:\n\n` +
    detailMessages.map(m => m.trim()).join('\n\n')
  );
}
