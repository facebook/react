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
  LValue,
  makeInstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveScopeDependency,
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
  const context = new Context();
  if (fn.id !== null) {
    context.declare(fn.id, { kind: DeclKind.Const, id: makeInstructionId(0) });
  }
  for (const param of fn.params) {
    context.declare(param.identifier, {
      kind: DeclKind.Dynamic,
      id: makeInstructionId(0),
    });
  }
  visit(context, fn.body);
}

enum DeclKind {
  Const = "Const",
  Dynamic = "Dynamic",
}

type DeclMap = Map<Identifier, Decl>;
type Decl = { kind: DeclKind; id: InstructionId };

type Scopes = Array<ReactiveScope>;

class Context {
  #declarations: DeclMap = new Map();
  #dependencies: Set<ReactiveScopeDependency> = new Set();
  #properties: Map<Identifier, ReactiveScopeDependency> = new Map();
  #scopes: Scopes = [];

  enter(scope: ReactiveScope, fn: () => void): Set<ReactiveScopeDependency> {
    const previousDependencies = this.#dependencies;
    const scopedDependencies = new Set<ReactiveScopeDependency>();
    this.#dependencies = scopedDependencies;
    this.#scopes.push(scope);
    fn();
    this.#scopes.pop();
    this.#dependencies = previousDependencies;
    return scopedDependencies;
  }

  declare(identifier: Identifier, decl: Decl): void {
    this.#declarations.set(identifier, decl);
  }

  declareProperty(lvalue: Place, object: Place, property: string): void {
    const objectDependency = this.#properties.get(object.identifier);
    let nextDependency: ReactiveScopeDependency;
    if (objectDependency === undefined) {
      nextDependency = { place: object, path: [property] };
    } else {
      nextDependency = {
        place: objectDependency.place,
        path: [...(objectDependency.path ?? []), property],
      };
    }
    this.#properties.set(lvalue.identifier, nextDependency);
  }

  #isScopeActive(scope: ReactiveScope): boolean {
    return this.#scopes.indexOf(scope) !== -1;
  }

  get #currentScope(): ReactiveScope {
    return this.#scopes.at(-1)!;
  }

  visitOperand(place: Place): void {
    this.visitDependency({ place, path: null });
  }

  visitDependency(dependency: ReactiveScopeDependency): void {
    let maybeDependency: ReactiveScopeDependency;
    if (dependency.path !== null) {
      // Operands may have memberPaths when propagating depenencies of an inner scope upward
      // In this case we use the dependency as-is
      maybeDependency = dependency;
    } else {
      // Otherwise if this operand is a temporary created for a property load, resolve it to
      // the expanded Place. Fall back to using the operand as-is.
      maybeDependency =
        this.#properties.get(dependency.place.identifier) ?? dependency;
    }

    const decl = this.#declarations.get(maybeDependency.place.identifier);

    // Any value used after its defining scope has concluded must be added as an
    // output of its defining scope. Regardless of whether its a const or not,
    // some later code needs access to the value.
    if (decl !== undefined) {
      const operandScope = maybeDependency.place.identifier.scope;
      if (operandScope !== null && !this.#isScopeActive(operandScope)) {
        operandScope.outputs.add(maybeDependency.place.identifier);
      }
    }

    // If this operand is used in a scope, has a dynamic value, and was defined
    // before this scope, then its a dependency of the scope.
    const currentScope = this.#currentScope;
    if (
      decl !== undefined &&
      decl.kind !== DeclKind.Const &&
      currentScope !== undefined &&
      decl.id < currentScope.range.start
    ) {
      // Check if there is an existing dependency that describes this operand
      for (const dep of this.#dependencies) {
        // not the same identifier
        if (dep.place.identifier !== maybeDependency.place.identifier) {
          continue;
        }
        const depPath = dep.path;
        // existing dep covers all paths
        if (depPath === null) {
          return;
        }
        const operandPath = maybeDependency.path;
        // existing dep is for a path, this operand covers all paths so swap them
        if (operandPath === null) {
          this.#dependencies.delete(dep);
          this.#dependencies.add(maybeDependency);
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
      this.#dependencies.add(maybeDependency);
    }
  }
}

function visit(context: Context, block: ReactiveBlock): void {
  for (const item of block) {
    switch (item.kind) {
      case "scope": {
        const scopeDependencies = context.enter(item.scope, () => {
          visit(context, item.instructions);
        });
        item.scope.dependencies = scopeDependencies;
        for (const dep of scopeDependencies) {
          // propagate dependencies upward using the same rules as
          // normal dependency collection. child scopes may have dependencies
          // on values created within the outer scope, which necessarily cannot
          // be dependencies of the outer scope
          context.visitDependency(dep);
        }
        break;
      }
      case "instruction": {
        visitInstruction(context, item.instruction);
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
              context.visitOperand(terminal.value);
            }
            break;
          }
          case "throw": {
            context.visitOperand(terminal.value);
            break;
          }
          case "for": {
            visitValueBlock(context, terminal.init);
            visitValueBlock(context, terminal.test);
            visitValueBlock(context, terminal.update);
            visit(context, terminal.loop);
            break;
          }
          case "while": {
            visitValueBlock(context, terminal.test);
            visit(context, terminal.loop);
            break;
          }
          case "if": {
            context.visitOperand(terminal.test);
            visit(context, terminal.consequent);
            if (terminal.alternate !== null) {
              visit(context, terminal.alternate);
            }
            break;
          }
          case "switch": {
            context.visitOperand(terminal.test);
            for (const case_ of terminal.cases) {
              if (case_.block !== undefined) {
                visit(context, case_.block);
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

function visitValueBlock(context: Context, block: ReactiveValueBlock): void {
  for (const initItem of block.instructions) {
    if (initItem.kind === "instruction") {
      visitInstruction(context, initItem.instruction);
    }
  }
  if (block.value !== null) {
    visitInstructionValue(context, block.value, null);
  }
}

function visitInstructionValue(
  context: Context,
  value: InstructionValue,
  lvalue: LValue | null
): void {
  for (const operand of eachInstructionValueOperand(value)) {
    // check for method invocation, we want to depend on the callee, not the method
    if (value.kind === "PropertyLoad" && lvalue !== null) {
      context.declareProperty(lvalue.place, value.object, value.property);
    } else {
      context.visitOperand(operand);
    }
  }
}

function visitInstruction(context: Context, instr: Instruction): void {
  const { lvalue } = instr;
  visitInstructionValue(context, instr.value, lvalue);
  if (lvalue !== null && lvalue.kind !== InstructionKind.Reassign) {
    const range = lvalue.place.identifier.mutableRange;
    // TODO: only assign Const if the value is never reassigned
    const kind =
      range.end === range.start + 1 ? valueKind(instr.value) : DeclKind.Dynamic;
    context.declare(lvalue.place.identifier, {
      kind,
      id: lvalue.place.identifier.mutableRange.start,
    });
  }
}

function valueKind(value: InstructionValue): DeclKind {
  switch (value.kind) {
    case "BinaryExpression":
    case "JSXText":
    case "Primitive": {
      return DeclKind.Const;
    }
    case "IndexLoad":
    case "IndexStore":
    case "PropertyStore":
    case "PropertyLoad":
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
