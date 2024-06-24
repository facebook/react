/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "..";
import {
  BasicBlock,
  Environment,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  Instruction,
  isExpressionBlockKind,
  markInstructionIds,
} from "../HIR";
import { printInstruction } from "../HIR/PrintHIR";
import {
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { mayAllocate } from "../ReactiveScopes/InferReactiveScopeVariables";
import { getOrInsertWith } from "../Utils/utils";

/**
 * This pass implements conservative instruction reordering to move instructions closer to
 * to where their produced values are consumed. The goal is to group instructions in a way that
 * is more optimal for future optimizations. Notably, MergeReactiveScopesThatAlwaysInvalidateTogether
 * can only merge two candidate scopes if there are no intervenining instructions that are used by
 * some later code: instruction reordering can move those intervening instructions later in many cases,
 * thereby allowing more scopes to merge together.
 *
 * The high-level approach is to build a dependency graph where nodes correspond either to
 * instructions OR to a particular lvalue assignment of another instruction. So
 * `Destructure [x, y] = z` creates 3 nodes: one for the instruction, and one each for x and y.
 * The lvalue nodes depend on the instruction node that assigns them.
 *
 * Dependency edges are added for all the lvalues and rvalues of each instruction, so for example
 * the node for `t$2 = CallExpression t$0 ( t$1 )` will take dependencies on the nodes for t$0 and t$1.
 *
 * Individual instructions are grouped into two categories:
 * - "Reorderable" instructions include a safe set of instructions that we know are fine to reorder.
 *   This includes JSX elements/fragments/text, primitives, template literals, and globals.
 *   These instructions are never emitted until they are referenced, and can even be moved across
 *   basic blocks until they are used.
 * - All other instructions are non-reorderable, and take an explicit dependency on the last such
 *   non-reorderable instruction in their block. This largely ensures that mutations are serialized,
 *   since all potentially mutating instructions are in this category.
 *
 * The only remaining mutation not handled by the above is variable reassignment. To ensure that all
 * reads/writes of a variable access the correct version, all references (lvalues and rvalues) to
 * each named variable are serialized. Thus `x = 1; y = x; x = 2; z = x` will establish a chain
 * of dependencies and retain the correct ordering.
 *
 * The algorithm proceeds one basic block at a time, first building up the dependnecy graph and then
 * reordering.
 *
 * The reordering weights nodes according to their transitive dependencies, and whether a particular node
 * needs memoization or not. Larger dependencies go first, followed by smaller dependencies, which in
 * testing seems to allow scopes to merge more effectively. Over time we can likely continue to improve
 * the reordering heuristic.
 *
 * An obvious area for improvement is to allow reordering of LoadLocals that occur after the last write
 * of the named variable. We can add this in a follow-up.
 */
export function instructionReordering(fn: HIRFunction): void {
  // Shared nodes are emitted when they are first used
  const shared: Nodes = new Map();
  for (const [, block] of fn.body.blocks) {
    reorderBlock(fn.env, block, shared);
  }
  CompilerError.invariant(shared.size === 0, {
    reason: `InstructionReordering: expected all reorderable nodes to have been emitted`,
    loc:
      [...shared.values()]
        .map((node) => node.instruction?.loc)
        .filter((loc) => loc != null)[0] ?? GeneratedSource,
  });
  markInstructionIds(fn.body);
}

const DEBUG = false;

type Nodes = Map<IdentifierId, Node>;
type Node = {
  instruction: Instruction | null;
  dependencies: Set<IdentifierId>;
  depth: number | null;
};

function reorderBlock(
  env: Environment,
  block: BasicBlock,
  shared: Nodes
): void {
  const locals: Nodes = new Map();
  const named: Map<string, IdentifierId> = new Map();
  let previous: IdentifierId | null = null;
  for (const instr of block.instructions) {
    const { lvalue, value } = instr;
    // Get or create a node for this lvalue
    const node = getOrInsertWith(
      locals,
      lvalue.identifier.id,
      () =>
        ({
          instruction: instr,
          dependencies: new Set(),
          depth: null,
        }) as Node
    );
    /**
     * Ensure non-reoderable instructions have their order retained by
     * adding explicit dependencies to the previous such instruction.
     */
    if (getReoderability(instr) === Reorderability.Nonreorderable) {
      if (previous !== null) {
        node.dependencies.add(previous);
      }
      previous = lvalue.identifier.id;
    }
    /**
     * Establish dependencies on operands
     */
    for (const operand of eachInstructionValueOperand(value)) {
      const { name, id } = operand.identifier;
      if (name !== null && name.kind === "named") {
        // Serialize all accesses to named variables
        const previous = named.get(name.value);
        if (previous !== undefined) {
          node.dependencies.add(previous);
        }
        named.set(name.value, lvalue.identifier.id);
      } else if (locals.has(id) || shared.has(id)) {
        node.dependencies.add(id);
      }
    }
    /**
     * Establish nodes for lvalues, with dependencies on the node
     * for the instruction itself. This ensures that any consumers
     * of the lvalue will take a dependency through to the original
     * instruction.
     */
    for (const lvalueOperand of eachInstructionValueLValue(value)) {
      const lvalueNode = getOrInsertWith(
        locals,
        lvalueOperand.identifier.id,
        () =>
          ({
            instruction: null,
            dependencies: new Set(),
            depth: null,
          }) as Node
      );
      lvalueNode.dependencies.add(lvalue.identifier.id);
      const name = lvalueOperand.identifier.name;
      if (name !== null && name.kind === "named") {
        const previous = named.get(name.value);
        if (previous !== undefined) {
          node.dependencies.add(previous);
        }
        named.set(name.value, lvalue.identifier.id);
      }
    }
  }

  const nextInstructions: Array<Instruction> = [];
  const seen = new Set<IdentifierId>();

  DEBUG && console.log(`bb${block.id}`);

  // First emit everything that can't be reordered
  if (previous !== null) {
    DEBUG && console.log(`(last non-reorderable instruction)`);
    DEBUG && print(env, locals, shared, seen, previous);
    emit(env, locals, shared, nextInstructions, previous);
  }
  /*
   * For "value" blocks the final instruction represents its value, so we have to be
   * careful to not change the ordering. Emit the last instruction explicitly.
   * Any non-reorderable instructions will get emitted first, and any unused
   * reorderable instructions can be deferred to the shared node list.
   */
  if (isExpressionBlockKind(block.kind) && block.instructions.length !== 0) {
    DEBUG && console.log(`(block value)`);
    DEBUG &&
      print(
        env,
        locals,
        shared,
        seen,
        block.instructions.at(-1)!.lvalue.identifier.id
      );
    emit(
      env,
      locals,
      shared,
      nextInstructions,
      block.instructions.at(-1)!.lvalue.identifier.id
    );
  }
  /*
   * Then emit the dependencies of the terminal operand. In many cases they will have
   * already been emitted in the previous step and this is a no-op.
   * TODO: sort the dependencies based on weight, like we do for other nodes. Not a big
   * deal though since most terminals have a single operand
   */
  for (const operand of eachTerminalOperand(block.terminal)) {
    DEBUG && console.log(`(terminal operand)`);
    DEBUG && print(env, locals, shared, seen, operand.identifier.id);
    emit(env, locals, shared, nextInstructions, operand.identifier.id);
  }
  // Anything not emitted yet is globally reorderable
  for (const [id, node] of locals) {
    if (node.instruction == null) {
      continue;
    }
    CompilerError.invariant(
      node.instruction != null &&
        getReoderability(node.instruction) === Reorderability.Reorderable,
      {
        reason: `Expected all remaining instructions to be reorderable`,
        loc: node.instruction?.loc ?? block.terminal.loc,
        description:
          node.instruction != null
            ? `Instruction [${node.instruction.id}] was not emitted yet but is not reorderable`
            : `Lvalue $${id} was not emitted yet but is not reorderable`,
      }
    );
    DEBUG && console.log(`save shared: $${id}`);
    shared.set(id, node);
  }

  block.instructions = nextInstructions;
  DEBUG && console.log();
}

function getDepth(env: Environment, nodes: Nodes, id: IdentifierId): number {
  const node = nodes.get(id)!;
  if (node == null) {
    return 0;
  }
  if (node.depth != null) {
    return node.depth;
  }
  node.depth = 0; // in case of cycles
  let depth =
    node.instruction != null && mayAllocate(env, node.instruction) ? 1 : 0;
  for (const dep of node.dependencies) {
    depth += getDepth(env, nodes, dep);
  }
  node.depth = depth;
  return depth;
}

function print(
  env: Environment,
  locals: Nodes,
  shared: Nodes,
  seen: Set<IdentifierId>,
  id: IdentifierId,
  depth: number = 0
): void {
  if (seen.has(id)) {
    console.log(`${"|   ".repeat(depth)}$${id} <skipped>`);
    return;
  }
  seen.add(id);
  const node = locals.get(id) ?? shared.get(id);
  if (node == null) {
    return;
  }
  const deps = [...node.dependencies];
  deps.sort((a, b) => {
    const aDepth = getDepth(env, locals, a);
    const bDepth = getDepth(env, locals, b);
    return bDepth - aDepth;
  });
  for (const dep of deps) {
    print(env, locals, shared, seen, dep, depth + 1);
  }
  console.log(
    `${"|   ".repeat(depth)}$${id} ${printNode(node)} deps=[${deps
      .map((x) => `$${x}`)
      .join(", ")}]`
  );
}

function printNode(node: Node): string {
  const { instruction } = node;
  if (instruction === null) {
    return "<lvalue-only>";
  }
  switch (instruction.value.kind) {
    case "FunctionExpression":
    case "ObjectMethod": {
      return `[${instruction.id}] ${instruction.value.kind}`;
    }
    default: {
      return printInstruction(instruction);
    }
  }
}

function emit(
  env: Environment,
  locals: Nodes,
  shared: Nodes,
  instructions: Array<Instruction>,
  id: IdentifierId
): void {
  const node = locals.get(id) ?? shared.get(id);
  if (node == null) {
    return;
  }
  locals.delete(id);
  shared.delete(id);
  const deps = [...node.dependencies];
  deps.sort((a, b) => {
    const aDepth = getDepth(env, locals, a);
    const bDepth = getDepth(env, locals, b);
    return bDepth - aDepth;
  });
  for (const dep of deps) {
    emit(env, locals, shared, instructions, dep);
  }
  if (node.instruction !== null) {
    instructions.push(node.instruction);
  }
}

enum Reorderability {
  Reorderable,
  Nonreorderable,
}
function getReoderability(instr: Instruction): Reorderability {
  switch (instr.value.kind) {
    case "JsxExpression":
    case "JsxFragment":
    case "JSXText":
    case "LoadGlobal":
    case "Primitive":
    case "TemplateLiteral":
    case "BinaryExpression":
    case "UnaryExpression": {
      return Reorderability.Reorderable;
    }
    default: {
      return Reorderability.Nonreorderable;
    }
  }
}
