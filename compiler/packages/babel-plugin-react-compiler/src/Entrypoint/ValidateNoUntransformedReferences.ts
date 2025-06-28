/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/core';
import * as t from '@babel/types';

import {
  CompilerError,
  CompilerErrorDetailOptions,
  EnvironmentConfig,
  ErrorSeverity,
  Logger,
} from '..';
import {getOrInsertWith} from '../Utils/utils';
import {Environment} from '../HIR';
import {DEFAULT_EXPORT} from '../HIR/Environment';
import {CompileProgramMetadata} from './Program';

function throwInvalidReact(
  options: Omit<CompilerErrorDetailOptions, 'severity'>,
  {logger, filename}: TraversalState,
): never {
  const detail: CompilerErrorDetailOptions = {
    ...options,
    severity: ErrorSeverity.InvalidReact,
  };
  logger?.logEvent(filename, {
    kind: 'CompileError',
    fnLoc: null,
    detail,
  });
  CompilerError.throw(detail);
}
function assertValidEffectImportReference(
  numArgs: number,
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
       * Only error on untransformed references of the form `useMyEffect(...)`
       * or `moduleNamespace.useMyEffect(...)`, with matching argument counts.
       * TODO: do we also want a mode to also hard error on non-call references?
       */
      if (args.length === numArgs && !hasInferredEffect) {
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
            reason:
              '[InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. ' +
              'This will break your build! ' +
              'To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics.',
            description: maybeErrorDiagnostic
              ? `(Bailout reason: ${maybeErrorDiagnostic})`
              : null,
            loc: parent.node.loc ?? null,
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
        reason:
          '[Fire] Untransformed reference to compiler-required feature. ' +
          'Either remove this `fire` call or ensure it is successfully transformed by the compiler',
        description: maybeErrorDiagnostic
          ? `(Bailout reason: ${maybeErrorDiagnostic})`
          : null,
        loc: paths[0].node.loc ?? null,
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
      numRequiredArgs,
    } of env.inferEffectDependencies) {
      const module = getOrInsertWith(moduleLoadChecks, source, () => new Map());
      module.set(
        importSpecifierName,
        assertValidEffectImportReference.bind(null, numRequiredArgs),
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
