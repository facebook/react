/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import {
  BasicBlock,
  BlockId,
  Effect,
  GeneratedSource,
  HIRFunction,
  Identifier,
  Instruction,
  InstructionKind,
  LValue,
  LValuePattern,
  makeInstructionId,
  Phi,
  Place,
} from "../HIR/HIR";
import { printPlace } from "../HIR/PrintHIR";
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
  terminalFallthrough,
} from "../HIR/visitors";

/**
 * Removes SSA form by converting all phis into explicit bindings and assignments. There are two main categories
 * of phis:
 *
 * ## Reassignments (operands are independently memoizable)
 *
 * These are phis that occur after some high-level control flow such as an if, switch, or loop. These phis are rewritten
 * to add a new `let` binding for the phi id prior to the control flow node (ie prior to the if/switch),
 * and to add a reassignment to that let binding in each of the phi's predecessors.
 *
 * Example:
 *
 * ```javascript
 * // Input
 * let x1 = null;
 * if (a) {
 *   x2 = b;
 * } else {
 *   x3 = c;
 * }
 * x4 = phi(x2, x3);
 * return x4;
 *
 * // Output
 * const x1 = null;
 * let x4; // synthesized binding for the phi identifier
 * if (a) {
 *   x2 = b;
 *   x4 = x2;; // sythesized assignment to the phi identifier
 * } else {
 *   x3 = c;
 *   x4 = x3; // synthesized assignment
 * }
 * // phi removed
 * return x4;
 * ```
 *
 * ## Rewrites (operands are not independently memoizable)
 *
 * Phis that occur inside loop constructs cannot use the reassignment strategy, because there isn't an appropriate place
 * to add the new let binding. Instead, we select a single "canonical" id for these phis which is the operand that is
 * defined first. Then, all assignments and references for any of the phi ir and operands are rewritten to reference
 * the canonical id instead.
 *
 * Example:
 *
 * ```javascript
 * // Input
 * for (
 *  let i1 = 0;
 *  { i2 = phi(i1, i2); i2 < 10 }; // note the phi in the test block
 *  i2 += 1
 * ) { ... }
 *
 * // Output
 * for (
 *   let i1 = 0; // i1 is defined first, so it becomes the canonical id
 *   i1 < 10; // rewritten to canonical id
 *   i1 += 1 // rewritten to canonical id
 * )
 * ```
 */
export function leaveSSA(fn: HIRFunction): void {
  // Maps identifier names to their original declaration.
  const declarations: Map<
    string,
    { lvalue: LValue | LValuePattern; place: Place }
  > = new Map();

  // For non-memoizable phis, this maps original identifiers to the identifier they should be
  // *rewritten* to. The keys are the original identifiers, and the value will be _either_ the
  // phi id or, more typically, the operand that was defined prior to the phi.
  const rewrites: Map<Identifier, Identifier> = new Map();

  type PhiState = {
    phi: Phi;
    block: BasicBlock;
  };

  const seen = new Set<BlockId>();
  const backEdgePhis = new Set<Phi>();
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      for (const [pred] of phi.operands) {
        if (!seen.has(pred)) {
          backEdgePhis.add(phi);
          break;
        }
      }
    }
    seen.add(block.id);
  }

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      // Iterate the instructions and perform any rewrites as well as promoting SSA variables to
      // `let` or `reassign` where possible.
      const { lvalue, value } = instr;
      if (value.kind === "DeclareLocal") {
        const name = value.lvalue.place.identifier.name;
        if (name !== null) {
          CompilerError.invariant(
            !declarations.has(name),
            `Unexpected duplicate declaration`,
            value.lvalue.place.loc,
            `Found duplicate declaration for '${name}'`
          );
          declarations.set(name, {
            lvalue: value.lvalue,
            place: value.lvalue.place,
          });
        }
      } else if (value.kind === "StoreLocal") {
        if (value.lvalue.place.identifier.name != null) {
          const originalLVal = declarations.get(
            value.lvalue.place.identifier.name
          );
          if (
            originalLVal === undefined ||
            originalLVal.lvalue === value.lvalue // in case this was pre-declared for the `for` initializer
          ) {
            CompilerError.invariant(
              originalLVal !== undefined || block.kind === "block",
              `TODO: Handle reassignment in a value block where the original declaration was removed by dead code elimination (DCE)`,
              value.lvalue.place.loc
            );
            declarations.set(value.lvalue.place.identifier.name, {
              lvalue: value.lvalue,
              place: value.lvalue.place,
            });
            value.lvalue.kind = InstructionKind.Const;
          } else {
            // This is an instance of the original id, so we need to promote the original declaration
            // to a `let` and the current lval to a `reassign`
            originalLVal.lvalue.kind = InstructionKind.Let;
            value.lvalue.kind = InstructionKind.Reassign;
          }
        } else if (rewrites.has(value.lvalue.place.identifier)) {
          value.lvalue.kind = InstructionKind.Const;
        }
      } else if (value.kind === "Destructure") {
        let kind: InstructionKind | null = null;
        for (const place of eachPatternOperand(value.lvalue.pattern)) {
          if (place.identifier.name == null) {
            CompilerError.invariant(
              kind === null || kind === InstructionKind.Const,
              `Expected consistent kind for destructuring`,
              place.loc,
              `other places were '${kind}' but '${printPlace(place)}' is const`
            );
            kind = InstructionKind.Const;
          } else {
            const originalLVal = declarations.get(place.identifier.name);
            if (
              originalLVal === undefined ||
              originalLVal.lvalue === value.lvalue
            ) {
              CompilerError.invariant(
                originalLVal !== undefined || block.kind !== "value",
                `TODO: Handle reassignment in a value block where the original declaration was removed by dead code elimination (DCE)`,
                place.loc
              );
              declarations.set(place.identifier.name, {
                lvalue: value.lvalue,
                place,
              });
              CompilerError.invariant(
                kind === null || kind === InstructionKind.Const,
                `Expected consistent kind for destructuring`,
                place.loc,
                `Other places were '${kind}' but '${printPlace(
                  place
                )}' is const`
              );
              kind = InstructionKind.Const;
            } else {
              CompilerError.invariant(
                kind === null || kind === InstructionKind.Reassign,
                `Expected consistent kind for destructuring`,
                place.loc,
                `Other places were '${kind}' but '${printPlace(
                  place
                )}' is reassigned`
              );
              kind = InstructionKind.Reassign;
              originalLVal.lvalue.kind = InstructionKind.Let;
            }
          }
        }
        CompilerError.invariant(
          kind !== null,
          "Expected at least one operand",
          null
        );
        value.lvalue.kind = kind;
      }
      rewritePlace(lvalue, rewrites, declarations);
      for (const operand of eachInstructionLValue(instr)) {
        rewritePlace(operand, rewrites, declarations);
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        rewritePlace(operand, rewrites, declarations);
      }
    }

    const terminal = block.terminal;
    for (const operand of eachTerminalOperand(terminal)) {
      rewritePlace(operand, rewrites, declarations);
    }

    // Find any phi nodes which need a variable declaration in the current block
    // This includes phis in fallthrough nodes, or blocks that form part of control flow
    // such as for or while (and later if/switch).
    const reassignmentPhis: Array<PhiState> = [];
    const rewritePhis: Array<PhiState> = [];
    function pushPhis(phiBlock: BasicBlock): void {
      for (const phi of phiBlock.phis) {
        if (phi.id.name === null) {
          rewritePhis.push({ phi, block: phiBlock });
        } else {
          reassignmentPhis.push({ phi, block: phiBlock });
        }
        const hasBackEdge = backEdgePhis.has(phi);
        const isPhiMutatedAfterCreation: boolean =
          phi.id.mutableRange.end >
          (phiBlock.instructions.at(0)?.id ?? phiBlock.terminal.id);

        // Named variables whose phi doesn't have a back-edge can potentially be independenly
        // memoized, depending on whether the phi is after its creation.
        if (phi.id.name !== null && !hasBackEdge) {
          if (!isPhiMutatedAfterCreation) {
            // Simple case: predecesor-only values flowing into a phi, which is never modified:
            // adjust the phi's range to clarify that the identifier does not mutate
            phi.id.mutableRange.start = terminal.id;
            phi.id.mutableRange.end = makeInstructionId(terminal.id + 1);
          } else {
            // Predecessor only values flow into a phi, which is modified later:
            // all operands flow into the phi and can be modified, must extend their ranges
            for (const [, operand] of phi.operands) {
              operand.mutableRange.end = phi.id.mutableRange.end;
            }
          }
          return;
        }
        // Otherwise this is a temporary phi (logical or ternary) or occurs in a loop. In either
        // case we can't independently memoize any of the values: unify their ranges to span the
        // min(start) to max(end) so that we create a single scope for all the computation.
        let start = block.terminal.id as number;
        let end = Number.MIN_SAFE_INTEGER;
        const operands = [phi.id, ...phi.operands.values()];
        for (const operand of operands) {
          start = Math.min(start, operand.mutableRange.start);
          end = Math.max(end, operand.mutableRange.end);
        }
        for (const operand of operands) {
          operand.mutableRange.start = makeInstructionId(start);
          operand.mutableRange.end = makeInstructionId(end);
        }
      }
    }
    const fallthroughId = terminalFallthrough(terminal);
    if (fallthroughId !== null) {
      const fallthrough = fn.body.blocks.get(fallthroughId)!;
      pushPhis(fallthrough);
    }
    if (terminal.kind === "while" || terminal.kind === "for") {
      const test = fn.body.blocks.get(terminal.test)!;
      pushPhis(test);

      const loop = fn.body.blocks.get(terminal.loop)!;
      pushPhis(loop);
    }
    if (terminal.kind === "for" || terminal.kind === "for-of") {
      const init = fn.body.blocks.get(terminal.init)!;
      pushPhis(init);

      // To avoid generating a let binding for the initializer prior to the loop,
      // check to see if the for declares an iterator variable
      const initIdentifier = init.instructions.at(-1);
      if (
        initIdentifier !== undefined &&
        initIdentifier.value.kind === "StoreLocal"
      ) {
        const value = initIdentifier.value;
        if (value.lvalue.place.identifier.name !== null) {
          const originalLVal = declarations.get(
            value.lvalue.place.identifier.name
          );
          if (originalLVal === undefined) {
            declarations.set(value.lvalue.place.identifier.name, {
              lvalue: value.lvalue,
              place: value.lvalue.place,
            });
            value.lvalue.kind = InstructionKind.Const;
          }
        }
      }

      if (terminal.kind === "for" && terminal.update !== null) {
        const update = fn.body.blocks.get(terminal.update)!;
        pushPhis(update);
      }
    }

    for (const { phi, block: phiBlock } of reassignmentPhis) {
      // In some cases one of the phi operands can be defined *before* the let binding
      // we will generate. For example, a variable that is only rebound in one branch of
      // an if but not another. In this case we populate the let binding with this initial
      // value rather than generate an extra assignment.
      let initOperand: Identifier | null = null;
      for (const [, operand] of phi.operands) {
        if (operand.mutableRange.start < terminal.id) {
          if (initOperand == null) {
            initOperand = operand;
          }
        }
      }

      // If the phi is mutated after its creation, then any values which flow into the phi
      // must also have their ranges extended accordingly.
      const isPhiMutatedAfterCreation: boolean =
        phi.id.mutableRange.end >
        (phiBlock.instructions.at(0)?.id ?? phiBlock.terminal.id);

      // If we never saw a declaration for this phi, it may have been pruned by DCE, so synthesize
      // a new Let binding
      CompilerError.invariant(
        phi.id.name != null,
        "Expected reassignment phis to have a name",
        null
      );
      const declaration = declarations.get(phi.id.name);
      if (declaration === undefined) {
        let initValue: Place;
        if (initOperand === null) {
          initValue = {
            effect: Effect.Read,
            kind: "Identifier",
            loc: GeneratedSource,
            identifier: {
              id: fn.env.nextIdentifierId,
              name: null,
              mutableRange: {
                // TODO: this is technically the wrong start range; we do this because the instruction to create the
                // undefined and the instruction to store it to the identifier share an InstructionId, which makes
                // this value otherwise appear mutable when stored. All that matters is that the range end prior
                // to the StoreLocal's instruction id, so we decrement by one.
                start: makeInstructionId(block.terminal.id - 1),
                end: makeInstructionId(block.terminal.id),
              },
              scope: null,
              type: { kind: "Primitive" },
            },
          };
          block.instructions.push({
            id: block.terminal.id,
            lvalue: { ...initValue, effect: Effect.ConditionallyMutate },
            value: {
              kind: "Primitive",
              // TODO: consider leaving the variable uninitialized rather than explicitly undefined.
              value: undefined,
              loc: GeneratedSource,
            },
            loc: GeneratedSource,
          });
        } else {
          initValue = {
            kind: "Identifier",
            identifier: initOperand,
            effect: Effect.Capture,
            loc: GeneratedSource,
          };
        }
        const lvalue: LValue = {
          place: {
            kind: "Identifier",
            identifier: phi.id,
            effect: Effect.ConditionallyMutate,
            loc: GeneratedSource,
          },
          kind: InstructionKind.Let,
        };
        const instr: Instruction = {
          // NOTE: reuse the terminal id since these lets must be scoped with the terminal anyway.
          // the mutable range of this canonical id must by definition span from the binding (before
          // the if) to the phi, so it's safe to reuse the terminal's id.
          id: block.terminal.id,
          lvalue: {
            kind: "Identifier",
            identifier: {
              id: fn.env.nextIdentifierId,
              mutableRange: {
                start: block.terminal.id,
                end: makeInstructionId(block.terminal.id + 1),
              },
              name: null,
              scope: null,
              type: phi.id.type,
            },
            effect: Effect.ConditionallyMutate,
            loc: GeneratedSource,
          },
          value: {
            kind: "StoreLocal",
            lvalue,
            value: initValue,
            loc: GeneratedSource,
          },
          loc: GeneratedSource,
        };
        block.instructions.push(instr);
        declarations.set(phi.id.name, { lvalue, place: lvalue.place });
        phi.id.mutableRange.start = terminal.id;
      } else if (isPhiMutatedAfterCreation) {
        // The declaration is not guaranteed to flow into the phi, for example in the case of a variable
        // that is reassigned in all control flow paths to a given phi. The original declaration's range
        // has to be extended in this case (if the phi is later mutated) since we are reusing the original
        // declaration instead of creating a new declaration.
        //
        // NOTE: this can *only* happen if the original declaration involves an instruction that DCE does
        // not prune. Otherwise, the declaration would have been pruned and we'd synthesize a new one.
        declaration.place.identifier.mutableRange.end = phi.id.mutableRange.end;
      }
    }

    // Similar logic for rewrite phis that occur in loops, except that instead of a new let binding
    // we pick one of the operands as the canonical id, and rewrite all references to the other
    // operands and the phi to reference this canonical id.
    for (const { phi } of rewritePhis) {
      let canonicalId = rewrites.get(phi.id);
      if (canonicalId === undefined) {
        canonicalId = phi.id;
        for (const [, operand] of phi.operands) {
          let canonicalOperand = rewrites.get(operand) ?? operand;
          if (canonicalOperand.id < canonicalId.id) {
            canonicalId = canonicalOperand;
          }
        }
        rewrites.set(phi.id, canonicalId);

        if (canonicalId.name !== null) {
          const declaration = declarations.get(canonicalId.name);
          if (declaration !== undefined) {
            declaration.lvalue.kind = InstructionKind.Let;
          }
        }
      }

      // all versions of the variable need to be remapped to the canonical id
      for (const [, operand] of phi.operands) {
        rewrites.set(operand, canonicalId);
      }
    }
  }
}

// Rewrite @param place's identifier based on the given rewrite mapping, if the identifier
// is present. Also expands the mutable range of the target identifier to include the
// place's range.
function rewritePlace(
  place: Place,
  rewrites: Map<Identifier, Identifier>,
  declarations: Map<string, { lvalue: LValue | LValuePattern; place: Place }>
): void {
  const prevIdentifier = place.identifier;
  const nextIdentifier = rewrites.get(prevIdentifier);

  if (nextIdentifier !== undefined) {
    if (nextIdentifier === prevIdentifier) return;
    place.identifier = nextIdentifier;
  } else if (prevIdentifier.name != null) {
    const declaration = declarations.get(prevIdentifier.name);
    // Only rewrite identifiers that were declared within the function
    if (declaration === undefined) return;
    const originalIdentifier = declaration.place.identifier;
    prevIdentifier.id = originalIdentifier.id;
  }
}
