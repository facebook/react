/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  InstructionId,
  InstructionValue,
  makeInstructionId,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveValueBlock,
  ScopeId,
} from "../HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { invariant } from "../Utils/CompilerError";
import DisjointSet from "../Utils/DisjointSet";
import { retainWhere } from "../Utils/utils";
import { getPlaceScope } from "./BuildReactiveBlocks";
import { eachTerminalBlock, eachTerminalOperand } from "./visitors";

/**
 * Note: this is the 3rd of 3 passes that determine how to break a function into discrete
 * reactive scopes (independently memoizeable units of code):
 * 1. InferReactiveScopeVariables (on HIR) determines operands that mutate together and assigns
 *    them a unique reactive scope.
 * 2. AlignReactiveScopesToBlockScopes (on ReactiveFunction) aligns reactive scopes
 *    to block scopes.
 * 3. MergeOverlappingReactiveScopes (this pass, on ReactiveFunction) ensures that reactive
 *    scopes do not overlap, merging any such scopes.
 *
 * Previous passes may leave "overlapping" scopes, ie where one or more instructions are within
 * the mutable range of multiple reactive scopes. We prefer to avoid executing instructions twice
 * for performance reasons (side effects are less of a concern bc components are required to be
 * idempotent), so we cannot simply repeat the instruction once for each scope. Instead, the only
 * option is to combine the two scopes into one. This is an area where an eventual Forget IDE
 * could provide real-time feedback to the developer that two computations are accidentally merged.
 *
 * ## Detailed Walkthrough
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
export function mergeOverlappingReactiveScopes(fn: ReactiveFunction): void {
  const context = new Context();
  context.enter(() => {
    visitBlock(context, fn.body);
  });
}

function visitBlock(context: Context, block: ReactiveBlock): void {
  for (const stmt of block) {
    switch (stmt.kind) {
      case "instruction": {
        visitValue(context, stmt.instruction.id, stmt.instruction.value);
        visitInstruction(context, stmt.instruction);
        break;
      }
      case "terminal": {
        const id = stmt.terminal.id;
        if (id !== null) {
          context.visitId(id);
          eachTerminalOperand(stmt.terminal, (operand) => {
            visitValue(context, id, operand);
          });
        }
        eachTerminalBlock(
          stmt.terminal,
          (block) => {
            context.enter(() => {
              visitBlock(context, block);
            });
          },
          (valueBlock) => {
            context.enter(() => {
              visitValueBlock(context, valueBlock);
            });
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

function visitValueBlock(context: Context, block: ReactiveValueBlock): void {
  visitBlock(context, block.instructions);
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

function visitInstruction(
  context: Context,
  instruction: ReactiveInstruction
): void {
  context.visitId(instruction.id);
  invariant(
    instruction.lvalue !== null,
    "Expected lvalues to not be null when assigning scopes. " +
      "Pruning lvalues too early can result in missing scope information."
  );
  if (
    instruction.lvalue.place.identifier.scope !== null &&
    instruction.id >= instruction.lvalue.place.identifier.scope.range.start &&
    instruction.id < instruction.lvalue.place.identifier.scope.range.end
  ) {
    context.visitScope(instruction.lvalue.place.identifier.scope);
  }
}

function visitValue(
  context: Context,
  id: InstructionId,
  value: InstructionValue
): void {
  context.visitId(id);
  for (const operand of eachInstructionValueOperand(value)) {
    if (
      operand.identifier.scope !== null &&
      id >= operand.identifier.scope.range.start &&
      id < operand.identifier.scope.range.end
    ) {
      context.visitScope(operand.identifier.scope);
    }
  }
}

class BlockScope {
  seen: Set<ScopeId> = new Set();
  scopes: Array<ShadowableReactiveScope> = [];
}

type ShadowableReactiveScope = {
  scope: ReactiveScope;
  shadowedBy: ReactiveScope | null;
};

class Context {
  scopes: Array<BlockScope> = [];
  seenScopes: Set<ScopeId> = new Set();
  joinedScopes: DisjointSet<ReactiveScope> = new DisjointSet();

  visitId(id: InstructionId): void {
    const currentBlock = this.scopes[this.scopes.length - 1]!;
    retainWhere(currentBlock.scopes, (pending) => {
      if (pending.scope.range.end > id) {
        return true;
      } else {
        currentBlock.seen.delete(pending.scope.id);
        return false;
      }
    });
  }

  visitScope(scope: ReactiveScope): void {
    const currentBlock = this.scopes[this.scopes.length - 1]!;
    // Fast-path for the first time we see a new scope
    if (!this.seenScopes.has(scope.id)) {
      this.seenScopes.add(scope.id);
      currentBlock.seen.add(scope.id);
      currentBlock.scopes.push({ shadowedBy: null, scope });
      return;
    }
    // Scope has already been seen, find it in the current block or a parent
    let index = this.scopes.length - 1;
    let nextBlock = currentBlock;
    while (!nextBlock.seen.has(scope.id)) {
      // scopes that cross control-flow boundaries are merged with overlapping
      // scopes
      this.joinedScopes.union([scope, ...nextBlock.scopes.map((s) => s.scope)]);
      index--;
      if (index < 0) {
        // TODO: handle reassignments in multiple branches. these create new identifiers that
        // add an entry to this.seenScopes but which are then removed when their blocks exit.
        // this is also wrong for codegen, different versions of an identifier could be cached
        // differently and so a reassigned version of a variable needs a separate declaration.
        // console.log(`scope ${scope.id} not found`);

        // for (let i = this.scopes.length - 1; i > index; i--) {
        //   const s = this.scopes[i];
        //   console.log(
        //     JSON.stringify(
        //       {
        //         seen: Array.from(s.seen),
        //         scopes: s.scopes,
        //       },
        //       null,
        //       2
        //     )
        //   );
        // }
        currentBlock.seen.add(scope.id);
        currentBlock.scopes.push({ shadowedBy: null, scope });
        return;
      }
      nextBlock = this.scopes[index]!;
    }

    // Handle interleaving within a given block scope
    let found = false;
    for (let i = 0; i < nextBlock.scopes.length; i++) {
      const current = nextBlock.scopes[i]!;
      if (current.scope.id === scope.id) {
        found = true;
        if (current.shadowedBy !== null) {
          this.joinedScopes.union([current.shadowedBy, current.scope]);
        }
      } else if (found && current.shadowedBy === null) {
        // `scope` is shadowing `current`, but we don't know they are interleaved yet
        current.shadowedBy = scope;
      }
    }
    if (!currentBlock.seen.has(scope.id)) {
      currentBlock.seen.add(scope.id);
      currentBlock.scopes.push({ shadowedBy: null, scope });
    }
  }

  enter(fn: () => void): void {
    this.scopes.push(new BlockScope());
    fn();
    this.scopes.pop();
    if (this.scopes.length === 0) {
      this.joinedScopes.forEach((scope, groupScope) => {
        if (scope !== groupScope) {
          groupScope.range.start = makeInstructionId(
            Math.min(groupScope.range.start, scope.range.start)
          );
          groupScope.range.end = makeInstructionId(
            Math.max(groupScope.range.end, scope.range.end)
          );
          scope.range = groupScope.range;
          scope.id = groupScope.id;
        }
      });
    }
  }
}
