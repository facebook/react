import {NodePath} from '@babel/core';
import * as t from '@babel/types';

import {CompilerError, EnvironmentConfig} from '..';
import {getOrInsertWith} from '../Utils/utils';
import {Environment} from '../HIR';

export default function validateNoUntransformedReferences(
  path: NodePath<t.Program>,
  env: EnvironmentConfig,
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
      react.set('fire', assertNone);
    }
  }
  if (env.inferEffectDependencies) {
    /**
     * Only error on untransformed references of the form `useMyEffect(...)` or
     * `moduleNamespace.useMyEffect(...)`, with matching argument counts.
     * TODO: add mode to also hard error on non-call references
     */
    for (const {
      function: {source, importSpecifierName},
      numRequiredArgs,
    } of env.inferEffectDependencies) {
      const module = getOrInsertWith(moduleLoadChecks, source, () => new Map());
      module.set(
        importSpecifierName,
        assertNoAutoDepCalls.bind(null, numRequiredArgs),
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

  CompilerError.invariant(binding != null, {
    reason: 'Expected binding to be found for import specifier',
    loc: local.node.loc ?? null,
  });
  const filteredReferences = new Map<
    CheckInvalidReferenceFn,
    Array<NodePath<t.Node>>
  >();
  for (const reference of binding.referencePaths) {
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

function assertNoAutoDepCalls(
  numArgs: number,
  paths: Array<NodePath<t.Node>>,
): void {
  for (const path of paths) {
    const parent = path.parentPath;
    if (parent != null && parent.isCallExpression()) {
      const args = parent.get('arguments');
      if (args.length === numArgs) {
        /**
         * Note that we cannot easily check the type of the first argument here,
         * as it may have already been transformed by the compiler (and not
         * memoized).
         */
        CompilerError.throwTodo({
          reason:
            'Untransformed reference to experimental compiler-only feature',
          loc: parent.node.loc ?? null,
        });
      }
    }
  }
}

function assertNone(paths: Array<NodePath<t.Node>>): void {
  if (paths.length > 0) {
    CompilerError.throwTodo({
      reason: 'Untransformed reference to experimental compiler-only feature',
      loc: paths[0].node.loc ?? null,
    });
  }
}
