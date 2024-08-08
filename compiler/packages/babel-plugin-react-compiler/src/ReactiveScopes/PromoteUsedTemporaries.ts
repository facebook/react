/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {GeneratedSource} from '../HIR';
import {
  DeclarationId,
  Identifier,
  InstructionId,
  Place,
  PrunedReactiveScopeBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveScopeBlock,
  ReactiveValue,
  ScopeId,
  promoteTemporary,
  promoteTemporaryJsxTag,
} from '../HIR/HIR';
import {ReactiveFunctionVisitor, visitReactiveFunction} from './visitors';

/**
 * Phase 2: Promote identifiers which are used in a place that requires a named variable.
 */
class PromoteTemporaries extends ReactiveFunctionVisitor<State> {
  override visitScope(scopeBlock: ReactiveScopeBlock, state: State): void {
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
    this.traverseScope(scopeBlock, state);
  }

  override visitPrunedScope(
    scopeBlock: PrunedReactiveScopeBlock,
    state: State,
  ): void {
    for (const [, declaration] of scopeBlock.scope.declarations) {
      if (
        declaration.identifier.name == null &&
        state.pruned.get(declaration.identifier.declarationId)
          ?.usedOutsideScope === true
      ) {
        promoteIdentifier(declaration.identifier, state);
      }
    }
    this.traversePrunedScope(scopeBlock, state);
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

/**
 * Phase 3: Now that identifiers which need promotion are promoted, find and promote
 * all other Identifier instances of each promoted DeclarationId.
 */
class PromoteAllInstancedOfPromotedTemporaries extends ReactiveFunctionVisitor<State> {
  override visitPlace(_id: InstructionId, place: Place, state: State): void {
    if (
      place.identifier.name === null &&
      state.promoted.has(place.identifier.declarationId)
    ) {
      promoteIdentifier(place.identifier, state);
    }
  }
  override visitLValue(
    _id: InstructionId,
    _lvalue: Place,
    _state: State,
  ): void {
    this.visitPlace(_id, _lvalue, _state);
  }
  traverseScopeIdentifiers(scope: ReactiveScope, state: State): void {
    for (const [, decl] of scope.declarations) {
      if (
        decl.identifier.name === null &&
        state.promoted.has(decl.identifier.declarationId)
      ) {
        promoteIdentifier(decl.identifier, state);
      }
    }
    for (const dep of scope.dependencies) {
      if (
        dep.identifier.name === null &&
        state.promoted.has(dep.identifier.declarationId)
      ) {
        promoteIdentifier(dep.identifier, state);
      }
    }
    for (const reassignment of scope.reassignments) {
      if (
        reassignment.name === null &&
        state.promoted.has(reassignment.declarationId)
      ) {
        promoteIdentifier(reassignment, state);
      }
    }
  }
  override visitScope(scope: ReactiveScopeBlock, state: State): void {
    this.traverseScope(scope, state);
    this.traverseScopeIdentifiers(scope.scope, state);
  }
  override visitPrunedScope(
    scopeBlock: PrunedReactiveScopeBlock,
    state: State,
  ): void {
    this.traversePrunedScope(scopeBlock, state);
    this.traverseScopeIdentifiers(scopeBlock.scope, state);
  }
  override visitReactiveFunctionValue(
    _id: InstructionId,
    _dependencies: Array<Place>,
    fn: ReactiveFunction,
    state: State,
  ): void {
    visitReactiveFunction(fn, this, state);
  }
}

type JsxExpressionTags = Set<DeclarationId>;
type State = {
  tags: JsxExpressionTags;
  promoted: Set<DeclarationId>;
  pruned: Map<
    DeclarationId,
    {activeScopes: Array<ScopeId>; usedOutsideScope: boolean}
  >; // true if referenced within another scope, false if only accessed outside of scopes
};

/**
 * Phase 1: checks for pruned variables which need to be promoted, as well as
 * usage of identifiers as jsx tags, which need to be promoted differently
 */
class CollectPromotableTemporaries extends ReactiveFunctionVisitor<State> {
  activeScopes: Array<ScopeId> = [];

  override visitPlace(_id: InstructionId, place: Place, state: State): void {
    if (
      this.activeScopes.length !== 0 &&
      state.pruned.has(place.identifier.declarationId)
    ) {
      const prunedPlace = state.pruned.get(place.identifier.declarationId)!;
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
      state.tags.add(value.tag.identifier.declarationId);
    }
  }

  override visitPrunedScope(
    scopeBlock: PrunedReactiveScopeBlock,
    state: State,
  ): void {
    for (const [_id, decl] of scopeBlock.scope.declarations) {
      state.pruned.set(decl.identifier.declarationId, {
        activeScopes: [...this.activeScopes],
        usedOutsideScope: false,
      });
    }
    this.visitBlock(scopeBlock.instructions, state);
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
    promoted: new Set(),
    pruned: new Map(),
  };
  visitReactiveFunction(fn, new CollectPromotableTemporaries(), state);
  for (const operand of fn.params) {
    const place = operand.kind === 'Identifier' ? operand : operand.place;
    if (place.identifier.name === null) {
      promoteIdentifier(place.identifier, state);
    }
  }
  visitReactiveFunction(fn, new PromoteTemporaries(), state);
  visitReactiveFunction(
    fn,
    new PromoteAllInstancedOfPromotedTemporaries(),
    state,
  );
}

function promoteIdentifier(identifier: Identifier, state: State): void {
  CompilerError.invariant(identifier.name === null, {
    reason:
      'promoteTemporary: Expected to be called only for temporary variables',
    description: null,
    loc: GeneratedSource,
    suggestions: null,
  });
  if (state.tags.has(identifier.declarationId)) {
    promoteTemporaryJsxTag(identifier);
  } else {
    promoteTemporary(identifier);
  }
  state.promoted.add(identifier.declarationId);
}
