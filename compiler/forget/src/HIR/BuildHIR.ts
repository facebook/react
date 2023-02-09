/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath, Scope } from "@babel/traverse";
import * as t from "@babel/types";
import invariant from "invariant";
import { CompilerError, ErrorSeverity } from "../CompilerError";
import { Err, Ok, Result } from "../Utils/Result";
import { assertExhaustive } from "../Utils/utils";
import {
  BlockId,
  BranchTerminal,
  Case,
  Effect,
  GeneratedSource,
  GotoVariant,
  HIRFunction,
  IfTerminal,
  InstructionKind,
  InstructionValue,
  JsxAttribute,
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
  func: NodePath<t.Function>,
  capturedRefs: t.Identifier[] = []
): Result<HIRFunction, CompilerError> {
  const env = new Environment();
  const builder = new HIRBuilder(env, capturedRefs);
  const context: Place[] = [];

  for (const ref of capturedRefs ?? []) {
    context.push({
      kind: "Identifier",
      identifier: builder.resolveBinding(ref),
      effect: Effect.Unknown,
      loc: GeneratedSource,
    });
  }

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
    } else if (param.isObjectPattern()) {
      const place: Place = {
        kind: "Identifier",
        identifier: builder.makeTemporary(),
        effect: Effect.Unknown,
        loc: param.node.loc ?? GeneratedSource,
      };
      params.push(place);
      lowerAssignment(
        builder,
        param.node.loc ?? GeneratedSource,
        InstructionKind.Let,
        param,
        place
      );
    } else {
      builder.errors.push({
        reason: `(BuildHIR::lower) Handle ${param.node.type} params`,
        severity: ErrorSeverity.Todo,
        nodePath: param,
      });
    }
  });

  const body = func.get("body");
  if (body.isExpression()) {
    const fallthrough = builder.reserve("block");
    const terminal: ReturnTerminal = {
      kind: "return",
      loc: GeneratedSource,
      value: lowerExpressionToPlace(builder, body),
      id: makeInstructionId(0),
    };
    builder.terminateWithContinuation(terminal, fallthrough);
  } else if (body.isBlockStatement()) {
    lowerStatement(builder, body);
  } else {
    builder.errors.push({
      reason: `(BuildHIR::lower) Unexpected function body kind: ${body.type}}`,
      severity: ErrorSeverity.InvalidInput,
      nodePath: body,
    });
  }

  if (builder.errors.hasErrors()) {
    return Err(builder.errors);
  }

  return Ok({
    id,
    params,
    body: builder.build(),
    context,
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
      builder.terminate(terminal, "block");
      return;
    }
    case "ReturnStatement": {
      const stmt = stmtPath as NodePath<t.ReturnStatement>;
      const argument = stmt.get("argument");
      const value =
        argument.node != null
          ? lowerExpressionToPlace(builder, argument as NodePath<t.Expression>)
          : null;
      const terminal: ReturnTerminal = {
        kind: "return",
        loc: stmt.node.loc ?? GeneratedSource,
        value,
        id: makeInstructionId(0),
      };
      builder.terminate(terminal, "block");
      return;
    }
    case "IfStatement": {
      const stmt = stmtPath as NodePath<t.IfStatement>;
      //  Block for code following the if
      const continuationBlock = builder.reserve("block");
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
      builder.terminateWithContinuation(terminal, continuationBlock);
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
      builder.terminate(
        {
          kind: "goto",
          block,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        },
        "block"
      );
      return;
    }
    case "ContinueStatement": {
      const stmt = stmtPath as NodePath<t.ContinueStatement>;
      const block = builder.lookupContinue(stmt.node.label?.name ?? null);
      builder.terminate(
        {
          kind: "goto",
          block,
          variant: GotoVariant.Continue,
          id: makeInstructionId(0),
        },
        "block"
      );
      return;
    }
    case "ForStatement": {
      const stmt = stmtPath as NodePath<t.ForStatement>;

      const testBlock = builder.reserve("loop");
      //  Block for code following the loop
      const continuationBlock = builder.reserve("block");

      const initBlock = builder.enter("loop", (blockId) => {
        const init = stmt.get("init");
        if (!init.isVariableDeclaration()) {
          builder.errors.push({
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

      const updateBlock = builder.enter("loop", (blockId) => {
        const update = stmt.get("update");
        if (update.node == null) {
          builder.errors.push({
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
        {
          kind: "for",
          loc: stmtNode.loc ?? GeneratedSource,
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
        builder.errors.push({
          reason: `(BuildHIR::lowerStatement) Handle empty test in ForStatement`,
          severity: ErrorSeverity.Todo,
          nodePath: stmt,
        });
      } else {
        builder.terminateWithContinuation(
          {
            kind: "branch",
            test: lowerExpressionToPlace(
              builder,
              test as NodePath<t.Expression>
            ),
            consequent: bodyBlock,
            alternate: continuationBlock.id,
            id: makeInstructionId(0),
          },
          continuationBlock
        );
      }
      return;
    }
    case "WhileStatement": {
      const stmt = stmtPath as NodePath<t.WhileStatement>;
      //  Block used to evaluate whether to (re)enter or exit the loop
      const conditionalBlock = builder.reserve("loop");
      //  Block for code following the loop
      const continuationBlock = builder.reserve("block");
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
      const loc = stmt.node.loc ?? GeneratedSource;
      builder.terminateWithContinuation(
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
      /**
       * The conditional block is empty and exists solely as conditional for
       * (re)entering or exiting the loop
       */
      const test = lowerExpressionToPlace(builder, stmt.get("test"));
      const terminal: BranchTerminal = {
        kind: "branch",
        test,
        consequent: loopBlock,
        alternate: continuationBlock.id,
        id: makeInstructionId(0),
      };
      //  Complete the conditional and continue with code after the loop
      builder.terminateWithContinuation(terminal, continuationBlock);
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
          const continuationBlock = builder.reserve("block");
          builder.label(label, continuationBlock.id, () => {
            lowerStatement(builder, stmt.get("body"));
          });
          builder.terminateWithContinuation(
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
      const continuationBlock = builder.reserve("block");
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
        const testExpr = case_.get("test");
        if (testExpr.node == null) {
          if (hasDefault) {
            builder.errors.push({
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
        let test: Place | null = null;
        if (testExpr.node != null) {
          switch (testExpr.node.type) {
            case "Identifier":
            case "StringLiteral":
            case "NumericLiteral":
            case "NullLiteral":
            case "BooleanLiteral":
            case "BigIntLiteral": {
              // ok
              break;
            }
            default: {
              builder.errors.push({
                reason:
                  "(BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported",
                severity: ErrorSeverity.Todo,
                nodePath: testExpr,
              });
            }
          }
          test = lowerExpressionToPlace(
            builder,
            testExpr as NodePath<t.Expression>
          );
        }
        cases.push({
          test,
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
        builder.errors.push({
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
    case "ForOfStatement":
    case "ForInStatement":
    case "DoWhileStatement":
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
      builder.errors.push({
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
          builder.errors.push({
            reason: `(BuildHIR::lowerExpression) Handle ${propertyPath.type} properties in ObjectExpression`,
            severity: ErrorSeverity.Todo,
            nodePath: propertyPath,
          });
          hasError = true;
          continue;
        }
        const key = propertyPath.node.key;
        if (key.type !== "Identifier") {
          builder.errors.push({
            reason: `(BuildHIR::lowerExpression) Expected Identifier, got ${key.type} key in ObjectExpression`,
            severity: ErrorSeverity.InvalidInput,
            nodePath: propertyPath,
          });
          hasError = true;
          continue;
        }
        const valuePath = propertyPath.get("value");
        if (!valuePath.isExpression()) {
          builder.errors.push({
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
          builder.errors.push({
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
        builder.errors.push({
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
          builder.errors.push({
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
        builder.errors.push({
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
            builder.errors.push({
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
            builder.errors.push({
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
        builder.errors.push({
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
    case "SequenceExpression": {
      const expr = exprPath as NodePath<t.SequenceExpression>;
      const exprLoc = expr.node.loc ?? GeneratedSource;

      let last: Place | null = null;
      for (const item of expr.get("expressions")) {
        last = lowerExpressionToPlace(builder, item);
      }
      if (last === null) {
        builder.errors.push({
          reason: `(BuildHIR::lowerExpression) Expected SequenceExpression to have at least one expression`,
          severity: ErrorSeverity.InvalidInput,
          nodePath: expr,
        });
        return { kind: "UnsupportedNode", node: expr.node, loc: exprLoc };
      }
      return last;
    }
    case "ConditionalExpression": {
      const expr = exprPath as NodePath<t.ConditionalExpression>;
      const exprLoc = expr.node.loc ?? GeneratedSource;

      //  Block for code following the if
      const continuationBlock = builder.reserve(builder.currentBlockKind());
      const testBlock = builder.reserve("value");
      const place = buildTemporaryPlace(builder, exprLoc);

      //  Block for the consequent (if the test is truthy)
      const consequentBlock = builder.enter("value", (blockId) => {
        builder.push({
          id: makeInstructionId(0),
          lvalue: { kind: InstructionKind.Reassign, place: { ...place } },
          value: lowerExpressionToPlace(builder, expr.get("consequent")),
          loc: exprLoc,
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
        builder.push({
          id: makeInstructionId(0),
          lvalue: { kind: InstructionKind.Reassign, place: { ...place } },
          value: lowerExpressionToPlace(builder, expr.get("alternate")),
          loc: exprLoc,
        });
        return {
          kind: "goto",
          block: continuationBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });

      builder.terminateWithContinuation(
        {
          kind: "ternary",
          fallthrough: continuationBlock.id,
          id: makeInstructionId(0),
          test: testBlock.id,
          loc: exprLoc,
        },
        testBlock
      );
      const testPlace = lowerExpressionToPlace(builder, expr.get("test"));
      builder.terminateWithContinuation(
        {
          kind: "branch",
          test: { ...testPlace },
          consequent: consequentBlock,
          alternate: alternateBlock,
          id: makeInstructionId(0),
        },
        continuationBlock
      );
      return place;
    }
    case "LogicalExpression": {
      const expr = exprPath as NodePath<t.LogicalExpression>;
      const exprLoc = expr.node.loc ?? GeneratedSource;
      const continuationBlock = builder.reserve(builder.currentBlockKind());
      const testBlock = builder.reserve("value");
      const place = buildTemporaryPlace(builder, exprLoc);
      const leftPlace = buildTemporaryPlace(
        builder,
        expr.get("left").node.loc ?? GeneratedSource
      );
      const consequent = builder.enter("value", () => {
        builder.push({
          id: makeInstructionId(0),
          lvalue: { kind: InstructionKind.Reassign, place: { ...place } },
          value: { ...leftPlace },
          loc: exprLoc,
        });
        return {
          kind: "goto",
          block: continuationBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });
      const alternate = builder.enter("value", () => {
        builder.push({
          id: makeInstructionId(0),
          lvalue: { kind: InstructionKind.Reassign, place: { ...place } },
          value: lowerExpressionToPlace(builder, expr.get("right")),
          loc: exprLoc,
        });
        return {
          kind: "goto",
          block: continuationBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });
      builder.terminateWithContinuation(
        {
          kind: "logical",
          fallthrough: continuationBlock.id,
          id: makeInstructionId(0),
          test: testBlock.id,
          operator: expr.node.operator,
          loc: exprLoc,
        },
        testBlock
      );
      builder.push({
        id: makeInstructionId(0),
        lvalue: { kind: InstructionKind.Reassign, place: { ...leftPlace } },
        value: lowerExpressionToPlace(builder, expr.get("left")),
        loc: exprLoc,
      });
      builder.terminateWithContinuation(
        {
          kind: "branch",
          test: { ...leftPlace },
          consequent,
          alternate,
          id: makeInstructionId(0),
        },
        continuationBlock
      );
      return place;
    }
    case "AssignmentExpression": {
      const expr = exprPath as NodePath<t.AssignmentExpression>;
      const operator = expr.node.operator;

      if (builder.currentBlockKind() === "value") {
        // try lowering the RHS in case it also contains errors
        lowerExpressionToPlace(builder, expr.get("right"));
        builder.errors.push({
          reason: `(BuildHIR::lowerExpression) Handle AssignmentExpression within a LogicalExpression or ConditionalExpression`,
          severity: ErrorSeverity.Todo,
          nodePath: expr.parentPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }

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
        builder.errors.push({
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
            builder.errors.push({
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
          builder.errors.push({
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
      const props: Array<JsxAttribute> = [];
      let hasError = false;
      for (const attribute of opening.get("attributes")) {
        if (attribute.isJSXSpreadAttribute()) {
          const argument = lowerExpressionToPlace(
            builder,
            attribute.get("argument")
          );
          props.push({ kind: "JsxSpreadAttribute", argument });
          continue;
        }
        if (!attribute.isJSXAttribute()) {
          builder.errors.push({
            reason: `(BuildHIR::lowerExpression) Handle ${attribute.type} attributes in JSXElement`,
            severity: ErrorSeverity.Todo,
            nodePath: attribute,
          });
          hasError = true;
          continue;
        }
        const name = attribute.get("name");
        if (!name.isJSXIdentifier()) {
          builder.errors.push({
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
            builder.errors.push({
              reason: `(BuildHIR::lowerExpression) Handle ${valueExpr.type} attribute values in JSXElement`,
              severity: ErrorSeverity.Todo,
              nodePath: valueExpr,
            });
            hasError = true;
            continue;
          }
          const expression = valueExpr.get("expression");
          if (!expression.isExpression()) {
            builder.errors.push({
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
        props.push({ kind: "JsxAttribute", name: prop, place: value });
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
      const captured = gatherCapturedDeps(builder, expr, componentScope);

      // TODO(gsn): In the future, we could only pass in the context identifiers
      // that are actually used by this function and it's nested functions, rather
      // than all context identifiers.
      //
      // This isn't a problem in practice because use Babel's scope analysis to
      // identify the correct references.
      const lowering = lower(expr, [
        ...builder.context,
        ...captured.identifiers,
      ]);
      let loweredFunc: HIRFunction;
      if (lowering.isErr()) {
        lowering
          .unwrapErr()
          .details.forEach((detail) => builder.errors.pushErrorDetail(detail));
        return {
          kind: "UnsupportedNode",
          node: exprNode,
          loc: exprLoc,
        };
      }
      loweredFunc = lowering.unwrap();
      return {
        kind: "FunctionExpression",
        name,
        loweredFunc,
        dependencies: captured.refs,
        expr: expr.node,
        loc: exprLoc,
      };
    }
    case "TaggedTemplateExpression": {
      const expr = exprPath as NodePath<t.TaggedTemplateExpression>;
      if (expr.get("quasi").get("expressions").length !== 0) {
        builder.errors.push({
          reason:
            "(BuildHIR::lowerExpression) Handle tagged template with interpolations",
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
        builder.errors.push({
          reason:
            "(BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value",
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
    case "TemplateLiteral": {
      const expr = exprPath as NodePath<t.TemplateLiteral>;
      const subexprs = expr.get("expressions");
      const quasis = expr.get("quasis");

      if (subexprs.length !== quasis.length - 1) {
        builder.errors.push({
          reason: `(BuildHIR::lowerExpression) Unexpected quasi and subexpression lengths in TemplateLiteral.`,
          severity: ErrorSeverity.InvalidInput,
          nodePath: exprPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }

      if (subexprs.some((e) => !e.isExpression())) {
        builder.errors.push({
          reason: `(BuildHIR::lowerAssignment) Handle TSType in TemplateLiteral.`,
          severity: ErrorSeverity.Todo,
          nodePath: exprPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }

      const subexprPlaces = subexprs.map((e) =>
        lowerExpressionToPlace(builder, e as NodePath<t.Expression>)
      );

      return {
        kind: "TemplateLiteral",
        subexprs: subexprPlaces,
        quasis: expr.get("quasis").map((q) => q.node.value),
        loc: exprLoc,
      };
    }
    case "UnaryExpression": {
      let expr = exprPath as NodePath<t.UnaryExpression>;
      return {
        kind: "UnaryExpression",
        operator: expr.node.operator,
        value: lowerExpressionToPlace(builder, expr.get("argument")),
        loc: exprLoc,
      };
    }
    case "TypeCastExpression": {
      let expr = exprPath as NodePath<t.TypeCastExpression>;
      return {
        kind: "TypeCastExpression",
        value: lowerExpressionToPlace(builder, expr.get("expression")),
        type: expr.get("typeAnnotation").node,
        loc: exprLoc,
      };
    }
    case "UpdateExpression": {
      let expr = exprPath as NodePath<t.UpdateExpression>;
      const argument = expr.get("argument");
      if (!argument.isIdentifier()) {
        builder.errors.push({
          reason: `(BuildHIR::lowerExpression) Handle UpdateExpression with ${argument.type} argument`,
          severity: ErrorSeverity.Todo,
          nodePath: exprPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }
      if (expr.node.prefix) {
        builder.errors.push({
          reason: `(BuildHIR::lowerExpression) Handle prefix UpdateExpression`,
          severity: ErrorSeverity.Todo,
          nodePath: exprPath,
        });
        return { kind: "UnsupportedNode", node: exprNode, loc: exprLoc };
      }
      const temp = buildTemporaryPlace(
        builder,
        expr.node.loc ?? GeneratedSource
      );
      builder.push({
        id: makeInstructionId(0),
        lvalue: { place: { ...temp }, kind: InstructionKind.Const },
        value: {
          kind: "Primitive",
          value: 1,
          loc: expr.node.loc ?? GeneratedSource,
        },
        loc: expr.node.loc ?? GeneratedSource,
      });
      const identifier = argument as NodePath<t.Identifier>;
      const place = lowerExpressionToPlace(builder, identifier);
      builder.push({
        id: makeInstructionId(0),
        lvalue: { place: { ...place }, kind: InstructionKind.Reassign },
        value: {
          kind: "BinaryExpression",
          operator: expr.node.operator === "++" ? "+" : "-",
          left: { ...place },
          right: { ...temp },
          loc: exprLoc,
        },
        loc: exprLoc,
      });
      return place;
    }
    default: {
      builder.errors.push({
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
      builder.errors.push({
        reason: `(BuildHIR::lowerMemberExpression) Handle ${property.type} property`,
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
      builder.errors.push({
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

function lowerJsxElementName(
  builder: HIRBuilder,
  exprPath: NodePath<
    t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName
  >
): Place {
  const exprNode = exprPath.node;
  const exprLoc = exprNode.loc ?? GeneratedSource;
  if (!exprPath.isJSXIdentifier()) {
    builder.errors.push({
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
      builder.errors.push({
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
      builder.errors.push({
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
          builder.errors.push({
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
          builder.errors.push({
            reason:
              "(BuildHIR::lowerAssignment) Expected private name to appear as a non-computed property",
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
          builder.errors.push({
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
          builder.errors.push({
            reason: `(BuildHIR::lowerAssignment) Handle ${property.type} properties in ObjectPattern`,
            severity: ErrorSeverity.Todo,
            nodePath: property,
          });
          hasError = true;
          continue;
        }
        const key = property.get("key");
        if (!key.isIdentifier()) {
          builder.errors.push({
            reason: `(BuildHIR::lowerAssignment) Handle ${key.type} keys in ObjectPattern`,
            severity: ErrorSeverity.Todo,
            nodePath: key,
          });
          hasError = true;
          continue;
        }
        const element = property.get("value");
        if (!element.isLVal()) {
          builder.errors.push({
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
      builder.errors.push({
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
): { identifiers: t.Identifier[]; refs: Place[] } {
  const capturedIds: Set<t.Identifier> = new Set();
  const capturedRefs: Set<Place> = new Set();

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
      capturedIds.add(binding.identifier);
      capturedRefs.add(lowerExpressionToPlace(builder, path));
    },
  });

  return { identifiers: [...capturedIds], refs: [...capturedRefs] };
}
