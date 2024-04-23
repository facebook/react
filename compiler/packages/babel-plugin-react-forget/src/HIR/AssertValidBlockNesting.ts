import { CompilerError } from "..";
import {
  BlockId,
  GeneratedSource,
  HIRFunction,
  MutableRange,
  Place,
  ReactiveScope,
  ScopeId,
} from "./HIR";
import {
  eachInstructionLValue,
  eachInstructionOperand,
  eachTerminalOperand,
  terminalFallthrough,
} from "./visitors";

/**
 * This pass asserts that program blocks and scopes properly form a tree hierarchy
 * with respect to block and scope ranges. In other words, two ranges must either
 * disjoint or nested.
 *
 * ProgramBlockSubtree = subtree of basic blocks between a terminal and its fallthrough
 * (e.g. continuation in the source AST). This spans every instruction contained within
 * the source AST subtree representing the terminal.
 *
 * In this example, there is a single ProgramBlockSubtree, which spans instructions 1:5
 * ```js
 * function Foo() {
 *   [0] a;
 *   [1] if (cond) {
 *   [2]   b;
 *   [3] } else {
 *   [4]   c;
 *       }
 *   [5] d;
 * }
 * ```
 *
 * Scope = reactive scope whose range has been correctly aligned and merged.
 */
type Block =
  | ({
      kind: "ProgramBlockSubtree";
      id: BlockId;
    } & MutableRange)
  | ({
      kind: "Scope";
      id: ScopeId;
    } & MutableRange);

function getScopes(fn: HIRFunction): Set<ReactiveScope> {
  const scopes: Set<ReactiveScope> = new Set();
  function visitPlace(place: Place): void {
    const scope = place.identifier.scope;
    if (scope != null) {
      if (scope.range.start !== scope.range.end) {
        scopes.add(scope);
      }
    }
  }

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      for (const operand of eachInstructionLValue(instr)) {
        visitPlace(operand);
      }

      for (const operand of eachInstructionOperand(instr)) {
        visitPlace(operand);
      }
    }

    for (const operand of eachTerminalOperand(block.terminal)) {
      visitPlace(operand);
    }
  }

  return scopes;
}

/**
 * Sort range in ascending order of start instruction, breaking ties
 * with descending order of end instructions. For overlapping ranges, this
 * always orders nested inner range after outer ranges which is identical
 * to the ordering of a pre-order tree traversal.
 * e.g. we order the following ranges to [0, 4], [0, 2], [5, 8]
 * 0  ⌝  ⌝
 * 1  ⌟  |
 * 2     |
 * 3     ⌟
 * 4
 * 5  ⌝
 * 6  |
 * 7  ⌟
 */
function nestedRangeComparator(a: MutableRange, b: MutableRange): number {
  const startDiff = a.start - b.start;
  if (startDiff !== 0) return startDiff;
  return b.end - a.end;
}

export function assertValidBlockNesting(fn: HIRFunction): void {
  const scopes = getScopes(fn);

  const blocks: Array<Block> = [...scopes].map((scope) => ({
    kind: "Scope",
    id: scope.id,
    ...scope.range,
  })) as Array<Block>;
  for (const [, block] of fn.body.blocks) {
    const fallthroughId = terminalFallthrough(block.terminal);
    if (fallthroughId != null) {
      const fallthrough = fn.body.blocks.get(fallthroughId)!;
      const end = fallthrough.instructions[0]?.id ?? fallthrough.terminal.id;
      blocks.push({
        kind: "ProgramBlockSubtree",
        id: block.id,
        start: block.terminal.id,
        end,
      });
    }
  }

  blocks.sort(nestedRangeComparator);

  for (let i = 1; i < blocks.length; i++) {
    const last = blocks[i - 1];
    const curr = blocks[i];

    const blocksDisjoint = curr.start >= last.end;
    const blocksNested = curr.end <= last.end;

    CompilerError.invariant(blocksDisjoint || blocksNested, {
      reason: "Invalid nesting in program blocks or scopes",
      description: `Blocks overlap but are not nested: ${last.kind}@${last.id}(${last.start}:${last.end}) ${curr.kind}@${curr.id}(${curr.start}:${curr.end})`,
      loc: GeneratedSource,
    });
  }
}
