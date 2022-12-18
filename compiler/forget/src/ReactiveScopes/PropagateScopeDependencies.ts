/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Identifier,
  Instruction,
  InstructionId,
  InstructionKind,
  InstructionValue,
  makeInstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveValueBlock,
} from "../HIR/HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";

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
  visit(fn.body, dependencies, declarations, []);
}

enum DeclKind {
  Const = "Const",
  Dynamic = "Dynamic",
}

type DeclMap = Map<Identifier, { kind: DeclKind; id: InstructionId }>;

type Scopes = Array<ReactiveScope>;

function visit(
  block: ReactiveBlock,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopes: Scopes
): void {
  for (const item of block) {
    switch (item.kind) {
      case "scope": {
        const scopeDependencies: Set<Place> = new Set();
        // TODO: it would be sufficient to use a single mapping of declarations
        const scopeDeclarations: DeclMap = new Map(declarations);
        scopes.push(item.scope);
        visit(item.instructions, scopeDependencies, scopeDeclarations, scopes);
        scopes.pop();
        item.scope.dependencies = scopeDependencies;
        for (const dep of scopeDependencies) {
          // propagate dependencies upward using the same rules as
          // normal dependency collection. child scopes may have dependencies
          // on values created within the outer scope, which necessarily cannot
          // be dependencies of the outer scope
          visitOperand(dep, dependencies, declarations, scopes);
        }
        for (const [ident, kind] of scopeDeclarations) {
          declarations.set(ident, kind);
        }
        break;
      }
      case "instruction": {
        visitInstruction(item.instruction, dependencies, declarations, scopes);
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
              visitOperand(terminal.value, dependencies, declarations, scopes);
            }
            break;
          }
          case "throw": {
            visitOperand(terminal.value, dependencies, declarations, scopes);
            break;
          }
          case "for": {
            visitValueBlock(terminal.init, dependencies, declarations, scopes);
            visitValueBlock(terminal.test, dependencies, declarations, scopes);
            visitValueBlock(
              terminal.update,
              dependencies,
              declarations,
              scopes
            );
            visit(terminal.loop, dependencies, declarations, scopes);
            break;
          }
          case "while": {
            visitValueBlock(terminal.test, dependencies, declarations, scopes);
            visit(terminal.loop, dependencies, declarations, scopes);
            break;
          }
          case "if": {
            visitOperand(terminal.test, dependencies, declarations, scopes);
            visit(terminal.consequent, dependencies, declarations, scopes);
            if (terminal.alternate !== null) {
              visit(terminal.alternate, dependencies, declarations, scopes);
            }
            break;
          }
          case "switch": {
            visitOperand(terminal.test, dependencies, declarations, scopes);
            for (const case_ of terminal.cases) {
              if (case_.block !== undefined) {
                visit(case_.block, dependencies, declarations, scopes);
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
  scopes: Scopes
): void {
  for (const initItem of block.instructions) {
    if (initItem.kind === "instruction") {
      visitInstruction(
        initItem.instruction,
        dependencies,
        declarations,
        scopes
      );
    }
  }
  if (block.value !== null) {
    visitInstructionValue(block.value, dependencies, declarations, scopes);
  }
}

function visitOperand(
  maybeDependency: Place,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopes: Scopes
): void {
  const decl = declarations.get(maybeDependency.identifier);

  // Any value used after its defining scope has concluded must be added as an
  // output of its defining scope. Regardless of whether its a const or not,
  // some later code needs access to the value.
  if (decl !== undefined) {
    const operandScope = maybeDependency.identifier.scope;
    if (operandScope !== null && scopes.indexOf(operandScope) === -1) {
      operandScope.outputs.add(maybeDependency.identifier);
    }
  }

  // If this operand is used in a scope, has a dynamic value, and was defined
  // before this scope, then its a dependency of the scope.
  const currentScope = scopes.at(-1);
  if (
    decl !== undefined &&
    decl.kind !== DeclKind.Const &&
    currentScope !== undefined &&
    decl.id < currentScope.range.start
  ) {
    // Check if there is an existing dependency that describes this operand
    for (const dep of dependencies) {
      // not the same identifier
      if (dep.identifier !== maybeDependency.identifier) {
        continue;
      }
      const depPath = dep.memberPath;
      // existing dep covers all paths
      if (depPath === null) {
        return;
      }
      const operandPath = maybeDependency.memberPath;
      // existing dep is for a path, this operand covers all paths so swap them
      if (operandPath === null) {
        dependencies.delete(dep);
        dependencies.add(maybeDependency);
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
    dependencies.add(maybeDependency);
  }
}

function visitInstructionValue(
  value: InstructionValue,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopes: Scopes
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
      visitOperand(callee, dependencies, declarations, scopes);
    } else {
      visitOperand(operand, dependencies, declarations, scopes);
    }
  }
}

function visitInstruction(
  instr: Instruction,
  dependencies: Set<Place>,
  declarations: DeclMap,
  scopes: Scopes
): void {
  visitInstructionValue(instr.value, dependencies, declarations, scopes);
  const { lvalue } = instr;
  if (
    lvalue !== null &&
    lvalue.kind !== InstructionKind.Reassign &&
    lvalue.place.memberPath === null
  ) {
    const range = lvalue.place.identifier.mutableRange;
    // TODO: only assign Const if the value is never reassigned
    const kind =
      range.end === range.start + 1 ? valueKind(instr.value) : DeclKind.Dynamic;
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
