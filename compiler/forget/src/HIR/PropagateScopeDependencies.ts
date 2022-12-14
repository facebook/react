/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import {
  Identifier,
  Instruction,
  InstructionId,
  InstructionKind,
  InstructionValue,
  makeInstructionId,
  Place,
  ReactiveBasicBlock,
  ReactiveFunction,
  ReactiveValueBlock,
} from "./HIR";
import { eachInstructionValueOperand } from "./visitors";

/**
 * Infers the dependencies of each scope to include variables whose values
 * are non-stable and created prior to the start of the scope. Also propagates
 * dependencies upwards, so that parent scope dependencies are the union of
 * their direct dependencies and those of their child scopes.
 */
export function propagateScopeDependencies(fn: ReactiveFunction): void {
  const dependencies: Set<Place> = new Set();
  const declarations: DeclMap = new Map();
  if (fn.id !== null) {
    declarations.set(fn.id, { kind: DeclKind.Const, id: makeInstructionId(0) });
  }
  for (const param of fn.params) {
    declarations.set(param.identifier, {
      kind: DeclKind.Dynamic,
      id: makeInstructionId(0),
    });
  }
  visit(fn.body, dependencies, declarations, null);
}

enum DeclKind {
  Const = "Const",
  Dynamic = "Dynamic",
}

type DeclMap = Map<Identifier, { kind: DeclKind; id: InstructionId }>;

function visit(
  block: ReactiveBasicBlock,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopeStart: InstructionId | null
): void {
  for (const item of block) {
    switch (item.kind) {
      case "block": {
        const scopeDependencies: Set<Place> = new Set();
        // TODO: it would be sufficient to use a single mapping of declarations
        const scopeDeclarations: DeclMap = new Map(declarations);
        visit(
          item.instructions,
          scopeDependencies,
          scopeDeclarations,
          item.range.start
        );
        item.dependencies = scopeDependencies;
        for (const dep of scopeDependencies) {
          // propagate dependencies upward using the same rules as
          // normal dependency collection. child scopes may have dependencies
          // on values created within the outer scope, which necessarily cannot
          // be dependencies of the outer scope
          visitOperand(dep, dependencies, declarations, scopeStart);
        }
        for (const [ident, kind] of scopeDeclarations) {
          declarations.set(ident, kind);
        }
        break;
      }
      case "instruction": {
        visitInstruction(
          item.instruction,
          dependencies,
          declarations,
          scopeStart
        );
        break;
      }
      case "terminal": {
        const terminal = item.terminal;
        switch (terminal.kind) {
          case "break":
          case "continue": {
            break;
          }
          case "return": {
            if (terminal.value !== null) {
              visitOperand(
                terminal.value,
                dependencies,
                declarations,
                scopeStart
              );
            }
            break;
          }
          case "throw": {
            visitOperand(
              terminal.value,
              dependencies,
              declarations,
              scopeStart
            );
            break;
          }
          case "for": {
            visitValueBlock(
              terminal.init,
              dependencies,
              declarations,
              scopeStart
            );
            visitValueBlock(
              terminal.test,
              dependencies,
              declarations,
              scopeStart
            );
            visitValueBlock(
              terminal.update,
              dependencies,
              declarations,
              scopeStart
            );
            visit(terminal.loop, dependencies, declarations, scopeStart);
            break;
          }
          case "while": {
            visitValueBlock(
              terminal.test,
              dependencies,
              declarations,
              scopeStart
            );
            visit(terminal.loop, dependencies, declarations, scopeStart);
            break;
          }
          case "if": {
            visitOperand(terminal.test, dependencies, declarations, scopeStart);
            visit(terminal.consequent, dependencies, declarations, scopeStart);
            if (terminal.alternate !== null) {
              visit(terminal.alternate, dependencies, declarations, scopeStart);
            }
            break;
          }
          case "switch": {
            visitOperand(terminal.test, dependencies, declarations, scopeStart);
            for (const case_ of terminal.cases) {
              if (case_.block !== undefined) {
                visit(case_.block, dependencies, declarations, scopeStart);
              }
            }
            break;
          }
          default: {
            assertExhaustive(
              terminal,
              `Unexpected terminal kind '${(terminal as any).kind}'`
            );
          }
        }
        break;
      }
      default: {
        assertExhaustive(item, `Unexpected item`);
      }
    }
  }
}

function visitValueBlock(
  block: ReactiveValueBlock,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopeStart: InstructionId | null
): void {
  for (const initItem of block.instructions) {
    if (initItem.kind === "instruction") {
      visitInstruction(
        initItem.instruction,
        dependencies,
        declarations,
        scopeStart
      );
    }
  }
  if (block.value !== null) {
    visitInstructionValue(block.value, dependencies, declarations, scopeStart);
  }
}

function visitOperand(
  operand: Place,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopeStart: InstructionId | null
): void {
  const decl = declarations.get(operand.identifier);
  if (decl === undefined) {
    // Probably a global, ignore for now
    // TODO @josephsavona: improve handling of globals
    return;
  } else if (decl.kind === DeclKind.Const) {
    // constant, dont need to add a dep
    return;
  } else if (scopeStart !== null && decl.id < scopeStart) {
    // Check if there is an existing dependency that describes this operand
    for (const dep of dependencies) {
      // not the same identifier
      if (dep.identifier !== operand.identifier) {
        continue;
      }
      const depPath = dep.memberPath;
      // existing dep covers all paths
      if (depPath === null) {
        return;
      }
      const operandPath = operand.memberPath;
      // existing dep is for a path, this operand covers all paths so swap them
      if (operandPath === null) {
        dependencies.delete(dep);
        dependencies.add(operand);
        return;
      }
      // both the operand and dep have paths, determine if the existing path
      // is a subset of the new path
      let commonPathIndex = 0;
      while (
        commonPathIndex < operandPath.length &&
        commonPathIndex < depPath.length &&
        operandPath[commonPathIndex] === depPath[commonPathIndex]
      ) {
        commonPathIndex++;
      }
      if (commonPathIndex === depPath.length) {
        return;
      }
    }
    dependencies.add(operand);
  }
}

function visitInstructionValue(
  value: InstructionValue,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopeStart: InstructionId | null
): void {
  for (const operand of eachInstructionValueOperand(value)) {
    // check for method invocation, we want to depend on the callee, not the method
    if (
      value.kind === "CallExpression" &&
      operand === value.callee &&
      operand.memberPath !== null
    ) {
      const callee = {
        ...operand,
        memberPath: operand.memberPath.slice(0, -1),
      };
      visitOperand(callee, dependencies, declarations, scopeStart);
    } else {
      visitOperand(operand, dependencies, declarations, scopeStart);
    }
  }
}

function visitInstruction(
  instr: Instruction,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopeStart: InstructionId | null
): void {
  visitInstructionValue(instr.value, dependencies, declarations, scopeStart);
  const { lvalue } = instr;
  if (
    lvalue !== null &&
    lvalue.kind !== InstructionKind.Reassign &&
    lvalue.place.memberPath === null
  ) {
    const kind = valueKind(instr.value);
    declarations.set(lvalue.place.identifier, { kind, id: instr.id });
  }
}

function valueKind(value: InstructionValue): DeclKind {
  switch (value.kind) {
    case "BinaryExpression":
    case "JSXText":
    case "Primitive": {
      return DeclKind.Const;
    }
    case "Identifier":
    case "ArrayExpression":
    case "CallExpression":
    case "JsxExpression":
    case "JsxFragment":
    case "NewExpression":
    case "ObjectExpression":
    case "OtherStatement":
    case "UnaryExpression": {
      return DeclKind.Dynamic;
    }
    default: {
      assertExhaustive(value, `Unexpected value kind '${(value as any).kind}'`);
    }
  }
}
