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
  Capability,
  HIRFunction,
  Identifier,
  IfTerminal,
  InstructionValue,
  Place,
  ReturnTerminal,
  Terminal,
  ThrowTerminal,
} from "./HIR";
import HIRBuilder from "./HIRBuilder";
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
export function lower(func: NodePath<t.Function>): HIRFunction {
  const builder = new HIRBuilder();

  const id =
    func.isFunctionDeclaration() && func.node.id != null
      ? builder.resolveIdentifier(func.node.id)
      : null;

  const params: Array<Identifier> = [];
  func.node.params.forEach((param) => {
    todoInvariant(t.isIdentifier(param), "todo: support non-identifier params");
    params.push(builder.resolveIdentifier(param));
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
    path: func,
    id,
    params,
    body: builder.build(),
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
      const terminal: ThrowTerminal = { kind: "throw", value };
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
        value,
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
        fallthrough:
          alternateBlock !== continuationBlock.id ? continuationBlock.id : null,
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
      });
      return;
    }
    case "ContinueStatement": {
      const stmt = stmtPath as NodePath<t.ContinueStatement>;
      const block = builder.lookupContinue(stmt.node.label?.name ?? null);
      builder.terminate({
        kind: "goto",
        block,
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
              fallthrough: null,
              tests: null,
            };
          }
        );
      });
      //  End the block leading up to the loop and jump to the conditional block
      builder.terminateWithContinuation(
        {
          kind: "goto",
          block: conditionalBlock.id,
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
        fallthrough: continuationBlock.id, // TODO: improve loop handling
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
              fallthrough: null,
              tests: null,
            };
          }
        );
      });
      //  End the block leading up to the loop and jump to the conditional block
      builder.terminateWithContinuation(
        {
          kind: "goto",
          block: conditionalBlock.id,
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
        fallthrough: continuationBlock.id, // TODO: improve loop handling
      };
      builder.terminateWithContinuation(terminal, continuationBlock);
      return;
    }
    case "ForStatement": {
      const stmt = stmtPath as NodePath<t.ForStatement>;
      /**
       * The initializer is evaluated once prior to entering the loop.
       * here we are not concerned about scoping, so we can push the
       * initializer to the end of of the block leading up to the loop
       */
      const init = stmt.get("init");
      if (init.hasNode()) {
        // builder.push(init);
        throw new Error("todo: lower initializer in ForStatement");
      }
      //  Block used to evaluate whether to (re)enter or exit the loop
      const conditionalBlock = builder.reserve();
      //  Block for code following the loop
      const continuationBlock = builder.reserve();
      /**
       * Block for the updater, which runs after each iteration (including upon `continue`)
       * Generally this would increment or decrement the loop index variable
       */
      const updateBlock = builder.reserve();
      const update = stmt.get("update");
      if (update.hasNode()) {
        // updateBlock[1].push(stmt.get("update") as any as NodePath<t.Statement>);
        throw new Error("todo: lower updater for ForStatement");
      }
      builder.complete(updateBlock, {
        kind: "goto",
        block: conditionalBlock.id,
      });
      /**
       * Construct the loop itself: the loop body wraps around to the update block
       * and the update block is also set as the `continue` target
       */
      const loopBlock = builder.enter((blockId) => {
        return builder.loop(label, updateBlock.id, continuationBlock.id, () => {
          lowerStatement(builder, stmt.get("body"));
          return {
            kind: "goto",
            block: updateBlock.id,
            fallthrough: null,
          };
        });
      });
      //  End the block leading up to the loop, jumping to the conditional block
      builder.terminateWithContinuation(
        {
          kind: "goto",
          block: conditionalBlock.id,
        },
        conditionalBlock
      );

      let terminal: Terminal;
      const test = stmt.get("test");
      if (test.hasNode()) {
        /**
         * Terminate the conditional block with the test conditional of the for statement:
         * if the condition is true enter the loop block, else exit to the continuation
         */
        terminal = {
          kind: "if",
          test: lowerExpressionToPlace(builder, test),
          consequent: loopBlock,
          alternate: continuationBlock.id,
          fallthrough: continuationBlock.id, // TODO: improve loop handling
        };
      } else {
        /**
         * If there is no test, then the "conditional" block unconditionally re-enters the loop.
         * this will create an indirection, but `shrink()` will eliminate this in post-processing.
         */
        terminal = {
          kind: "goto",
          block: loopBlock,
        };
      }
      builder.terminateWithContinuation(terminal, continuationBlock);
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
            fallthrough: continuationBlock.id, // TODO: improve loop handling
          };
          return terminal;
        });
      });
      //  do-while unconditionally enters the loop
      builder.terminateWithContinuation(
        { kind: "goto", block: loopBlock },
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
            };
          }
        );
      });
      /**
       * The code leading up to the loop must jump to the conditional block,
       * to evaluate whether to enter the loop or bypass to the continuation.
       */
      builder.terminateWithContinuation(
        {
          kind: "goto",
          block: conditionalBlock.id,
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
        fallthrough: continuationBlock.id, // TODO: improve loop handling
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
             * always generate a fallthrough, this may be dead code if there was
             * an explicit break
             */
            return {
              kind: "goto",
              block: fallthrough,
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
        { kind: "switch", test, cases, fallthrough: continuationBlock.id },
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
      const kind: string = stmt.node.kind;
      invariant(
        kind === "let" || kind === "const",
        "`var` declarations are not supported, use let or const"
      );
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
            path: init as any, // TODO
          };
        }
        builder.push({
          place: id,
          value,
          path: stmt,
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
        place: null,
        value,
        path: stmt,
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
        path: stmtPath,
        place: null,
        value: { kind: "OtherStatement", path: stmtPath },
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
  switch (exprNode.type) {
    case "Identifier": {
      const expr = exprPath as NodePath<t.Identifier>;
      return lowerLVal(builder, expr);
    }
    case "NullLiteral": {
      return {
        kind: "Primitive",
        value: null,
        path: exprPath,
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
        path: exprPath,
      };
    }
    case "ObjectExpression": {
      const expr = exprPath as NodePath<t.ObjectExpression>;
      const propertyPaths = expr.get("properties");
      const properties: { [name: string]: Place } = {};
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
        properties[key.name] = value;
      }
      return {
        kind: "ObjectExpression",
        properties,
        path: exprPath,
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
        path: exprPath,
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
        path: exprPath,
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
        path: exprPath,
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
        path: exprPath,
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
            () => left,
            () => lowerExpression(builder, expr.get("right"))
          );
        }
        case "&&": {
          const left = lowerExpressionToPlace(builder, leftPath);
          return lowerConditional(
            builder,
            left,
            () => lowerExpression(builder, expr.get("right")),
            () => left
          );
        }
        case "??": {
          // test should be roughly the equivalent of `<left> != null`
          todo("Handle logical ??");
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
      const right = lowerExpression(builder, expr.get("right"));
      const operator = expr.node.operator;
      todoInvariant(operator === "=", "todo: support non-simple assignment");
      builder.push({
        path: exprPath,
        value: right,
        place: left,
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
        value: object.value,
        memberPath: [...(object.memberPath ?? []), property.node.name],
        capability: Capability.Unknown,
        path: exprPath,
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
      const props: { [prop: string]: Place } = {};
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
        props[prop] = value;
      });
      return {
        kind: "JsxExpression",
        path: exprPath,
        tag,
        props,
        children,
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
  consequent: () => InstructionValue,
  alternate: () => InstructionValue
): Place {
  const place: Place = {
    kind: "Identifier",
    value: builder.makeTemporary(),
    memberPath: null,
    capability: Capability.Readonly,
    path: null as any, // TODO
  };
  //  Block for code following the if
  const continuationBlock = builder.reserve();
  //  Block for the consequent (if the test is truthy)
  const consequentBlock = builder.enter((blockId) => {
    let value = consequent();
    builder.push({ value, place: { ...place }, path: value.path });
    return {
      kind: "goto",
      block: continuationBlock.id,
    };
  });
  //  Block for the alternate (if the test is not truthy)
  const alternateBlock = builder.enter((blockId) => {
    let value = alternate();
    builder.push({ value, place: { ...place }, path: value.path });
    return {
      kind: "goto",
      block: continuationBlock.id,
    };
  });
  const terminal: IfTerminal = {
    kind: "if",
    test,
    consequent: consequentBlock,
    alternate: alternateBlock,
    fallthrough: continuationBlock.id,
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
  const tag: string = exprPath.node.name;
  if (tag.match(/^[A-Z]/)) {
    const binding =
      exprPath.scope.getBindingIdentifier(tag) ?? GLOBALS.get(tag);
    invariant(
      binding != null,
      `Expected to find a binding for variable '%s'`,
      tag
    );
    const identifier = builder.resolveIdentifier(binding);
    const place: Place = {
      kind: "Identifier",
      value: identifier,
      memberPath: null,
      capability: Capability.Unknown,
      path: exprPath,
    };
    return place;
  } else {
    const place: Place = {
      kind: "Identifier",
      value: builder.makeTemporary(),
      memberPath: null,
      capability: Capability.Unknown,
      path: exprPath,
    };
    builder.push({
      value: { kind: "Primitive", value: tag, path: exprPath },
      path: exprPath,
      place,
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
  if (exprPath.isJSXElement()) {
    return lowerExpressionToPlace(builder, exprPath);
  } else if (exprPath.isJSXExpressionContainer()) {
    const expression = exprPath.get("expression");
    todoInvariant(expression.isExpression(), "handle empty expressions");
    return lowerExpressionToPlace(builder, expression);
  } else if (exprPath.isJSXText()) {
    const place: Place = {
      kind: "Identifier",
      value: builder.makeTemporary(),
      memberPath: null,
      capability: Capability.Unknown,
      path: exprPath,
    };
    builder.push({
      value: { kind: "JSXText", value: exprPath.node.value, path: exprPath },
      path: exprPath,
      place: { ...place },
    });
    return place;
  } else {
    const place: Place = {
      kind: "Identifier",
      value: builder.makeTemporary(),
      memberPath: null,
      capability: Capability.Unknown,
      path: exprPath,
    };
    builder.push({
      value: { kind: "OtherStatement", path: exprPath },
      path: exprPath,
      place: { ...place },
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
  const place: Place = {
    kind: "Identifier",
    value: builder.makeTemporary(),
    memberPath: null,
    capability: Capability.Unknown,
    path: exprPath,
  };
  builder.push({
    value: instr,
    path: exprPath,
    place: { ...place },
  });
  return place;
}

function lowerLVal(builder: HIRBuilder, exprPath: NodePath<t.LVal>): Place {
  const exprNode = exprPath.node;
  switch (exprNode.type) {
    case "Identifier": {
      //   const expr = exprPath as NodePath<t.Identifier>;
      //   const name: string = expr.get("name");
      const binding =
        exprPath.scope.getBindingIdentifier(exprNode.name) ??
        GLOBALS.get(exprNode.name);
      invariant(
        binding != null,
        `Expected to find a binding for variable '%s'`,
        exprNode.name
      );
      const identifier = builder.resolveIdentifier(binding);
      const place: Place = {
        kind: "Identifier",
        value: identifier,
        memberPath: null,
        capability: Capability.Unknown,
        path: exprPath,
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
        value: object.value,
        memberPath: [...(object.memberPath ?? []), propertyPath.node.name],
        capability: Capability.Unknown,
        path: exprPath,
      };
      return place;
    }
    default: {
      todo(`lowerLVal(${exprNode.type})`);
      //   assertExhaustive(exprNode, "Unexpected lval kind");
    }
  }
}
