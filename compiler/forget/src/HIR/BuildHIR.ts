/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath, Scope } from "@babel/traverse";
import * as t from "@babel/types";
import invariant from "invariant";
import { CompilerErrorDetail, ErrorSeverity } from "../CompilerError";
import { Err, Ok, Result } from "../lib/Result";
import { assertExhaustive } from "../Utils/utils";
import {
  BlockId,
  Case,
  Effect,
  GeneratedSource,
  GotoVariant,
  HIRFunction,
  IfTerminal,
  InstructionKind,
  InstructionValue,
  makeInstructionId,
  Place,
  ReturnTerminal,
  SourceLocation,
  ThrowTerminal,
} from "./HIR";
import HIRBuilder, { Environment } from "./HIRBuilder";

// *******************************************************************************************
// *******************************************************************************************
// ************************************* Lowering to HIR *************************************
// *******************************************************************************************
// *******************************************************************************************

/**
 * Lower a function declaration into a control flow graph that models aspects of
 * control flow that are necessary for memoization. Notably, only control flow
 * that occurs at statement granularity is modeled (eg `if`, `for`, `return`
 * statements), not control flow at the expression level (ternaries or boolean
 * short-circuiting). Throw semantics are also not modeled: in general exceptions
 * are treated as exceptional conditions that invalidate memoization.
 *
 * TODO: consider modeling control-flow at expression level for even more fine-
 * grained reactivity.
 */
export function lower(
  func: NodePath<t.Function>
): Result<HIRFunction, CompilerErrorDetail[]> {
  const env = new Environment();
  const builder = new HIRBuilder(env);

  // Internal babel is on an older version that does not have hasNode (v7.17)
  // See https://github.com/babel/babel/pull/13940/files for impl
  // TODO: write helper function for NodePath.node != null
  const id =
    func.isFunctionDeclaration() && func.get("id").node != null
      ? builder.resolveIdentifier(func.get("id") as NodePath<t.Identifier>)
      : null;

  const params: Array<Place> = [];
  func.get("params").forEach((param) => {
    if (param.isIdentifier()) {
      const identifier = builder.resolveIdentifier(param);
      const place: Place = {
        kind: "Identifier",
        identifier,
        effect: Effect.Unknown,
        loc: param.node.loc ?? GeneratedSource,
      };
      params.push(place);
    } else {
      builder.pushError({
        reason: `(BuildHIR::lower) Handle ${param.node.type} params`,
        severity: ErrorSeverity.Todo,
        nodePath: param,
      });
    }
  });

  const body = func.get("body");
  if (body.isExpression()) {
    const fallthrough = builder.reserve();
    const terminal: ReturnTerminal = {
      kind: "return",
      loc: GeneratedSource,
      value: lowerExpressionToPlace(builder, body),
      id: makeInstructionId(0),
    };
    builder.terminateWithContinuation("block", terminal, fallthrough);
  } else if (body.isBlockStatement()) {
    lowerStatement(builder, body);
  } else {
    builder.pushError({
      reason: `(BuildHIR::lower) Unexpected function body kind: ${body.type}}`,
      severity: ErrorSeverity.InvalidInput,
      nodePath: body,
    });
  }

  if (builder.hasErrors()) {
    return Err(builder.errors);
  }

  return Ok({
    id,
    params,
    body: builder.build(),
    generator: func.node.generator === true,
    async: func.node.async === true,
    loc: func.node.loc ?? GeneratedSource,
    env,
  });
}

/**
 * Helper to lower a statement
 */
function lowerStatement(
  builder: HIRBuilder,
  stmtPath: NodePath<t.Statement>,
  label: string | null = null
): undefined {
  const stmtNode = stmtPath.node;
  switch (stmtNode.type) {
    case "ThrowStatement": {
      const stmt = stmtPath as NodePath<t.ThrowStatement>;
      const value = lowerExpressionToPlace(builder, stmt.get("argument"));
      const terminal: ThrowTerminal = {
        kind: "throw",
        value,
        id: makeInstructionId(0),
      };
      builder.terminate("block", terminal);
      return;
    }
    case "ReturnStatement": {
      const stmt = stmtPath as NodePath<t.ReturnStatement>;
      const argument = stmt.get("argument");
      const value =
        argument.node != null
          ? lowerExpressionToPlace(builder, argument as NodePath<t.Expression>)
          : null;
      const fallthrough = builder.reserve();
      const terminal: ReturnTerminal = {
        kind: "return",
        loc: stmt.node.loc ?? GeneratedSource,
        value,
        id: makeInstructionId(0),
      };
      builder.terminateWithContinuation("block", terminal, fallthrough);
      return;
    }
    case "IfStatement": {
      const stmt = stmtPath as NodePath<t.IfStatement>;
      //  Block for code following the if
      const continuationBlock = builder.reserve();
      //  Block for the consequent (if the test is truthy)
      const consequentBlock = builder.enter("block", (blockId) => {
        lowerStatement(builder, stmt.get("consequent"));
        return {
          kind: "goto",
          block: continuationBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });
      //  Block for the alternate (if the test is not truthy)
      let alternateBlock: BlockId;
      const alternate = stmt.get("alternate");
      if (alternate.node != null) {
        alternateBlock = builder.enter("block", (blockId) => {
          lowerStatement(builder, alternate as NodePath<t.Statement>);
          return {
            kind: "goto",
            block: continuationBlock.id,
            variant: GotoVariant.Break,
            id: makeInstructionId(0),
          };
        });
      } else {
        //  If there is no else clause, use the continuation directly
        alternateBlock = continuationBlock.id;
      }
      const test = lowerExpressionToPlace(builder, stmt.get("test"));
      const terminal: IfTerminal = {
        kind: "if",
        test,
        consequent: consequentBlock,
        alternate: alternateBlock,
        fallthrough: continuationBlock.id,
        id: makeInstructionId(0),
      };
      builder.terminateWithContinuation("block", terminal, continuationBlock);
      return;
    }
    case "BlockStatement": {
      const stmt = stmtPath as NodePath<t.BlockStatement>;
      stmt.get("body").forEach((s) => lowerStatement(builder, s));
      return;
    }
    case "BreakStatement": {
      const stmt = stmtPath as NodePath<t.BreakStatement>;
      const block = builder.lookupBreak(stmt.node.label?.name ?? null);
      builder.terminate("block", {
        kind: "goto",
        block,
        variant: GotoVariant.Break,
        id: makeInstructionId(0),
      });
      return;
    }
    case "ContinueStatement": {
      const stmt = stmtPath as NodePath<t.ContinueStatement>;
      const block = builder.lookupContinue(stmt.node.label?.name ?? null);
      builder.terminate("block", {
        kind: "goto",
        block,
        variant: GotoVariant.Continue,
        id: makeInstructionId(0),
      });
      return;
    }
    case "ForInStatement": {
      const stmt = stmtPath as NodePath<t.ForInStatement>;
      //  Block used to evaluate whether to (re)enter or exit the loop
      const conditionalBlock = builder.reserve();
      //  Block for code following the loop
      const continuationBlock = builder.reserve();
      const loopBlock = builder.enter("block", (blockId) => {
        return builder.loop(
          label,
          conditionalBlock.id,
          continuationBlock.id,
          () => {
            lowerStatement(builder, stmt.get("body"));
            return {
              kind: "goto",
              block: conditionalBlock.id,
              variant: GotoVariant.Continue,
              id: makeInstructionId(0),
            };
          }
        );
      });
      //  End the block leading up to the loop and jump to the conditional block
      builder.terminateWithContinuation(
        "block",
        {
          kind: "goto",
          block: conditionalBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        },
        conditionalBlock
      );
      /**
       * Terminate the conditional block using the <right> value as the test condition:
       * this conceptually represents that the value of <right> influences which branch
       * is taken (if it has properties enter the loop, if no properties exit to the continuation)
       */
      const test = lowerExpressionToPlace(builder, stmt.get("right"));
      const terminal: IfTerminal = {
        kind: "if",
        test,
        consequent: loopBlock,
        alternate: continuationBlock.id,
        fallthrough: continuationBlock.id,
        id: makeInstructionId(0),
      };
      builder.terminateWithContinuation("block", terminal, continuationBlock);
      return;
    }
    case "ForOfStatement": {
      const stmt = stmtPath as NodePath<t.ForOfStatement>;
      //  Block used to evaluate whether to (re)enter or exit the loop
      const conditionalBlock = builder.reserve();
      //  Block for code following the loop
      const continuationBlock = builder.reserve();
      /**
       * Build the loop body, each iteration loops back to the conditional block
       * to check whether to continue or exit
       */
      const loopBlock = builder.enter("block", (blockId) => {
        return builder.loop(
          label,
          conditionalBlock.id,
          continuationBlock.id,
          () => {
            lowerStatement(builder, stmt.get("body"));
            return {
              kind: "goto",
              block: conditionalBlock.id,
              variant: GotoVariant.Continue,
              id: makeInstructionId(0),
            };
          }
        );
      });
      //  End the block leading up to the loop and jump to the conditional block
      builder.terminateWithContinuation(
        "block",
        {
          kind: "goto",
          block: conditionalBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        },
        conditionalBlock
      );
      /**
       * Terminate the conditional block using the <right> value as the test condition:
       * this conceptually represents that the value of <right> influences which branch
       * is taken (even though it isn't actually a boolean check in practice)
       */
      const test = lowerExpressionToPlace(builder, stmt.get("right"));
      const terminal: IfTerminal = {
        kind: "if",
        test,
        consequent: loopBlock,
        alternate: continuationBlock.id,
        fallthrough: continuationBlock.id,
        id: makeInstructionId(0),
      };
      builder.terminateWithContinuation("block", terminal, continuationBlock);
      return;
    }
    case "ForStatement": {
      const stmt = stmtPath as NodePath<t.ForStatement>;

      const testBlock = builder.reserve();
      //  Block for code following the loop
      const continuationBlock = builder.reserve();

      const initBlock = builder.enter("value", (blockId) => {
        const init = stmt.get("init");
        if (!init.isVariableDeclaration()) {
          builder.pushError({
            reason:
              "(BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement",
            severity: ErrorSeverity.Todo,
            nodePath: stmt,
          });
          return { kind: "unsupported", id: makeInstructionId(0) };
        }
        lowerStatement(builder, init);
        return {
          kind: "goto",
          block: testBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });

      const updateBlock = builder.enter("value", (blockId) => {
        const update = stmt.get("update");
        if (update.node == null) {
          builder.pushError({
            reason: `(BuildHIR::lowerStatement) Handle empty update in ForStatement`,
            severity: ErrorSeverity.Todo,
            nodePath: stmt,
          });
          return { kind: "unsupported", id: makeInstructionId(0) };
        }
        lowerExpressionToVoid(builder, update as NodePath<t.Expression>);
        return {
          kind: "goto",
          block: testBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });

      const bodyBlock = builder.enter("block", (blockId) => {
        return builder.loop(label, updateBlock, continuationBlock.id, () => {
          lowerStatement(builder, stmt.get("body"));
          return {
            kind: "goto",
            block: updateBlock,
            variant: GotoVariant.Continue,
            id: makeInstructionId(0),
          };
        });
      });

      builder.terminateWithContinuation(
        "block",
        {
          kind: "for",
          init: initBlock,
          test: testBlock.id,
          update: updateBlock,
          loop: bodyBlock,
          fallthrough: continuationBlock.id,
          id: makeInstructionId(0),
        },
        testBlock
      );

      const test = stmt.get("test");
      if (test.node == null) {
        builder.pushError({
          reason: `(BuildHIR::lowerStatement) Handle empty test in ForStatement`,
          severity: ErrorSeverity.Todo,
          nodePath: stmt,
        });
      } else {
        builder.terminateWithContinuation(
          "value",
          {
            kind: "if",
            test: lowerExpressionToPlace(
              builder,
              test as NodePath<t.Expression>
            ),
            consequent: bodyBlock,
            alternate: continuationBlock.id,
            fallthrough: continuationBlock.id,
            id: makeInstructionId(0),
          },
          continuationBlock
        );
      }
      return;
    }
    case "DoWhileStatement": {
      const stmt = stmtPath as NodePath<t.DoWhileStatement>;
      //  Block for code following the loop
      const continuationBlock = builder.reserve();
      //  Loop body
      const loopBlock = builder.enter("block", (loopBlock) => {
        return builder.loop(label, loopBlock, continuationBlock.id, () => {
          lowerStatement(builder, stmt.get("body"));
          /**
           * the loop terminates with the while condition, either looping
           * around (consequent) or exiting to the continuation (alternate)
           */
          const test = lowerExpressionToPlace(builder, stmt.get("test"));
          const terminal: IfTerminal = {
            kind: "if",
            test,
            consequent: loopBlock,
            alternate: continuationBlock.id,
            fallthrough: continuationBlock.id,
            id: makeInstructionId(0),
          };
          return terminal;
        });
      });
      //  do-while unconditionally enters the loop
      builder.terminateWithContinuation(
        "block",
        {
          kind: "goto",
          block: loopBlock,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        },
        continuationBlock
      );
      return;
    }
    case "WhileStatement": {
      const stmt = stmtPath as NodePath<t.WhileStatement>;
      //  Block used to evaluate whether to (re)enter or exit the loop
      const conditionalBlock = builder.reserve();
      //  Block for code following the loop
      const continuationBlock = builder.reserve();
      //  Loop body
      const loopBlock = builder.enter("block", (blockId) => {
        return builder.loop(
          label,
          conditionalBlock.id,
          continuationBlock.id,
          () => {
            lowerStatement(builder, stmt.get("body"));
            return {
              kind: "goto",
              block: conditionalBlock.id,
              variant: GotoVariant.Continue,
              id: makeInstructionId(0),
            };
          }
        );
      });
      /**
       * The code leading up to the loop must jump to the conditional block,
       * to evaluate whether to enter the loop or bypass to the continuation.
       */
      const loc = stmt.node.loc;
      if (loc == null) {
        builder.pushError({
          reason: `(BuildHIR::lowerStatement) Expected WhileStatement to have a location, got ${loc}`,
          severity: ErrorSeverity.InvalidInput,
          nodePath: stmt,
        });
      } else {
        builder.terminateWithContinuation(
          "block",
          {
            kind: "while",
            loc,
            test: conditionalBlock.id,
            loop: loopBlock,
            fallthrough: continuationBlock.id,
            id: makeInstructionId(0),
          },
          conditionalBlock
        );
      }
      /**
       * The conditional block is empty and exists solely as conditional for
       * (re)entering or exiting the loop
       */
      const test = lowerExpressionToPlace(builder, stmt.get("test"));
      const terminal: IfTerminal = {
        kind: "if",
        test,
        consequent: loopBlock,
        alternate: continuationBlock.id,
        fallthrough: continuationBlock.id,
        id: makeInstructionId(0),
      };
      //  Complete the conditional and continue with code after the loop
      builder.terminateWithContinuation("value", terminal, continuationBlock);
      return;
    }
    case "LabeledStatement": {
      const stmt = stmtPath as NodePath<t.LabeledStatement>;
      const label = stmt.node.label.name;
      const body = stmt.get("body");
      switch (body.node.type) {
        case "ForInStatement":
        case "ForOfStatement":
        case "ForStatement":
        case "WhileStatement":
        case "DoWhileStatement": {
          // labeled loops are special because of continue, so push the label
          // down
          lowerStatement(builder, stmt.get("body"), label);
          break;
        }
        default: {
          // All other statements create a continuation block to allow `break`,
          // explicitly *don't* pass the label down
          const continuationBlock = builder.reserve();
          builder.label(label, continuationBlock.id, () => {
            lowerStatement(builder, stmt.get("body"));
          });
          builder.terminateWithContinuation(
            "block",
            {
              kind: "goto",
              block: continuationBlock.id,
              variant: GotoVariant.Break,
              id: makeInstructionId(0),
            },
            continuationBlock
          );
        }
      }
      return;
    }
    case "SwitchStatement": {
      const stmt = stmtPath as NodePath<t.SwitchStatement>;
      //  Block following the switch
      const continuationBlock = builder.reserve();
      /**
       * The goto target for any cases that fallthrough, which initially starts
       * as the continuation block and is then updated as we iterate through cases
       * in reverse order.
       */
      let fallthrough = continuationBlock.id;
      /**
       * Iterate through cases in reverse order, so that previous blocks can fallthrough
       * to successors
       */
      const cases: Case[] = [];
      let hasDefault = false;
      for (let ii = stmt.get("cases").length - 1; ii >= 0; ii--) {
        const case_: NodePath<t.SwitchCase> = stmt.get("cases")[ii];
        const test = case_.get("test");
        if (test.node == null) {
          if (hasDefault) {
            builder.pushError({
              reason:
                "(BuildHIR::lowerStatement) Expected at most one `default` branch in SwitchStatement, this code should have failed to parse",
              severity: ErrorSeverity.InvalidInput,
              nodePath: case_,
            });
            break;
          }
          hasDefault = true;
        }
        const block = builder.enter("block", (_blockId) => {
          return builder.switch(label, continuationBlock.id, () => {
            case_
              .get("consequent")
              .forEach((consequent) => lowerStatement(builder, consequent));
            /**
             * always generate a fallthrough to the next block, this may be dead code
             * if there was an explicit break, but if so it will be pruned later.
             */
            return {
              kind: "goto",
              block: fallthrough,
              variant: GotoVariant.Break,
              id: makeInstructionId(0),
            };
          });
        });
        cases.push({
          test:
            test.node != null
              ? lowerExpressionToPlace(builder, test as NodePath<t.Expression>)
              : null,
          block,
        });
        fallthrough = block;
      }
      /**
       * it doesn't matter for our analysis purposes, but reverse the order of the cases
       * back to the original to make it match the original code/intent.
       */
      cases.reverse();
      /**
       * If there wasn't an explicit default case, generate one to model the fact that execution
       * could bypass any of the other cases and jump directly to the continuation.
       */
      if (!hasDefault) {
        cases.push({ test: null, block: continuationBlock.id });
      }

      const test = lowerExpressionToPlace(builder, stmt.get("discriminant"));
      builder.terminateWithContinuation(
        "block",
        {
          kind: "switch",
          test,
          cases,
          fallthrough: continuationBlock.id,
          id: makeInstructionId(0),
        },
        continuationBlock
      );
      return;
    }
    case "TryStatement": {
      const stmt = stmtPath as NodePath<t.TryStatement>;
      /**
       * NOTE: Accurately modeling control flow within a try statement would require treating
       * effectively every expression as a possible branch point (since almost any expression can throw).
       * Instead, we model the try statement as an atomic unit from a control-flow perspective,
       * and rely on other passes to handle codegen for try statements
       */
      lowerStatement(builder, stmt.get("block"));
      const handler = stmt.get("handler");
      if (handler.node != null) {
        //  TODO: consider whether we need to track the param
        lowerStatement(builder, handler.get("body") as NodePath<t.Statement>);
      }
      const finalizer = stmt.get("finalizer");
      if (finalizer.node != null) {
        lowerStatement(builder, finalizer as NodePath<t.Statement>);
      }
      return;
    }
    case "VariableDeclaration": {
      const stmt = stmtPath as NodePath<t.VariableDeclaration>;
      const nodeKind: string = stmt.node.kind;
      if (nodeKind === "var") {
        builder.pushError({
          reason: `(BuildHIR::lowerStatement) Handle ${nodeKind} kinds in VariableDeclaration`,
          severity: ErrorSeverity.Todo,
          nodePath: stmt,
        });
        return;
      }
      const kind =
        nodeKind === "let" ? InstructionKind.Let : InstructionKind.Const;
      for (const declaration of stmt.get("declarations")) {
        const id = declaration.get("id");
        const init = declaration.get("init");
        let value: InstructionValue;
        if (init.node != null) {
          value = lowerExpression(builder, init as NodePath<t.Expression>);
        } else {
          value = {
            kind: "Primitive",
            value: undefined,
            loc: id.node.loc ?? GeneratedSource,
          };
        }
        lowerAssignment(
          builder,
          stmt.node.loc ?? GeneratedSource,
          kind,
          id,
          value
        );
      }
      return;
    }
    case "ExpressionStatement": {
      const stmt = stmtPath as NodePath<t.ExpressionStatement>;
      const expression = stmt.get("expression");
      const value = lowerExpression(builder, expression);
      if (expression.isAssignmentExpression() && value.kind === "Identifier") {
        // already lowered to a place
        return;
      }
      const place = buildTemporaryPlace(
        builder,
        stmt.node.loc ?? GeneratedSource
      );
      builder.push({
        id: makeInstructionId(0),
        lvalue: { kind: InstructionKind.Const, place },
        value,
        loc: stmt.node.loc ?? GeneratedSource,
      });
      return;
    }
    case "ClassDeclaration":
    case "DebuggerStatement":
    case "DeclareClass":
    case "DeclareExportAllDeclaration":
    case "DeclareExportDeclaration":
    case "DeclareFunction":
    case "DeclareInterface":
    case "DeclareModule":
    case "DeclareModuleExports":
    case "DeclareOpaqueType":
    case "DeclareTypeAlias":
    case "DeclareVariable":
    case "EmptyStatement":
    case "EnumDeclaration":
    case "ExportAllDeclaration":
    case "ExportDefaultDeclaration":
    case "ExportNamedDeclaration":
    case "FunctionDeclaration":
    case "ImportDeclaration":
    case "InterfaceDeclaration":
    case "OpaqueType":
    case "TypeAlias":
    case "TSDeclareFunction":
    case "TSEnumDeclaration":
    case "TSExportAssignment":
    case "TSImportEqualsDeclaration":
    case "TSInterfaceDeclaration":
    case "TSModuleDeclaration":
    case "TSNamespaceExportDeclaration":
    case "TSTypeAliasDeclaration":
    case "WithStatement": {
      builder.pushError({
        reason: `(BuildHIR::lowerStatement) Handle ${stmtPath.type} statements`,
        severity: ErrorSeverity.Todo,
        nodePath: stmtPath,
      });
      builder.push({
        id: makeInstructionId(0),
        lvalue: {
          place: buildTemporaryPlace(
            builder,
            stmtPath.node.loc ?? GeneratedSource
          ),
          kind: InstructionKind.Const,
        },
        loc: stmtPath.node.loc ?? GeneratedSource,
        value: {
          kind: "UnsupportedNode",
          loc: stmtPath.node.loc ?? GeneratedSource,
          node: stmtPath.node,
        },
      });
      return;
    }
    default: {
      return assertExhaustive(
        stmtNode,
        `Unsupported statement kind '${
          (stmtNode as any as NodePath<t.Statement>).type
        }'`
      );
    }
  }
}

function lowerExpression(
  builder: HIRBuilder,
  exprPath: NodePath<t.Expression>
): InstructionValue {
  const exprNode = exprPath.node;
  const exprLoc = exprNode.loc ?? GeneratedSource;
  switch (exprNode.type) {
    case "Identifier": {
      const expr = exprPath as NodePath<t.Identifier>;
      return lowerIdentifier(builder, expr);
    }
    case "NullLiteral": {
      return {
        kind: "Primitive",
        value: null,
        loc: exprLoc,
      };
    }
    case "BooleanLiteral":
    case "NumericLiteral":
    case "StringLiteral": {
      const expr = exprPath as NodePath<
        t.StringLiteral | t.BooleanLiteral | t.NumericLiteral
      >;
      const value = expr.node.value;
      return {
        kind: "Primitive",
        value,
        loc: exprLoc,
      };
    }
    case "ObjectExpression": {
      const expr = exprPath as NodePath<t.ObjectExpression>;
      const propertyPaths = expr.get("properties");
      const properties: Map<string, Place> = new Map();
      let hasError = false;
      for (const propertyPath of propertyPaths) {
        if (!propertyPath.isObjectProperty()) {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Handle ${propertyPath.type} properties in ObjectExpression`,
            severity: ErrorSeverity.Todo,
            nodePath: propertyPath,
          });
          hasError = true;
          continue;
        }
        const key = propertyPath.node.key;
        if (key.type !== "Identifier") {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Expected Identifier, got ${key.type} key in ObjectExpression`,
            severity: ErrorSeverity.InvalidInput,
            nodePath: propertyPath,
          });
          hasError = true;
          continue;
        }
        const valuePath = propertyPath.get("value");
        if (!valuePath.isExpression()) {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Handle ${valuePath.type} values in ObjectExpression`,
            severity: ErrorSeverity.Todo,
            nodePath: valuePath,
          });
          hasError = true;
          continue;
        }
        const value = lowerExpressionToPlace(builder, valuePath);
        properties.set(key.name, value);
      }
      return hasError
        ? { kind: "UnsupportedNode", node: exprNode, loc: exprLoc }
        : {
            kind: "ObjectExpression",
            properties,
            loc: exprLoc,
          };
    }
    case "ArrayExpression": {
      const expr = exprPath as NodePath<t.ArrayExpression>;
      let hasError = false;
      let elements: Place[] = [];
      for (const element of expr.get("elements")) {
        if (element.node == null || !element.isExpression()) {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Handle ${element.type} elements in ArrayExpression`,
            severity: ErrorSeverity.Todo,
            nodePath: element,
          });
          hasError = true;
          continue;
        }
        elements.push(
          lowerExpressionToPlace(builder, element as NodePath<t.Expression>)
        );
      }
      return hasError
        ? { kind: "UnsupportedNode", node: exprNode, loc: exprLoc }
        : {
            kind: "ArrayExpression",
            elements,
            loc: exprLoc,
          };
    }
    case "NewExpression": {
      const expr = exprPath as NodePath<t.NewExpression>;
      const calleePath = expr.get("callee");
      if (!calleePath.isExpression()) {
        builder.pushError({
          reason: `(BuildHIR::lowerExpression) Expected Expression, got ${calleePath.type} in NewExpression (v8 intrinsics not supported): ${calleePath.type}`,
          severity: ErrorSeverity.InvalidInput,
          nodePath: calleePath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }
      const callee = lowerExpressionToPlace(builder, calleePath);
      let args: Place[] = [];
      let hasError = false;
      for (const argPath of expr.get("arguments")) {
        if (!argPath.isExpression()) {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Handle ${argPath.type} arguments in NewExpression`,
            severity: ErrorSeverity.Todo,
            nodePath: argPath,
          });
          hasError = true;
          continue;
        }
        args.push(lowerExpressionToPlace(builder, argPath));
      }

      return hasError
        ? { kind: "UnsupportedNode", node: exprNode, loc: exprLoc }
        : {
            kind: "NewExpression",
            callee,
            args,
            loc: exprLoc,
          };
    }
    case "CallExpression": {
      const expr = exprPath as NodePath<t.CallExpression>;
      const calleePath = expr.get("callee");
      let hasError = false;
      if (!calleePath.isExpression()) {
        builder.pushError({
          reason: `(BuildHIR::lowerExpression) Expected Expression, got ${calleePath.type} in CallExpression (v8 intrinsics not supported)`,
          severity: ErrorSeverity.InvalidInput,
          nodePath: calleePath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }
      if (calleePath.isMemberExpression()) {
        const { object, property, value } = lowerMemberExpression(
          builder,
          calleePath
        );
        let args: Place[] = [];
        for (const argPath of expr.get("arguments")) {
          if (!argPath.isExpression()) {
            builder.pushError({
              reason: `(BuildHIR::lowerExpression) Handle ${argPath.type} arguments in CallExpression`,
              severity: ErrorSeverity.Todo,
              nodePath: argPath,
            });
            hasError = true;
            continue;
          }
          args.push(lowerExpressionToPlace(builder, argPath));
        }
        if (typeof property === "string") {
          return {
            kind: "PropertyCall",
            receiver: object,
            property,
            args,
            loc: exprLoc,
          };
        } else {
          return {
            kind: "ComputedCall",
            receiver: object,
            property,
            args,
            loc: exprLoc,
          };
        }
      } else {
        const callee = lowerExpressionToPlace(builder, calleePath);
        let args: Place[] = [];
        for (const argPath of expr.get("arguments")) {
          if (!argPath.isExpression()) {
            builder.pushError({
              reason: `(BuildHIR::lowerExpression) Handle ${argPath.type} arguments in CallExpression`,
              severity: ErrorSeverity.Todo,
              nodePath: argPath,
            });
            hasError = true;
            continue;
          }
          args.push(lowerExpressionToPlace(builder, argPath));
        }
        return hasError
          ? { kind: "UnsupportedNode", node: exprNode, loc: exprLoc }
          : {
              kind: "CallExpression",
              callee,
              args,
              loc: exprLoc,
            };
      }
    }
    case "BinaryExpression": {
      const expr = exprPath as NodePath<t.BinaryExpression>;
      const leftPath = expr.get("left");
      if (!leftPath.isExpression()) {
        builder.pushError({
          reason: `(BuildHIR::lowerExpression) Expected Expression, got ${leftPath.type} lval in BinaryExpression`,
          severity: ErrorSeverity.InvalidInput,
          nodePath: leftPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }
      const left = lowerExpressionToPlace(builder, leftPath);
      const right = lowerExpressionToPlace(builder, expr.get("right"));
      const operator = expr.node.operator;
      return {
        kind: "BinaryExpression",
        operator,
        left,
        right,
        loc: exprLoc,
      };
    }
    case "LogicalExpression": {
      const expr = exprPath as NodePath<t.LogicalExpression>;
      const leftPath = expr.get("left");
      const operator = expr.node.operator;
      switch (operator) {
        case "||": {
          const left = lowerExpressionToPlace(builder, leftPath);
          return lowerConditional(
            builder,
            left,
            exprLoc,
            () => left,
            () => lowerExpression(builder, expr.get("right"))
          );
        }
        case "&&": {
          const left = lowerExpressionToPlace(builder, leftPath);
          return lowerConditional(
            builder,
            left,
            exprLoc,
            () => lowerExpression(builder, expr.get("right")),
            () => left
          );
        }
        case "??": {
          // generate the equivalent of
          //   const tmp = <left>;
          //   tmp != null ? tmp : <right>
          const left = lowerExpressionToPlace(builder, leftPath);

          const nullPlace: Place = buildTemporaryPlace(builder, left.loc);
          builder.push({
            id: makeInstructionId(0),
            value: {
              kind: "Primitive",
              value: null,
              loc: GeneratedSource,
            },
            loc: left.loc,
            lvalue: { place: { ...nullPlace }, kind: InstructionKind.Const },
          });

          const condPlace: Place = buildTemporaryPlace(builder, left.loc);
          builder.push({
            id: makeInstructionId(0),
            lvalue: {
              place: { ...condPlace },
              kind: InstructionKind.Const,
            },
            value: {
              kind: "BinaryExpression",
              operator: "!=",
              left,
              right: nullPlace,
              loc: left.loc,
            },
            loc: left.loc,
          });
          return lowerConditional(
            builder,
            condPlace,
            exprLoc,
            () => left,
            () => lowerExpression(builder, expr.get("right"))
          );
        }
        default: {
          assertExhaustive(
            operator,
            `Unexpected logical operator '${operator as any}'`
          );
        }
      }
    }
    case "AssignmentExpression": {
      const expr = exprPath as NodePath<t.AssignmentExpression>;
      const operator = expr.node.operator;

      if (operator === "=") {
        const left = expr.get("left");
        return lowerAssignment(
          builder,
          left.node.loc ?? GeneratedSource,
          InstructionKind.Reassign,
          left,
          lowerExpression(builder, expr.get("right"))
        );
      }

      const operators: { [key: string]: t.BinaryExpression["operator"] } = {
        "+=": "+",
        "-=": "-",
        "/=": "/",
        "%=": "%",
        "*=": "*",
        "**=": "**",
        "&=": "&",
        "|=": "|",
        ">>=": ">>",
        ">>>=": ">>>",
        "<<=": "<<",
        "^=": "^",
      };
      const binaryOperator = operators[operator];
      if (binaryOperator == null) {
        builder.pushError({
          reason: `(BuildHIR::lowerExpression) Handle ${operator} operaators in AssignmentExpression`,
          severity: ErrorSeverity.Todo,
          nodePath: expr.get("operator"),
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }
      const left = expr.get("left");
      const leftNode = left.node;
      switch (leftNode.type) {
        case "Identifier": {
          const leftExpr = left as NodePath<t.Identifier>;
          const place = lowerExpressionToPlace(builder, leftExpr);
          const right = lowerExpressionToPlace(builder, expr.get("right"));
          builder.push({
            id: makeInstructionId(0),
            lvalue: { place: { ...place }, kind: InstructionKind.Reassign },
            value: {
              kind: "BinaryExpression",
              operator: binaryOperator,
              left: { ...place },
              right,
              loc: exprLoc,
            },
            loc: exprLoc,
          });
          return place;
        }
        case "MemberExpression": {
          // a.b.c += <right>
          const leftExpr = left as NodePath<t.MemberExpression>;
          // Lower everything up to the final property to a temporary, eg `a.b`
          const object = lowerExpressionToPlace(
            builder,
            leftExpr.get("object")
          );
          // Extract the final property to be read from and re-assigned, eg 'c'
          const property = leftExpr.get("property");
          if (!property.isIdentifier()) {
            builder.pushError({
              reason: `(BuildHIR::lowerExpression) Handle ${property.type} properties in MemberExpression`,
              severity: ErrorSeverity.Todo,
              nodePath: property,
            });
            return {
              kind: "UnsupportedNode",
              node: leftExpr.node,
              loc: leftExpr.node.loc ?? GeneratedSource,
            };
          }
          // Store the previous value to a temporary
          const previousValuePlace: Place = buildTemporaryPlace(
            builder,
            exprLoc
          );
          builder.push({
            id: makeInstructionId(0),
            lvalue: {
              place: { ...previousValuePlace },
              kind: InstructionKind.Const,
            },
            value: {
              kind: "PropertyLoad",
              object: { ...object },
              property: property.node.name,
              loc: leftExpr.node.loc ?? GeneratedSource,
              optional: false, // LVal cannot be optional
            },
            loc: leftExpr.node.loc ?? GeneratedSource,
          });
          // Store the new value to a temporary
          const newValuePlace: Place = buildTemporaryPlace(builder, exprLoc);
          builder.push({
            id: makeInstructionId(0),
            lvalue: {
              place: { ...newValuePlace },
              kind: InstructionKind.Const,
            },
            value: {
              kind: "BinaryExpression",
              operator: binaryOperator,
              left: { ...previousValuePlace },
              right: lowerExpressionToPlace(builder, expr.get("right")),
              loc: leftExpr.node.loc ?? GeneratedSource,
            },
            loc: leftExpr.node.loc ?? GeneratedSource,
          });

          // Save the result back to the property
          return {
            kind: "PropertyStore",
            object: { ...object },
            property: property.node.name,
            value: { ...newValuePlace },
            loc: leftExpr.node.loc ?? GeneratedSource,
          };
        }
        default: {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Expected Identifier or MemberExpression, got ${expr.type} lval in AssignmentExpression`,
            severity: ErrorSeverity.InvalidInput,
            nodePath: expr,
          });
          return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
        }
      }
    }
    case "OptionalMemberExpression":
    case "MemberExpression": {
      const expr = exprPath as NodePath<
        t.MemberExpression | t.OptionalMemberExpression
      >;
      const { value } = lowerMemberExpression(builder, expr);
      const place: Place = buildTemporaryPlace(builder, exprLoc);
      builder.push({
        id: makeInstructionId(0),
        lvalue: { place: { ...place }, kind: InstructionKind.Const },
        value,
        loc: exprLoc,
      });
      return place;
    }
    case "JSXElement": {
      const expr = exprPath as NodePath<t.JSXElement>;
      const opening = expr.get("openingElement");
      const tag = lowerJsxElementName(builder, opening.get("name"));
      const children = expr
        .get("children")
        .map((child) => lowerJsxElement(builder, child));
      const props: Map<string, Place> = new Map();
      let hasError = false;
      for (const attribute of opening.get("attributes")) {
        if (!attribute.isJSXAttribute()) {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Handle ${attribute.type} attributes in JSXElement`,
            severity: ErrorSeverity.Todo,
            nodePath: attribute,
          });
          hasError = true;
          continue;
        }
        const name = attribute.get("name");
        if (!name.isJSXIdentifier()) {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Handle ${name.type} attribute names in JSXElement`,
            severity: ErrorSeverity.Todo,
            nodePath: name,
          });
          hasError = true;
          continue;
        }
        const valueExpr = attribute.get("value");
        let value;
        if (valueExpr.isJSXElement() || valueExpr.isStringLiteral()) {
          value = lowerExpressionToPlace(builder, valueExpr);
        } else {
          if (!valueExpr.isJSXExpressionContainer()) {
            builder.pushError({
              reason: `(BuildHIR::lowerExpression) Handle ${valueExpr.type} attribute values in JSXElement`,
              severity: ErrorSeverity.Todo,
              nodePath: valueExpr,
            });
            hasError = true;
            continue;
          }
          const expression = valueExpr.get("expression");
          if (!expression.isExpression()) {
            builder.pushError({
              reason: `(BuildHIR::lowerExpression) Handle ${expression.type} expressions in JSXExpressionContainer within JSXElement`,
              severity: ErrorSeverity.Todo,
              nodePath: valueExpr,
            });
            hasError = true;
            continue;
          }
          value = lowerExpressionToPlace(builder, expression);
        }
        const prop: string = name.node.name;
        props.set(prop, value);
      }
      return hasError
        ? { kind: "UnsupportedNode", node: exprNode, loc: exprLoc }
        : {
            kind: "JsxExpression",
            tag,
            props,
            children,
            loc: exprLoc,
          };
    }
    case "JSXFragment": {
      const expr = exprPath as NodePath<t.JSXFragment>;
      const children = expr
        .get("children")
        .map((child) => lowerJsxElement(builder, child));
      return {
        kind: "JsxFragment",
        children,
        loc: exprLoc,
      };
    }
    case "ArrowFunctionExpression":
    case "FunctionExpression": {
      const expr = exprPath as NodePath<
        t.FunctionExpression | t.ArrowFunctionExpression
      >;
      let name: string | null = null;
      if (expr.isFunctionExpression()) {
        name = expr.get("id")?.node?.name ?? null;
      }
      const componentScope: Scope = expr.scope.parent.getFunctionParent()!;
      const dependencies: Array<Place> = gatherCapturedDeps(
        builder,
        expr,
        componentScope
      );
      const lowering = lower(expr);
      let loweredFunc: HIRFunction;
      if (lowering.isErr()) {
        lowering.unwrapErr().forEach((e) => builder.pushError(e));
        return {
          kind: "UnsupportedNode",
          node: exprNode,
          loc: exprLoc,
        };
      }
      loweredFunc = lowering.unwrap();

      let hasError = false;
      const params: Array<string> = [];
      for (const p of expr.get("params")) {
        if (!p.isIdentifier()) {
          builder.pushError({
            reason: `(BuildHIR::lowerExpression) Handle ${p.type} params in FunctionExpression`,
            severity: ErrorSeverity.Todo,
            nodePath: p,
          });
          hasError = true;
          continue;
        }
        params.push(p.node.name);
      }
      return hasError
        ? { kind: "UnsupportedNode", node: exprNode, loc: exprLoc }
        : {
            kind: "FunctionExpression",
            name,
            params,
            loweredFunc,
            dependencies,
            mutatedDeps: [],
            expr: expr.node,
            loc: exprLoc,
          };
    }
    case "TaggedTemplateExpression": {
      const expr = exprPath as NodePath<t.TaggedTemplateExpression>;
      if (expr.get("quasi").get("expressions").length !== 0) {
        builder.pushError({
          reason: "Unhandled tagged template with interpolations",
          severity: ErrorSeverity.Todo,
          nodePath: exprPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }
      invariant(
        expr.get("quasi").get("quasis").length == 1,
        "there should be only one quasi as we don't support interpolations yet"
      );

      const value = expr.get("quasi").get("quasis").at(0)!.node.value;
      if (value.raw !== value.cooked) {
        builder.pushError({
          reason:
            "Unhandled tagged template where cooked value is different from raw value",
          severity: ErrorSeverity.Todo,
          nodePath: exprPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }

      return {
        kind: "TaggedTemplateExpression",
        tag: lowerExpressionToPlace(builder, expr.get("tag")),
        value,
        loc: exprLoc,
      };
    }
    default: {
      builder.pushError({
        reason: `(BuildHIR::lowerExpression) Handle ${exprPath.type} expressions`,
        severity: ErrorSeverity.Todo,
        nodePath: exprPath,
      });
      return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
    }
  }
}

function lowerMemberExpression(
  builder: HIRBuilder,
  expr: NodePath<t.MemberExpression | t.OptionalMemberExpression>
): { object: Place; property: Place | string; value: InstructionValue } {
  const exprNode = expr.node;
  const exprLoc = exprNode.loc ?? GeneratedSource;
  const object = lowerExpressionToPlace(builder, expr.get("object"));
  const property = expr.get("property");
  if (!expr.node.computed) {
    if (!property.isIdentifier()) {
      builder.pushError({
        reason: `(BuildHIR::lowerExpression) Handle ${property.type} property`,
        severity: ErrorSeverity.Todo,
        nodePath: property,
      });
      return {
        object,
        property: property.toString(),
        value: { kind: "UnsupportedNode", node: exprNode, loc: exprLoc },
      };
    }
    const value: InstructionValue = {
      kind: "PropertyLoad",
      object: { ...object },
      property: property.node.name,
      loc: exprLoc,
      optional: t.isOptionalMemberExpression(expr),
    };
    return { object, property: property.node.name, value };
  } else {
    if (!property.isExpression()) {
      builder.pushError({
        reason: `(BuildHIR::lowerMemberExpression) Expected Expression, got ${property.type} property`,
        severity: ErrorSeverity.InvalidInput,
        nodePath: property,
      });
      return {
        object,
        property: property.toString(),
        value: {
          kind: "UnsupportedNode",
          node: exprNode,
          loc: exprLoc,
        },
      };
    }
    const propertyPlace = lowerExpressionToPlace(builder, property);
    const value: InstructionValue = {
      kind: "ComputedLoad",
      object: { ...object },
      property: { ...propertyPlace },
      loc: exprLoc,
    };
    return { object, property: propertyPlace, value };
  }
}

function lowerConditional(
  builder: HIRBuilder,
  test: Place,
  loc: SourceLocation,
  consequent: () => InstructionValue,
  alternate: () => InstructionValue
): Place {
  const place: Place = buildTemporaryPlace(builder, loc);
  //  Block for code following the if
  const continuationBlock = builder.reserve();
  //  Block for the consequent (if the test is truthy)
  const consequentBlock = builder.enter("value", (blockId) => {
    let value = consequent();
    builder.push({
      id: makeInstructionId(0),
      value,
      lvalue: { place: { ...place }, kind: InstructionKind.Const },
      loc: value.loc,
    });
    return {
      kind: "goto",
      block: continuationBlock.id,
      variant: GotoVariant.Break,
      id: makeInstructionId(0),
    };
  });
  //  Block for the alternate (if the test is not truthy)
  const alternateBlock = builder.enter("value", (blockId) => {
    let value = alternate();
    builder.push({
      id: makeInstructionId(0),
      value,
      lvalue: { place: { ...place }, kind: InstructionKind.Const },
      loc: value.loc,
    });
    return {
      kind: "goto",
      block: continuationBlock.id,
      variant: GotoVariant.Break,
      id: makeInstructionId(0),
    };
  });
  const terminal: IfTerminal = {
    kind: "if",
    test,
    consequent: consequentBlock,
    alternate: alternateBlock,
    fallthrough: continuationBlock.id,
    id: makeInstructionId(0),
  };
  builder.terminateWithContinuation("value", terminal, continuationBlock);
  return place;
}

function lowerJsxElementName(
  builder: HIRBuilder,
  exprPath: NodePath<
    t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName
  >
): Place {
  const exprNode = exprPath.node;
  const exprLoc = exprNode.loc ?? GeneratedSource;
  if (!exprPath.isJSXIdentifier()) {
    builder.pushError({
      reason: `(BuildHIR::lowerJsxElementName) Handle ${exprPath.type} tags`,
      severity: ErrorSeverity.Todo,
      nodePath: exprPath,
    });
    const place: Place = buildTemporaryPlace(builder, exprLoc);
    builder.push({
      id: makeInstructionId(0),
      value: {
        kind: "UnsupportedNode",
        node: exprNode,
        loc: exprLoc,
      },
      loc: exprLoc,
      lvalue: { place: { ...place }, kind: InstructionKind.Const },
    });
    return { ...place };
  }
  const tag: string = exprPath.node.name;
  if (tag.match(/^[A-Z]/)) {
    const identifier = builder.resolveIdentifier(exprPath);
    const place: Place = {
      kind: "Identifier",
      identifier: identifier,
      effect: Effect.Unknown,
      loc: exprLoc,
    };
    return place;
  } else {
    const place: Place = buildTemporaryPlace(builder, exprLoc);
    builder.push({
      id: makeInstructionId(0),
      value: {
        kind: "Primitive",
        value: tag,
        loc: exprLoc,
      },
      loc: exprLoc,
      lvalue: { place, kind: InstructionKind.Const },
    });
    return { ...place };
  }
}

function lowerJsxElement(
  builder: HIRBuilder,
  exprPath: NodePath<
    | t.JSXText
    | t.JSXExpressionContainer
    | t.JSXSpreadChild
    | t.JSXElement
    | t.JSXFragment
  >
): Place {
  const exprNode = exprPath.node;
  const exprLoc = exprNode.loc ?? GeneratedSource;
  if (exprPath.isJSXElement() || exprPath.isJSXFragment()) {
    return lowerExpressionToPlace(builder, exprPath);
  } else if (exprPath.isJSXExpressionContainer()) {
    const expression = exprPath.get("expression");
    if (!expression.isExpression()) {
      builder.pushError({
        reason: `(BuildHIR::lowerJsxElement) Handle ${expression.type} expressions`,
        severity: ErrorSeverity.Todo,
        nodePath: expression,
      });
      const place: Place = buildTemporaryPlace(builder, exprLoc);
      builder.push({
        id: makeInstructionId(0),
        value: {
          kind: "UnsupportedNode",
          node: exprNode,
          loc: exprLoc,
        },
        loc: exprLoc,
        lvalue: { place: { ...place }, kind: InstructionKind.Const },
      });
      return { ...place };
    }
    return lowerExpressionToPlace(builder, expression);
  } else if (exprPath.isJSXText()) {
    const place: Place = buildTemporaryPlace(builder, exprLoc);
    builder.push({
      id: makeInstructionId(0),
      value: {
        kind: "JSXText",
        value: exprPath.node.value,
        loc: exprLoc,
      },
      loc: exprLoc,
      lvalue: { place: { ...place }, kind: InstructionKind.Const },
    });
    return place;
  } else {
    if (!(t.isJSXFragment(exprNode) || t.isJSXSpreadChild(exprNode))) {
      builder.pushError({
        reason: `(BuildHIR::lowerJsxElement) Expected refinement to work, got: ${exprPath.type}`,
        severity: ErrorSeverity.InvalidInput,
        nodePath: exprPath,
      });
    }
    const place: Place = buildTemporaryPlace(builder, exprLoc);
    builder.push({
      id: makeInstructionId(0),
      value: {
        kind: "UnsupportedNode",
        node: exprNode,
        loc: exprLoc,
      },
      loc: exprLoc,
      lvalue: { place: { ...place }, kind: InstructionKind.Const },
    });
    return place;
  }
}

function lowerExpressionToPlace(
  builder: HIRBuilder,
  exprPath: NodePath<t.Expression>
): Place {
  const instr = lowerExpression(builder, exprPath);
  if (instr.kind === "Identifier") {
    return instr;
  }
  const exprLoc = exprPath.node.loc ?? GeneratedSource;
  const place: Place = buildTemporaryPlace(builder, exprLoc);
  builder.push({
    id: makeInstructionId(0),
    value: instr,
    loc: exprLoc,
    lvalue: { place: { ...place }, kind: InstructionKind.Const },
  });
  return place;
}

/**
 * Lowers an expression to an instruction with no lvalue
 */
function lowerExpressionToVoid(
  builder: HIRBuilder,
  exprPath: NodePath<t.Expression>
): void {
  const instr = lowerExpression(builder, exprPath);
  const exprLoc = exprPath.node.loc ?? GeneratedSource;
  builder.push({
    id: makeInstructionId(0),
    value: instr,
    loc: exprLoc,
    lvalue: {
      place: buildTemporaryPlace(builder, exprLoc),
      kind: InstructionKind.Const,
    },
  });
}

function lowerIdentifier(
  builder: HIRBuilder,
  exprPath: NodePath<t.Identifier>
): Place {
  const exprNode = exprPath.node;
  const exprLoc = exprNode.loc ?? GeneratedSource;
  const identifier = builder.resolveIdentifier(exprPath);
  const place: Place = {
    kind: "Identifier",
    identifier: identifier,
    effect: Effect.Unknown,
    loc: exprLoc,
  };
  return place;
}

/**
 * Creates a temporary Identifier and Place referencing that identifier.
 */
function buildTemporaryPlace(builder: HIRBuilder, loc: SourceLocation): Place {
  const place: Place = {
    kind: "Identifier",
    identifier: builder.makeTemporary(),
    effect: Effect.Unknown,
    loc,
  };
  return place;
}

function lowerAssignment(
  builder: HIRBuilder,
  loc: SourceLocation,
  kind: InstructionKind,
  lvaluePath: NodePath<t.LVal>,
  value: InstructionValue
): InstructionValue {
  const lvalueNode = lvaluePath.node;
  switch (lvalueNode.type) {
    case "Identifier": {
      const lvalue = lvaluePath as NodePath<t.Identifier>;
      const place = lowerIdentifier(builder, lvalue);
      builder.push({
        id: makeInstructionId(0),
        lvalue: { place: { ...place }, kind },
        value,
        loc,
      });
      return place;
    }
    case "MemberExpression": {
      const lvalue = lvaluePath as NodePath<t.MemberExpression>;
      const property = lvalue.get("property");
      const object = lowerExpressionToPlace(builder, lvalue.get("object"));
      let valuePlace: Place;
      if (value.kind === "Identifier") {
        valuePlace = value;
      } else {
        valuePlace = buildTemporaryPlace(builder, loc);
        builder.push({
          id: makeInstructionId(0),
          lvalue: { place: { ...valuePlace }, kind: InstructionKind.Const },
          value,
          loc,
        });
      }
      if (!lvalue.node.computed) {
        if (!property.isIdentifier()) {
          builder.pushError({
            reason: `(BuildHIR::lowerAssignment) Handle ${property.type} properties in MemberExpression`,
            severity: ErrorSeverity.Todo,
            nodePath: property,
          });
          return { kind: "UnsupportedNode", node: lvalueNode, loc };
        }
        return {
          kind: "PropertyStore",
          object,
          property: property.node.name,
          value: valuePlace,
          loc,
        };
      } else {
        if (!property.isExpression()) {
          builder.pushError({
            reason:
              "Expected private name to appear as a non-computed property",
            severity: ErrorSeverity.InvalidInput,
            nodePath: property,
          });
          return { kind: "UnsupportedNode", node: lvalueNode, loc };
        }
        const propertyPlace = lowerExpressionToPlace(builder, property);
        return {
          kind: "ComputedStore",
          object,
          property: propertyPlace,
          value: valuePlace,
          loc,
        };
      }
    }
    case "ArrayPattern": {
      const lvalue = lvaluePath as NodePath<t.ArrayPattern>;
      const arrayPlace = buildTemporaryPlace(builder, loc);
      builder.push({
        id: makeInstructionId(0),
        lvalue: { place: { ...arrayPlace }, kind: InstructionKind.Const },
        value,
        loc,
      });
      const elements = lvalue.get("elements");
      let hasError = false;
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.node == null) {
          continue;
        }
        if (element.node.type === "RestElement") {
          builder.pushError({
            reason: `(BuildHIR::lowerAssignment) Handle ${element.type} in ArrayPattern`,
            severity: ErrorSeverity.Todo,
            nodePath: element,
          });
          hasError = true;
          continue;
        }
        const property = buildTemporaryPlace(
          builder,
          element.node.loc ?? GeneratedSource
        );
        builder.push({
          id: makeInstructionId(0),
          lvalue: { place: { ...property }, kind: InstructionKind.Const },
          value: {
            kind: "Primitive",
            value: i,
            loc: element.node.loc ?? GeneratedSource,
          },
          loc: element.node.loc ?? GeneratedSource,
        });
        const value: InstructionValue = {
          kind: "ComputedLoad",
          loc,
          object: { ...arrayPlace },
          property,
        };
        lowerAssignment(builder, loc, kind, element as NodePath<t.LVal>, value);
      }
      return hasError
        ? { kind: "UnsupportedNode", node: lvalueNode, loc }
        : arrayPlace;
    }
    case "ObjectPattern": {
      const lvalue = lvaluePath as NodePath<t.ObjectPattern>;
      const objectPlace = buildTemporaryPlace(builder, loc);
      builder.push({
        id: makeInstructionId(0),
        lvalue: { place: { ...objectPlace }, kind },
        value,
        loc,
      });
      const properties = lvalue.get("properties");
      let hasError = false;
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        if (!property.isObjectProperty()) {
          builder.pushError({
            reason: `(BuildHIR::lowerAssignment) Handle ${property.type} properties in ObjectPattern`,
            severity: ErrorSeverity.Todo,
            nodePath: property,
          });
          hasError = true;
          continue;
        }
        const key = property.get("key");
        if (!key.isIdentifier()) {
          builder.pushError({
            reason: `(BuildHIR::lowerAssignment) Handle ${key.type} keys in ObjectPattern`,
            severity: ErrorSeverity.Todo,
            nodePath: key,
          });
          hasError = true;
          continue;
        }
        const element = property.get("value");
        if (!element.isLVal()) {
          builder.pushError({
            reason: `(BuildHIR::lowerAssignment) Expected object property value to be an LVal, got: ${element.type}`,
            severity: ErrorSeverity.InvalidInput,
            nodePath: element,
          });
          hasError = true;
          continue;
        }
        const value: InstructionValue = {
          kind: "PropertyLoad",
          loc,
          object: { ...objectPlace },
          property: key.node.name,
          optional: false, // Key of ObjectPattern (evaluation of LVal) cannot be optional.
        };
        lowerAssignment(builder, loc, kind, element, value);
      }
      return hasError
        ? { kind: "UnsupportedNode", node: lvalueNode, loc }
        : objectPlace;
    }
    default: {
      builder.pushError({
        reason: `(BuildHIR::lowerAssignment) Handle ${lvaluePath.type} assignments`,
        severity: ErrorSeverity.Todo,
        nodePath: lvaluePath,
      });
      return { kind: "UnsupportedNode", node: lvalueNode, loc };
    }
  }
}

function captureScopes({ from, to }: { from: Scope; to: Scope }): Set<Scope> {
  let scopes: Set<Scope> = new Set();
  while (from) {
    scopes.add(from);

    if (from === to) {
      break;
    }

    from = from.parent;
  }
  return scopes;
}

function gatherCapturedDeps(
  builder: HIRBuilder,
  fn: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
  componentScope: Scope
): Array<Place> {
  const captured: Set<Place> = new Set();

  // Capture all the scopes from the parent of this function up to and including
  // the component scope.
  const pureScopes: Set<Scope> = captureScopes({
    from: fn.scope.parent,
    to: componentScope,
  });

  fn.get("body").traverse({
    Expression(path) {
      let obj = path;
      while (obj.isMemberExpression()) {
        obj = obj.get("object");
      }

      if (!obj.isIdentifier()) {
        return;
      }

      const binding = obj.scope.getBinding(obj.node.name);
      if (binding === undefined || !pureScopes.has(binding.scope)) {
        return;
      }

      path.skip();
      captured.add(lowerExpressionToPlace(builder, path));
    },
  });

  return [...captured];
}
