/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/core';
import * as t from '@babel/types';

import {CompilerError, EnvironmentConfig, ErrorSeverity, Logger} from '..';
import {getOrInsertWith} from '../Utils/utils';
import {Environment, GeneratedSource} from '../HIR';
import {DEFAULT_EXPORT} from '../HIR/Environment';
import {CompileProgramMetadata} from './Program';
import {CompilerDiagnostic, CompilerDiagnosticOptions} from '../CompilerError';

function throwInvalidReact(
  options: Omit<CompilerDiagnosticOptions, 'severity'>,
  {logger, filename}: TraversalState,
): never {
  const detail: CompilerDiagnosticOptions = {
    severity: ErrorSeverity.InvalidReact,
    ...options,
  };
  logger?.logEvent(filename, {
    kind: 'CompileError',
    fnLoc: null,
    detail: new CompilerDiagnostic(detail),
  });
  CompilerError.throwDiagnostic(detail);
}

function isAutodepsSigil(
  arg: NodePath<t.ArgumentPlaceholder | t.SpreadElement | t.Expression>,
): boolean {
  // Check for AUTODEPS identifier imported from React
  if (arg.isIdentifier() && arg.node.name === 'AUTODEPS') {
    const binding = arg.scope.getBinding(arg.node.name);
    if (binding && binding.path.isImportSpecifier()) {
      const importSpecifier = binding.path.node as t.ImportSpecifier;
      if (importSpecifier.imported.type === 'Identifier') {
        return (importSpecifier.imported as t.Identifier).name === 'AUTODEPS';
      }
    }
    return false;
  }

  // Check for React.AUTODEPS member expression
  if (arg.isMemberExpression() && !arg.node.computed) {
    const object = arg.get('object');
    const property = arg.get('property');

    if (
      object.isIdentifier() &&
      object.node.name === 'React' &&
      property.isIdentifier() &&
      property.node.name === 'AUTODEPS'
    ) {
      return true;
    }
  }

  return false;
}
function assertValidEffectImportReference(
  autodepsIndex: number,
  paths: Array<NodePath<t.Node>>,
  context: TraversalState,
): void {
  for (const path of paths) {
    const parent = path.parentPath;
    if (parent != null && parent.isCallExpression()) {
      const args = parent.get('arguments');
      const maybeCalleeLoc = path.node.loc;
      const hasInferredEffect =
        maybeCalleeLoc != null &&
        context.inferredEffectLocations.has(maybeCalleeLoc);
      /**
       * Error on effect calls that still have AUTODEPS in their args
       */
      const hasAutodepsArg = args.some(isAutodepsSigil);
      if (hasAutodepsArg && !hasInferredEffect) {
        const maybeErrorDiagnostic = matchCompilerDiagnostic(
          path,
          context.transformErrors,
        );
        /**
         * Note that we cannot easily check the type of the first argument here,
         * as it may have already been transformed by the compiler (and not
         * memoized).
         */
        throwInvalidReact(
          {
            category:
              'Cannot infer dependencies of this effect. This will break your build!',
            description:
              'To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.' +
              (maybeErrorDiagnostic ? ` ${maybeErrorDiagnostic}` : ''),
            details: [
              {
                kind: 'error',
                message: 'Cannot infer dependencies',
                loc: parent.node.loc ?? GeneratedSource,
              },
            ],
          },
          context,
        );
      }
    }
  }
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
        category:
          '[Fire] Untransformed reference to compiler-required feature.',
        description:
          'Either remove this `fire` call or ensure it is successfully transformed by the compiler' +
          maybeErrorDiagnostic
            ? ` ${maybeErrorDiagnostic}`
            : '',
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
  if (env.inferEffectDependencies) {
    for (const {
      function: {source, importSpecifierName},
      autodepsIndex,
    } of env.inferEffectDependencies) {
      const module = getOrInsertWith(moduleLoadChecks, source, () => new Map());
      module.set(
        importSpecifierName,
        assertValidEffectImportReference.bind(null, autodepsIndex),
      );
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
  inferredEffectLocations: Set<t.SourceLocation>;
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
    loc: local.node.loc ?? null,
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
    loc: local.node.loc ?? null,
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
    inferredEffectLocations:
      compileResult?.inferredEffectLocations ?? new Set(),
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
