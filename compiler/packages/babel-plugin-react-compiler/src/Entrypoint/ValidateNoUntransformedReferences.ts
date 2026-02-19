/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/core';
import * as t from '@babel/types';

import {CompilerError, EnvironmentConfig, Logger} from '..';
import {getOrInsertWith} from '../Utils/utils';
import {Environment, GeneratedSource} from '../HIR';
import {DEFAULT_EXPORT} from '../HIR/Environment';
import {CompileProgramMetadata} from './Program';
import {
  CompilerDiagnostic,
  CompilerDiagnosticOptions,
  ErrorCategory,
} from '../CompilerError';

function throwInvalidReact(
  options: CompilerDiagnosticOptions,
  {logger, filename}: TraversalState,
): never {
  logger?.logEvent(filename, {
    kind: 'CompileError',
    fnLoc: null,
    detail: new CompilerDiagnostic(options),
  });
  CompilerError.throwDiagnostic(options);
}

function assertValidFireImportReference(
  paths: Array<NodePath<t.Node>>,
  context: TraversalState,
): void {
  if (paths.length > 0) {
    const maybeErrorDiagnostic = matchCompilerDiagnostic(
      paths[0],
      context.transformErrors,
    );
    throwInvalidReact(
      {
        category: ErrorCategory.Fire,
        reason: '[Fire] Untransformed reference to compiler-required feature.',
        description:
          'Either remove this `fire` call or ensure it is successfully transformed by the compiler' +
          (maybeErrorDiagnostic != null ? ` ${maybeErrorDiagnostic}` : ''),
        details: [
          {
            kind: 'error',
            message: 'Untransformed `fire` call',
            loc: paths[0].node.loc ?? GeneratedSource,
          },
        ],
      },
      context,
    );
  }
}
export default function validateNoUntransformedReferences(
  path: NodePath<t.Program>,
  filename: string | null,
  logger: Logger | null,
  env: EnvironmentConfig,
  compileResult: CompileProgramMetadata | null,
): void {
  const moduleLoadChecks = new Map<
    string,
    Map<string, CheckInvalidReferenceFn>
  >();
  if (env.enableFire) {
    /**
     * Error on any untransformed references to `fire` (e.g. including non-call
     * expressions)
     */
    for (const module of Environment.knownReactModules) {
      const react = getOrInsertWith(moduleLoadChecks, module, () => new Map());
      react.set('fire', assertValidFireImportReference);
    }
  }
  if (moduleLoadChecks.size > 0) {
    transformProgram(path, moduleLoadChecks, filename, logger, compileResult);
  }
}

type TraversalState = {
  shouldInvalidateScopes: boolean;
  program: NodePath<t.Program>;
  logger: Logger | null;
  filename: string | null;
  transformErrors: Array<{fn: NodePath<t.Node>; error: CompilerError}>;
};
type CheckInvalidReferenceFn = (
  paths: Array<NodePath<t.Node>>,
  context: TraversalState,
) => void;

function validateImportSpecifier(
  specifier: NodePath<t.ImportSpecifier>,
  importSpecifierChecks: Map<string, CheckInvalidReferenceFn>,
  state: TraversalState,
): void {
  const imported = specifier.get('imported');
  const specifierName: string =
    imported.node.type === 'Identifier'
      ? imported.node.name
      : imported.node.value;
  const checkFn = importSpecifierChecks.get(specifierName);
  if (checkFn == null) {
    return;
  }
  if (state.shouldInvalidateScopes) {
    state.shouldInvalidateScopes = false;
    state.program.scope.crawl();
  }

  const local = specifier.get('local');
  const binding = local.scope.getBinding(local.node.name);
  CompilerError.invariant(binding != null, {
    reason: 'Expected binding to be found for import specifier',
    loc: local.node.loc ?? GeneratedSource,
  });
  checkFn(binding.referencePaths, state);
}

function validateNamespacedImport(
  specifier: NodePath<t.ImportNamespaceSpecifier | t.ImportDefaultSpecifier>,
  importSpecifierChecks: Map<string, CheckInvalidReferenceFn>,
  state: TraversalState,
): void {
  if (state.shouldInvalidateScopes) {
    state.shouldInvalidateScopes = false;
    state.program.scope.crawl();
  }
  const local = specifier.get('local');
  const binding = local.scope.getBinding(local.node.name);
  const defaultCheckFn = importSpecifierChecks.get(DEFAULT_EXPORT);

  CompilerError.invariant(binding != null, {
    reason: 'Expected binding to be found for import specifier',
    loc: local.node.loc ?? GeneratedSource,
  });
  const filteredReferences = new Map<
    CheckInvalidReferenceFn,
    Array<NodePath<t.Node>>
  >();
  for (const reference of binding.referencePaths) {
    if (defaultCheckFn != null) {
      getOrInsertWith(filteredReferences, defaultCheckFn, () => []).push(
        reference,
      );
    }
    const parent = reference.parentPath;
    if (
      parent != null &&
      parent.isMemberExpression() &&
      parent.get('object') === reference
    ) {
      if (parent.node.computed || parent.node.property.type !== 'Identifier') {
        continue;
      }
      const checkFn = importSpecifierChecks.get(parent.node.property.name);
      if (checkFn != null) {
        getOrInsertWith(filteredReferences, checkFn, () => []).push(parent);
      }
    }
  }

  for (const [checkFn, references] of filteredReferences) {
    checkFn(references, state);
  }
}
function transformProgram(
  path: NodePath<t.Program>,

  moduleLoadChecks: Map<string, Map<string, CheckInvalidReferenceFn>>,
  filename: string | null,
  logger: Logger | null,
  compileResult: CompileProgramMetadata | null,
): void {
  const traversalState: TraversalState = {
    shouldInvalidateScopes: true,
    program: path,
    filename,
    logger,
    transformErrors: compileResult?.retryErrors ?? [],
  };
  path.traverse({
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      const importSpecifierChecks = moduleLoadChecks.get(
        path.node.source.value,
      );
      if (importSpecifierChecks == null) {
        return;
      }
      const specifiers = path.get('specifiers');
      for (const specifier of specifiers) {
        if (specifier.isImportSpecifier()) {
          validateImportSpecifier(
            specifier,
            importSpecifierChecks,
            traversalState,
          );
        } else {
          validateNamespacedImport(
            specifier as NodePath<
              t.ImportNamespaceSpecifier | t.ImportDefaultSpecifier
            >,
            importSpecifierChecks,
            traversalState,
          );
        }
      }
    },
  });
}

function matchCompilerDiagnostic(
  badReference: NodePath<t.Node>,
  transformErrors: Array<{fn: NodePath<t.Node>; error: CompilerError}>,
): string | null {
  for (const {fn, error} of transformErrors) {
    if (fn.isAncestor(badReference)) {
      return error.toString();
    }
  }
  return null;
}
