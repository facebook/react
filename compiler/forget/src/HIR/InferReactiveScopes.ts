/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  HIRFunction,
  Instruction,
  InstructionId,
  InstructionValue,
  ReactiveScope,
  ScopeId,
} from "./HIR";
import { BlockTerminal, Visitor, visitTree } from "./HIRTreeVisitor";
import { eachInstructionOperand } from "./visitors";

/**
 * This is a second (final) stage of constructing reactive scopes. Prior to this pass,
 * InferReactiveScopeVariables infers the sets of identifiers that "construct together",
 * assigning each identifier in each scope the same ScopeId and same MutableRange which
 * describes that span.
 *
 * Note that at this point reactive scopes describe ranges based on specific instructions
 * at arbitrary points in the control flow graph. However, reactive scopes must align
 * with control-flow boundaries — we can't memoize half of a loop!
 *
 * This pass refines the reactive scopes as follows:
 *
 * ## Expanding each reactive scope to align with control-flow boundaries (DONE)
 *
 * This corresponds with the shape of the AST: a scope that extends into an if consequent
 * would expand across the alternate branch, A scope that extends partway into an if
 * would expand to cover the full loop body, etc.
 *
 * ```javascript
 * function foo(cond, a) {
 *                    ⌵ original scope
 *                         ⌵ expanded scope
 *   const x = [];    ⌝    ⌝
 *   if (cond) {      ⎮    ⎮
 *     ...            ⎮    ⎮
 *     x.push(a);     ⌟    ⎮
 *     ...                 ⎮
 *   }                     ⌟
 * }
 * ```
 *
 * ## Merging (some) overlapping reactive scopes (TODO)
 *
 * Two scopes overlap if there is one or more instruction that is inside the range
 * of both scopes. In general, overlapping scopes are merged togther. The only
 * exception to this is when one scope *shadows* another scope. For example:
 *
 * ```javascript
 * function foo(cond, a) {
 *                                 ⌵ scope for x
 *   let x = [];                   ⌝
 *   if (cond) {                   ⎮
 *                   ⌵ scope for y ⎮
 *     let y = [];   ⌝             ⎮
 *     if (b) {      ⎮             ⎮
 *       y.push(b);  ⌟             ⎮
 *     }                           ⎮
 *     x.push(<div>{y}</div>);     ⎮
 *   }                             ⌟
 * }
 * ```
 *
 * In this example the two scopes overlap, but mutation of the two scopes is not
 * interleaved. Specifically within the y scope there are no instructions that
 * modify any other scope: the inner scope "shadows" the outer one. This category
 * of overlap does *NOT* merge the scopes together.
 *
 * The implementation is inspired by the Rust notion of "stacked borrows". We traverse
 * the control-flow graph in tree form, at each point keeping track of which scopes are
 * active. So initially we see
 *
 * `let x = []`
 * active scopes: [x]
 *
 * and mark the x scope as active.
 *
 * Then we later encounter
 *
 * `let y = [];`
 * active scopes: [x, y]
 *
 * Here we first check to see if 'y' is already in the list of active scopes. It isn't,
 * so we push it to the stop of the stack.
 *
 * Then
 *
 * `y.push(b)`
 * active scopes: [x, y]
 *
 * Mutates y, so we check if y is the top of the stack. It is, so no merging must occur.
 *
 * If instead we saw eg
 *
 * `x.push(b)`
 * active scopes: [x, y]
 *
 * Then we would see that 'x' is active, but that it is shadowed. The two scopes would have
 * to be merged.
 */
export function inferReactiveScopes(fn: HIRFunction) {
  const visitor = new ScopeVisitor();
  visitTree(fn, visitor);
}

type PendingReactiveScope = ReactiveScope & { active: boolean };

class ScopeVisitor implements Visitor<void, void, void, void> {
  // For each block scope (outer array) stores a list of ReactiveScopes that start
  // in that block scope.
  blockScopes: Array<Array<PendingReactiveScope>> = [];

  // ReactiveScopes whose declaring block scope has ended but may still need to
  // be "closed" (ie have their range.end be updated). A given scope can be in
  // blockScopes OR this array but not both.
  unclosedScopes: Array<PendingReactiveScope> = [];

  // Set of all scope ids that have been seen so far, regardless of which of
  // the above data structures they're in, to avoid tracking the same scope twice.
  seenScopes: Set<ScopeId> = new Set();

  visitId(id: InstructionId) {
    const currentScopes = this.blockScopes[this.blockScopes.length - 1]!;
    const scopes = [...currentScopes, ...this.unclosedScopes];
    for (const scope of scopes) {
      if (!scope.active) {
        continue;
      }
      if (id >= scope.range.end) {
        scope.active = false;
        scope.range.end = id;
      }
    }
  }

  enterBlock(): void {
    this.blockScopes.push([]);
  }

  leaveBlock(block: void): void {
    const lastScope = this.blockScopes.pop();
    invariant(
      lastScope !== undefined,
      "Expected enterBlock/leaveBlock to be called 1:1"
    );
    for (const scope of lastScope) {
      if (scope.active) {
        this.unclosedScopes.push(scope);
      }
    }
  }

  visitInstruction(instruction: Instruction, value: void): void {
    const scope = getInstructionScope(instruction);
    if (scope !== null) {
      if (!this.seenScopes.has(scope.id)) {
        const currentScopes = this.blockScopes[this.blockScopes.length - 1]!;
        this.seenScopes.add(scope.id);
        currentScopes.push({
          id: scope.id,
          active: true,
          range: scope.range,
        });
      }
    }

    this.visitId(instruction.id);
  }

  visitTerminal(terminal: BlockTerminal<void, void, void, void>): void {
    if (terminal.id !== null) {
      this.visitId(terminal.id);
    }
  }

  visitImplicitTerminal(id: InstructionId | null): void | null {
    if (id !== null) {
      this.visitId(id);
    }
  }

  // no-ops
  visitValue(value: InstructionValue): void {}
  visitCase(test: void | null, block: void): void {}
  appendBlock(block: void, item: void, label?: string | undefined): void {}
}

function getInstructionScope(instr: Instruction): ReactiveScope | null {
  if (instr.lvalue !== null && instr.lvalue.place.identifier.scope !== null) {
    return instr.lvalue.place.identifier.scope;
  }
  for (const operand of eachInstructionOperand(instr)) {
    if (operand.identifier.scope !== null) {
      return operand.identifier.scope;
    }
  }
  return null;
}
