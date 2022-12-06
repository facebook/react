/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import {
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
  Terminal,
  ThrowTerminal,
} from "./HIR";
import HIRBuilder, { Environment } from "./HIRBuilder";
import todo, { todoInvariant } from "./todo";

// *******************************************************************************************
// *******************************************************************************************
// ************************************* Lowering to HIR *************************************
// *******************************************************************************************
// *******************************************************************************************

const GLOBALS: Map<string, t.Identifier> = new Map([
  ["Map", t.identifier("Map")],
  ["Set", t.identifier("Set")],
  ["Math", t.identifier("Math")],
]);

// TODO: This will work as a stopgap but it isn't really correct. We need proper handling of globals
// and module-scoped variables, which means understanding module constants and imports.
function getOrAddGlobal(identifierName: string): t.Identifier {
  const ident = GLOBALS.get(identifierName);
  if (ident != null) {
    return ident;
  }
  const newIdent = t.identifier(identifierName);
  GLOBALS.set(identifierName, newIdent);
  return newIdent;
}

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
  env: Environment
): HIRFunction {
  const builder = new HIRBuilder(env);

  const id =
    func.isFunctionDeclaration() && func.node.id != null
      ? builder.resolveIdentifier(func.node.id)
      : null;

  const params: Array<Place> = [];
  func.node.params.forEach((param) => {
    todoInvariant(t.isIdentifier(param), "todo: support non-identifier params");
    const identifier = builder.resolveIdentifier(param);
    const place: Place = {
      kind: "Identifier",
      identifier,
      memberPath: null,
      effect: Effect.Unknown,
      loc: param.loc ?? GeneratedSource,
    };
    params.push(place);
  });

  const body = func.get("body");
  if (body.isExpression()) {
    todoInvariant(false, "TODO handle arrow functions");
  } else if (body.isBlockStatement()) {
    lowerStatement(builder, body);
  } else {
    invariant(false, "Unexpected function body kind");
  }

  return {
    id,
    params,
    body: builder.build(),
    generator: func.node.generator === true,
    async: func.node.async === true,
    loc: func.node.loc ?? GeneratedSource,
  };
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
      builder.terminate(terminal);
      return;
    }
    case "ReturnStatement": {
      const stmt = stmtPath as NodePath<t.ReturnStatement>;
      const argument = stmt.get("argument");
      const value = argument.hasNode()
        ? lowerExpressionToPlace(builder, argument)
        : null;
      const fallthrough = builder.reserve();
      const terminal: ReturnTerminal = {
        kind: "return",
        loc: stmt.node.loc ?? GeneratedSource,
        value,
        id: makeInstructionId(0),
      };
      builder.terminateWithContinuation(terminal, fallthrough);
      return;
    }
    case "IfStatement": {
      const stmt = stmtPath as NodePath<t.IfStatement>;
      //  Block for code following the if
      const continuationBlock = builder.reserve();
      //  Block for the consequent (if the test is truthy)
      const consequentBlock = builder.enter((blockId) => {
        lowerStatement(builder, stmt.get("consequent"));
        return {
          kind: "goto",
          block: continuationBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });
      //  Block for the alternate (if the test is not truthy)
      let alternateBlock = null;
      const alternate = stmt.get("alternate");
      if (alternate.hasNode()) {
        alternateBlock = builder.enter((blockId) => {
          lowerStatement(builder, alternate);
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
      builder.terminate({
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
      builder.terminate({
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
      const loopBlock = builder.enter((blockId) => {
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
      builder.terminateWithContinuation(terminal, continuationBlock);
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
      const loopBlock = builder.enter((blockId) => {
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
      builder.terminateWithContinuation(terminal, continuationBlock);
      return;
    }
    case "ForStatement": {
      const stmt = stmtPath as NodePath<t.ForStatement>;

      const testBlock = builder.reserve();
      //  Block for code following the loop
      const continuationBlock = builder.reserve();

      const initBlock = builder.enter((blockId) => {
        const init = stmt.get("init") as NodePath<t.VariableDeclaration>;
        todoInvariant(
          t.isVariableDeclaration(init.node),
          "handle non variable initialization in for"
        );
        lowerStatement(builder, init);
        return {
          kind: "goto",
          block: testBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });

      const updateBlock = builder.enter((blockId) => {
        const update = stmt.get("update");
        if (update.hasNode()) {
          lowerExpressionToVoid(builder, update);
        }
        return {
          kind: "goto",
          block: testBlock.id,
          variant: GotoVariant.Break,
          id: makeInstructionId(0),
        };
      });

      const bodyBlock = builder.enter((blockId) => {
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
      todoInvariant(test.hasNode(), "ForStatement without test");
      builder.terminateWithContinuation(
        {
          kind: "if",
          test: lowerExpressionToPlace(builder, test),
          consequent: bodyBlock,
          alternate: continuationBlock.id,
          fallthrough: continuationBlock.id,
          id: makeInstructionId(0),
        },
        continuationBlock
      );
      return;
    }
    case "DoWhileStatement": {
      const stmt = stmtPath as NodePath<t.DoWhileStatement>;
      //  Block for code following the loop
      const continuationBlock = builder.reserve();
      //  Loop body
      const loopBlock = builder.enter((loopBlock) => {
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
      const loopBlock = builder.enter((blockId) => {
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
      invariant(loc, "while statement must have a location");
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
      const terminal: IfTerminal = {
        kind: "if",
        test,
        consequent: loopBlock,
        alternate: continuationBlock.id,
        fallthrough: continuationBlock.id,
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
          const continuationBlock = builder.reserve();
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
      const cases = [];
      let hasDefault = false;
      for (let ii = stmt.get("cases").length - 1; ii >= 0; ii--) {
        const case_: NodePath<t.SwitchCase> = stmt.get("cases")[ii];
        const test = case_.get("test");
        if (!test.hasNode()) {
          invariant(
            !hasDefault,
            "Expected at most one `default` branch, this code should have failed to parse"
          );
          hasDefault = true;
        }
        const block = builder.enter((_blockId) => {
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
          test: test.hasNode() ? lowerExpressionToPlace(builder, test) : null,
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
      if (handler.hasNode()) {
        //  TODO: consider whether we need to track the param
        lowerStatement(builder, handler.get("body"));
      }
      const finalizer = stmt.get("finalizer");
      if (finalizer.hasNode()) {
        lowerStatement(builder, finalizer);
      }
      return;
    }
    case "VariableDeclaration": {
      const stmt = stmtPath as NodePath<t.VariableDeclaration>;
      const nodeKind: string = stmt.node.kind;
      invariant(
        nodeKind === "let" || nodeKind === "const",
        "`var` declarations are not supported, use let or const"
      );
      const kind =
        nodeKind === "let" ? InstructionKind.Let : InstructionKind.Const;
      for (const declaration of stmt.get("declarations")) {
        const id = lowerLVal(builder, declaration.get("id"));
        const init = declaration.get("init");
        let value: InstructionValue;
        if (init.hasNode()) {
          value = lowerExpression(builder, init);
        } else {
          value = {
            kind: "Primitive",
            value: undefined,
            loc: id.loc,
          };
        }
        builder.push({
          id: makeInstructionId(0),
          lvalue: { place: id, kind },
          value,
          loc: declaration.node.loc ?? GeneratedSource,
        });
      }
      return;
    }
    case "ExpressionStatement": {
      const stmt = stmtPath as NodePath<t.ExpressionStatement>;
      const expression = stmt.get("expression");
      const value = lowerExpression(builder, expression);
      if (expression.isAssignmentExpression()) {
        // instruction already emitted via lowerExpression()
        return;
      }
      builder.push({
        id: makeInstructionId(0),
        lvalue: null,
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
      builder.push({
        id: makeInstructionId(0),
        lvalue: null,
        loc: stmtPath.node.loc ?? GeneratedSource,
        value: {
          kind: "OtherStatement",
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
      return lowerLVal(builder, expr);
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
      for (const propertyPath of propertyPaths) {
        todoInvariant(
          propertyPath.isObjectProperty(),
          "Handle object property spread"
        );
        const key = propertyPath.node.key;
        invariant(key.type === "Identifier", "Unexpected private name");
        const valuePath = propertyPath.get("value");
        todoInvariant(
          valuePath.isExpression(),
          "Handle non-expression object values"
        );
        const value = lowerExpressionToPlace(builder, valuePath);
        properties.set(key.name, value);
      }
      return {
        kind: "ObjectExpression",
        properties,
        loc: exprLoc,
      };
    }
    case "ArrayExpression": {
      const expr = exprPath as NodePath<t.ArrayExpression>;
      const elements = expr.get("elements").map((element) => {
        todoInvariant(
          element.hasNode() && element.isExpression(),
          "todo: handle non-expression array elements"
        );
        return lowerExpressionToPlace(builder, element);
      });
      return {
        kind: "ArrayExpression",
        elements,
        loc: exprLoc,
      };
    }
    case "NewExpression": {
      const expr = exprPath as NodePath<t.NewExpression>;
      const calleePath = expr.get("callee");
      invariant(
        calleePath.isExpression(),
        "Call expressions only support callees that are expressions (v8 intrinsics not supported)"
      );
      const callee = lowerExpressionToPlace(builder, calleePath);
      const argPaths = expr.get("arguments");
      const args = argPaths.map((arg) => {
        todoInvariant(
          arg.isExpression(),
          "todo: support non-expression call arguments"
        );
        return lowerExpressionToPlace(builder, arg);
      });
      return {
        kind: "NewExpression",
        callee,
        args,
        loc: exprLoc,
      };
    }
    case "CallExpression": {
      const expr = exprPath as NodePath<t.CallExpression>;
      const calleePath = expr.get("callee");
      invariant(
        calleePath.isExpression(),
        "Call expressions only support callees that are expressions (v8 intrinsics not supported)"
      );
      const callee = lowerExpressionToPlace(builder, calleePath);
      const argPaths = expr.get("arguments");
      const args = argPaths.map((arg) => {
        todoInvariant(
          arg.isExpression(),
          "todo: support non-expression call arguments"
        );
        return lowerExpressionToPlace(builder, arg);
      });
      return {
        kind: "CallExpression",
        callee,
        args,
        loc: exprLoc,
      };
    }
    case "BinaryExpression": {
      const expr = exprPath as NodePath<t.BinaryExpression>;
      const leftPath = expr.get("left");
      invariant(
        leftPath.isExpression(),
        "Private names may not appear as the left hand side of a binary expression"
      );
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
      invariant(
        leftPath.isExpression(),
        "Private names may not appear as the left hand side of a binary expression"
      );
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

          const nullPlace: Place = {
            kind: "Identifier",
            identifier: builder.makeTemporary(),
            memberPath: null,
            effect: Effect.Unknown,
            loc: left.loc,
          };
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

          const condPlace: Place = {
            kind: "Identifier",
            identifier: builder.makeTemporary(),
            memberPath: null,
            effect: Effect.Unknown,
            loc: left.loc,
          };
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
      const left = lowerLVal(builder, expr.get("left"));
      const operator = expr.node.operator;

      if (operator === "=") {
        const right = lowerExpression(builder, expr.get("right"));
        builder.push({
          id: makeInstructionId(0),
          lvalue: { place: left, kind: InstructionKind.Reassign },
          value: right,
          loc: exprLoc,
        });
        return left;
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
      invariant(
        binaryOperator != null,
        `Unhandled assignment operator '${operator}'`
      );

      const right = lowerExpressionToPlace(builder, expr.get("right"));
      builder.push({
        id: makeInstructionId(0),
        lvalue: { place: left, kind: InstructionKind.Reassign },
        value: {
          kind: "BinaryExpression",
          operator: binaryOperator,
          left,
          right,
          loc: exprLoc,
        },
        loc: exprLoc,
      });
      return left;
    }
    case "MemberExpression": {
      const expr = exprPath as NodePath<t.MemberExpression>;
      const object = lowerExpressionToPlace(builder, expr.get("object"));
      invariant(object.kind === "Identifier", "scope cannot appear here");
      const property = expr.get("property");
      todoInvariant(
        property.isIdentifier(),
        "Handle non-identifier properties"
      );
      const place: Place = {
        kind: "Identifier",
        identifier: object.identifier,
        memberPath: [...(object.memberPath ?? []), property.node.name],
        effect: Effect.Unknown,
        loc: exprLoc,
      };
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
      opening.get("attributes").forEach((attribute) => {
        todoInvariant(attribute.isJSXAttribute(), "handle spread attributes");
        const name = attribute.get("name");
        todoInvariant(
          name.isJSXIdentifier(),
          "handle non-identifier jsx attribute names"
        );
        const valueExpr = attribute.get("value");
        let value;
        if (valueExpr.isJSXElement() || valueExpr.isStringLiteral()) {
          value = lowerExpressionToPlace(builder, valueExpr);
        } else {
          todoInvariant(
            valueExpr.isJSXExpressionContainer(),
            "handle other non expr containers"
          );
          const expression = valueExpr.get("expression");
          todoInvariant(expression.isExpression(), "handle empty expressions");
          value = lowerExpressionToPlace(builder, expression);
        }
        const prop: string = name.node.name;
        props.set(prop, value);
      });
      return {
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
    default: {
      todo(`lowerExpression(${exprNode.type})`);
      //   assertExhaustive(
      //     exprNode,
      //     `Unexpected expression kind '${exprNode.type}'`
      //   );
    }
  }
}

function lowerConditional(
  builder: HIRBuilder,
  test: Place,
  loc: SourceLocation,
  consequent: () => InstructionValue,
  alternate: () => InstructionValue
): Place {
  const place: Place = {
    kind: "Identifier",
    identifier: builder.makeTemporary(),
    memberPath: null,
    effect: Effect.Read,
    loc,
  };
  //  Block for code following the if
  const continuationBlock = builder.reserve();
  //  Block for the consequent (if the test is truthy)
  const consequentBlock = builder.enter((blockId) => {
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
  const alternateBlock = builder.enter((blockId) => {
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
  builder.terminateWithContinuation(terminal, continuationBlock);
  return place;
}

function lowerJsxElementName(
  builder: HIRBuilder,
  exprPath: NodePath<
    t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName
  >
): Place {
  todoInvariant(exprPath.isJSXIdentifier(), "handle non-identifier tags");
  const exprLoc = exprPath.node.loc ?? GeneratedSource;
  const tag: string = exprPath.node.name;
  if (tag.match(/^[A-Z]/)) {
    const binding =
      exprPath.scope.getBindingIdentifier(tag) ?? getOrAddGlobal(tag);
    invariant(
      binding != null,
      `Expected to find a binding for variable '%s'`,
      tag
    );
    const identifier = builder.resolveIdentifier(binding);
    const place: Place = {
      kind: "Identifier",
      identifier: identifier,
      memberPath: null,
      effect: Effect.Unknown,
      loc: exprLoc,
    };
    return place;
  } else {
    const place: Place = {
      kind: "Identifier",
      identifier: builder.makeTemporary(),
      memberPath: null,
      effect: Effect.Unknown,
      loc: exprLoc,
    };
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
    todoInvariant(expression.isExpression(), "handle empty expressions");
    return lowerExpressionToPlace(builder, expression);
  } else if (exprPath.isJSXText()) {
    const place: Place = {
      kind: "Identifier",
      identifier: builder.makeTemporary(),
      memberPath: null,
      effect: Effect.Unknown,
      loc: exprLoc,
    };
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
    invariant(
      t.isJSXFragment(exprNode) || t.isJSXSpreadChild(exprNode),
      "Expected refinement to work"
    );
    const place: Place = {
      kind: "Identifier",
      identifier: builder.makeTemporary(),
      memberPath: null,
      effect: Effect.Unknown,
      loc: exprLoc,
    };
    builder.push({
      id: makeInstructionId(0),
      value: {
        kind: "OtherStatement",
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
  const place: Place = {
    kind: "Identifier",
    identifier: builder.makeTemporary(),
    memberPath: null,
    effect: Effect.Unknown,
    loc: exprLoc,
  };
  builder.push({
    id: makeInstructionId(0),
    value: instr,
    loc: exprLoc,
    lvalue: { place: { ...place }, kind: InstructionKind.Const },
  });
  return place;
}

function lowerExpressionToVoid(
  builder: HIRBuilder,
  exprPath: NodePath<t.Expression>
): void {
  const instr = lowerExpression(builder, exprPath);
  if (instr.kind !== "Identifier") {
    const exprLoc = exprPath.node.loc ?? GeneratedSource;
    builder.push({
      id: makeInstructionId(0),
      value: instr,
      loc: exprLoc,
      lvalue: null,
    });
  }
}

function lowerLVal(builder: HIRBuilder, exprPath: NodePath<t.LVal>): Place {
  const exprNode = exprPath.node;
  const exprLoc = exprNode.loc ?? GeneratedSource;
  switch (exprNode.type) {
    case "Identifier": {
      //   const expr = exprPath as NodePath<t.Identifier>;
      //   const name: string = expr.get("name");
      const binding =
        exprPath.scope.getBindingIdentifier(exprNode.name) ??
        getOrAddGlobal(exprNode.name);
      invariant(
        binding != null,
        `Expected to find a binding for variable '%s'`,
        exprNode.name
      );
      const identifier = builder.resolveIdentifier(binding);
      const place: Place = {
        kind: "Identifier",
        identifier: identifier,
        memberPath: null,
        effect: Effect.Unknown,
        loc: exprLoc,
      };
      return place;
    }
    case "MemberExpression": {
      const expr = exprPath as NodePath<t.MemberExpression>;
      const objectPath = expr.get("object");
      todoInvariant(objectPath.isLVal(), "Support complex object assignment");
      const object = lowerLVal(builder, objectPath);
      const propertyPath = expr.get("property");
      todoInvariant(
        propertyPath.isIdentifier(),
        "Support non-identifier properties"
      );
      const place: Place = {
        kind: "Identifier",
        identifier: object.identifier,
        memberPath: [...(object.memberPath ?? []), propertyPath.node.name],
        effect: Effect.Unknown,
        loc: exprLoc,
      };
      return place;
    }
    default: {
      todo(`lowerLVal(${exprNode.type})`);
      //   assertExhaustive(exprNode, "Unexpected lval kind");
    }
  }
}
