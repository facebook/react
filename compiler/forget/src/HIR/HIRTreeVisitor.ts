/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import todo from "../Utils/todo";
import { assertExhaustive } from "../Utils/utils";
import {
  BasicBlock,
  BlockId,
  GotoVariant,
  HIR,
  HIRFunction,
  Instruction,
  InstructionId,
  InstructionValue,
  Place,
  SourceLocation,
} from "./HIR";

/**
 * Function to visit HIR as a tree of high-level constructs rather than as a sequence
 * of lower-level basic blocks. Intended for use in codegen and reactive scope
 * construction which need to see the original "shape" of the code.
 *
 * See the {@link Visitor} interface for more about implementing a visitor.
 */
export function visitTree<
  TBlockBuilder,
  TBlock,
  TInit,
  TValueBlock,
  TValue,
  TStatement,
  TCase
>(
  fn: HIRFunction,
  visitor: Visitor<
    TBlockBuilder,
    TBlock,
    TInit,
    TValueBlock,
    TValue,
    TStatement,
    TCase
  >
): TBlock {
  const cx = new Context(fn.body);
  const driver = new Driver(cx, visitor);
  return driver.traverseBlock(cx.block(fn.body.entry));
}

class Driver<
  TBlockBuilder,
  TBlock,
  TInit,
  TValueBlock,
  TValue,
  TStatement,
  TCase
> {
  cx: Context;
  visitor: Visitor<
    TBlockBuilder,
    TBlock,
    TInit,
    TValueBlock,
    TValue,
    TStatement,
    TCase
  >;

  constructor(
    cx: Context,
    visitor: Visitor<
      TBlockBuilder,
      TBlock,
      TInit,
      TValueBlock,
      TValue,
      TStatement,
      TCase
    >
  ) {
    this.cx = cx;
    this.visitor = visitor;
  }

  traverseBlock(block: BasicBlock): TBlock {
    const blockValue = this.visitor.enterBlock();
    this.visitBlock(block, blockValue);
    return this.visitor.leaveBlock(blockValue);
  }

  visitBlock(block: BasicBlock, blockValue: TBlockBuilder): void {
    invariant(
      !this.cx.emitted.has(block.id),
      `Cannot emit the same block twice: bb${block.id}`
    );
    this.cx.emitted.add(block.id);
    for (const instr of block.instructions) {
      this.visitInstr(instr, blockValue);
    }

    const terminal = block.terminal;
    const scheduleIds = [];
    switch (terminal.kind) {
      case "return": {
        const value =
          terminal.value != null
            ? this.visitPlace(terminal.value, terminal.id)
            : null;
        this.visitor.visitTerminalId(terminal.id);
        this.visitor.appendBlock(
          blockValue,
          this.visitor.visitTerminal({
            kind: "return",
            loc: terminal.loc,
            value,
            id: terminal.id,
          })
        );
        break;
      }
      case "throw": {
        const value = this.visitPlace(terminal.value, terminal.id);
        this.visitor.visitTerminalId(terminal.id);
        this.visitor.appendBlock(
          blockValue,
          this.visitor.visitTerminal({
            kind: "throw",
            value,
            id: terminal.id,
          })
        );
        break;
      }
      case "if": {
        const test = this.visitPlace(terminal.test, terminal.id);
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

        this.visitor.visitTerminalId(terminal.id);
        let consequent: TBlock | null = null;
        if (this.cx.isScheduled(terminal.consequent)) {
          const break_ = this.visitBreak(terminal.consequent, null);
          if (break_ !== null) {
            const builder = this.visitor.enterBlock();
            this.visitor.appendBlock(builder, break_);
            consequent = this.visitor.leaveBlock(builder);
          }
        } else {
          consequent = this.traverseBlock(
            this.cx.ir.blocks.get(terminal.consequent)!
          );
        }

        let alternate: TBlock | null = null;
        if (alternateId !== null) {
          if (this.cx.isScheduled(alternateId)) {
            const break_ = this.visitBreak(alternateId, null);
            if (break_ !== null) {
              const builder = this.visitor.enterBlock();
              this.visitor.appendBlock(builder, break_);
              alternate = this.visitor.leaveBlock(builder);
            }
          } else {
            alternate = this.traverseBlock(this.cx.ir.blocks.get(alternateId)!);
          }
        }

        this.cx.unscheduleAll(scheduleIds);
        if (fallthroughId !== null) {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "if",
              test,
              consequent: consequent ?? this.emptyBlock(),
              alternate: alternate,
              id: terminal.id,
            }),
            fallthroughId
          );
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        } else {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "if",
              test,
              consequent: consequent ?? this.emptyBlock(),
              alternate: alternate,
              id: terminal.id,
            })
          );
        }
        break;
      }
      case "switch": {
        const test = this.visitPlace(terminal.test, terminal.id);
        const fallthroughId =
          terminal.fallthrough !== null &&
          !this.cx.isScheduled(terminal.fallthrough)
            ? terminal.fallthrough
            : null;
        if (fallthroughId !== null) {
          const scheduleId = this.cx.schedule(fallthroughId, "switch");
          scheduleIds.push(scheduleId);
        }

        this.visitor.visitTerminalId(terminal.id);
        const cases: Array<TCase> = [];
        [...terminal.cases].reverse().forEach((case_, index) => {
          const test =
            case_.test !== null
              ? this.visitPlace(case_.test, terminal.id)
              : null;

          let consequent;
          if (this.cx.isScheduled(case_.block)) {
            // cases which are empty or contain only a `break` may point to blocks
            // that are already scheduled. emit as follows:
            // - if the block is for another case branch, don't emit a break and fall-through
            // - else, emit an explicit break.
            const break_ = this.visitBreak(case_.block, null);
            if (
              index === 0 &&
              break_ === null &&
              case_.block === terminal.fallthrough &&
              case_.test === null
            ) {
              // If the last case statement (first in reverse order) is a default that
              // jumps to the fallthrough, then we would emit a useless `default: {}`,
              // so instead skip this case.
              return;
            }
            const block = this.visitor.enterBlock();
            if (break_ !== null) {
              this.visitor.appendBlock(block, break_);
            }
            consequent = this.visitor.leaveBlock(block);
          } else {
            consequent = this.traverseBlock(
              this.cx.ir.blocks.get(case_.block)!
            );
            const scheduleId = this.cx.schedule(case_.block, "case");
            scheduleIds.push(scheduleId);
          }
          cases.push(this.visitor.visitCase(test, consequent));
        });
        cases.reverse();

        this.cx.unscheduleAll(scheduleIds);
        if (fallthroughId !== null) {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "switch",
              test,
              cases,
              id: terminal.id,
            }),
            fallthroughId
          );
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        } else {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "switch",
              test,
              cases,
              id: terminal.id,
            })
          );
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

        this.visitor.visitTerminalId(terminal.id);
        const testBlock = this.cx.ir.blocks.get(terminal.test)!;
        const testTerminal = testBlock.terminal;
        invariant(
          testTerminal.kind === "if",
          "Expected while loop test block to end in an if"
        );
        const testValue = this.visitValueBlock(blockValue, testBlock, {
          value: testTerminal.test,
          id: testTerminal.id,
        });
        let loopBody: TBlock;
        if (loopId) {
          loopBody = this.traverseBlock(this.cx.ir.blocks.get(loopId)!);
        } else {
          const break_ = this.visitBreak(terminal.loop, null);
          invariant(
            break_ !== null,
            "If loop body is already scheduled it must be a break"
          );
          const body = this.visitor.enterBlock();
          this.visitor.appendBlock(body, break_);
          loopBody = this.visitor.leaveBlock(body);
        }

        this.cx.unscheduleAll(scheduleIds);
        if (fallthroughId !== null) {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "while",
              loc: terminal.loc,
              test: testValue,
              loop: loopBody,
              id: terminal.id,
            }),
            fallthroughId
          );
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        } else {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "while",
              loc: terminal.loc,
              test: testValue,
              loop: loopBody,
              id: terminal.id,
            })
          );
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
          terminal.update,
          terminal.loop
        );
        scheduleIds.push(scheduleId);

        this.visitor.visitTerminalId(terminal.id);

        const initBlock = this.cx.ir.blocks.get(terminal.init)!;
        const initTerminal = initBlock.terminal;
        invariant(
          initTerminal.kind === "goto",
          "Expected for loop init block to end in a goto"
        );
        const initValue = this.visitInitBlock(blockValue, initBlock);

        const testBlock = this.cx.ir.blocks.get(terminal.test)!;
        const testTerminal = testBlock.terminal;
        invariant(
          testTerminal.kind === "if",
          "Expected for loop test block to end in an if"
        );
        const testValue = this.visitValueBlock(blockValue, testBlock, {
          value: testTerminal.test,
          id: testTerminal.id,
        });

        const updateBlock = this.cx.ir.blocks.get(terminal.update)!;
        const updateTerminal = updateBlock.terminal;
        invariant(
          updateTerminal.kind === "goto",
          "Expected for loop update block to end in a goto"
        );
        const updateValue = this.visitValueBlock(blockValue, updateBlock);

        let loopBody: TBlock;
        if (loopId) {
          loopBody = this.traverseBlock(this.cx.ir.blocks.get(loopId)!);
        } else {
          const break_ = this.visitBreak(terminal.loop, null);
          invariant(
            break_ !== null,
            "If loop body is already scheduled it must be a break"
          );
          const body = this.visitor.enterBlock();
          this.visitor.appendBlock(body, break_);
          loopBody = this.visitor.leaveBlock(body);
        }

        this.cx.unscheduleAll(scheduleIds);
        if (fallthroughId !== null) {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "for",
              init: initValue,
              test: testValue,
              update: updateValue,
              loop: loopBody,
              id: terminal.id,
            }),
            fallthroughId
          );
          this.visitBlock(this.cx.ir.blocks.get(fallthroughId)!, blockValue);
        } else {
          this.visitor.appendBlock(
            blockValue,
            this.visitor.visitTerminal({
              kind: "for",
              init: initValue,
              test: testValue,
              update: updateValue,
              loop: loopBody,
              id: terminal.id,
            })
          );
        }
        break;
      }
      case "logical": {
        todo("Implement tree visitor for logical terminal");
      }
      case "goto": {
        this.visitor.visitTerminalId(terminal.id);
        switch (terminal.variant) {
          case GotoVariant.Break: {
            const break_ = this.visitBreak(terminal.block, terminal.id);
            if (break_ !== null) {
              this.visitor.appendBlock(blockValue, break_);
            }
            break;
          }
          case GotoVariant.Continue: {
            const continue_ = this.visitContinue(terminal.block, terminal.id);
            if (continue_ !== null) {
              this.visitor.appendBlock(blockValue, continue_);
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
      case "error":
        break;
      default: {
        assertExhaustive(terminal, "Unexpected terminal");
      }
    }
  }

  visitInitBlock(parent: TBlockBuilder, block: BasicBlock): TInit {
    const initBlock = this.visitor.enterInitBlock(parent);
    for (const instr of block.instructions) {
      const value = this.visitor.visitValue(instr.value, instr.id);
      const item = this.visitor.visitInstruction(instr, value);
      this.visitor.appendInitBlock(initBlock, item);
    }
    return this.visitor.leaveInitBlock(initBlock);
  }

  visitValueBlock(
    parent: TBlockBuilder,
    block: BasicBlock,
    terminalValue?: { value: InstructionValue; id: InstructionId }
  ): TValue {
    const valueBlock = this.visitor.enterValueBlock(parent);
    const instructions = [...block.instructions];
    let lastValue: { value: InstructionValue; id: InstructionId } | null = null;
    if (terminalValue != null) {
      lastValue = terminalValue;
    }
    for (const instr of instructions) {
      const value = this.visitor.visitValue(instr.value, instr.id);
      const item = this.visitor.visitInstruction(instr, value);
      this.visitor.appendValueBlock(valueBlock, item);
    }
    const value =
      lastValue !== null
        ? {
            value: this.visitor.visitValue(lastValue.value, lastValue.id),
            id: lastValue.id,
          }
        : null;
    return this.visitor.leaveValueBlock(valueBlock, value);
  }

  emptyBlock(): TBlock {
    const block = this.visitor.enterBlock();
    return this.visitor.leaveBlock(block);
  }

  visitBreak(block: BlockId, id: InstructionId | null): TStatement | null {
    const target = this.cx.getBreakTarget(block);
    if (target === null) {
      // TODO: we should always have a target
      return null;
    }
    switch (target.type) {
      case "implicit": {
        return this.visitor.visitImplicitTerminal();
      }
      case "unlabeled": {
        return this.visitor.visitTerminal({ kind: "break", label: null, id });
      }
      case "labeled": {
        return this.visitor.visitTerminal({
          kind: "break",
          label: target.block,
          id,
        });
      }
    }
  }

  visitContinue(block: BlockId, id: InstructionId): TStatement | null {
    const target = this.cx.getContinueTarget(block);
    invariant(
      target !== null,
      `Expected continue target to be scheduled for bb${block}`
    );
    switch (target.type) {
      case "labeled": {
        return this.visitor.visitTerminal({
          kind: "continue",
          label: target.block,
          id,
        });
      }
      case "unlabeled": {
        return this.visitor.visitTerminal({
          kind: "continue",
          label: null,
          id,
        });
      }
      case "implicit": {
        return this.visitor.visitImplicitTerminal();
      }
      default: {
        assertExhaustive(
          target.type,
          `Unexpected continue target kind '${(target as any).type}'`
        );
      }
    }
  }

  visitInstr(instr: Instruction, blockValue: TBlockBuilder): void {
    const value = this.visitor.visitValue(instr.value, instr.id);
    const item = this.visitor.visitInstruction(instr, value);
    this.visitor.appendBlock(blockValue, item);
  }

  visitPlace(place: Place, id: InstructionId): TValue {
    return this.visitor.visitValue(place, id);
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

/**
 * An object that can receive structured callbacks to visit HIR as a tree,
 * and convert it to an alternate format.
 *
 * TBlock = representation of a list of statements
 * TValue = represenation of an InstructionValue
 * TStatement = representation of an Instruction
 * TCase = representation of a switch case
 */
export interface Visitor<
  TBlockBuilder,
  TBlock,
  TInit,
  TValueBlock,
  TValue,
  TStatement,
  TCase
> {
  /**
   * Must create an "empty" instance of the visitor's represenation for
   * the contents of a block.
   */
  enterBlock(): TBlockBuilder;

  /**
   * Appends an item onto the given block, with an optional label. The label
   * indicates that a break/continue will proceed to code *after* the given item.
   */
  appendBlock(block: TBlockBuilder, item: TStatement, label?: BlockId): void;

  /**
   * Converts the visitor's block representation into the representation of a
   * block item, simultaneously "closing" the given block. The block will no
   * longer be modified by the visitor driver.
   */
  leaveBlock(block: TBlockBuilder): TBlock;

  /**
   * Must create an "empty" instance of the visitor's representation for a value
   * block, which can generally contain only expressions but not statements. The
   * currently active parent block is passed as an argument.
   *
   * The exception is the for initializer, which may contain declarations but not
   * other statement types.
   */
  enterValueBlock(block: TBlockBuilder): TValueBlock;

  /**
   * Appends an item onto the given value block.
   */
  appendValueBlock(block: TValueBlock, item: TStatement): void;

  /**
   * Converts the visitor's value block (and final value) to the visitor's
   * value representation.
   */
  leaveValueBlock(
    block: TValueBlock,
    value: { value: TValue; id: InstructionId } | null
  ): TValue;

  enterInitBlock(block: TBlockBuilder): TValueBlock;

  appendInitBlock(block: TValueBlock, item: TStatement): void;

  leaveInitBlock(block: TValueBlock): TInit;

  /**
   * Convert an InstructionValue into the visitor's own representation
   * of a value.
   */
  visitValue(value: InstructionValue, id: InstructionId): TValue;

  /**
   * Convert an Instruction into the visitor's own representation of
   * a block item.
   */
  visitInstruction(instruction: Instruction, value: TValue): TStatement;

  /**
   * Called when a terminal is reached, before processing any of its
   * possible branches.
   */
  visitTerminalId(id: InstructionId): void;

  /**
   * Converts a break/continue that is implicit — that does not strictly
   * have to be emitted — to the visitor's representation. The visitor
   * can choose to return null if this does not need to be represented.
   */
  visitImplicitTerminal(): TStatement | null;

  /**
   * Converts a terminal into the visitor's own representation of a block
   * item. Note that the terminal differs from HIR Terminals, because
   * values and block ids will have already been converted into the visitor's
   * own representations.
   */
  visitTerminal(
    terminal: BlockTerminal<TInit, TValue, TBlock, TCase>
  ): TStatement;

  /**
   * Visits a switch case statement, which is collected into a switch terminal
   * variant.
   */
  visitCase(test: TValue | null, block: TBlock): TCase;
}

export type BlockTerminal<TInit, TValue, TBlock, TCase> =
  | {
      kind: "return";
      loc: SourceLocation;
      value: TValue | null;
      id: InstructionId;
    }
  | { kind: "throw"; value: TValue; id: InstructionId }
  | {
      kind: "if";
      test: TValue;
      consequent: TBlock;
      alternate: TBlock | null;
      id: InstructionId;
    }
  | { kind: "switch"; test: TValue; cases: Array<TCase>; id: InstructionId }
  | {
      kind: "while";
      loc: SourceLocation;
      test: TValue;
      loop: TBlock;
      id: InstructionId;
    }
  | {
      kind: "for";
      init: TInit;
      test: TValue;
      update: TValue;
      loop: TBlock;
      id: InstructionId;
    }
  | { kind: "break"; label: BlockId | null; id: InstructionId | null }
  | { kind: "continue"; label: BlockId | null; id: InstructionId };
