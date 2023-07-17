import { CompilerError, ErrorSeverity } from "../CompilerError";
import {
  BlockId,
  HIRFunction,
  Place,
  computePostDominatorTree,
  isSetStateType,
} from "../HIR";
import { PostDominator } from "../HIR/Dominator";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { findBlocksWithBackEdges } from "../Optimization/DeadCodeElimination";
import { Err, Ok, Result } from "../Utils/Result";

export function validateNoSetStateInRender(
  fn: HIRFunction
): Result<PostDominator<BlockId>, CompilerError> {
  // Construct the set of blocks that is always reachable from the entry block.
  const unconditionalBlocks = new Set<BlockId>();
  const blocksWithBackEdges = findBlocksWithBackEdges(fn);
  const dominators = computePostDominatorTree(fn, {
    includeThrowsAsExitNode: false,
  });
  const exit = dominators.exit;
  let current: BlockId | null = fn.body.entry;
  while (
    current !== null &&
    current !== exit &&
    !blocksWithBackEdges.has(current)
  ) {
    unconditionalBlocks.add(current);
    current = dominators.get(current);
  }

  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    if (unconditionalBlocks.has(block.id)) {
      for (const instr of block.instructions) {
        switch (instr.value.kind) {
          case "FunctionExpression": {
            /**
             * TODO: setState's return value is considered Frozen, so the lambda's mutable range
             * does not get extended even if the lambda is called in render. The below only catches
             * setStates where the lambda has another instruction that extends its mutable range
             */
            const mutableRange = instr.lvalue.identifier.mutableRange;
            if (mutableRange.end > mutableRange.start + 1) {
              for (const operand of eachInstructionValueOperand(instr.value)) {
                validateNonSetState(errors, operand);
              }
            }
            break;
          }
          case "CallExpression": {
            validateNonSetState(errors, instr.value.callee);
            break;
          }
        }
      }
    }
  }

  if (errors.hasErrors()) {
    return Err(errors);
  } else {
    return Ok(dominators);
  }
}

function validateNonSetState(errors: CompilerError, operand: Place): void {
  if (isSetStateType(operand.identifier)) {
    errors.push({
      reason:
        "This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)",
      description: null,
      severity: ErrorSeverity.InvalidReact,
      loc: typeof operand.loc !== "symbol" ? operand.loc : null,
      suggestions: null,
    });
  }
}
