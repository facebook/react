/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import {
  BasicBlock,
  BlockId,
  Effect,
  Environment,
  FunctionExpression,
  GeneratedSource,
  GotoTerminal,
  GotoVariant,
  HIR,
  HIRFunction,
  IdentifierId,
  Identifier,
  InstructionKind,
  makeInstructionId,
  makeType,
  Place,
  reversePostorderBlocks,
  shrink,
} from "../HIR";
import { markInstructionIds, markPredecessors } from "../HIR/HIRBuilder";
import { assertExhaustive, retainWhere } from "../Utils/utils";

/**
 * Rewrites `useMemo()` calls, rewriting so that the lambda body becomes part of the
 * outer block's instructions.
 *
 * Example:
 *
 * ```javascript
 * // Before
 * const x = useMemo(() => foo(y, z), [y, z])
 *
 * // After
 * const x = foo(y, z);
 * ```
 *
 * The main challenge is dealing with the possibility of complex control flow within
 * the lambda body. The approach is roughly:
 * - split the block with the useMemo call in two:
 *   - the first block is everything up to the memo call plus the lambda body
 *   - the second block is everything after the memo call
 * - use the temporary from the useMemo call result value as the place to store
 *   the useMemo result
 * - for every return terminal in the lambda body:
 *   - add a StoreLocal to the temporary, assigning the return value
 *   - replace the terminal w a goto to the second block
 *
 * NOTE: *this pass must be run prior to EnterSSA*. Prior to entering SSA form identifiers
 *       in the top-level function and any function expressions will have consistent
 *       correlation between `Identifier` instances and IdentifierIds. After entering SSA
 *       form we drop this correspondence. It's much easier to write this inlining pass
 *       without having to worry about SSA form.
 */
export function inlineUseMemo(fn: HIRFunction): void {
  // Track all function expressions in case they appear as the argument to a useMemo
  const functions = new Map<IdentifierId, FunctionExpression>();
  // Track all references to `useMemo`
  const useMemoGlobals = new Set<IdentifierId>();
  // Identifiers (lvalues) for known useMemo functions, so that we can prune them
  // at the end of the pass
  const useMemoFunctions = new Set<IdentifierId>();

  // Iterate the *existing* blocks from the outer component to find useMemo calls
  // and inline them. During iteration we will modify `fn` (by inlining the CFG
  // of useMemo callbacks) so we explicitly copy references to just the original
  // function's blocks first. As blocks are split to make room for useMemo calls,
  // the split portions of the blocks will be added to this queue.
  const queue = Array.from(fn.body.blocks.values());
  queue: for (const block of queue) {
    for (let ii = 0; ii < block.instructions.length; ii++) {
      const instr = block.instructions[ii]!;
      switch (instr.value.kind) {
        case "LoadGlobal": {
          if (instr.value.name === "useMemo") {
            useMemoGlobals.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case "FunctionExpression": {
          functions.set(instr.lvalue.identifier.id, instr.value);
          break;
        }
        case "CallExpression": {
          if (useMemoGlobals.has(instr.value.callee.identifier.id)) {
            const [lambda] = instr.value.args;
            if (lambda.kind === "Spread") {
              continue;
            }
            const body = functions.get(lambda.identifier.id);
            if (body === undefined) {
              CompilerError.invariant(
                "Expected first argument to useMemo() to be a function expression",
                lambda.loc
              );
            }

            if (body.loweredFunc.params.length > 0) {
              CompilerError.invariant(
                "Did not expect any arguments to useMemo callback",
                body.loc
              );
            }

            if (body.loweredFunc.async || body.loweredFunc.generator) {
              CompilerError.invariant(
                "Did not expect useMemo callback to be async or a generator",
                body.loc
              );
            }

            // We know this function is used for useMemo and can prune it later
            useMemoFunctions.add(lambda.identifier.id);

            // Create a new block which will contain code following the useMemo call
            const continuationBlockId = fn.env.nextBlockId;
            const continuationBlock: BasicBlock = {
              id: continuationBlockId,
              instructions: block.instructions.slice(ii + 1),
              kind: block.kind,
              phis: new Set(),
              preds: new Set(),
              terminal: block.terminal,
            };
            fn.body.blocks.set(continuationBlockId, continuationBlock);

            // Trim the original block to contain instructions up to (but not including)
            // the useMemo
            block.instructions.length = ii;

            // The block leading up to the useMemo needs to jump to the entry block of
            // the useMemo control flow graph. These will be merged into a single block
            // via MergeConsectuveBlocks
            const newTerminal: GotoTerminal = {
              block: body.loweredFunc.body.entry,
              id: makeInstructionId(0),
              kind: "goto",
              variant: GotoVariant.Break,
              loc: block.terminal.loc,
            };
            block.terminal = newTerminal;

            // If the final terminal type has a fallthrough, update it to point to the
            // continuation block
            const terminalBlock = getTerminalBlock(
              body.loweredFunc.body,
              body.loweredFunc.body.entry
            );
            switch (terminalBlock.terminal.kind) {
              case "if":
              case "switch":
              case "label": {
                // These terminals can all appear as the final top-level terminal
                // *and* have fallthroughs. If they are final, their fallthrough
                // must be updated to point to the continuation block to main
                // proper CFG structure (a block that succeeds all branches of a conditional
                // must be marked as that conditional's fallthrough)
                terminalBlock.terminal.fallthrough = continuationBlockId;
                break;
              }
              case "return":
              case "throw": {
                // These can appear as the final top-level terminal
                break;
              }
              // These all have non-nullable fallthroughs: there is always some code in the
              // CFG that succeeds them which we should find instead
              case "optional-call":
              case "ternary":
              case "logical":
              case "while":
              case "for":
              case "for-of":
              case "do-while":
              // These are invalid terminals for a top-level block
              case "branch":
              case "goto":
              case "unsupported": {
                CompilerError.invariant(
                  `Unexpected final top-level terminal`,
                  terminalBlock.terminal.loc,
                  `Found ${terminalBlock.terminal.kind}, expected one of if, switch, label, return, or throw`
                );
              }
              default: {
                assertExhaustive(
                  terminalBlock.terminal,
                  `Unexpected terminal kind '${
                    (terminalBlock.terminal as any).kind
                  }'`
                );
              }
            }

            // We store the result in the useMemo temporary
            const result = instr.lvalue;

            // Declare the useMemo temporary
            declareTemporary(fn.env, block, result);

            // Promote the temporary with a name as we require this to persist
            promoteTemporary(result.identifier);

            // Rewrite blocks from the lambda to replace any `return` with a
            // store to the result and `goto` the continuation block
            for (const [id, block] of body.loweredFunc.body.blocks) {
              block.preds.clear();
              rewriteBlock(fn.env, block, continuationBlockId, result);
              fn.body.blocks.set(id, block);
            }

            // Ensure we visit the continuation block, since there may have been
            // sequential useMemos that need to be visited.
            queue.push(continuationBlock);
            continue queue;
          }
        }
      }
    }
  }

  if (useMemoFunctions.size !== 0) {
    // Remove instructions that define lambdas which we inlined
    for (const [, block] of fn.body.blocks) {
      retainWhere(
        block.instructions,
        (instr) => !useMemoFunctions.has(instr.lvalue.identifier.id)
      );
    }

    // If terminals have changed then blocks may have become newly unreachable.
    // Re-run minification of the graph (incl reordering instruction ids)
    shrink(fn.body);
    reversePostorderBlocks(fn.body);
    markInstructionIds(fn.body);
    markPredecessors(fn.body);
  }
}

// Finds the final top-level terminal node for a CFG, by following any
// fallthrough nodes.
function getTerminalBlock(cfg: HIR, start: BlockId): BasicBlock {
  let current = cfg.blocks.get(start)!;
  while (true) {
    const { terminal } = current;
    switch (terminal.kind) {
      case "if": {
        if (
          terminal.fallthrough !== null &&
          terminal.fallthrough === terminal.alternate
        ) {
          // Here we don't know if the fallthrough and alternate are the same because there was
          // no alternate or because both the alternate exists and the fallthrough is just unreachable
          // So we check if the fallthrough returns/throws (the if is the final top-level terminal)
          // or whether execution actually may continue.
          const fallthrough = getTerminalBlock(cfg, terminal.fallthrough);
          if (
            fallthrough.terminal.kind === "return" ||
            fallthrough.terminal.kind === "throw"
          ) {
            return current;
          } else {
            current = fallthrough;
            continue;
          }
        } else {
          return current;
        }
      }
      case "switch":
      case "label": {
        if (terminal.fallthrough !== null) {
          current = cfg.blocks.get(terminal.fallthrough)!;
          continue;
        } else {
          return current;
        }
      }
      case "optional-call":
      case "ternary":
      case "logical":
      case "while":
      case "for":
      case "for-of":
      case "do-while": {
        current = cfg.blocks.get(terminal.fallthrough)!;
        continue;
      }
      case "return":
      case "throw": {
        return current;
      }
      case "unsupported":
      case "branch":
      case "goto": {
        CompilerError.invariant(
          `Unexpected block terminal`,
          terminal.loc,
          `Top-level blocks may not end in a ${terminal.kind} terminal`
        );
      }
      default: {
        assertExhaustive(
          terminal,
          `Unexpected terminal kind '${(terminal as any).kind}'`
        );
      }
    }
  }
}

/**
 * Rewrites the block so that all `return` terminals are replaced:
 * * Add a StoreLocal <returnValue> = <terminal.value>
 * * Replace the terminal with a Goto to <returnTarget>
 */
function rewriteBlock(
  env: Environment,
  block: BasicBlock,
  returnTarget: BlockId,
  returnValue: Place
): void {
  const { terminal } = block;
  if (terminal.kind !== "return") {
    return;
  }
  if (terminal.value !== null) {
    block.instructions.push({
      id: makeInstructionId(0),
      loc: terminal.loc,
      lvalue: {
        effect: Effect.Unknown,
        identifier: {
          id: env.nextIdentifierId,
          mutableRange: {
            start: makeInstructionId(0),
            end: makeInstructionId(0),
          },
          name: null,
          scope: null,
          type: makeType(),
        },
        kind: "Identifier",
        loc: terminal.loc,
      },
      value: {
        kind: "StoreLocal",
        lvalue: { kind: InstructionKind.Reassign, place: { ...returnValue } },
        value: terminal.value,
        loc: terminal.loc,
      },
    });
  }
  block.terminal = {
    kind: "goto",
    block: returnTarget,
    id: makeInstructionId(0),
    variant: GotoVariant.Break,
    loc: block.terminal.loc,
  };
}

function declareTemporary(
  env: Environment,
  block: BasicBlock,
  result: Place
): void {
  block.instructions.push({
    id: makeInstructionId(0),
    loc: GeneratedSource,
    lvalue: {
      effect: Effect.Unknown,
      identifier: {
        id: env.nextIdentifierId,
        mutableRange: {
          start: makeInstructionId(0),
          end: makeInstructionId(0),
        },
        name: null,
        scope: null,
        type: makeType(),
      },
      kind: "Identifier",
      loc: GeneratedSource,
    },
    value: {
      kind: "DeclareLocal",
      lvalue: {
        place: result,
        kind: InstructionKind.Let,
      },
      loc: result.loc,
    },
  });
}

function promoteTemporary(temp: Identifier): void {
  temp.name = `t${temp.id}`;
}
