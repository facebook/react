/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import {CompilerDiagnostic, CompilerError, ErrorCategory} from '..';
import {CodegenFunction} from '../ReactiveScopes';
import {Result} from '../Utils/Result';

/**
 * IMPORTANT: This validation is only intended for use in unit tests.
 * It is not intended for use in production.
 *
 * This validation is used to ensure that the generated AST has proper source locations
 * for "important" original nodes.
 *
 * There's one big gotcha with this validation: it only works if the "important" original nodes
 * are not optimized away by the compiler.
 *
 * When that scenario happens, we should just update the fixture to not include a node that has no
 * corresponding node in the generated AST due to being completely removed during compilation.
 */

/**
 * Some common node types that are important for coverage tracking.
 * Based on istanbul-lib-instrument
 */
const IMPORTANT_INSTRUMENTED_TYPES = new Set([
  'ArrowFunctionExpression',
  'AssignmentPattern',
  'ObjectMethod',
  'ExpressionStatement',
  'BreakStatement',
  'ContinueStatement',
  'ReturnStatement',
  'ThrowStatement',
  'TryStatement',
  'VariableDeclarator',
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'SwitchCase',
  'WithStatement',
  'FunctionDeclaration',
  'FunctionExpression',
  'LabeledStatement',
  'ConditionalExpression',
  'LogicalExpression',
]);

/**
 * Check if a node is a manual memoization call that the compiler optimizes away.
 * These include useMemo and useCallback calls, which are intentionally removed
 * by the DropManualMemoization pass.
 */
function isManualMemoization(node: t.Node): boolean {
  // Check if this is a useMemo/useCallback call expression
  if (t.isCallExpression(node)) {
    const callee = node.callee;
    if (t.isIdentifier(callee)) {
      return callee.name === 'useMemo' || callee.name === 'useCallback';
    }
    if (
      t.isMemberExpression(callee) &&
      t.isIdentifier(callee.property) &&
      t.isIdentifier(callee.object)
    ) {
      return (
        callee.object.name === 'React' &&
        (callee.property.name === 'useMemo' ||
          callee.property.name === 'useCallback')
      );
    }
  }

  return false;
}

/**
 * Create a location key for comparison. We compare by line/column/source,
 * not by object identity.
 */
function locationKey(loc: t.SourceLocation): string {
  return `${loc.start.line}:${loc.start.column}-${loc.end.line}:${loc.end.column}`;
}

/**
 * Validates that important source locations from the original code are preserved
 * in the generated AST. This ensures that Istanbul coverage instrumentation can
 * properly map back to the original source code.
 *
 * The validator:
 * 1. Collects locations from "important" nodes in the original AST (those that
 *    Istanbul instruments for coverage tracking)
 * 2. Exempts known compiler optimizations (useMemo/useCallback removal)
 * 3. Verifies that all important locations appear somewhere in the generated AST
 *
 * Missing locations can cause Istanbul to fail to track coverage for certain
 * code paths, leading to inaccurate coverage reports.
 */
export function validateSourceLocations(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  generatedAst: CodegenFunction,
): Result<void, CompilerError> {
  const errors = new CompilerError();

  // Step 1: Collect important locations from the original source
  const importantOriginalLocations = new Map<
    string,
    {loc: t.SourceLocation; nodeType: string}
  >();

  func.traverse({
    enter(path) {
      const node = path.node;

      // Only track node types that Istanbul instruments
      if (!IMPORTANT_INSTRUMENTED_TYPES.has(node.type)) {
        return;
      }

      // Skip manual memoization that the compiler intentionally removes
      if (isManualMemoization(node)) {
        return;
      }

      // Collect the location if it exists
      if (node.loc) {
        const key = locationKey(node.loc);
        importantOriginalLocations.set(key, {
          loc: node.loc,
          nodeType: node.type,
        });
      }
    },
  });

  // Step 2: Collect all locations from the generated AST
  const generatedLocations = new Set<string>();

  function collectGeneratedLocations(node: t.Node): void {
    if (node.loc) {
      generatedLocations.add(locationKey(node.loc));
    }

    // Use Babel's VISITOR_KEYS to traverse only actual node properties
    const keys = t.VISITOR_KEYS[node.type as keyof typeof t.VISITOR_KEYS];

    if (!keys) {
      return;
    }

    for (const key of keys) {
      const value = (node as any)[key];

      if (Array.isArray(value)) {
        for (const item of value) {
          if (t.isNode(item)) {
            collectGeneratedLocations(item);
          }
        }
      } else if (t.isNode(value)) {
        collectGeneratedLocations(value);
      }
    }
  }

  // Collect from main function body
  collectGeneratedLocations(generatedAst.body);

  // Collect from outlined functions
  for (const outlined of generatedAst.outlined) {
    collectGeneratedLocations(outlined.fn.body);
  }

  // Step 3: Validate that all important locations are preserved
  for (const [key, {loc, nodeType}] of importantOriginalLocations) {
    if (!generatedLocations.has(key)) {
      errors.pushDiagnostic(
        CompilerDiagnostic.create({
          category: ErrorCategory.Todo,
          reason: 'Important source location missing in generated code',
          description:
            `Source location for ${nodeType} is missing in the generated output. This can cause coverage instrumentation ` +
            `to fail to track this code properly, resulting in inaccurate coverage reports.`,
        }).withDetails({
          kind: 'error',
          loc,
          message: null,
        }),
      );
    }
  }

  return errors.asResult();
}
