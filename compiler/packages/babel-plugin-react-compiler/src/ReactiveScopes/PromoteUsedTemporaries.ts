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
  ReactiveInstruction,
  ReactiveScopeBlock,
  ReactiveValue,
  ScopeId,
  SpreadPattern,
  promoteTemporary,
  promoteTemporaryJsxTag,
} from '../HIR/HIR';
import {ReactiveFunctionVisitor, visitReactiveFunction} from './visitors';
import {eachInstructionValueLValue, eachPatternOperand} from '../HIR/visitors';

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
    this.visitBlock(scopeBlock.instructions, state);
  }

  override visitScope(scopeBlock: ReactiveScopeBlock, state: State): void {
    this.activeScopes.push(scopeBlock.scope.id);
    this.traverseScope(scopeBlock, state);
    this.activeScopes.pop();
  }
}

type InterState = Map<IdentifierId, [Identifier, boolean]>;
class PromoteInterposedTemporaries extends ReactiveFunctionVisitor<InterState> {
  #promotable: State;
  #consts: Set<IdentifierId> = new Set();
  #globals: Set<IdentifierId> = new Set();

  /*
   * Unpromoted temporaries will be emitted at their use sites rather than as separate
   * declarations. However, this causes errors if an interposing temporary has been
   * promoted, or if an interposing instruction has had its lvalues deleted, because such
   * temporaries will be emitted as separate statements, which can effectively cause
   * code to be reordered, and when that code has side effects that changes program behavior.
   * This visitor promotes temporarties that have such interposing instructions to preserve
   * source ordering.
   */
  constructor(promotable: State, params: Array<Place | SpreadPattern>) {
    super();
    params.forEach(param => {
      switch (param.kind) {
        case 'Identifier':
          this.#consts.add(param.identifier.id);
          break;
        case 'Spread':
          this.#consts.add(param.place.identifier.id);
          break;
      }
    });
    this.#promotable = promotable;
  }

  override visitPlace(
    _id: InstructionId,
    place: Place,
    state: InterState,
  ): void {
    const promo = state.get(place.identifier.id);
    if (promo) {
      const [identifier, needsPromotion] = promo;
      if (
        needsPromotion &&
        identifier.name === null &&
        !this.#consts.has(identifier.id)
      ) {
        /*
         * If the identifier hasn't been promoted but is marked as needing
         * promotion by the logic in `visitInstruction`, and we've seen a
         * use of it after said marking, promote it
         */
        promoteIdentifier(identifier, this.#promotable);
      }
    }
  }

  override visitInstruction(
    instruction: ReactiveInstruction,
    state: InterState,
  ): void {
    for (const lval of eachInstructionValueLValue(instruction.value)) {
      CompilerError.invariant(lval.identifier.name != null, {
        reason:
          'PromoteInterposedTemporaries: Assignment targets not expected to be temporaries',
        loc: instruction.loc,
      });
    }

    switch (instruction.value.kind) {
      case 'CallExpression':
      case 'MethodCall':
      case 'Await':
      case 'PropertyStore':
      case 'PropertyDelete':
      case 'ComputedStore':
      case 'ComputedDelete':
      case 'PostfixUpdate':
      case 'PrefixUpdate':
      case 'StoreLocal':
      case 'StoreContext':
      case 'StoreGlobal':
      case 'Destructure': {
        let constStore = false;

        if (
          (instruction.value.kind === 'StoreContext' ||
            instruction.value.kind === 'StoreLocal') &&
          (instruction.value.lvalue.kind === 'Const' ||
            instruction.value.lvalue.kind === 'HoistedConst')
        ) {
          /*
           * If an identifier is const, we don't need to worry about it
           * being mutated between being loaded and being used
           */
          this.#consts.add(instruction.value.lvalue.place.identifier.id);
          constStore = true;
        }
        if (
          instruction.value.kind === 'Destructure' &&
          (instruction.value.lvalue.kind === 'Const' ||
            instruction.value.lvalue.kind === 'HoistedConst')
        ) {
          [...eachPatternOperand(instruction.value.lvalue.pattern)].forEach(
            ident => this.#consts.add(ident.identifier.id),
          );
          constStore = true;
        }
        if (instruction.value.kind === 'MethodCall') {
          // Treat property of method call as constlike so we don't promote it.
          this.#consts.add(instruction.value.property.identifier.id);
        }

        super.visitInstruction(instruction, state);
        if (
          !constStore &&
          (instruction.lvalue == null ||
            instruction.lvalue.identifier.name != null)
        ) {
          /*
           * If we've stripped the lvalue or promoted the lvalue, then we will emit this instruction
           * as a statement in codegen.
           *
           * If this instruction will be emitted directly as a statement rather than as a temporary
           * during codegen, then it can interpose between the defs and the uses of other temporaries.
           * Since this instruction could potentially mutate those defs, it's not safe to relocate
           * the definition of those temporaries to after this instruction. Mark all those temporaries
           * as needing promotion, but don't promote them until we actually see them being used.
           */
          for (const [key, [ident, _]] of state.entries()) {
            state.set(key, [ident, true]);
          }
        }
        if (instruction.lvalue && instruction.lvalue.identifier.name === null) {
          // Add this instruction's lvalue to the state, initially not marked as needing promotion
          state.set(instruction.lvalue.identifier.id, [
            instruction.lvalue.identifier,
            false,
          ]);
        }
        break;
      }
      case 'DeclareContext':
      case 'DeclareLocal': {
        if (
          instruction.value.lvalue.kind === 'Const' ||
          instruction.value.lvalue.kind === 'HoistedConst'
        ) {
          this.#consts.add(instruction.value.lvalue.place.identifier.id);
        }
        super.visitInstruction(instruction, state);
        break;
      }
      case 'LoadContext':
      case 'LoadLocal': {
        if (instruction.lvalue && instruction.lvalue.identifier.name === null) {
          if (this.#consts.has(instruction.value.place.identifier.id)) {
            this.#consts.add(instruction.lvalue.identifier.id);
          }
          state.set(instruction.lvalue.identifier.id, [
            instruction.lvalue.identifier,
            false,
          ]);
        }
        super.visitInstruction(instruction, state);
        break;
      }
      case 'PropertyLoad':
      case 'ComputedLoad': {
        if (instruction.lvalue) {
          if (this.#globals.has(instruction.value.object.identifier.id)) {
            this.#globals.add(instruction.lvalue.identifier.id);
            this.#consts.add(instruction.lvalue.identifier.id);
          }
          if (instruction.lvalue.identifier.name === null) {
            state.set(instruction.lvalue.identifier.id, [
              instruction.lvalue.identifier,
              false,
            ]);
          }
        }
        super.visitInstruction(instruction, state);
        break;
      }
      case 'LoadGlobal': {
        instruction.lvalue &&
          this.#globals.add(instruction.lvalue.identifier.id);
        super.visitInstruction(instruction, state);
        break;
      }
      default: {
        super.visitInstruction(instruction, state);
      }
    }
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

  visitReactiveFunction(
    fn,
    new PromoteInterposedTemporaries(state, fn.params),
    new Map(),
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
  if (state.tags.has(identifier.id)) {
    promoteTemporaryJsxTag(identifier);
  } else {
    promoteTemporary(identifier);
  }
}
