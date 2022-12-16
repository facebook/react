/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import type { Function, Program } from "@babel/types";
import * as t from "@babel/types";
import { pathUnion } from "../Common/PathUnion";
import { assertExhaustive } from "../Common/utils";
import type { CompilerContext } from "../CompilerContext";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import { isNonMethodFunctionPath, NonMethodFunction } from "../IR/babel-utils";
import { PassKind, PassName } from "../Pass";

/**
 * React Function Inference.
 *
 * This middle end pass use heurstics to infer JavaScript functions that are
 * considered as "React Functions" and will be used as compilation units.
 *
 * The correctness of this analysis depend on
 * - Rules of Hooks, which is materalized by the eslint-plugin-hooks. E.g. we
 *   don't check reachability of the hook calls in Forget.
 * - Sanity, i.e. Forget can go wrong with big anti-patterns. E.g. calling
 *   Component directly.
 */
export default {
  name: PassName.ReactFuncsInfer,
  kind: PassKind.Prog as const,
  run,
};

export function run(program: NodePath<Program>, context: CompilerContext) {
  if (context.opts.optIn) {
    const { directives } = program.node;
    const useForget = directives.some(
      (directive) => directive.value.value === "use forget"
    );
    if (!useForget) return;
  }

  program.traverse({
    Function(func) {
      runFunc(func, context);
    },
  });
}

/**
 * Infer whether or not a @param func is a "React Function" using heuristics.
 * If it is, register it to the @param context and lower to {@link IR.Func}.
 */
export function runFunc(func: NodePath<Function>, context: CompilerContext) {
  func.traverse({
    /**
     * `Directive`s can be used as escape hatches.
     */
    Directive(directive) {
      /**
       * Enforced compilation: `function foo(){ "use forget" }`
       * This can be used to include false negative.
       */
      if (directive.node.value.value === "use forget") {
        const parentalFunc = directive.findParent(
          isNonMethodFunctionPath
        ) as NodePath<NonMethodFunction>;
        const [name, kind] = getFuncNameAndKind(parentalFunc);
        registerReactFunc(parentalFunc, name, kind, context);
      }

      /**
       * Enforced bailout: `function foo(){ "use no forget" }`
       * This can be used to exclused false positive.
       */
      if (directive.node.value.value === "use no forget") {
        // Stop the entire traversal of `func`.
        directive.stop();
        context.bailoutWithoutDiagnostic("use no forget", directive);
      }
    },

    /**
     * `JSX` presense alone is not safe enough to be considered as a ReactFunc.
     * Notably, it could be either a React Component or just a helper function.
     *
     * We may rethink how to use this information in the future.
     */
    JSX(jsx) {},

    /**
     * `CallExpression`s are where we are looking for hook calls. Similar to
     * eslint-plugin-hooks, we don't look for hook names from other places.
     */
    CallExpression(call) {
      // It's possible for a custom hook that only calls other custom hooks, so
      // the entry criteria is set to be pretty low.
      const hookCall = IR.matchHookCall(call.node);
      if (!hookCall) return;
      context.logger.logEvent({ name: "matchHookCall", kind: hookCall.kind });

      // To minimize the chance to include false positive, we furthur check
      // if the parental function looks like a Component or Hook.
      const parentalFunc = call.findParent(
        isNonMethodFunctionPath
      ) as NodePath<NonMethodFunction>;
      invariant(parentalFunc, "parentalFunc exists.");
      const [name, kind] = getFuncNameAndKind(parentalFunc);

      if (kind === IR.FuncKind.Unknown) return;

      // According to [Rule of Hooks](https://reactjs.org/docs/hooks-rules.html),
      // Hooks should only be called at the RF "Top level". But in practices,
      // block scopes e.g. `{}` and `try...catch` are allowed.
      // Although we can identify its parental React Func without issues, they
      // requires extra work to support. We'll extend their support later.
      if (!t.isFunction(call.scope.block)) {
        context.createDiagnostic({
          code: "E0004",
          path: call,
          context: null,
        });
        return;
      }

      registerReactFunc(parentalFunc, name, kind, context);
    },
  });
}

/**
 *  @returns the name and infered `FuncKind` of @param parentalFunc
 */
function getFuncNameAndKind(
  parentalFunc: NodePath<NonMethodFunction>
): [string | undefined, IR.FuncKind] {
  const funcName = getFuncName(parentalFunc);
  const isInComp = isComponentLike(parentalFunc, funcName);
  const isInHook = isHookLike(parentalFunc, funcName);
  const kind = isInComp
    ? IR.FuncKind.Component
    : isInHook
    ? IR.FuncKind.Hook
    : IR.FuncKind.Unknown;
  return [funcName, kind];
}

/**
 * Enforce FunctionBody of @param func is a BlockStatement.
 *
 * The current heuristics (occurence of hook calls) means function body is
 * likely a block (and in cases where it's not, they will be safely omitted).
 *
 * Note that it doesn't mean we couldn't expand the support to Expression-body
 * functions. We just need a thin pre pass rewriting them to BlockStatement ones
 * and the rest of the compiler pipeline will stay identical.
 */
function validateBlockBody(
  func: NodePath<Function>,
  context: CompilerContext
): boolean {
  const funcBody: NodePath<t.BlockStatement | t.Expression> = func.get("body");

  if (funcBody.isExpression()) {
    context.createDiagnostic({
      code: "E0003",
      path: funcBody,
      context: null,
    });
  }

  return funcBody.isBlockStatement();
}

/**
 * Lower @param func with @param flags to {@link IR.Func} and register it
 * into @param context
 */
function registerReactFunc(
  func: NodePath<NonMethodFunction>,
  name: IR.Name,
  kind: IR.FuncKind,
  context: CompilerContext
) {
  if (!validateBlockBody(func, context)) return;

  if (!context.irProg.funcs.has(func)) {
    context.logger.logEvent({
      name: "registerReactFunc",
      flags: { name, kind },
    });
    const irFunc = new IR.Func(
      func,
      name,
      kind,
      context.opts.flags.localMutationThroughFreeVars
    );
    context.irProg.funcs.set(func, irFunc);
  }
}

/**
 * @returns whether or not @param func is like a Component-kinded react func.
 */
function isComponentLike(
  func: NodePath<Function>,
  funcName: string | undefined
) {
  return funcName
    ? isValidComponentNameNode(funcName)
    : isForwardRefCallback(func) || isMemoCallback(func);
}

/**
 * @returns whether or not @param func is like a Hook-kinded react func.
 */
function isHookLike(func: NodePath<Function>, funcName: string | undefined) {
  return funcName && isValidHookNameNode(funcName);
}

/**
 * Checks if the @param node is a valid React Component name. React Component
 * names must always start with a non-lowercase letter. So `MyComponent` or
 * `_MyComponent` are valid component names for instance.
 */
function isValidComponentNameNode(name: string) {
  return !/^[a-z]/.test(name);
}

function isValidHookNameNode(name: string) {
  return IR.isHookLikeName(name);
}

/**
 * @return whether or not @param node is one of React's @param apiName API.
 * This was named as `isReactFunction` is eslint-plugin-hooks.
 */
function isReactAPI(node: t.Node, apiName: string) {
  return (
    (node.type === "Identifier" && node.name === apiName) ||
    (node.type === "MemberExpression" &&
      node.object.type === "Identifier" &&
      node.object.name === "React" &&
      node.property.type === "Identifier" &&
      node.property.name === apiName)
  );
}

/**
 * Checks if the @param func is a callback argument of `React.forwardRef`.
 */
function isForwardRefCallback(func: NodePath<Function>): boolean {
  return !!(
    func.parent &&
    t.isCallExpression(func.parent) &&
    isReactAPI(func.parent.callee, "forwardRef")
  );
}

/**
 * Checks if the @param func is a callback argument of `React.memo`.
 */
function isMemoCallback(func: NodePath<Function>) {
  return !!(
    func.parent &&
    t.isCallExpression(func.parent) &&
    isReactAPI(func.parent.callee, "memo")
  );
}

function getFuncName(func: NodePath<NonMethodFunction>): string | undefined {
  const node = getFuncNameNode(func);
  return t.isIdentifier(node) ? node.name : undefined;
}

/**
 * Gets the {@link t.Node} representing the name of a @param func AST.
 *
 * For function declarations it is easy.
 * For anonymous function expressions it is much harder. If you search for
 * `IsAnonymousFunctionDefinition()` in the ECMAScript spec you'll find places
 * where JS gives anonymous function expressions names. We roughly detect the
 * same AST nodes with some exceptions to better fit our use case.
 */
function getFuncNameNode(funcPath: NodePath<NonMethodFunction>) {
  const func = pathUnion(funcPath);
  switch (func.type) {
    case "FunctionDeclaration": {
      // function useHook() {}
      //
      // Function declaration or function expression names win over any
      // assignment statements or other renames.
      return func.node.id ?? undefined;
    }
    case "ArrowFunctionExpression":
    case "FunctionExpression": {
      if (t.isFunctionExpression(func.node)) {
        // const whatever = function useHook() {};
        return func.node.id ?? undefined;
      }

      if (t.isVariableDeclarator(func.parent) && func.parent.init) {
        // const useHook = () => {};
        return func.parent.id;
      }

      if (
        t.isAssignmentExpression(func.parent) &&
        func.parent.right === func.node &&
        func.parent.operator === "="
      ) {
        // useHook = () => {};
        return func.parent.left;
      }

      if (
        t.isProperty(func.parent) &&
        func.parent.value === func.node &&
        !t.isClassPrivateProperty(func.parent) &&
        !func.parent.computed
      ) {
        // {useHook: () => {}}
        // {useHook() {}}
        return func.parent.key;

        // NOTE: We could also support `ClassProperty` and `MethodDefinition`
        // here to be pedantic. However, hooks in a class are an anti-pattern. So
        // we don't allow it to error early.
        //
        // class {useHook = () => {}}
        // class {useHook() {}}
      }

      if (
        t.isAssignmentPattern(func.parent) &&
        func.parent.right === func.node
      ) {
        // const {useHook = () => {}} = {};
        // ({useHook = () => {}} = {});
        //
        // Kinda clowny, but we'd said we'd follow spec convention for
        // `IsAnonymousFunctionDefinition()` usage.
        return func.parent.left;
      }
      return undefined;
    }
    case "ObjectMethod":
      return undefined;
    default:
      assertExhaustive(func, "Unhandled func AST node");
  }
}
