/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  InstructionId,
  makeInstructionId,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeBlock,
} from "../HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { mapTerminalBlocks } from "./visitors";

/**
 * Given a function where the reactive scopes have been correctly aligned and merged,
 * this pass groups the instructions for each reactive scope into ReactiveBlocks.
 */
export function buildReactiveBlocks(fn: ReactiveFunction): void {
  fn.body = visitBlock(fn.body);
}

type Entry =
  | ReactiveScopeBlock
  | { kind: "block"; instructions: ReactiveBlock };

function visitBlock(block: ReactiveBlock): ReactiveBlock {
  let current: Entry = { kind: "block", instructions: [] };
  const stack: Array<Entry> = [current];
  let lastId: InstructionId = makeInstructionId(0);
  for (const stmt of block) {
    switch (stmt.kind) {
      case "instruction": {
        lastId = stmt.instruction.id;
        while (current.kind === "scope" && lastId >= current.scope.range.end) {
          current = stack.pop()!;
        }
        const scope = getInstructionScope(stmt.instruction);

        if (
          scope !== null &&
          (current.kind !== "scope" || current.scope.id !== scope.id)
        ) {
          const reactiveScope: ReactiveScopeBlock = {
            kind: "scope",
            scope,
            instructions: [],
          };
          current.instructions.push(reactiveScope);
          stack.push(current);
          current = reactiveScope;
        }

        current.instructions.push(stmt);
        break;
      }
      case "terminal": {
        const id = stmt.terminal.id;
        if (id !== null) {
          lastId = id;
          while (
            current.kind === "scope" &&
            lastId >= current.scope.range.end
          ) {
            current = stack.pop()!;
          }
        }
        mapTerminalBlocks(stmt.terminal, visitBlock);
        current.instructions.push(stmt);
        break;
      }
      case "scope": {
        invariant(
          false,
          "Expected the function to not have scopes already assigned"
        );
      }
    }
  }
  while (current.kind === "scope") {
    invariant(current.scope.range.end === lastId + 1, "Scope ended too soon");
    current = stack.pop()!;
  }
  return current.instructions;
}

function getInstructionScope({
  id,
  lvalue,
  value,
}: ReactiveInstruction): ReactiveScope | null {
  invariant(
    lvalue !== null,
    "Expected lvalues to not be null when assigning scopes. " +
      "Pruning lvalues too early can result in missing scope information."
  );
  if (
    lvalue.place.identifier.scope !== null &&
    isScopeActive(lvalue.place.identifier.scope, id)
  ) {
    return lvalue.place.identifier.scope;
  } else {
    for (const operand of eachInstructionValueOperand(value)) {
      if (
        operand.identifier.scope !== null &&
        isScopeActive(operand.identifier.scope, id)
      ) {
        return operand.identifier.scope;
      }
    }
  }
  return null;
}

function isScopeActive(scope: ReactiveScope, id: InstructionId): boolean {
  return id >= scope.range.start && id < scope.range.end;
}
