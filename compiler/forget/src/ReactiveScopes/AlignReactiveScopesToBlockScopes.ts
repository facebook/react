/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  InstructionId,
  makeInstructionId,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveValueBlock,
  ScopeId,
} from "../HIR/HIR";
import { invariant } from "../Utils/CompilerError";
import { getInstructionScope, getPlaceScope } from "./BuildReactiveBlocks";
import { eachTerminalBlock, eachTerminalOperand } from "./visitors";

/**
 * Note: this is the 2nd of 3 passes that determine how to break a function into discrete
 * reactive scopes (independently memoizeable units of code):
 * 1. InferReactiveScopeVariables (on HIR) determines operands that mutate together and assigns
 *    them a unique reactive scope.
 * 2. AlignReactiveScopesToBlockScopes (this pass, on ReactiveFunction) aligns reactive scopes
 *    to block scopes.
 * 3. MergeOverlappingReactiveScopes (on ReactiveFunction) ensures that reactive scopes do not
 *    overlap, merging any such scopes.
 *
 * Prior inference passes assign a reactive scope to each operand, but the ranges of these
 * scopes are based on specific instructions at arbitrary points in the control-flow graph.
 * However, to codegen blocks around the instructions in each scope, the scopes must be
 * aligned to block-scope boundaries - we can't memoize half of a loop!
 *
 * This pass updates reactive scope boundaries to align to control flow boundaries, for
 * example:
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
 * Here the original scope for `x` ended partway through the if consequent, but we can't
 * memoize part of that block. This pass would align the scope to the end of the consequent.
 *
 * The more general rule is that a reactive scope may only end at the same block scope as it
 * began: this pass therefore finds, for each scope, the block where that scope started and
 * finds the first instruction after the scope's mutable range in that same block scope (which
 * will be the updated end for that scope).
 */

export function alignReactiveScopesToBlockScopes(fn: ReactiveFunction): void {
  const context = new Context();
  context.enter(() => {
    visitBlock(context, fn.body);
  });
}

function visitBlock(context: Context, block: ReactiveBlock): void {
  for (const stmt of block) {
    switch (stmt.kind) {
      case "instruction": {
        context.visitId(stmt.instruction.id);
        const scope = getInstructionScope(stmt.instruction);
        if (scope !== null) {
          context.visitScope(scope);
        }
        break;
      }
      case "terminal": {
        const id = stmt.terminal.id;
        if (id !== null) {
          context.visitId(id);
        }
        eachTerminalOperand(stmt.terminal, (operand) => {
          const scope = getPlaceScope(id!, operand);
          if (scope !== null) {
            context.visitScope(scope);
          }
        });
        eachTerminalBlock(
          stmt.terminal,
          (block) => {
            context.enter(() => visitBlock(context, block));
          },
          (valueBlock) => {
            context.enter(
              () => visitValueBlock(context, valueBlock, id!),
              "value"
            );
          }
        );
        break;
      }
      case "scope": {
        invariant(false, "Expected scopes to be constructed later");
      }
    }
  }
}

function visitValueBlock(
  context: Context,
  block: ReactiveValueBlock,
  start: InstructionId
): void {
  for (const stmt of block.instructions) {
    switch (stmt.kind) {
      case "instruction": {
        context.visitId(stmt.instruction.id);
        const scope = getInstructionScope(stmt.instruction);
        if (scope !== null) {
          scope.range.start = makeInstructionId(
            Math.min(start, scope.range.start)
          );
          context.visitScope(scope);
        }
        break;
      }
      default: {
        invariant(false, "Unexpected terminal or scope in value block");
      }
    }
  }
  if (block.last !== null) {
    context.visitId(block.last.id);
    if (block.last.value.kind === "Identifier") {
      const scope = getPlaceScope(block.last.id, block.last.value);
      if (scope !== null) {
        context.visitScope(scope);
      }
    }
  }
}

type PendingReactiveScope = { active: boolean; scope: ReactiveScope };

class Context {
  // For each block scope (outer array) stores a list of ReactiveScopes that start
  // in that block scope.
  #blockScopes: Array<{
    kind: "block" | "value";
    scopes: Array<PendingReactiveScope>;
  }> = [];

  // ReactiveScopes whose declaring block scope has ended but may still need to
  // be "closed" (ie have their range.end be updated). A given scope can be in
  // blockScopes OR this array but not both.
  #unclosedScopes: Array<PendingReactiveScope> = [];

  // Set of all scope ids that have been seen so far, regardless of which of
  // the above data structures they're in, to avoid tracking the same scope twice.
  #seenScopes: Set<ScopeId> = new Set();

  enter(fn: () => void, kind: "block" | "value" = "block"): void {
    this.#blockScopes.push({ kind, scopes: [] });
    fn();
    const lastScope = this.#blockScopes.pop()!;
    for (const scope of lastScope.scopes) {
      if (scope.active) {
        this.#unclosedScopes.push(scope);
      }
    }
  }

  visitId(id: InstructionId): void {
    const currentScopes = this.#blockScopes.at(-1)!;
    if (currentScopes.kind === "value") {
      return;
    }
    const scopes = [...currentScopes.scopes, ...this.#unclosedScopes];
    for (const pending of scopes) {
      if (!pending.active) {
        continue;
      }
      if (id >= pending.scope.range.end) {
        pending.active = false;
        pending.scope.range.end = id;
      }
    }
  }

  visitScope(scope: ReactiveScope): void {
    if (!this.#seenScopes.has(scope.id)) {
      const currentScopes = this.#blockScopes.at(-1)!;
      this.#seenScopes.add(scope.id);
      currentScopes.scopes.push({
        active: true,
        scope,
      });
    }
  }
}
