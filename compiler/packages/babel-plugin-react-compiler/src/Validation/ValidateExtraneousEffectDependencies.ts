/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerDiagnostic, CompilerError, SourceLocation} from '..';
import {ErrorCategory} from '../CompilerError';
import {
  areEqualPaths,
  DependencyPath,
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  isStableType,
  isSubPath,
  isSubPathIgnoringOptionals,
  isUseEffectHookType,
  isUseInsertionEffectHookType,
  isUseLayoutEffectHookType,
  Place,
} from '../HIR';
import {Result} from '../Utils/Result';

type EffectDependency = {
  root:
    | {
        kind: 'NamedLocal';
        value: Place;
      }
    | {kind: 'Global'; identifierName: string};
  path: DependencyPath;
  loc: SourceLocation;
};

/**
 * Validates that effect dependency arrays do not include extraneous dependencies that
 * are not referenced within the effect.
 *
 * Including extraneous dependencies can cause effects to re-run unnecessarily.
 * This leads to people relying on effects as "watchers".
 *
 * Example of extraneous dependency:
 * ```javascript
 * useEffect(() => {
 *   console.log(a);
 * }, [a, b]); // `b` is extraneous - it's not used in the effect
 * ```
 */
export function validateExtraneousEffectDependencies(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const error = new CompilerError();
  const functionExpressions = new Map<IdentifierId, HIRFunction>();
  const arrayExpressions = new Map<IdentifierId, Instruction>();

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      if (value.kind === 'FunctionExpression') {
        functionExpressions.set(lvalue.identifier.id, value.loweredFunc.func);
      }

      if (value.kind === 'ArrayExpression') {
        arrayExpressions.set(lvalue.identifier.id, instr);
      }

      if (
        value.kind === 'CallExpression' &&
        value.args.length === 2 &&
        isEffectHook(value.callee.identifier)
      ) {
        const [callback, depsArg] = value.args;

        if (callback?.kind !== 'Identifier' || depsArg?.kind !== 'Identifier') {
          continue;
        }

        const callbackFunc = functionExpressions.get(callback.identifier.id);
        const depsArray = arrayExpressions.get(depsArg.identifier.id);

        if (callbackFunc == null || depsArray == null) {
          continue;
        }

        if (depsArray.value.kind !== 'ArrayExpression') {
          continue;
        }

        const deps: Array<EffectDependency> = [];
        for (const el of depsArray.value.elements) {
          if (el.kind === 'Identifier') {
            const resolved = resolveLoadLocal(fn, el);
            deps.push({
              root: {
                kind: 'NamedLocal' as const,
                value: resolved.place,
              },
              path: resolved.path,
              loc: el.loc,
            });
          }
        }

        validateEffectDependencies(
          callbackFunc,
          deps,
          depsArray.loc,
          value.loc,
          error,
        );
      }
    }
  }

  return error.asResult();
}

/**
 * Validates that all dependencies in the effect's dependency array are actually
 * referenced within the effect callback.
 */
function validateEffectDependencies(
  callbackFunc: HIRFunction,
  manualDeps: Array<EffectDependency>,
  depsLoc: SourceLocation,
  effectLoc: SourceLocation,
  error: CompilerError,
): void {
  // Collect all identifiers referenced in the callback
  const referencedIdentifiers = collectReferencedIdentifiers(callbackFunc);

  const extraneousDeps: Array<EffectDependency> = [];
  for (const manualDep of manualDeps) {
    if (manualDep.root.kind !== 'NamedLocal') {
      continue;
    }

    const depId = manualDep.root.value.identifier.id;
    const isReferenced = referencedIdentifiers.some(
      ref =>
        ref.identifier.id === depId &&
        (areEqualPaths(ref.path, manualDep.path) ||
          isSubPath(manualDep.path, ref.path) ||
          isSubPathIgnoringOptionals(manualDep.path, ref.path)),
    );

    if (!isReferenced) {
      extraneousDeps.push(manualDep);
    }
  }

  if (extraneousDeps.length === 0) {
    return;
  }

  /**
   * Filter out stable types (refs, setState) as they're often included
   * as defensive dependencies even if not used
   */
  const nonStableExtraneous = extraneousDeps.filter(dep => {
    if (dep.root.kind === 'NamedLocal') {
      return !isStableType(dep.root.value.identifier);
    }
    return true;
  });

  if (nonStableExtraneous.length > 0) {
    const diagnostic = CompilerDiagnostic.create({
      category: ErrorCategory.EffectDependencies,
      reason: 'Found unnecessary effect dependencies',
      description:
        'Unnecessary dependencies can cause an effect to re-run more often than necessary, ' +
        'potentially causing performance issues',
    });

    diagnostic.withDetails({
      kind: 'error',
      message: `Unnecessary dependencies: ${nonStableExtraneous.map(dep => `\`${printEffectDependency(dep)}\``).join(', ')}. These values are not referenced in the effect`,
      loc: depsLoc ?? effectLoc,
    });

    error.pushDiagnostic(diagnostic);
  }
}

type ReferencedIdentifier = {
  identifier: Identifier;
  path: DependencyPath;
};

/**
 * Collects all identifiers that are referenced (read) within a function.
 * This includes:
 * - LoadLocal/LoadContext instructions that reference variables from outer scope
 * - Property loads on those variables
 */
function collectReferencedIdentifiers(
  fn: HIRFunction,
): Array<ReferencedIdentifier> {
  const referenced: Array<ReferencedIdentifier> = [];
  const identifierPaths = new Map<IdentifierId, DependencyPath>();
  const sourcePlaces = new Map<IdentifierId, Place>();

  // Track which identifiers are local to the function (params, local vars)
  const localIdentifiers = new Set<IdentifierId>();
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    localIdentifiers.add(place.identifier.id);
  }

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      // Track local variable declarations
      if (
        value.kind === 'DeclareLocal' ||
        value.kind === 'StoreLocal' ||
        value.kind === 'DeclareContext' ||
        value.kind === 'StoreContext' ||
        value.kind === 'Destructure'
      ) {
        localIdentifiers.add(lvalue.identifier.id);
      }

      // Track LoadLocal and LoadContext - these reference variables from outer scope
      if (value.kind === 'LoadLocal' || value.kind === 'LoadContext') {
        const sourceId = value.place.identifier.id;
        // Only track if it's not a local identifier (i.e., it's from outer scope)
        if (!localIdentifiers.has(sourceId)) {
          const path = identifierPaths.get(sourceId) ?? [];
          const exists = referenced.some(
            ref =>
              ref.identifier.id === sourceId && areEqualPaths(ref.path, path),
          );
          if (!exists) {
            referenced.push({
              identifier: value.place.identifier,
              path,
            });
          }
          // Track that lvalue now represents this source identifier
          identifierPaths.set(lvalue.identifier.id, path);
          sourcePlaces.set(lvalue.identifier.id, value.place);
        } else {
          // It's a local identifier, track its path
          const path = identifierPaths.get(sourceId) ?? [];
          identifierPaths.set(lvalue.identifier.id, path);
          sourcePlaces.set(lvalue.identifier.id, value.place);
        }
      }

      // Track property loads to build paths and mark outer references
      if (value.kind === 'PropertyLoad') {
        const objectId = value.object.identifier.id;
        const basePath = identifierPaths.get(objectId) ?? [];
        const fullPath = [
          ...basePath,
          {property: value.property, optional: false},
        ];
        identifierPaths.set(lvalue.identifier.id, fullPath);

        // Resolve to the original source place (outer scope) for the object
        const basePlace = sourcePlaces.get(objectId) ?? value.object;
        const baseSourceId = basePlace.identifier.id;
        if (!localIdentifiers.has(baseSourceId)) {
          const exists = referenced.some(
            ref =>
              ref.identifier.id === baseSourceId &&
              areEqualPaths(ref.path, fullPath),
          );
          if (!exists) {
            referenced.push({
              identifier: basePlace.identifier,
              path: fullPath,
            });
          }
        }
      }
    }
  }

  return referenced;
}

/**
 * Resolves LoadLocal chains to find the actual source identifier and path.
 * For example, if we have:
 *   $31 = LoadLocal $20
 *   $20 = LoadLocal a
 * This will resolve $31 back to identifier `a`.
 */
function resolveLoadLocal(
  fn: HIRFunction,
  place: Place,
): {place: Place; path: DependencyPath} {
  const identifierPaths = new Map<
    IdentifierId,
    {place: Place; path: DependencyPath}
  >();

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;

      // Track LoadLocal to resolve chains
      if (value.kind === 'LoadLocal' || value.kind === 'LoadContext') {
        const source = identifierPaths.get(value.place.identifier.id) ?? {
          place: value.place,
          path: [],
        };
        identifierPaths.set(lvalue.identifier.id, source);
      }

      // Track PropertyLoad to build paths
      if (value.kind === 'PropertyLoad') {
        const base = identifierPaths.get(value.object.identifier.id) ?? {
          place: value.object,
          path: [],
        };
        identifierPaths.set(lvalue.identifier.id, {
          place: base.place,
          path: [...base.path, {property: value.property, optional: false}],
        });
      }
    }
  }

  return identifierPaths.get(place.identifier.id) ?? {place, path: []};
}

function printEffectDependency(dep: EffectDependency): string {
  let identifierName: string;
  if (dep.root.kind === 'Global') {
    identifierName = dep.root.identifierName;
  } else {
    const name = dep.root.value.identifier.name;
    if (name == null || name.kind !== 'named') {
      return '<unnamed>';
    }
    identifierName = name.value;
  }
  return `${identifierName}${dep.path.map(p => (p.optional ? '?' : '') + '.' + p.property).join('')}`;
}

function isEffectHook(identifier: Identifier): boolean {
  return (
    isUseEffectHookType(identifier) ||
    isUseLayoutEffectHookType(identifier) ||
    isUseInsertionEffectHookType(identifier)
  );
}
