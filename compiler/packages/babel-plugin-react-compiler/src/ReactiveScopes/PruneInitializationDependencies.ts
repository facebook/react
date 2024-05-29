/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Environment,
  Identifier,
  IdentifierId,
  InstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
  getHookKind,
  isUseRefType,
  isUseStateType,
} from "../HIR";
import { eachCallArgument, eachInstructionLValue } from "../HIR/visitors";
import DisjointSet from "../Utils/DisjointSet";
import { assertExhaustive } from "../Utils/utils";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

/**
 * This pass is built based on the observation by @jbrown215 that arguments
 * to useState and useRef are only used the first time a component is rendered.
 * Any subsequent times, the arguments will be evaluated but ignored. In this pass,
 * we use this fact to improve the output of the compiler by not recomputing values that
 * are only used as arguments (or inputs to arguments to) useState and useRef.
 *
 * Algorithm:
 * We take two passes over the reactive function AST. In the first pass, we gather
 * aliases and build relationships between property accesses--the key thing we need
 * to do here is to find that, e.g., $0.x and $1 refer to the same value if
 * $1 = PropertyLoad $0.x.
 *
 * In the second pass, we traverse the AST in reverse order and track how each place
 * is used. If a place is read from in any Terminal, we mark the place as "Update", meaning
 * it is used whenever the component is updated/re-rendered. If a place is read from in
 * a useState or useRef hook call, we mark it as "Create", since it is only used when the
 * component is created. In other instructions, we propagate the inferred place for the
 * instructions lvalues onto any other instructions that are read.
 *
 * Whenever we finish this reverse pass over a reactive block, we can look at the blocks
 * dependencies and see whether the dependencies are used in an "Update" context or only
 * in a "Create" context. If a dependency is create-only, then we can remove that dependency
 * from the block.
 */

type CreateUpdate = "Create" | "Update" | "Unknown";

type KindMap = Map<IdentifierId, CreateUpdate>;

class Visitor extends ReactiveFunctionVisitor<CreateUpdate> {
  map: KindMap = new Map();
  aliases: DisjointSet<IdentifierId>;
  paths: Map<IdentifierId, Map<string, IdentifierId>>;
  env: Environment;

  constructor(
    env: Environment,
    aliases: DisjointSet<IdentifierId>,
    paths: Map<IdentifierId, Map<string, IdentifierId>>
  ) {
    super();
    this.aliases = aliases;
    this.paths = paths;
    this.env = env;
  }

  join(values: Array<CreateUpdate>): CreateUpdate {
    function join2(l: CreateUpdate, r: CreateUpdate): CreateUpdate {
      if (l === r) {
        return l;
      }
      if (l === "Unknown") {
        return r;
      }
      if (r === "Unknown") {
        return l;
      }
      if (l === "Create") {
        return r;
      }
      if (r === "Create") {
        return l;
      }
      if (r === "Update" || l === "Update") {
        return "Update";
      }
      assertExhaustive(r, `Unhandled variable kind ${r}`);
    }
    return values.reduce(join2, "Unknown");
  }

  isCreateOnlyHook(id: Identifier): boolean {
    return isUseStateType(id) || isUseRefType(id);
  }

  override visitPlace(
    _: InstructionId,
    place: Place,
    state: CreateUpdate
  ): void {
    this.map.set(
      place.identifier.id,
      this.join([state, this.map.get(place.identifier.id) ?? "Unknown"])
    );
  }

  override visitBlock(block: ReactiveBlock, state: CreateUpdate): void {
    super.visitBlock([...block].reverse(), state);
  }

  override visitInstruction(instruction: ReactiveInstruction): void {
    let state = this.join(
      [...eachInstructionLValue(instruction)].map(
        (operand) => this.map.get(operand.identifier.id) ?? "Unknown"
      )
    );

    const visitCallOrMethodNonArgs = (): void => {
      switch (instruction.value.kind) {
        case "CallExpression": {
          this.visitPlace(instruction.id, instruction.value.callee, state);
          break;
        }
        case "MethodCall": {
          this.visitPlace(instruction.id, instruction.value.property, state);
          this.visitPlace(instruction.id, instruction.value.receiver, state);
          break;
        }
      }
    };

    const isHook = (): boolean => {
      let callee = null;
      switch (instruction.value.kind) {
        case "CallExpression": {
          callee = instruction.value.callee.identifier;
          break;
        }
        case "MethodCall": {
          callee = instruction.value.property.identifier;
          break;
        }
      }
      return callee != null && getHookKind(this.env, callee) != null;
    };

    switch (instruction.value.kind) {
      case "CallExpression":
      case "MethodCall": {
        if (
          instruction.lvalue &&
          this.isCreateOnlyHook(instruction.lvalue.identifier)
        ) {
          [...eachCallArgument(instruction.value.args)].forEach((operand) =>
            this.visitPlace(instruction.id, operand, "Create")
          );
          visitCallOrMethodNonArgs();
        } else {
          if (isHook()) {
            /*
             * Values flowing into hooks that aren't create-only should be treated
             * as Update.
             */
            state = "Update";
          }
          this.traverseInstruction(instruction, state);
        }
        break;
      }
      default: {
        this.traverseInstruction(instruction, state);
      }
    }
  }

  override visitScope(scope: ReactiveScopeBlock): void {
    const state = this.join(
      [
        ...scope.scope.declarations.keys(),
        ...[...scope.scope.reassignments.values()].map((ident) => ident.id),
      ].map((id) => this.map.get(id) ?? "Unknown")
    );
    super.visitScope(scope, state);
    [...scope.scope.dependencies].forEach((ident) => {
      let target: undefined | IdentifierId =
        this.aliases.find(ident.identifier.id) ?? ident.identifier.id;
      ident.path.forEach((key) => {
        target &&= this.paths.get(target)?.get(key);
      });
      if (target && this.map.get(target) === "Create") {
        scope.scope.dependencies.delete(ident);
      }
    });
  }

  override visitReactiveFunctionValue(
    _id: InstructionId,
    _dependencies: Array<Place>,
    fn: ReactiveFunction,
    state: CreateUpdate
  ): void {
    visitReactiveFunction(fn, this, state);
  }
}

export default function pruneInitializationDependencies(
  fn: ReactiveFunction
): void {
  const [aliases, paths] = getAliases(fn);
  visitReactiveFunction(fn, new Visitor(fn.env, aliases, paths), "Update");
}

function update(
  map: Map<IdentifierId, Map<string, IdentifierId>>,
  key: IdentifierId,
  path: string,
  value: IdentifierId
): void {
  const inner = map.get(key) ?? new Map();
  inner.set(path, value);
  map.set(key, inner);
}

class AliasVisitor extends ReactiveFunctionVisitor {
  scopeIdentifiers: DisjointSet<IdentifierId> = new DisjointSet<IdentifierId>();
  scopePaths: Map<IdentifierId, Map<string, IdentifierId>> = new Map();

  override visitInstruction(instr: ReactiveInstruction): void {
    if (
      instr.value.kind === "StoreLocal" ||
      instr.value.kind === "StoreContext"
    ) {
      this.scopeIdentifiers.union([
        instr.value.lvalue.place.identifier.id,
        instr.value.value.identifier.id,
      ]);
    } else if (
      instr.value.kind === "LoadLocal" ||
      instr.value.kind === "LoadContext"
    ) {
      instr.lvalue &&
        this.scopeIdentifiers.union([
          instr.lvalue.identifier.id,
          instr.value.place.identifier.id,
        ]);
    } else if (instr.value.kind === "PropertyLoad") {
      instr.lvalue &&
        update(
          this.scopePaths,
          instr.value.object.identifier.id,
          instr.value.property,
          instr.lvalue.identifier.id
        );
    } else if (instr.value.kind === "PropertyStore") {
      update(
        this.scopePaths,
        instr.value.object.identifier.id,
        instr.value.property,
        instr.value.value.identifier.id
      );
    }
  }
}

function getAliases(
  fn: ReactiveFunction
): [DisjointSet<IdentifierId>, Map<IdentifierId, Map<string, IdentifierId>>] {
  const visitor = new AliasVisitor();
  visitReactiveFunction(fn, visitor, null);
  let disjoint = visitor.scopeIdentifiers;
  let scopePaths = new Map<IdentifierId, Map<string, IdentifierId>>();
  for (const [key, value] of visitor.scopePaths) {
    for (const [path, id] of value) {
      update(
        scopePaths,
        disjoint.find(key) ?? key,
        path,
        disjoint.find(id) ?? id
      );
    }
  }
  return [disjoint, scopePaths];
}
