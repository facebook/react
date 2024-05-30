import {
  BasicBlock,
  Environment,
  HIRFunction,
  IdentifierId,
  Instruction,
  InstructionId,
  makeInstructionId,
  markInstructionIds,
} from "../HIR";
import {
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { mayAllocate } from "../ReactiveScopes/InferReactiveScopeVariables";
import { getOrInsertDefault } from "../Utils/utils";

/**
 * WIP early exploration of instruction reordering. This is a fairly aggressive form and has
 * some issues. The idea of what's implemented:
 *
 * The high-level approach is to build a dependency graph where nodes generally correspond
 * either to instructions OR to particular lvalue assignments of an expresssion. So
 * `Destructure [x, y] = z` creates 3 nodes: one for the instruction, and one each for x and y.
 * The lvalue nodes depend on the instruction node that assigns them.
 *
 * We add dependency edges for all the rvalues/lvalues of each instruction. In addition, we
 * implicitly add dependencies btw non-reorderable instructions (more on that criteria) to
 * serialize any instruction where order might be observable.
 *
 * We then distinguish two types of instructions that are reorderable:
 * - Primitives, JSXText, JSX elements, and globals can be *globally* reordered, ie across blocks.
 *   We defer emitting them until they are first used globally.
 * - Array and object expressions are reorderable within basic blocks. This could likely be relaxed to be global.
 * - StoreLocal, LoadLocal, and Destructure are reorderable within basic blocks. However, we serialize all
 *   references to each named variable (reads and writes) to ensure that we aren't changing the order of evaluation
 *   of variable references.
 *
 * The variable reordering relies on the fact that any variables that could be reassigned via a function expression
 * are promoted to "context" variables and use LoadContext/StoreContext, which are not reorderable.
 *
 * In theory it might even be safe to do this variable reordering globally, but i want to think through that more.
 *
 * With the above context, the algorithm is approximately:
 * - For each basic block:
 *   - Iterate the instructions to create the dependency graph
 *   - Re-emit instructions, "pulling" from all the values that are depended upon by the block's terminal.
 *   - Emit any remaining instructions that cannot be globally reordered, starting from later instructions first.
 *   - Save any globally-reorderable instructions into a global map that is shared across blocks, so they can be
 *     emitted by the first block that needs them.
 *
 * Emitting instructions is currently naive: we just iterate in the order that the dependencies were established.
 * If instruction 4 depends on instructions 1, 2, and 3, we'll visit in depth-first order and emit 1, 2, 3, 4.
 * That's true even if instruction 1 and 2 are simple instructions (for ex primitives) while instruction 3 has its
 * own large dependency tree.
 *
 * ## Issues/things to explore:
 *
 * - An obvious improvement is to weight the nodes and emit dependencies based on weight. Alternatively, we could try to
 * determine the reactive dependencies of each node, and try to emit nodes that have the same dependencies together.
 * - Reordering destructure statements means that we also end up deferring the evaluation of its RHS. So i noticed some
 *   `const [state, setState] = useState(...)` getting moved around. But i think i might have just messed up the bit that
 *   ensures non-reorderable instructions (like the useState() call here) are serialized. So this should just be a simple fix,
 *   if i didn't already fix it (need to go back through the fixture output changes)
 * - I also noticed that destructuring being moved meant that some reactive scopes ended up with less precise input, because
 *   the destructure moved into the reactive scope itself (so the scope depends on the rvalue of the destructure, not the lvalues).
 *   This is weird, i need to debug.
 * - Probably more things.
 */
export function instructionReordering(fn: HIRFunction): void {
  const lastAssignments = getLastAssignments(fn);
  const globalDependencies: Dependencies = new Map();
  for (const [, block] of fn.body.blocks) {
    reorderBlock(fn.env, block, globalDependencies, lastAssignments);
  }
  markInstructionIds(fn.body);
}

function getLastAssignments(fn: HIRFunction): LastAssignments {
  const lastAssignments: LastAssignments = new Map();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      for (const lvalue of eachInstructionValueLValue(instr.value)) {
        if (
          lvalue.identifier.name !== null &&
          lvalue.identifier.name.kind === "named"
        ) {
          const name = lvalue.identifier.name.value;
          const previous = lastAssignments.get(name);
          if (previous !== undefined) {
            lastAssignments.set(
              name,
              makeInstructionId(Math.max(previous, instr.id))
            );
          } else {
            lastAssignments.set(name, instr.id);
          }
        }
      }
    }
  }
  return lastAssignments;
}

type LastAssignments = Map<string, InstructionId>;
type Dependencies = Map<IdentifierId, Node>;
type Node = {
  instruction: Instruction | null;
  dependencies: Array<IdentifierId>;
  depth: number | null;
};

enum ReorderingLevel {
  None = "none",
  Local = "local",
  Global = "global",
}

function reorderBlock(
  env: Environment,
  block: BasicBlock,
  globalDependencies: Dependencies,
  lastAssignments: LastAssignments
): void {
  const dependencies: Dependencies = new Map();
  const locals = new Map<string, IdentifierId>();
  let previousIdentifier: IdentifierId | null = null;
  for (const instr of block.instructions) {
    const node: Node = getOrInsertDefault(
      dependencies,
      instr.lvalue.identifier.id,
      {
        instruction: instr,
        dependencies: [],
        depth: null,
      }
    );
    if (getReorderingLevel(instr, lastAssignments) === ReorderingLevel.None) {
      if (previousIdentifier !== null) {
        node.dependencies.push(previousIdentifier);
      }
      previousIdentifier = instr.lvalue.identifier.id;
    }
    for (const operand of eachInstructionValueOperand(instr.value)) {
      if (
        operand.identifier.name !== null &&
        operand.identifier.name.kind === "named"
      ) {
        const previous = locals.get(operand.identifier.name.value);
        if (previous !== undefined) {
          node.dependencies.push(previous);
        }
        locals.set(operand.identifier.name.value, instr.lvalue.identifier.id);
      } else {
        if (
          dependencies.has(operand.identifier.id) ||
          globalDependencies.has(operand.identifier.id)
        ) {
          node.dependencies.push(operand.identifier.id);
        }
      }
    }
    dependencies.set(instr.lvalue.identifier.id, node);

    for (const lvalue of eachInstructionValueLValue(instr.value)) {
      const lvalueNode = getOrInsertDefault(
        dependencies,
        lvalue.identifier.id,
        {
          instruction: null,
          dependencies: [],
          depth: null,
        }
      );
      lvalueNode.dependencies.push(instr.lvalue.identifier.id);
      if (
        lvalue.identifier.name !== null &&
        lvalue.identifier.name.kind === "named"
      ) {
        const previous = locals.get(lvalue.identifier.name.value);
        if (previous !== undefined) {
          node.dependencies.push(previous);
        }
        locals.set(lvalue.identifier.name.value, instr.lvalue.identifier.id);
      }
    }
  }

  function getDepth(env: Environment, id: IdentifierId): number {
    const node = dependencies.get(id);
    if (node == null) {
      return 0;
    }
    if (node.depth !== null) {
      return node.depth;
    }
    node.depth = 0;
    let depth =
      node.instruction != null && mayAllocate(env, node.instruction) ? 1 : 0;
    for (const dep of node.dependencies) {
      depth += getDepth(env, dep);
    }
    node.depth = depth;
    return depth;
  }

  const instructions: Array<Instruction> = [];

  function emit(id: IdentifierId): void {
    const node = dependencies.get(id) ?? globalDependencies.get(id);
    if (node == null) {
      return;
    }
    dependencies.delete(id);
    globalDependencies.delete(id);
    node.dependencies.sort((a, b) => {
      const aDepth = getDepth(env, a);
      const bDepth = getDepth(env, b);
      return bDepth - aDepth;
    });
    for (const dep of node.dependencies) {
      emit(dep);
    }
    if (node.instruction !== null) {
      instructions.push(node.instruction);
    }
  }

  for (const operand of eachTerminalOperand(block.terminal)) {
    emit(operand.identifier.id);
  }
  /**
   * Gross hack: for value blocks we want the terminal operand to be emitted last, since that's its value.
   * For other blocks the exact order doesn't matter, we assume instructions whose values aren't depended
   * upon by the block terminal are used later, so it makes sense to order them last.
   */
  const index = instructions.length;
  for (const id of Array.from(dependencies.keys()).reverse()) {
    const node = dependencies.get(id);
    if (node == null) {
      continue;
    }
    if (
      node.instruction !== null &&
      getReorderingLevel(node.instruction, lastAssignments) ===
        ReorderingLevel.Global &&
      (block.kind === "block" || block.kind === "catch")
    ) {
      globalDependencies.set(id, node);
    } else {
      emit(id);
    }
  }
  if (block.kind !== "block" && block.kind !== "catch") {
    const extra = instructions.splice(index);
    instructions.splice(0, 0, ...extra);
  }
  block.instructions = instructions;
}

function getReorderingLevel(
  instr: Instruction,
  lastAssignments: LastAssignments
): ReorderingLevel {
  switch (instr.value.kind) {
    case "JsxExpression":
    case "JsxFragment":
    case "JSXText":
    case "LoadGlobal":
    case "Primitive":
    case "TemplateLiteral": {
      return ReorderingLevel.Global;
    }
    case "LoadLocal": {
      if (
        instr.value.place.identifier.name !== null &&
        instr.value.place.identifier.name.kind === "named"
      ) {
        const name = instr.value.place.identifier.name.value;
        const lastAssignment = lastAssignments.get(name);
        if (lastAssignment !== undefined && lastAssignment < instr.id) {
          return ReorderingLevel.Global;
        }
      }
      return ReorderingLevel.None;
    }
    default: {
      return ReorderingLevel.None;
    }
  }
}
