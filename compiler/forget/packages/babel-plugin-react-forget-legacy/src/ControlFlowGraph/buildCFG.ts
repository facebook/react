import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { pathUnion } from "../Common/PathUnion";
import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import CFGBuilder from "./CFGBuilder";
import {
  CFG,
  IfTerminal,
  ReturnTerminal,
  Terminal,
  ThrowTerminal,
} from "./ControlFlowGraph";

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
export function buildCFG(func: IR.Func): CFG {
  const builder = new CFGBuilder();
  for (const topLevel of func.body) {
    buildStatement(builder, topLevel.ast, topLevel);
  }
  return builder.build();
}

/**
 * Helper to lower a statement
 */
function buildStatement(
  builder: CFGBuilder,
  stmtPath: NodePath<t.Statement>,
  parent: IR.FuncTopLevel,
  label: string | null = null
) {
  builder.associateParentBlock(parent);
  const stmt = pathUnion(stmtPath);
  switch (stmt.type) {
    case "ThrowStatement": {
      /**
       * TODO: consider what to do if there is a try/catch
       * one idea is to emit an instruction in the catch block to tell React
       * that the memo cache is invalid (not sure that it is though)
       */
      const terminal: ThrowTerminal = { kind: "throw" };
      builder.terminate(terminal);
      return;
    }
    case "ReturnStatement": {
      const argument = stmt.get("argument");
      const fallthrough = builder.reserve();
      const terminal: ReturnTerminal = {
        kind: "return",
        value: hasNode(argument) ? argument : null,
        fallthrough: {
          block: fallthrough.id,
          tests: builder.controlExpressions(),
        },
      };
      builder.terminateWithContinuation(terminal, fallthrough);
      return;
    }
    case "IfStatement": {
      //  Block for code following the if
      const continuationBlock = builder.reserve();
      builder.condition(stmt.get("test"), () => {
        //  Block for the consequent (if the test is truthy)
        const consequentBlock = builder.enter((blockId) => {
          // TODO: add associateParentBlock() to all enter calls
          // or maybe make it a required arg (?)
          buildStatement(builder, stmt.get("consequent"), parent);
          return {
            kind: "goto",
            block: continuationBlock.id,
            fallthrough: null,
            tests: null,
          };
        });
        //  Block for the alternate (if the test is not truthy)
        let alternateBlock = null;
        const alternate = stmt.get("alternate");
        if (hasNode(alternate)) {
          alternateBlock = builder.enter((blockId) => {
            buildStatement(builder, alternate, parent);
            return {
              kind: "goto",
              block: continuationBlock.id,
              fallthrough: null,
              tests: null,
            };
          });
        } else {
          //  If there is no else clause, use the continuation directly
          alternateBlock = continuationBlock.id;
        }
        const terminal: IfTerminal = {
          kind: "if",
          test: stmt.get("test"),
          consequent: consequentBlock,
          alternate: alternateBlock,
        };
        builder.terminateWithContinuation(terminal, continuationBlock);
      });
      return;
    }
    case "BlockStatement": {
      stmt.get("body").forEach((s) => buildStatement(builder, s, parent));
      return;
    }
    case "BreakStatement": {
      const block = builder.lookupBreak(stmt.node.label?.name ?? null);
      const continuationBlock = builder.reserve();
      builder.terminateWithContinuation(
        {
          kind: "goto",
          block,
          // An unlabeled break within a switch statement only bypasses the fallthrough
          // branch, which is already reachable otherwise. This type of break doesn't
          // bypass normal control flow and doesn't need to record a fallthrough.
          fallthrough: {
            block: continuationBlock.id,
            tests: builder.controlExpressions(),
          },
        },
        continuationBlock
      );
      return;
    }
    case "ContinueStatement": {
      const block = builder.lookupContinue(stmt.node.label?.name ?? null);
      const continuationBlock = builder.reserve();
      builder.terminateWithContinuation(
        {
          kind: "goto",
          block,
          fallthrough: {
            block: continuationBlock.id,
            tests: builder.controlExpressions(),
          },
        },
        continuationBlock
      );
      return;
    }
    case "ForInStatement": {
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
            buildStatement(builder, stmt.get("body"), parent);
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
          fallthrough: null,
        },
        conditionalBlock
      );
      /**
       * Terminate the conditional block using the <right> value as the test condition:
       * this conceptually represents that the value of <right> influences which branch
       * is taken (if it has properties enter the loop, if no properties exit to the continuation)
       */
      const terminal: IfTerminal = {
        kind: "if",
        test: stmt.get("right"),
        consequent: loopBlock,
        alternate: continuationBlock.id,
      };
      builder.terminateWithContinuation(terminal, continuationBlock);
      return;
    }
    case "ForOfStatement": {
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
            buildStatement(builder, stmt.get("body"), parent);
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
          fallthrough: null,
        },
        conditionalBlock
      );
      /**
       * Terminate the conditional block using the <right> value as the test condition:
       * this conceptually represents that the value of <right> influences which branch
       * is taken (even though it isn't actually a boolean check in practice)
       */
      const terminal: IfTerminal = {
        kind: "if",
        test: stmt.get("right"),
        consequent: loopBlock,
        alternate: continuationBlock.id,
      };
      builder.terminateWithContinuation(terminal, continuationBlock);
      return;
    }
    case "ForStatement": {
      /**
       * The initializer is evaluated once prior to entering the loop.
       * here we are not concerned about scoping, so we can push the
       * initializer to the end of of the block leading up to the loop
       */
      const init = stmt.get("init");
      if (hasNode(init)) {
        builder.push(init);
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
      if (hasNode(update)) {
        updateBlock.body.push(
          stmt.get("update") as any as NodePath<t.Statement>
        );
      }
      builder.complete(updateBlock, {
        kind: "goto",
        block: conditionalBlock.id,
        fallthrough: null,
      });
      /**
       * Construct the loop itself: the loop body wraps around to the update block
       * and the update block is also set as the `continue` target
       */
      const loopBlock = builder.enter((blockId) => {
        return builder.loop(label, updateBlock.id, continuationBlock.id, () => {
          buildStatement(builder, stmt.get("body"), parent);
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
          fallthrough: null,
        },
        conditionalBlock
      );

      let terminal: Terminal;
      const test = stmt.get("test");
      if (hasNode(test)) {
        /**
         * Terminate the conditional block with the test conditional of the for statement:
         * if the condition is true enter the loop block, else exit to the continuation
         */
        terminal = {
          kind: "if",
          test,
          consequent: loopBlock,
          alternate: continuationBlock.id,
        };
      } else {
        /**
         * If there is no test, then the "conditional" block unconditionally re-enters the loop.
         * this will create an indirection, but `shrink()` will eliminate this in post-processing.
         */
        terminal = {
          kind: "goto",
          block: loopBlock,
          fallthrough: null,
        };
      }
      builder.terminateWithContinuation(terminal, continuationBlock);
      return;
    }
    case "DoWhileStatement": {
      //  Block for code following the loop
      const continuationBlock = builder.reserve();
      //  Loop body
      const loopBlock = builder.enter((loopBlock) => {
        return builder.loop(label, loopBlock, continuationBlock.id, () => {
          buildStatement(builder, stmt.get("body"), parent);
          /**
           * the loop terminates with the while condition, either looping
           * around (consequent) or exiting to the continuation (alternate)
           */
          const terminal: IfTerminal = {
            kind: "if",
            test: stmt.get("test"),
            consequent: loopBlock,
            alternate: continuationBlock.id,
          };
          return terminal;
        });
      });
      //  do-while unconditionally enters the loop
      builder.terminateWithContinuation(
        { kind: "goto", block: loopBlock, fallthrough: null },
        continuationBlock
      );
      return;
    }
    case "WhileStatement": {
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
            buildStatement(builder, stmt.get("body"), parent);
            return {
              kind: "goto",
              block: conditionalBlock.id,
              fallthrough: null,
              tests: null,
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
          fallthrough: null,
        },
        conditionalBlock
      );
      /**
       * The conditional block is empty and exists solely as conditional for
       * (re)entering or exiting the loop
       */
      const terminal: IfTerminal = {
        kind: "if",
        test: stmt.get("test"),
        consequent: loopBlock,
        alternate: continuationBlock.id,
      };
      //  Complete the conditional and continue with code after the loop
      builder.terminateWithContinuation(terminal, continuationBlock);
      return;
    }
    case "LabeledStatement": {
      const label = stmt.node.label.name;
      const body = stmt.get("body");
      switch (body.node.type) {
        case "ForInStatement":
        case "ForOfStatement":
        case "ForStatement":
        case "WhileStatement":
        case "DoWhileStatement": {
          // Labeled loops can not only break out of the loop to the subsequent code,
          // but may also continue to a subsequent iteration of the loop. This means
          // the label must be associated specifically with the loop statement (and
          // the block generated to test for (re)entry to the block), so special-case
          // by passing the label down.
          buildStatement(builder, stmt.get("body"), parent, label);
          break;
        }
        default: {
          // All other statements create a continuation block to allow `break` to jump
          // to the continuation.
          const continuationBlock = builder.reserve();
          builder.label(label, continuationBlock.id, () => {
            buildStatement(builder, stmt.get("body"), parent);
          });
          // TODO: if there is no break, this can cause code to be split across
          // two blocks unnecessarily (ie where the continuation has only one
          // incoming edge). shrink() could detect this case and merge the blocks.
          builder.terminateWithContinuation(
            {
              kind: "goto",
              block: continuationBlock.id,
              fallthrough: null,
            },
            continuationBlock
          );
        }
      }
      return;
    }
    case "SwitchStatement": {
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
        if (!hasNode(test)) {
          invariant(
            !hasDefault,
            "Expected at most one `default` branch, this code should have failed to parse"
          );
          hasDefault = true;
        }
        const block = builder.enter((_blockId) => {
          /**
           * Use loop() to save the break target, passing null for the continue target
           * since switch doesn't support continue
           */
          return builder.switch(
            stmt.get("discriminant"),
            continuationBlock.id,
            () => {
              case_
                .get("consequent")
                .forEach((consequent) =>
                  buildStatement(builder, consequent, parent)
                );
              /**
               * always generate a fallthrough, this may be dead code if there was
               * an explicit break
               */
              return {
                kind: "goto",
                block: fallthrough,
                fallthrough: null,
                tests: null,
              };
            }
          );
        });
        cases.push({ test: hasNode(test) ? test : null, block });
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

      builder.terminateWithContinuation(
        { kind: "switch", test: stmt.get("discriminant"), cases },
        continuationBlock
      );
      return;
    }
    case "TryStatement": {
      /**
       * NOTE: Accurately modeling control flow within a try statement would require treating
       * effectively every expression as a possible branch point (since almost any expression can throw).
       * Instead, we model the try statement as an atomic unit from a control-flow perspective,
       * and rely on other passes to handle codegen for try statements
       */
      buildStatement(builder, stmt.get("block"), parent);
      const handler = stmt.get("handler");
      if (hasNode(handler)) {
        //  TODO: consider whether we need to track the param
        buildStatement(builder, handler.get("body"), parent);
      }
      const finalizer = stmt.get("finalizer");
      if (hasNode(finalizer)) {
        buildStatement(builder, finalizer, parent);
      }
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
    case "ExpressionStatement":
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
    case "VariableDeclaration":
    case "WithStatement": {
      builder.push(stmtPath);
      return;
    }
    default: {
      return assertExhaustive(
        stmt,
        `Unsupported statement kind '${
          (stmt as any as NodePath<t.Statement>).type
        }'`
      );
    }
  }
}

/**
 * Equivalent to `NodePath.hasNode()` which is missing from older versions of
 * @babel.
 */
function hasNode<T>(path: NodePath<T | null | undefined>): path is NodePath<T> {
  return path.node != null;
}
