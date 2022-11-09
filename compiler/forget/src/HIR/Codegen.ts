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
   * A stack of blocks that are in scope, used to decide whether/how to emit
   * break and continue statements. All blocks in the stack must also be
   * in 'scheduled'.
   */
  #breakTargets: Array<BreakTarget> = [];

  constructor(ir: HIR) {
    this.ir = ir;
  }

  /**
   * Record that the given block will be emitted (eg by the codegen of a parent node)
   * so that child nodes can avoid re-emitting it.
   */
  schedule(block: BlockId, type: "if" | "switch" | "case"): number {
    const id = this.#nextScheduleId++;
    invariant(!this.#scheduled.has(block), "Block is already scheduled");
    this.#scheduled.add(block);
    this.#breakTargets.push({ block, id, type });
    return id;
  }

  /**
   * Removes a block that was scheduled; must be called after that block is emitted.
   */
  unschedule(scheduleId: number): void {
    const last = this.#breakTargets.pop();
    invariant(
      last !== undefined && last.id === scheduleId,
      "Can only unschedule the last target"
    );
    this.#scheduled.delete(last.block);
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
   * Lookup the break target for the given @param block. This will return non-null
   * if and only if isScheduled() returns true for the given @param block. Returns
   * the break target and whether this is the most recent target (which can be used
   * to elide unnecessary break statemetns).
   */
  getBreakTarget(
    block: BlockId
  ): { target: BreakTarget; last: boolean } | null {
    for (let i = this.#breakTargets.length - 1; i >= 0; i--) {
      const target = this.#breakTargets[i]!;
      if (target.block === block) {
        return {
          target,
          last: i === this.#breakTargets.length - 1,
        };
      }
    }
    return null;
  }
}

type BreakTarget = {
  block: BlockId;
  id: number;
  type: "if" | "switch" | "case";
};

function codegenBlock(cx: Context, block: BasicBlock): t.BlockStatement {
  invariant(
    !cx.emitted.has(block.id),
    `Cannot emit the same block twice: bb${block.id}`
  );
  cx.emitted.add(block.id);
  const body: Array<t.Statement> = [];
  writeBlock(cx, block, body);
  return t.blockStatement(body);
}

function writeBlock(cx: Context, block: BasicBlock, body: Array<t.Statement>) {
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
          invariant(
            cx.isScheduled(terminal.block),
            "Expected continue target to be scheduled"
          );
          body.push(t.continueStatement(t.identifier(`bb${terminal.block}`)));
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
  cx.unscheduleAll(scheduleIds);
}

function codegenBreak(cx: Context, block: BlockId): t.Statement | null {
  const breakTarget = cx.getBreakTarget(block);
  if (breakTarget === null) {
    // TODO: we should always have a target
    return null;
  }
  const { target, last } = breakTarget;
  if (target.type === "case") {
    // This break is transitioning to the next case statement. JS doesn't allow
    // labeling cases, the only option is to emit a plain break.
    return null;
  } else if (last) {
    // This break is to the most recent break target. Control flow will naturally
    // transition to this target, so a break is not required.
    return null;
  } else {
    // We're trying to break somewhere else, emit a label
    return t.breakStatement(t.identifier(`bb${block}`));
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
