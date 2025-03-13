import {NodePath} from '@babel/core';
import * as t from '@babel/types';

import {CompilerError, EnvironmentConfig} from '..';
import {getOrInsertWith} from '../Utils/utils';
import {Environment} from '../HIR';
import {DEFAULT_EXPORT} from '../HIR/Environment';

export default function validateNoUntransformedReferences(
  path: NodePath<t.Program>,
  env: EnvironmentConfig,
  transformErrors: Array<{fn: NodePath<t.Node>; error: CompilerError}>,
): void {
  function assertValidEffectImportReference(
    numArgs: number,
    paths: Array<NodePath<t.Node>>,
  ): void {
    for (const path of paths) {
      const parent = path.parentPath;
      if (parent != null && parent.isCallExpression()) {
        const args = parent.get('arguments');
        /**
         * Only error on untransformed references of the form `useMyEffect(...)`
         * or `moduleNamespace.useMyEffect(...)`, with matching argument counts.
         * TODO: do we also want a mode to also hard error on non-call references?
         */
        if (args.length === numArgs) {
          const maybeErrorDiagnostic = matchCompilerDiagnostic(
            path,
            transformErrors,
          );
          /**
           * Note that we cannot easily check the type of the first argument here,
           * as it may have already been transformed by the compiler (and not
           * memoized).
           */
          CompilerError.throwInvalidReact({
            reason:
              '[InferEffectDependencies] Untransformed reference to compiler-required feature. ' +
              'Either remove this call or ensure it is successfully transformed by the compiler',
            description: maybeErrorDiagnostic
              ? `(Bailout reason: ${maybeErrorDiagnostic})`
              : null,
            loc: parent.node.loc ?? null,
          });
        }
      }
    }
  }

  function assertValidFireImportReference(
    paths: Array<NodePath<t.Node>>,
  ): void {
    if (paths.length > 0) {
      const maybeErrorDiagnostic = matchCompilerDiagnostic(
        paths[0],
        transformErrors,
      );
      CompilerError.throwInvalidReact({
        reason:
          '[Fire] Untransformed reference to compiler-required feature. ' +
          'Either remove this `fire` call or ensure it is successfully transformed by the compiler',
        description: maybeErrorDiagnostic
          ? `(Bailout reason: ${maybeErrorDiagnostic})`
          : null,
        loc: paths[0].node.loc ?? null,
      });
    }
  }

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
    transformProgram(path, moduleLoadChecks);
  }
}

type TraversalState = {
  shouldInvalidateScopes: boolean;
  program: NodePath<t.Program>;
};
type CheckInvalidReferenceFn = (paths: Array<NodePath<t.Node>>) => void;
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
  checkFn(binding.referencePaths);
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
    checkFn(references);
  }
}
function transformProgram(
  path: NodePath<t.Program>,
  moduleLoadChecks: Map<string, Map<string, CheckInvalidReferenceFn>>,
): void {
  const traversalState = {shouldInvalidateScopes: true, program: path};
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
