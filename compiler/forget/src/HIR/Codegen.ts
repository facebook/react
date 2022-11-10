/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import {
  BasicBlock,
  BlockId,
  GotoVariant,
  HIR,
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  InstructionKind,
  LValue,
  Place,
} from "./HIR";
import { todoInvariant } from "./todo";

/**
 * Converts HIR into Babel nodes, which can then be printed into source text.
 * Note that converting source to HIR and back is not guaranteed to produce
 * identicl source text: instead, it is guaranteed to produce semantically
 * equivalent JavaScript. Where possible the original shape of the source
 * code is preserved. Notably, temporary variables are only introduced
 * where strictly necessary such that in general the only variable declarations
 * that appear in the output are those that appeared in the input.
 *
 * However, it is expected that minor changes may occur, such as splitting
 * multiple variable declarations into one, converting `else` branches
 * into fallthrough branches, etc.
 *
 * Also, the *semantics* of variable resolution are preserved, but the exact
 * original block structure is *not* guaranteed to be preserved. As such,
 * variable names in the output may have a suffix attached to distinguish them.
 * It is expected that the output will be passed through a minifier which can
 * rename variables to reduce code size. In theory minification could be
 * performed as an HIR optimization pass, that is left todo for the time being.
 */
export default function codegen(fn: HIRFunction): t.Function {
  const entry = fn.body.blocks.get(fn.body.entry)!;
  const cx = new Context(fn.body);
  const body = codegenBlock(cx, entry);
  const params = fn.params.map((param) => convertIdentifier(param.identifier));
  return t.functionDeclaration(
    fn.id !== null ? convertIdentifier(fn.id) : null,
    params,
    body,
    fn.generator,
    fn.async
  );
}

class Context {
  ir: HIR;
  temp: Map<IdentifierId, t.Expression> = new Map();
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

function codegenBlock(cx: Context, block: BasicBlock): t.BlockStatement {
  const body: Array<t.Statement> = [];
  writeBlock(cx, block, body);
  return t.blockStatement(body);
}

function writeBlock(cx: Context, block: BasicBlock, body: Array<t.Statement>) {
  invariant(
    !cx.emitted.has(block.id),
    `Cannot emit the same block twice: bb${block.id}`
  );
  cx.emitted.add(block.id);
  for (const instr of block.instructions) {
    writeInstr(cx, instr, body);
  }
  const terminal = block.terminal;
  const scheduleIds = [];
  switch (terminal.kind) {
    case "return": {
      const value =
        terminal.value != null ? codegenPlace(cx, terminal.value) : null;
      body.push(t.returnStatement(value));
      break;
    }
    case "throw": {
      const value = codegenPlace(cx, terminal.value);
      body.push(t.throwStatement(value));
      break;
    }
    case "if": {
      const test = codegenPlace(cx, terminal.test);
      const fallthroughId =
        terminal.fallthrough !== null && !cx.isScheduled(terminal.fallthrough)
          ? terminal.fallthrough
          : null;
      const alternateId =
        terminal.alternate !== terminal.fallthrough ? terminal.alternate : null;

      if (fallthroughId !== null) {
        const scheduleId = cx.schedule(fallthroughId, "if");
        scheduleIds.push(scheduleId);
      }

      let consequent: t.Statement | null = null;
      if (cx.isScheduled(terminal.consequent)) {
        consequent = codegenBreak(cx, terminal.consequent);
      } else {
        consequent = codegenBlock(cx, cx.ir.blocks.get(terminal.consequent)!);
      }

      let alternate: t.Statement | null = null;
      if (alternateId !== null) {
        if (cx.isScheduled(alternateId)) {
          alternate = codegenBreak(cx, alternateId);
        } else {
          alternate = codegenBlock(cx, cx.ir.blocks.get(alternateId)!);
        }
      }

      cx.unscheduleAll(scheduleIds);
      if (fallthroughId !== null) {
        if (consequent === null && alternate === null) {
          body.push(t.expressionStatement(test));
        } else {
          body.push(
            t.labeledStatement(
              t.identifier(`bb${fallthroughId}`),
              t.ifStatement(test, consequent ?? t.blockStatement([]), alternate)
            )
          );
        }
        writeBlock(cx, cx.ir.blocks.get(fallthroughId)!, body);
      } else {
        if (consequent === null && alternate === null) {
          body.push(t.expressionStatement(test));
        } else {
          body.push(
            t.ifStatement(test, consequent ?? t.blockStatement([]), alternate)
          );
        }
      }
      break;
    }
    case "switch": {
      const test = codegenPlace(cx, terminal.test);
      const fallthroughId =
        terminal.fallthrough !== null && !cx.isScheduled(terminal.fallthrough)
          ? terminal.fallthrough
          : null;
      if (fallthroughId !== null) {
        const scheduleId = cx.schedule(fallthroughId, "switch");
        scheduleIds.push(scheduleId);
      }

      const cases: Array<t.SwitchCase> = [];
      [...terminal.cases].reverse().forEach((case_, index) => {
        const test = case_.test !== null ? codegenPlace(cx, case_.test) : null;

        let consequent;
        if (cx.isScheduled(case_.block)) {
          // cases which are empty or contain only a `break` may point to blocks
          // that are already scheduled. emit as follows:
          // - if the block is for another case branch, don't emit a break and fall-through
          // - else, emit an explicit break.
          const break_ = codegenBreak(cx, case_.block);
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
          const block = [];
          if (break_ !== null) {
            block.push(break_);
          }
          consequent = t.blockStatement(block);
        } else {
          consequent = codegenBlock(cx, cx.ir.blocks.get(case_.block)!);
          const scheduleId = cx.schedule(case_.block, "case");
          scheduleIds.push(scheduleId);
        }
        cases.push(t.switchCase(test, [consequent]));
      });
      cases.reverse();

      cx.unscheduleAll(scheduleIds);
      if (fallthroughId !== null) {
        body.push(
          t.labeledStatement(
            t.identifier(`bb${fallthroughId}`),
            t.switchStatement(test, cases)
          )
        );
        writeBlock(cx, cx.ir.blocks.get(fallthroughId)!, body);
      } else {
        body.push(t.switchStatement(test, cases));
      }
      break;
    }
    case "while": {
      const testBlock = cx.ir.blocks.get(terminal.test)!;
      const testTerminal = testBlock.terminal;
      invariant(
        testTerminal.kind === "if",
        "Expected while loop test block to end in an if"
      );
      const bodyLength = body.length;
      for (const instr of testBlock.instructions) {
        writeInstr(cx, instr, body);
      }
      invariant(
        body.length === bodyLength,
        "Expected test to produce only temporaries"
      );
      const testValue =
        cx.temp.get(testTerminal.test.identifier.id) ??
        codegenPlace(cx, testTerminal.test);
      invariant(
        testValue != null,
        "Expected test to produce a temporary value"
      );

      const fallthroughId =
        terminal.fallthrough !== null && !cx.isScheduled(terminal.fallthrough)
          ? terminal.fallthrough
          : null;
      const loopId =
        !cx.isScheduled(terminal.loop) && terminal.loop !== terminal.fallthrough
          ? terminal.loop
          : null;
      const scheduleId = cx.scheduleLoop(
        terminal.fallthrough,
        terminal.test,
        terminal.loop
      );
      scheduleIds.push(scheduleId);

      let loopBody: t.Statement;
      if (loopId) {
        loopBody = codegenBlock(cx, cx.ir.blocks.get(loopId)!);
      } else {
        const break_ = codegenBreak(cx, terminal.loop);
        invariant(
          break_ !== null,
          "If loop body is already scheduled it must be a break"
        );
        loopBody = t.blockStatement([break_]);
      }

      cx.unscheduleAll(scheduleIds);
      if (fallthroughId !== null) {
        body.push(
          t.labeledStatement(
            t.identifier(`bb${fallthroughId}`),
            t.whileStatement(testValue, loopBody)
          )
        );
        writeBlock(cx, cx.ir.blocks.get(fallthroughId)!, body);
      } else {
        body.push(t.whileStatement(testValue, loopBody));
      }
      break;
    }
    case "goto": {
      switch (terminal.variant) {
        case GotoVariant.Break: {
          const break_ = codegenBreak(cx, terminal.block);
          if (break_ !== null) {
            body.push(break_);
          }
          break;
        }
        case GotoVariant.Continue: {
          const continue_ = codegenContinue(cx, terminal.block);
          if (continue_ !== null) {
            body.push(continue_);
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
    default: {
      assertExhaustive(terminal, "Unexpected terminal");
    }
  }
}

function codegenBreak(cx: Context, block: BlockId): t.Statement | null {
  const target = cx.getBreakTarget(block);
  if (target === null) {
    // TODO: we should always have a target
    return null;
  }
  switch (target.type) {
    case "implicit": {
      return null;
    }
    case "unlabeled": {
      return t.breakStatement();
    }
    case "labeled": {
      return t.breakStatement(t.identifier(`bb${target.block}`));
    }
  }
}

function codegenContinue(cx: Context, block: BlockId): t.Statement | null {
  const target = cx.getContinueTarget(block);
  invariant(
    target !== null,
    `Expected continue target to be scheduled for bb${block}`
  );
  switch (target.type) {
    case "labeled": {
      return t.continueStatement(t.identifier(`bb${target.block}`));
    }
    case "unlabeled": {
      return t.continueStatement();
    }
    case "implicit": {
      return null;
    }
    default: {
      assertExhaustive(
        target.type,
        `Unexpected continue target kind '${(target as any).type}'`
      );
    }
  }
}

function writeInstr(cx: Context, instr: Instruction, body: Array<t.Statement>) {
  let value: t.Expression;
  const instrValue = instr.value;
  switch (instrValue.kind) {
    case "ArrayExpression": {
      const elements = instrValue.elements.map((element) =>
        codegenPlace(cx, element)
      );
      value = t.arrayExpression(elements);
      break;
    }
    case "BinaryExpression": {
      const left = codegenPlace(cx, instrValue.left);
      const right = codegenPlace(cx, instrValue.right);
      value = t.binaryExpression(instrValue.operator, left, right);
      break;
    }
    case "UnaryExpression": {
      value = t.unaryExpression(
        instrValue.operator as "throw", // todo
        codegenPlace(cx, instrValue.value)
      );
      break;
    }
    case "Primitive": {
      value = codegenValue(cx, instrValue.value);
      break;
    }
    case "CallExpression": {
      const callee = codegenPlace(cx, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenPlace(cx, arg));
      value = t.callExpression(callee, args);
      break;
    }
    case "NewExpression": {
      const callee = codegenPlace(cx, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenPlace(cx, arg));
      value = t.newExpression(callee, args);
      break;
    }
    case "ObjectExpression": {
      const properties = [];
      if (instrValue.properties !== null) {
        for (const [property, value] of instrValue.properties) {
          properties.push(
            t.objectProperty(t.stringLiteral(property), codegenPlace(cx, value))
          );
        }
      }
      value = t.objectExpression(properties);
      break;
    }
    case "JSXText": {
      value = t.stringLiteral(instrValue.value);
      break;
    }
    case "JsxExpression": {
      const attributes: Array<t.JSXAttribute> = [];
      for (const [prop, value] of instrValue.props) {
        attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier(prop),
            t.jsxExpressionContainer(codegenPlace(cx, value))
          )
        );
      }
      let tagValue = codegenPlace(cx, instrValue.tag);
      let tag: string;
      if (tagValue.type === "Identifier") {
        tag = tagValue.name;
      } else {
        invariant(
          tagValue.type === "StringLiteral",
          "Expected JSX tag to be an identifier or string"
        );
        tag = tagValue.value;
      }
      const children =
        instrValue.children !== null
          ? instrValue.children.map((child) => codegenJsxElement(cx, child))
          : [];
      value = t.jsxElement(
        t.jsxOpeningElement(
          t.jsxIdentifier(tag),
          attributes,
          instrValue.children === null
        ),
        instrValue.children !== null
          ? t.jsxClosingElement(t.jsxIdentifier(tag))
          : null,
        children,
        instrValue.children === null
      );
      break;
    }
    case "JsxFragment": {
      value = t.jsxFragment(
        t.jsxOpeningFragment(),
        t.jsxClosingFragment(),
        instrValue.children.map((child) => codegenJsxElement(cx, child))
      );
      break;
    }
    case "OtherStatement": {
      const node = instrValue.node;
      if (t.isStatement(node)) {
        body.push(node);
        return;
      }
      value = node as any; // TODO(josephsavona) complete handling of JSX fragment/spreadchild elements
      break;
    }
    case "Identifier": {
      value = codegenPlace(cx, instrValue);
      break;
    }
    default: {
      assertExhaustive(instrValue, "Unexpected instruction kind");
    }
  }
  if (instr.lvalue !== null) {
    if (
      instr.lvalue.place.identifier.name === null &&
      instr.lvalue.place.memberPath === null
    ) {
      // Temporary value: don't immediately emit, instead save the value to refer to later
      cx.temp.set(instr.lvalue.place.identifier.id, value);
    } else {
      switch (instr.lvalue.kind) {
        case InstructionKind.Const: {
          body.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(codegenLVal(instr.lvalue), value),
            ])
          );
          break;
        }
        case InstructionKind.Let: {
          body.push(
            t.variableDeclaration("let", [
              t.variableDeclarator(codegenLVal(instr.lvalue), value),
            ])
          );
          break;
        }
        case InstructionKind.Reassign: {
          body.push(
            t.expressionStatement(
              t.assignmentExpression("=", codegenLVal(instr.lvalue), value)
            )
          );
          break;
        }
        default: {
          assertExhaustive(
            instr.lvalue.kind,
            `Unexpected instruction kind '${instr.lvalue.kind}'`
          );
        }
      }
    }
  } else {
    body.push(t.expressionStatement(value));
  }
}

function codegenJsxElement(
  cx: Context,
  place: Place
):
  | t.JSXText
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXElement
  | t.JSXFragment {
  const value = codegenPlace(cx, place);
  switch (value.type) {
    case "StringLiteral": {
      return t.jsxText(value.value);
    }
    default: {
      return t.jsxExpressionContainer(value);
    }
  }
}

function codegenLVal(lval: LValue): t.LVal {
  return convertIdentifier(lval.place.identifier);
}

function codegenValue(
  cx: Context,
  value: boolean | number | string | null | undefined
): t.Expression {
  if (typeof value === "number") {
    return t.numericLiteral(value);
  } else if (typeof value === "boolean") {
    return t.booleanLiteral(value);
  } else if (typeof value === "string") {
    return t.stringLiteral(value);
  } else if (value === null) {
    return t.nullLiteral();
  } else if (value === undefined) {
    return t.identifier("undefined");
  } else {
    assertExhaustive(value, "Unexpected primitive value kind");
  }
}

function codegenPlace(cx: Context, place: Place): t.Expression {
  todoInvariant(place.kind === "Identifier", "support scope values");
  if (place.memberPath === null) {
    let tmp = cx.temp.get(place.identifier.id);
    if (tmp != null) {
      return tmp;
    }
    return convertIdentifier(place.identifier);
  } else {
    let object: t.Expression = convertIdentifier(place.identifier);
    for (const path of place.memberPath) {
      object = t.memberExpression(object, t.identifier(path));
    }
    return object;
  }
}

function convertIdentifier(identifier: Identifier): t.Identifier {
  if (identifier.name !== null) {
    return t.identifier(`${identifier.name}$${identifier.id}`);
  }
  return t.identifier(`t${identifier.id}`);
}
