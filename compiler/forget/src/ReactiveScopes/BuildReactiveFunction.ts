/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { CompilerError } from "../CompilerError";
import {
  BasicBlock,
  BlockId,
  GotoVariant,
  HIR,
  InstructionId,
  Place,
  ReactiveBlock,
  SourceLocation,
} from "../HIR";
import {
  HIRFunction,
  ReactiveBreakTerminal,
  ReactiveContinueTerminal,
  ReactiveFunction,
  ReactiveLogicalValue,
  ReactiveSequenceValue,
  ReactiveTerminalStatement,
  ReactiveTernaryValue,
  ReactiveValue,
  Terminal,
} from "../HIR/HIR";
import { assertExhaustive } from "../Utils/utils";

/**
 * Converts from HIR (lower-level CFG) to ReactiveFunction, a tree representation
 * that is closer to an AST. This pass restores the original control flow constructs,
 * including break/continue to labeled statements. Note that this pass naively emits
 * labels for *all* terminals: see PruneUnusedLabels which removes unnecessary labels.
 */
export function buildReactiveFunction(fn: HIRFunction): ReactiveFunction {
  const cx = new Context(fn.body);
  const driver = new Driver(cx);
  const body = driver.traverseBlock(cx.block(fn.body.entry));
  return {
    loc: fn.loc,
    id: fn.id,
    params: fn.params,
    generator: fn.generator,
    async: fn.async,
    body,
    env: fn.env,
  };
}

class Driver {
  cx: Context;

  constructor(cx: Context) {
    this.cx = cx;
  }

  traverseBlock(block: BasicBlock): ReactiveBlock {
    const blockValue: ReactiveBlock = [];
    this.visitBlock(block, blockValue);
    return blockValue;
  }

  visitBlock(block: BasicBlock, blockValue: ReactiveBlock): void {
    invariant(
      !this.cx.emitted.has(block.id),
      `Cannot emit the same block twice: bb${block.id}`
    );
    this.cx.emitted.add(block.id);
    for (const instruction of block.instructions) {
      blockValue.push({
        kind: "instruction",
        instruction,
      });
    }

    const terminal = block.terminal;
    const scheduleIds = [];
    switch (terminal.kind) {
      case "return": {
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "return",
            // loc: terminal.loc,
            value: terminal.value,
            id: terminal.id,
          },
          label: null,
        });
        break;
      }
      case "throw": {
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "throw",
            value: terminal.value,
            id: terminal.id,
          },
          label: null,
        });
        break;
      }
      case "if": {
        const fallthroughId =
          terminal.fallthrough !== null &&
          !this.cx.isScheduled(terminal.fallthrough)
            ? terminal.fallthrough
            : null;
        const alternateId =
          terminal.alternate !== terminal.fallthrough
            ? terminal.alternate
            : null;

        if (fallthroughId !== null) {
          const scheduleId = this.cx.schedule(fallthroughId, "if");
          scheduleIds.push(scheduleId);
        }

        let consequent: ReactiveBlock | null = null;
        if (this.cx.isScheduled(terminal.consequent)) {
          const break_ = this.visitBreak(terminal.consequent, null);
          if (break_ !== null) {
            consequent = [break_];
          }
        } else {
          consequent = this.traverseBlock(
            this.cx.ir.blocks.get(terminal.consequent)!
          );
        }

        let alternate: ReactiveBlock | null = null;
        if (alternateId !== null) {
          if (this.cx.isScheduled(alternateId)) {
            const break_ = this.visitBreak(alternateId, null);
            if (break_ !== null) {
              alternate = [break_];
            }
          } else {
            alternate = this.traverseBlock(this.cx.ir.blocks.get(alternateId)!);
          }
        }

        this.cx.unscheduleAll(scheduleIds);
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "if",
            test: terminal.test,
            consequent: consequent ?? this.emptyBlock(),
            alternate: alternate,
            id: terminal.id,
          },
          label: fallthroughId,
        });
        if (fallthroughId !== null) {
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        }
        break;
      }
      case "switch": {
        const fallthroughId =
          terminal.fallthrough !== null &&
          !this.cx.isScheduled(terminal.fallthrough)
            ? terminal.fallthrough
            : null;
        if (fallthroughId !== null) {
          const scheduleId = this.cx.schedule(fallthroughId, "switch");
          scheduleIds.push(scheduleId);
        }

        const cases: Array<{
          test: Place | null;
          block: ReactiveBlock;
        }> = [];
        [...terminal.cases].reverse().forEach((case_, index) => {
          const test = case_.test;

          let consequent: ReactiveBlock;
          if (this.cx.isScheduled(case_.block)) {
            // cases which are empty or contain only a `break` may point to blocks
            // that are already scheduled. emit as follows:
            // - if the block is for another case branch, don't emit a break and fall-through
            // - else, emit an explicit break.
            const break_ = this.visitBreak(case_.block, null);
            if (
              index === 0 &&
              break_.terminal.implicit &&
              case_.block === terminal.fallthrough &&
              case_.test === null
            ) {
              // If the last case statement (first in reverse order) is a default that
              // jumps to the fallthrough, then we would emit a useless `default: {}`,
              // so instead skip this case.
              return;
            }
            const block = [];
            if (break_ !== null) {
              block.push(break_);
            }
            consequent = block;
          } else {
            consequent = this.traverseBlock(
              this.cx.ir.blocks.get(case_.block)!
            );
            const scheduleId = this.cx.schedule(case_.block, "case");
            scheduleIds.push(scheduleId);
          }
          cases.push({ test, block: consequent });
        });
        cases.reverse();

        this.cx.unscheduleAll(scheduleIds);
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "switch",
            test: terminal.test,
            cases,
            id: terminal.id,
          },
          label: fallthroughId,
        });
        if (fallthroughId !== null) {
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        }
        break;
      }
      case "do-while": {
        const fallthroughId = !this.cx.isScheduled(terminal.fallthrough)
          ? terminal.fallthrough
          : null;
        const loopId =
          !this.cx.isScheduled(terminal.loop) &&
          terminal.loop !== terminal.fallthrough
            ? terminal.loop
            : null;
        const scheduleId = this.cx.scheduleLoop(
          terminal.fallthrough,
          terminal.test,
          terminal.loop
        );
        scheduleIds.push(scheduleId);

        let loopBody: ReactiveBlock;
        if (loopId) {
          loopBody = this.traverseBlock(this.cx.ir.blocks.get(loopId)!);
        } else {
          const break_ = this.visitBreak(terminal.loop, null);
          invariant(
            break_ !== null,
            "If loop body is already scheduled it must be a break"
          );
          loopBody = [break_];
        }

        const testValue = this.visitValueBlock(
          terminal.test,
          terminal.loc
        ).value;

        this.cx.unscheduleAll(scheduleIds);
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "do-while",
            test: testValue,
            loop: loopBody,
            id: terminal.id,
          },
          label: fallthroughId,
        });
        if (fallthroughId !== null) {
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        }
        break;
      }
      case "while": {
        const fallthroughId =
          terminal.fallthrough !== null &&
          !this.cx.isScheduled(terminal.fallthrough)
            ? terminal.fallthrough
            : null;
        const loopId =
          !this.cx.isScheduled(terminal.loop) &&
          terminal.loop !== terminal.fallthrough
            ? terminal.loop
            : null;
        const scheduleId = this.cx.scheduleLoop(
          terminal.fallthrough,
          terminal.test,
          terminal.loop
        );
        scheduleIds.push(scheduleId);

        const testValue = this.visitValueBlock(
          terminal.test,
          terminal.loc
        ).value;

        let loopBody: ReactiveBlock;
        if (loopId) {
          loopBody = this.traverseBlock(this.cx.ir.blocks.get(loopId)!);
        } else {
          const break_ = this.visitBreak(terminal.loop, null);
          invariant(
            break_ !== null,
            "If loop body is already scheduled it must be a break"
          );
          loopBody = [break_];
        }

        this.cx.unscheduleAll(scheduleIds);
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "while",
            // loc: terminal.loc,
            test: testValue,
            loop: loopBody,
            id: terminal.id,
          },
          label: fallthroughId,
        });
        if (fallthroughId !== null) {
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        }
        break;
      }
      case "for": {
        const loopId =
          !this.cx.isScheduled(terminal.loop) &&
          terminal.loop !== terminal.fallthrough
            ? terminal.loop
            : null;

        const fallthroughId =
          terminal.fallthrough !== null &&
          !this.cx.isScheduled(terminal.fallthrough)
            ? terminal.fallthrough
            : null;

        const scheduleId = this.cx.scheduleLoop(
          terminal.fallthrough,
          terminal.update ?? terminal.test,
          terminal.loop
        );
        scheduleIds.push(scheduleId);

        const init = this.visitValueBlock(terminal.init, terminal.loc);
        const initBlock = this.cx.ir.blocks.get(init.block)!;
        let initValue = init.value;
        if (initValue.kind === "SequenceExpression") {
          const last = initBlock.instructions.at(-1)!;
          initValue.instructions.push(last);
          initValue.value = {
            kind: "Primitive",
            value: undefined,
            loc: terminal.loc,
          };
        } else {
          initValue = {
            kind: "SequenceExpression",
            instructions: [initBlock.instructions.at(-1)!],
            id: terminal.id,
            loc: terminal.loc,
            value: {
              kind: "Primitive",
              value: undefined,
              loc: terminal.loc,
            },
          };
        }

        const testValue = this.visitValueBlock(
          terminal.test,
          terminal.loc
        ).value;

        const updateValue =
          terminal.update !== null
            ? this.visitValueBlock(terminal.update, terminal.loc).value
            : null;

        let loopBody: ReactiveBlock;
        if (loopId) {
          loopBody = this.traverseBlock(this.cx.ir.blocks.get(loopId)!);
        } else {
          const break_ = this.visitBreak(terminal.loop, null);
          invariant(
            break_ !== null,
            "If loop body is already scheduled it must be a break"
          );
          loopBody = [break_];
        }

        this.cx.unscheduleAll(scheduleIds);
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "for",
            init: initValue,
            test: testValue,
            update: updateValue,
            loop: loopBody,
            id: terminal.id,
          },
          label: fallthroughId,
        });
        if (fallthroughId !== null) {
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        }
        break;
      }
      case "for-of": {
        const loopId =
          !this.cx.isScheduled(terminal.loop) &&
          terminal.loop !== terminal.fallthrough
            ? terminal.loop
            : null;

        const fallthroughId =
          terminal.fallthrough !== null &&
          !this.cx.isScheduled(terminal.fallthrough)
            ? terminal.fallthrough
            : null;

        const scheduleId = this.cx.scheduleLoop(
          terminal.fallthrough,
          terminal.init,
          terminal.loop
        );
        scheduleIds.push(scheduleId);

        const init = this.visitValueBlock(terminal.init, terminal.loc);
        const initBlock = this.cx.ir.blocks.get(init.block)!;
        let initValue = init.value;
        if (initValue.kind === "SequenceExpression") {
          const last = initBlock.instructions.at(-1)!;
          initValue.instructions.push(last);
          initValue.value = {
            kind: "Primitive",
            value: undefined,
            loc: terminal.loc,
          };
        } else {
          initValue = {
            kind: "SequenceExpression",
            instructions: [initBlock.instructions.at(-1)!],
            id: terminal.id,
            loc: terminal.loc,
            value: {
              kind: "Primitive",
              value: undefined,
              loc: terminal.loc,
            },
          };
        }

        let loopBody: ReactiveBlock;
        if (loopId) {
          loopBody = this.traverseBlock(this.cx.ir.blocks.get(loopId)!);
        } else {
          const break_ = this.visitBreak(terminal.loop, null);
          invariant(
            break_ !== null,
            "If loop body is already scheduled it must be a break"
          );
          loopBody = [break_];
        }

        this.cx.unscheduleAll(scheduleIds);
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "for-of",
            init: initValue,
            loop: loopBody,
            id: terminal.id,
          },
          label: fallthroughId,
        });
        if (fallthroughId !== null) {
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        }
        break;
      }
      case "branch": {
        let consequent: ReactiveBlock | null = null;
        if (this.cx.isScheduled(terminal.consequent)) {
          const break_ = this.visitBreak(terminal.consequent, null);
          if (break_ !== null) {
            consequent = [break_];
          }
        } else {
          consequent = this.traverseBlock(
            this.cx.ir.blocks.get(terminal.consequent)!
          );
        }

        let alternate: ReactiveBlock | null = null;
        if (this.cx.isScheduled(terminal.alternate)) {
          const break_ = this.visitBreak(terminal.alternate, null);
          if (break_ !== null) {
            alternate = [break_];
          }
        } else {
          alternate = this.traverseBlock(
            this.cx.ir.blocks.get(terminal.alternate)!
          );
        }

        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "if",
            test: terminal.test,
            consequent: consequent ?? this.emptyBlock(),
            alternate: alternate,
            id: terminal.id,
          },
          label: null,
        });

        break;
      }
      case "label": {
        const fallthroughId =
          terminal.fallthrough !== null &&
          !this.cx.isScheduled(terminal.fallthrough)
            ? terminal.fallthrough
            : null;
        if (fallthroughId !== null) {
          const scheduleId = this.cx.schedule(fallthroughId, "if");
          scheduleIds.push(scheduleId);
        }

        const block = this.traverseBlock(
          this.cx.ir.blocks.get(terminal.block)!
        );

        this.cx.unscheduleAll(scheduleIds);
        blockValue.push({
          kind: "terminal",
          terminal: {
            kind: "label",
            block,
            id: terminal.id,
          },
          label: fallthroughId,
        });
        if (fallthroughId !== null) {
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        }

        break;
      }
      case "optional-call":
      case "ternary":
      case "logical": {
        const fallthroughId = terminal.fallthrough;
        invariant(
          !this.cx.isScheduled(fallthroughId),
          "Logical terminal fallthrough cannot have been scheduled"
        );
        const scheduleId = this.cx.schedule(fallthroughId, "if");
        scheduleIds.push(scheduleId);

        const { place, value } = this.visitValueBlockTerminal(terminal);
        blockValue.push({
          kind: "instruction",
          instruction: {
            id: terminal.id,
            lvalue: place,
            value,
            loc: terminal.loc,
          },
        });

        this.cx.unschedule(scheduleId);
        this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        break;
      }
      case "goto": {
        switch (terminal.variant) {
          case GotoVariant.Break: {
            const break_ = this.visitBreak(terminal.block, terminal.id);
            if (break_ !== null) {
              blockValue.push(break_);
            }
            break;
          }
          case GotoVariant.Continue: {
            const continue_ = this.visitContinue(terminal.block, terminal.id);
            if (continue_ !== null) {
              blockValue.push(continue_);
            }
            break;
          }
          default: {
            assertExhaustive(
              terminal.variant,
              `Unexpected goto variant '${terminal.variant}'`
            );
          }
        }
        break;
      }
      case "unsupported": {
        invariant(false, "Unexpected unsupported terminal");
      }
      default: {
        assertExhaustive(terminal, "Unexpected terminal");
      }
    }
  }

  visitValueBlock(
    id: BlockId,
    loc: SourceLocation
  ): { block: BlockId; value: ReactiveValue; place: Place; id: InstructionId } {
    const defaultBlock = this.cx.ir.blocks.get(id)!;
    if (defaultBlock.terminal.kind === "branch") {
      const instructions = defaultBlock.instructions;
      if (instructions.length === 0) {
        return {
          block: defaultBlock.id,
          place: defaultBlock.terminal.test,
          value: {
            kind: "LoadLocal",
            place: defaultBlock.terminal.test,
            loc: defaultBlock.terminal.test.loc,
          },
          id: defaultBlock.terminal.id,
        };
      } else if (defaultBlock.instructions.length === 1) {
        const instr = defaultBlock.instructions[0]!;
        invariant(
          instr.lvalue.identifier.id ===
            defaultBlock.terminal.test.identifier.id,
          "Expected branch block to end in an instruction that sets the test value"
        );
        return {
          block: defaultBlock.id,
          place: instr.lvalue!,
          value: instr.value,
          id: instr.id,
        };
      } else {
        const instr = defaultBlock.instructions.at(-1)!;
        const sequence: ReactiveSequenceValue = {
          kind: "SequenceExpression",
          instructions: defaultBlock.instructions.slice(0, -1),
          id: instr.id,
          value: instr.value,
          loc: loc,
        };
        return {
          block: defaultBlock.id,
          place: defaultBlock.terminal.test,
          value: sequence,
          id: defaultBlock.terminal.id,
        };
      }
    } else if (defaultBlock.terminal.kind === "goto") {
      const instructions = defaultBlock.instructions;
      if (instructions.length === 0) {
        invariant(
          false,
          "Expected goto value block to have at least one instruction"
        );
      } else if (defaultBlock.instructions.length === 1) {
        const instr = defaultBlock.instructions[0]!;
        let place: Place = instr.lvalue!;
        let value: ReactiveValue = instr.value;
        if (instr.value.kind === "StoreLocal") {
          place = instr.value.lvalue.place;
          value = {
            kind: "LoadLocal",
            place: instr.value.value,
            loc: instr.value.value.loc,
          };
        }
        return {
          block: defaultBlock.id,
          place,
          value,
          id: instr.id,
        };
      } else {
        const instr = defaultBlock.instructions.at(-1)!;
        let place: Place = instr.lvalue!;
        let value: ReactiveValue = instr.value;
        if (instr.value.kind === "StoreLocal") {
          place = instr.value.lvalue.place;
          value = {
            kind: "LoadLocal",
            place: instr.value.value,
            loc: instr.value.value.loc,
          };
        }
        const sequence: ReactiveSequenceValue = {
          kind: "SequenceExpression",
          instructions: defaultBlock.instructions.slice(0, -1),
          id: instr.id,
          value,
          loc: loc,
        };
        return {
          block: defaultBlock.id,
          place,
          value: sequence,
          id: instr.id,
        };
      }
    } else {
      // The value block ended in a value terminal, recurse to get the value
      // of that terminal
      const init = this.visitValueBlockTerminal(defaultBlock.terminal);
      // Code following the logical terminal
      const final = this.visitValueBlock(init.fallthrough, loc);
      // Stitch the two together...
      const sequence: ReactiveSequenceValue = {
        kind: "SequenceExpression",
        instructions: [
          ...defaultBlock.instructions,
          {
            id: init.id,
            loc,
            lvalue: init.place,
            value: init.value,
          },
        ],
        id: final.id,
        value: final.value,
        loc,
      };
      return {
        block: init.fallthrough,
        value: sequence,
        place: final.place,
        id: final.id,
      };
    }
  }

  visitValueBlockTerminal(terminal: Terminal): {
    value: ReactiveValue;
    place: Place;
    fallthrough: BlockId;
    id: InstructionId;
  } {
    switch (terminal.kind) {
      case "optional-call": {
        const test = this.visitValueBlock(terminal.test, terminal.loc);
        const testBlock = this.cx.ir.blocks.get(test.block)!;
        invariant(
          testBlock.terminal.kind === "branch",
          "Unexpected terminal kind '%s' for optional call test block",
          testBlock.terminal.kind
        );
        const consequent = this.visitValueBlock(
          testBlock.terminal.consequent,
          terminal.loc
        );
        return {
          place: { ...consequent.place },
          value: {
            kind: "OptionalCall",
            optional: terminal.optional,
            call: consequent.value,
            id: terminal.id,
            loc: terminal.loc,
          },
          fallthrough: terminal.fallthrough,
          id: terminal.id,
        };
      }
      case "logical": {
        const test = this.visitValueBlock(terminal.test, terminal.loc);
        const testBlock = this.cx.ir.blocks.get(test.block)!;
        invariant(
          testBlock.terminal.kind === "branch",
          "Unexpected terminal kind '%s' for logical test block",
          testBlock.terminal.kind
        );

        const leftFinal = this.visitValueBlock(
          testBlock.terminal.consequent,
          terminal.loc
        );
        const left: ReactiveSequenceValue = {
          kind: "SequenceExpression",
          instructions: [
            {
              id: test.id,
              loc: terminal.loc,
              lvalue: test.place,
              value: test.value,
            },
          ],
          id: leftFinal.id,
          value: leftFinal.value,
          loc: terminal.loc,
        };
        const right = this.visitValueBlock(
          testBlock.terminal.alternate,
          terminal.loc
        );
        if (leftFinal.place.identifier !== right.place.identifier) {
          CompilerError.todo(
            "TODO: Support LogicalExpression whose value is unused",
            leftFinal.place.loc
          );
        }
        const value: ReactiveLogicalValue = {
          kind: "LogicalExpression",
          operator: terminal.operator,
          left: left,
          right: right.value,
          loc: terminal.loc,
        };
        return {
          place: { ...leftFinal.place },
          value,
          fallthrough: terminal.fallthrough,
          id: terminal.id,
        };
      }
      case "ternary": {
        const test = this.visitValueBlock(terminal.test, terminal.loc);
        const testBlock = this.cx.ir.blocks.get(test.block)!;
        invariant(
          testBlock.terminal.kind === "branch",
          "Unexpected terminal kind '%s' for ternary test block",
          testBlock.terminal.kind
        );
        const consequent = this.visitValueBlock(
          testBlock.terminal.consequent,
          terminal.loc
        );
        const alternate = this.visitValueBlock(
          testBlock.terminal.alternate,
          terminal.loc
        );
        const value: ReactiveTernaryValue = {
          kind: "ConditionalExpression",
          test: test.value,
          consequent: consequent.value,
          alternate: alternate.value,
          loc: terminal.loc,
        };
        if (consequent.place.identifier !== alternate.place.identifier) {
          CompilerError.todo(
            "TODO: Support ConditionalExpression whose value is unused",
            consequent.place.loc
          );
        }

        return {
          place: { ...consequent.place },
          value,
          fallthrough: terminal.fallthrough,
          id: terminal.id,
        };
      }
      default: {
        invariant(
          false,
          "Unexpected value block terminal kind '%s'",
          terminal.kind
        );
      }
    }
  }

  emptyBlock(): ReactiveBlock {
    return [];
  }

  visitBreak(
    block: BlockId,
    id: InstructionId | null
  ): ReactiveTerminalStatement<ReactiveBreakTerminal> {
    const target = this.cx.getBreakTarget(block);
    if (target === null) {
      invariant(false, "Expected a break target");
    }
    switch (target.type) {
      case "implicit": {
        return {
          kind: "terminal",
          terminal: { kind: "break", label: null, id, implicit: true },
          label: null,
        };
      }
      case "labeled": {
        return {
          kind: "terminal",
          terminal: { kind: "break", label: target.block, id, implicit: false },
          label: null,
        };
      }
      case "unlabeled": {
        return {
          kind: "terminal",
          terminal: { kind: "break", label: null, id, implicit: false },
          label: null,
        };
      }
      default: {
        assertExhaustive(
          target.type,
          `Unexpected break target kind '${(target as any).type}'`
        );
      }
    }
  }

  visitContinue(
    block: BlockId,
    id: InstructionId
  ): ReactiveTerminalStatement<ReactiveContinueTerminal> {
    const target = this.cx.getContinueTarget(block);
    invariant(
      target !== null,
      `Expected continue target to be scheduled for bb${block}`
    );
    switch (target.type) {
      case "implicit": {
        return {
          kind: "terminal",
          terminal: { kind: "continue", label: null, id, implicit: true },
          label: null,
        };
      }
      case "labeled": {
        return {
          kind: "terminal",
          terminal: {
            kind: "continue",
            label: target.block,
            id,
            implicit: false,
          },
          label: null,
        };
      }
      case "unlabeled": {
        return {
          kind: "terminal",
          terminal: { kind: "continue", label: null, id, implicit: false },
          label: null,
        };
      }
      default: {
        assertExhaustive(
          target.type,
          `Unexpected continue target kind '${(target as any).type}'`
        );
      }
    }
  }
}

class Context {
  ir: HIR;
  #nextScheduleId: number = 0;

  /**
   * Used to track which blocks *have been* generated already in order to
   * abort if a block is generated a second time. This is an error catching
   * mechanism for debugging purposes, and is not used by the codegen algorithm
   * to drive decisions about how to emit blocks.
   */
  emitted: Set<BlockId> = new Set();

  /**
   * A set of blocks that are already scheduled to be emitted by eg a parent.
   * This allows child nodes to avoid re-emitting the same block and emit eg
   * a break instead.
   */
  #scheduled: Set<BlockId> = new Set();

  /**
   * Represents which control flow operations are currently in scope, with the innermost
   * scope last. Roughly speaking, the last ControlFlowTarget on the stack indicates where
   * control will implicitly transfer, such that gotos to that block can be elided. Gotos
   * targeting items higher up the stack may need labeled break or continue; see
   * getBreakTarget() and getContinueTarget() for more details.
   */
  #controlFlowStack: Array<ControlFlowTarget> = [];

  constructor(ir: HIR) {
    this.ir = ir;
  }

  block(id: BlockId): BasicBlock {
    return this.ir.blocks.get(id)!;
  }

  /**
   * Record that the given block will be emitted (eg by the codegen of a parent node)
   * so that child nodes can avoid re-emitting it.
   */
  schedule(block: BlockId, type: "if" | "switch" | "case"): number {
    const id = this.#nextScheduleId++;
    invariant(
      !this.#scheduled.has(block),
      `Break block is already scheduled: bb${block}`
    );
    this.#scheduled.add(block);
    this.#controlFlowStack.push({ block, id, type });
    return id;
  }

  scheduleLoop(
    fallthroughBlock: BlockId,
    continueBlock: BlockId,
    loopBlock: BlockId | null
  ): number {
    const id = this.#nextScheduleId++;
    const ownsBlock = !this.#scheduled.has(fallthroughBlock);
    this.#scheduled.add(fallthroughBlock);
    invariant(
      !this.#scheduled.has(continueBlock),
      `Continue block is already scheduled: bb${continueBlock}`
    );
    this.#scheduled.add(continueBlock);
    let ownsLoop = false;
    if (loopBlock !== null) {
      ownsLoop = !this.#scheduled.has(loopBlock);
      this.#scheduled.add(loopBlock);
    }

    this.#controlFlowStack.push({
      block: fallthroughBlock,
      ownsBlock,
      id,
      type: "loop",
      continueBlock,
      loopBlock,
      ownsLoop,
    });
    return id;
  }

  /**
   * Removes a block that was scheduled; must be called after that block is emitted.
   */
  unschedule(scheduleId: number): void {
    const last = this.#controlFlowStack.pop();
    invariant(
      last !== undefined && last.id === scheduleId,
      "Can only unschedule the last target"
    );
    if (last.type !== "loop" || last.ownsBlock !== null) {
      this.#scheduled.delete(last.block);
    }
    if (last.type === "loop") {
      this.#scheduled.delete(last.continueBlock);
      if (last.ownsLoop && last.loopBlock !== null) {
        this.#scheduled.delete(last.loopBlock);
      }
    }
  }

  /**
   * Helper to unschedule multiple scheduled blocks. The ids should be in
   * the order in which they were scheduled, ie most recently scheduled last.
   */
  unscheduleAll(scheduleIds: Array<number>): void {
    for (let i = scheduleIds.length - 1; i >= 0; i--) {
      this.unschedule(scheduleIds[i]!);
    }
  }

  /**
   * Check if the given @param block is scheduled or not.
   */
  isScheduled(block: BlockId): boolean {
    return this.#scheduled.has(block);
  }

  /**
   * Given the current control flow stack, determines how a `break` to the given @param block
   * must be emitted. Returns as follows:
   * - 'implicit' if control would implicitly transfer to that block
   * - 'labeled' if a labeled break is required to transfer control to that block
   * - 'unlabeled' if an unlabeled break would transfer to that block
   * - null if there is no information for this block
   *
   * The returned 'block' value should be used as the label if necessary.
   */
  getBreakTarget(
    block: BlockId
  ): { block: BlockId; type: ControlFlowKind } | null {
    let hasPrecedingLoop = false;
    for (let i = this.#controlFlowStack.length - 1; i >= 0; i--) {
      const target = this.#controlFlowStack[i]!;
      if (target.block === block) {
        let type: ControlFlowKind;
        if (target.type === "loop") {
          // breaking out of a loop requires an explicit break,
          // but only requires a label if breaking past the innermost loop.
          type = hasPrecedingLoop ? "labeled" : "unlabeled";
        } else if (i === this.#controlFlowStack.length - 1) {
          // breaking to the last break point, which is where control will transfer
          // implicitly
          type = "implicit";
        } else {
          // breaking somewhere else requires an explicit break
          type = "labeled";
        }
        return {
          block: target.block,
          type,
        };
      }
      hasPrecedingLoop ||= target.type === "loop";
    }
    return null;
  }

  /**
   * Given the current control flow stack, determines how a `continue` to the given @param block
   * must be emitted. Returns as follows:
   * - 'implicit' if control would implicitly continue to that block
   * - 'labeled' if a labeled continue is required to continue to that block
   * - 'unlabeled' if an unlabeled continue would transfer to that block
   * - null if there is no information for this block
   *
   * The returned 'block' value should be used as the label if necessary.
   */
  getContinueTarget(
    block: BlockId
  ): { block: BlockId; type: ControlFlowKind } | null {
    let hasPrecedingLoop = false;
    for (let i = this.#controlFlowStack.length - 1; i >= 0; i--) {
      const target = this.#controlFlowStack[i]!;
      if (target.type == "loop" && target.continueBlock === block) {
        let type: ControlFlowKind;
        if (hasPrecedingLoop) {
          // continuing to a loop that is not the innermost loop always requires
          // a label
          type = "labeled";
        } else if (i === this.#controlFlowStack.length - 1) {
          // continuing to the last break point, which is where control will
          // transfer to naturally
          type = "implicit";
        } else {
          // the continue is inside some conditional logic, requires an explicit
          // continue
          type = "unlabeled";
        }
        return {
          block: target.block,
          type,
        };
      }
      hasPrecedingLoop ||= target.type === "loop";
    }
    return null;
  }

  debugBreakTargets(): Array<ControlFlowTarget> {
    return this.#controlFlowStack.map((target) => ({ ...target }));
  }
}

type ControlFlowKind = "implicit" | "labeled" | "unlabeled";

type ControlFlowTarget =
  | { type: "if"; block: BlockId; id: number }
  | { type: "switch"; block: BlockId; id: number }
  | { type: "case"; block: BlockId; id: number }
  | {
      type: "loop";
      block: BlockId;
      ownsBlock: boolean;
      continueBlock: BlockId;
      loopBlock: BlockId | null;
      ownsLoop: boolean;
      id: number;
    };
