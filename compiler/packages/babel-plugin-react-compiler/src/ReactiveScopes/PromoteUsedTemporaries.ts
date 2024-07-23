/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {GeneratedSource} from '../HIR';
import {
  Identifier,
  IdentifierId,
  InstructionId,
  Place,
  PrunedReactiveScopeBlock,
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveValue,
  ScopeId,
  promoteTemporary,
  promoteTemporaryJsxTag,
} from '../HIR/HIR';
import {ReactiveFunctionVisitor, visitReactiveFunction} from './visitors';

class Visitor extends ReactiveFunctionVisitor<State> {
  override visitScope(scopeBlock: ReactiveScopeBlock, state: State): void {
    this.traverseScope(scopeBlock, state);
    for (const dep of scopeBlock.scope.dependencies) {
      const {identifier} = dep;
      if (identifier.name == null) {
        promoteIdentifier(identifier, state);
      }
    }
    /*
     * This is technically optional. We could prune ReactiveScopes
     * whose outputs are not used in another computation or return
     * value.
     * Many of our current test fixtures do not return a value, so
     * it is better for now to promote (and memoize) every output.
     */
    for (const [, declaration] of scopeBlock.scope.declarations) {
      if (declaration.identifier.name == null) {
        promoteIdentifier(declaration.identifier, state);
      }
    }
  }

  override visitPrunedScope(
    scopeBlock: PrunedReactiveScopeBlock,
    state: State,
  ): void {
    this.traversePrunedScope(scopeBlock, state);
    for (const [, declaration] of scopeBlock.scope.declarations) {
      if (
        declaration.identifier.name == null &&
        state.pruned.get(declaration.identifier.id)?.usedOutsideScope === true
      ) {
        promoteIdentifier(declaration.identifier, state);
      }
    }
  }

  override visitParam(place: Place, state: State): void {
    if (place.identifier.name === null) {
      promoteIdentifier(place.identifier, state);
    }
  }

  override visitValue(
    id: InstructionId,
    value: ReactiveValue,
    state: State,
  ): void {
    this.traverseValue(id, value, state);
    if (value.kind === 'FunctionExpression' || value.kind === 'ObjectMethod') {
      this.visitHirFunction(value.loweredFunc.func, state);
    }
  }

  override visitReactiveFunctionValue(
    _id: InstructionId,
    _dependencies: Array<Place>,
    fn: ReactiveFunction,
    state: State,
  ): void {
    for (const operand of fn.params) {
      const place = operand.kind === 'Identifier' ? operand : operand.place;
      if (place.identifier.name === null) {
        promoteIdentifier(place.identifier, state);
      }
    }
    visitReactiveFunction(fn, this, state);
  }
}

type JsxExpressionTags = Set<IdentifierId>;
type State = {
  tags: JsxExpressionTags;
  pruned: Map<
    IdentifierId,
    {activeScopes: Array<ScopeId>; usedOutsideScope: boolean}
  >; // true if referenced within another scope, false if only accessed outside of scopes
};

class CollectPromotableTemporaries extends ReactiveFunctionVisitor<State> {
  activeScopes: Array<ScopeId> = [];

  override visitPlace(_id: InstructionId, place: Place, state: State): void {
    if (
      this.activeScopes.length !== 0 &&
      state.pruned.has(place.identifier.id)
    ) {
      const prunedPlace = state.pruned.get(place.identifier.id)!;
      if (prunedPlace.activeScopes.indexOf(this.activeScopes.at(-1)!) === -1) {
        prunedPlace.usedOutsideScope = true;
      }
    }
  }

  override visitValue(
    id: InstructionId,
    value: ReactiveValue,
    state: State,
  ): void {
    this.traverseValue(id, value, state);
    if (value.kind === 'JsxExpression' && value.tag.kind === 'Identifier') {
      state.tags.add(value.tag.identifier.id);
    }
  }

  override visitPrunedScope(
    scopeBlock: PrunedReactiveScopeBlock,
    state: State,
  ): void {
    for (const [id] of scopeBlock.scope.declarations) {
      state.pruned.set(id, {
        activeScopes: [...this.activeScopes],
        usedOutsideScope: false,
      });
    }
  }

  override visitScope(scopeBlock: ReactiveScopeBlock, state: State): void {
    this.activeScopes.push(scopeBlock.scope.id);
    this.traverseScope(scopeBlock, state);
    this.activeScopes.pop();
  }
}

export function promoteUsedTemporaries(fn: ReactiveFunction): void {
  const state: State = {
    tags: new Set(),
    pruned: new Map(),
  };
  visitReactiveFunction(fn, new CollectPromotableTemporaries(), state);
  for (const operand of fn.params) {
    const place = operand.kind === 'Identifier' ? operand : operand.place;
    if (place.identifier.name === null) {
      promoteIdentifier(place.identifier, state);
    }
  }
  visitReactiveFunction(fn, new Visitor(), state);
}

function promoteIdentifier(identifier: Identifier, state: State): void {
  CompilerError.invariant(identifier.name === null, {
    reason:
      'promoteTemporary: Expected to be called only for temporary variables',
    description: null,
    loc: GeneratedSource,
    suggestions: null,
  });
  if (state.tags.has(identifier.id)) {
    promoteTemporaryJsxTag(identifier);
  } else {
    promoteTemporary(identifier);
  }
}
