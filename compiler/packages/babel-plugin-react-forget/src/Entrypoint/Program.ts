/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import {
  CompilerError,
  CompilerErrorDetail,
  CompilerSuggestionOperation,
  ErrorSeverity,
} from "../CompilerError";
import { CodegenFunction } from "../ReactiveScopes";
import { isComponentDeclaration } from "../Utils/ComponentDeclaration";
import { assertExhaustive } from "../Utils/utils";
import { insertGatedFunctionDeclaration } from "./Gating";
import {
  addImportsToProgram,
  findExistingImports,
  insertUseMemoCacheImportDeclaration,
  updateExistingReactImportDeclaration,
} from "./Imports";
import { addInstrumentForget } from "./Instrumentation";
import { PluginOptions, parsePluginOptions } from "./Options";
import { compileFn } from "./Pipeline";

export type CompilerPass = {
  opts: PluginOptions;
  filename: string | null;
  comments: (t.CommentBlock | t.CommentLine)[];
};

function hasUseForgetDirective(directive: t.Directive): boolean {
  return directive.value.value === "use forget";
}

function hasAnyUseForgetDirectives(directives: t.Directive[]): boolean {
  for (const directive of directives) {
    if (hasUseForgetDirective(directive)) {
      return true;
    }
  }
  return false;
}

function hasAnyUseNoForgetDirectives(directives: t.Directive[]): boolean {
  for (const directive of directives) {
    if (directive.value.value === "use no forget") {
      return true;
    }
  }
  return false;
}

/**
 * Runs the Compiler pipeline and mutates the source AST to include the newly compiled function.
 * Returns a boolean denoting if the AST was mutated or not.
 */
function compileAndInsertNewFunctionDeclaration(
  fnPath: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  pass: CompilerPass
): boolean {
  if (ALREADY_COMPILED.has(fnPath.node)) {
    return false;
  }

  let compiledFn: CodegenFunction;
  try {
    compiledFn = compileFn(fnPath, pass.opts.environment);
  } catch (err) {
    if (pass.opts.logger && err) {
      pass.opts.logger.logEvent("err", err);
    }
    /** Always throw if the flag is enabled, otherwise we only throw if the error is critical
     * (eg an invariant is broken, meaning the compiler may be buggy). See
     * {@link CompilerError.isCritical} for mappings.
     * */
    if (
      pass.opts.panicOnBailout ||
      !(err instanceof CompilerError) ||
      (err instanceof CompilerError && err.isCritical())
    ) {
      throw err;
    } else {
      if (pass.opts.isDev) {
        log(err, pass.filename ?? null);
      }
    }
    return false;
  }

  // Successfully compiled
  if (pass.opts.noEmit === true) {
    return false;
  }

  // We are generating a new FunctionDeclaration node, so we must skip over it or this
  // traversal will loop infinitely.
  fnPath.skip();

  let transformedFunction:
    | t.FunctionDeclaration
    | t.ArrowFunctionExpression
    | t.FunctionExpression;
  switch (fnPath.node.type) {
    case "FunctionDeclaration": {
      const fn: t.FunctionDeclaration = {
        type: "FunctionDeclaration",
        id: compiledFn.id,
        loc: fnPath.node.loc ?? null,
        async: compiledFn.async,
        generator: compiledFn.generator,
        params: compiledFn.params,
        body: compiledFn.body,
      };
      transformedFunction = fn;
      break;
    }
    case "ArrowFunctionExpression": {
      const fn: t.ArrowFunctionExpression = {
        type: "ArrowFunctionExpression",
        loc: fnPath.node.loc ?? null,
        async: compiledFn.async,
        generator: compiledFn.generator,
        params: compiledFn.params,
        expression: fnPath.node.expression,
        body: compiledFn.body,
      };
      transformedFunction = fn;
      break;
    }
    case "FunctionExpression": {
      const fn: t.FunctionExpression = {
        type: "FunctionExpression",
        id: compiledFn.id,
        loc: fnPath.node.loc ?? null,
        async: compiledFn.async,
        generator: compiledFn.generator,
        params: compiledFn.params,
        body: compiledFn.body,
      };
      transformedFunction = fn;
      break;
    }
  }

  // Ensure we avoid visiting the original function again (since we move it
  // within the AST in gating mode)
  ALREADY_COMPILED.add(fnPath);
  // And avoid visiting the new version as well
  ALREADY_COMPILED.add(transformedFunction);

  insertNewFunctionDeclaration(fnPath, transformedFunction, pass);

  return true;
}

function insertNewFunctionDeclaration(
  fnPath: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  compiledFn:
    | t.FunctionDeclaration
    | t.ArrowFunctionExpression
    | t.FunctionExpression,
  pass: CompilerPass
): void {
  if (pass.opts.instrumentForget != null) {
    const instrumentFnName = pass.opts.instrumentForget.importSpecifierName;
    addInstrumentForget(compiledFn, instrumentFnName);
  }
  if (pass.opts)
    if (pass.opts.gating != null) {
      if (pass.opts.instrumentForget != null) {
        const instrumentFnName = pass.opts.instrumentForget.importSpecifierName;
        addInstrumentForget(fnPath.node, instrumentFnName);
      }
      insertGatedFunctionDeclaration(fnPath, compiledFn, pass.opts.gating);
    } else {
      fnPath.replaceWith(compiledFn);
    }
}

// This is a hack to work around what seems to be a Babel bug. Babel doesn't
// consistently respect the `skip()` function to avoid revisiting a node within
// a pass, so we use this set to track nodes that we have compiled.
const ALREADY_COMPILED: WeakSet<object> | Set<object> = new (WeakSet ?? Set)();

export function compileProgram(
  program: NodePath<t.Program>,
  pass: CompilerPass
): void {
  const options = parsePluginOptions(pass.opts);
  const violations = [];
  const fileComments = pass.comments;
  let hasForgetMutatedOriginalSource: boolean = false;
  let fileHasUseForgetDirective = false;

  if (Array.isArray(fileComments)) {
    for (const comment of fileComments) {
      if (
        /eslint-disable(-next-line)? react-hooks\/(exhaustive-deps|rules-of-hooks)/.test(
          comment.value
        )
      ) {
        violations.push(comment);
      }
    }
  }

  if (violations.length > 0) {
    program.traverse({
      Directive(directive) {
        if (hasUseForgetDirective(directive.node)) {
          fileHasUseForgetDirective = true;
        }
      },
    });

    const reason =
      "React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior";
    const error = new CompilerError();
    for (const violation of violations) {
      if (options.logger != null) {
        options.logger.logEvent("err", {
          reason,
          filename: pass.filename,
          violation,
        });
      }

      error.pushErrorDetail(
        new CompilerErrorDetail({
          reason,
          description: violation.value.trim(),
          severity: ErrorSeverity.InvalidReact,
          loc: violation.loc ?? null,
          suggestions: [
            {
              description: "Remove the eslint disable",
              range: [violation.start!, violation.end!],
              op: CompilerSuggestionOperation.Remove,
            },
          ],
        })
      );
    }

    if (fileHasUseForgetDirective) {
      if (options.panicOnBailout || error.isCritical()) {
        throw error;
      } else {
        if (options.isDev) {
          log(error, pass.filename ?? null);
        }
      }
    }

    return;
  }

  // Main traversal to compile with Forget
  program.traverse(
    {
      ClassDeclaration(node: NodePath<t.ClassDeclaration>) {
        // Don't visit functions defined inside classes, because they
        // can reference `this` which is unsafe for compilation
        node.skip();
        return;
      },

      ClassExpression(node: NodePath<t.ClassExpression>) {
        // Don't visit functions defined inside classes, because they
        // can reference `this` which is unsafe for compilation
        node.skip();
        return;
      },

      FunctionDeclaration(
        fn: NodePath<t.FunctionDeclaration>,
        pass: CompilerPass
      ): void {
        if (!shouldVisitNode(fn, pass)) {
          return;
        }

        if (compileAndInsertNewFunctionDeclaration(fn, pass) === true) {
          hasForgetMutatedOriginalSource = true;
        }
      },

      FunctionExpression(
        fn: NodePath<t.FunctionExpression>,
        pass: CompilerPass
      ): void {
        if (!shouldVisitNode(fn, pass)) {
          return;
        }

        if (compileAndInsertNewFunctionDeclaration(fn, pass) === true) {
          hasForgetMutatedOriginalSource = true;
        }
      },

      ArrowFunctionExpression(
        fn: NodePath<t.ArrowFunctionExpression>,
        pass: CompilerPass
      ): void {
        if (!shouldVisitNode(fn, pass)) {
          return;
        }

        if (compileAndInsertNewFunctionDeclaration(fn, pass) === true) {
          hasForgetMutatedOriginalSource = true;
        }
      },
    },
    {
      ...pass,
      opts: { ...pass.opts, ...options },
      filename: pass.filename ?? null,
    }
  );

  // If there isn't already an import of * as React, insert it so useMemoCache doesn't
  // throw
  if (hasForgetMutatedOriginalSource) {
    const { didInsertUseMemoCache, hasExistingReactImport } =
      findExistingImports(program);

    // If Forget did successfully compile inject/update an import of
    // `import {unstable_useMemoCache as useMemoCache} from 'react'` and rename
    // `React.unstable_useMemoCache(n)` to `useMemoCache(n)`;
    if (didInsertUseMemoCache) {
      if (hasExistingReactImport) {
        const didUpdateImport = updateExistingReactImportDeclaration(program);
        if (didUpdateImport === false) {
          throw new Error(
            "Expected an ImportDeclaration of react in order to update ImportSpecifiers with useMemoCache"
          );
        }
      } else {
        insertUseMemoCacheImportDeclaration(program);
      }
    }
    const externalFunctions = [];
    // TODO: check for duplicate import specifiers
    if (options.gating != null) {
      externalFunctions.push(options.gating);
    }
    if (options.instrumentForget != null) {
      externalFunctions.push(options.instrumentForget);
    }
    if (options.environment?.enableEmitFreeze != null) {
      externalFunctions.push(options.environment.enableEmitFreeze);
    }
    addImportsToProgram(program, externalFunctions);
  }
}

function shouldVisitNode(
  fn: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  pass: CompilerPass
): boolean {
  if (fn.node.body.type === "BlockStatement") {
    // Opt-outs disable compilation regardless of mode
    if (hasAnyUseNoForgetDirectives(fn.node.body.directives)) {
      return false;
    }
    // Otherwise opt-ins enable compilation regardless of mode
    if (hasAnyUseForgetDirectives(fn.node.body.directives)) {
      return true;
    }
  }
  switch (pass.opts.compilationMode) {
    case "annotation": {
      // opt-ins are checked above
      return false;
    }
    case "infer": {
      return (
        // Component declarations are known components
        (fn.isFunctionDeclaration() && isComponentDeclaration(fn.node)) ||
        // Otherwise check if this is a component or hook-like function
        isReactFunctionLike(fn)
      );
    }
    case "all": {
      return fn.scope.getProgramParent() === fn.scope.parent;
    }
    default: {
      assertExhaustive(
        pass.opts.compilationMode,
        `Unexpected compilationMode '${pass.opts.compilationMode}'`
      );
    }
  }
}

function log(error: CompilerError, filename: string | null): void {
  const filenameStr = filename ? `in ${filename}` : "";
  console.log(
    error.details
      .map(
        (e) =>
          `[ReactForget] Skipping compilation of component ${filenameStr}: ${e.printErrorMessage()}`
      )
      .join("\n")
  );
}

function isHookName(s: string): boolean {
  return /^use[A-Z0-9]/.test(s);
}

/**
 * We consider hooks to be a hook name identifier or a member expression
 * containing a hook name.
 */

function isHook(path: NodePath<t.Expression | t.PrivateName>): boolean {
  if (path.isIdentifier()) {
    return isHookName(path.node.name);
  } else if (
    path.isMemberExpression() &&
    !path.node.computed &&
    isHook(path.get("property"))
  ) {
    const obj = path.get("object").node;
    const isPascalCaseNameSpace = /^[A-Z].*/;
    return obj.type === "Identifier" && isPascalCaseNameSpace.test(obj.name);
  } else {
    return false;
  }
}

/**
 * Checks if the node is a React component name. React component names must
 * always start with an uppercase letter.
 */

function isComponentName(path: NodePath<t.Expression>): boolean {
  return path.isIdentifier() && /^[A-Z]/.test(path.node.name);
}

function isReactFunction(
  path: NodePath<t.Expression | t.PrivateName | t.V8IntrinsicIdentifier>,
  functionName: string
): boolean {
  const node = path.node;
  return (
    (node.type === "Identifier" && node.name === functionName) ||
    (node.type === "MemberExpression" &&
      node.object.type === "Identifier" &&
      node.object.name === "React" &&
      node.property.type === "Identifier" &&
      node.property.name === functionName)
  );
}

/**
 * Checks if the node is a callback argument of forwardRef. This render function
 * should follow the rules of hooks.
 */

function isForwardRefCallback(path: NodePath<t.Expression>): boolean {
  return !!(
    path.parentPath.isCallExpression() &&
    path.parentPath.get("callee").isExpression() &&
    isReactFunction(path.parentPath.get("callee"), "forwardRef")
  );
}

/**
 * Checks if the node is a callback argument of React.memo. This anonymous
 * functional component should follow the rules of hooks.
 */

function isMemoCallback(path: NodePath<t.Expression>): boolean {
  return (
    path.parentPath.isCallExpression() &&
    path.parentPath.get("callee").isExpression() &&
    isReactFunction(path.parentPath.get("callee"), "memo")
  );
}

// Adapted from the ESLint rule at
// https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js#L90-L103
function isReactFunctionLike(
  node: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >
): boolean {
  const functionName = getFunctionName(node);
  // Check if the name is component or hook like:
  if (
    functionName !== null &&
    (isComponentName(functionName) || isHook(functionName))
  ) {
    // As an added check we also look for hook invocations or JSX
    return callsHooksOrCreatesJsx(node);
  }
  // Otherwise for function or arrow function expressions, check if they
  // appear as the argument to React.forwardRef() or React.memo():
  if (node.isFunctionExpression() || node.isArrowFunctionExpression()) {
    if (isForwardRefCallback(node) || isMemoCallback(node)) {
      // As an added check we also look for hook invocations or JSX
      return callsHooksOrCreatesJsx(node);
    } else {
      return false;
    }
  }
  return false;
}

function callsHooksOrCreatesJsx(node: NodePath<t.Node>): boolean {
  let invokesHooks = false;
  let createsJsx = false;
  node.traverse({
    JSX() {
      createsJsx = true;
    },
    CallExpression(call) {
      const callee = call.get("callee");
      if (callee.isExpression() && isHook(callee)) {
        invokesHooks = true;
      }
    },
  });

  return invokesHooks || createsJsx;
}

/**
 * Gets the static name of a function AST node. For function declarations it is
 * easy. For anonymous function expressions it is much harder. If you search for
 * `IsAnonymousFunctionDefinition()` in the ECMAScript spec you'll find places
 * where JS gives anonymous function expressions names. We roughly detect the
 * same AST nodes with some exceptions to better fit our use case.
 */

function getFunctionName(
  path: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >
): NodePath<t.Expression> | null {
  if (path.isFunctionDeclaration()) {
    const id = path.get("id");
    if (id.isIdentifier()) {
      return id;
    }
    return null;
  }
  let id: NodePath<t.LVal | t.Expression | t.PrivateName> | null = null;
  const parent = path.parentPath;
  if (parent.isVariableDeclarator() && parent.get("init").node === path.node) {
    // const useHook = () => {};
    id = parent.get("id");
  } else if (
    parent.isAssignmentExpression() &&
    parent.get("right").node === path.node &&
    parent.get("operator") === "="
  ) {
    // useHook = () => {};
    id = parent.get("left");
  } else if (
    parent.isProperty() &&
    parent.get("value").node === path.node &&
    !parent.get("computed") &&
    parent.get("key").isLVal()
  ) {
    // {useHook: () => {}}
    // {useHook() {}}
    id = parent.get("key");
  } else if (
    parent.isAssignmentPattern() &&
    parent.get("right").node === path.node &&
    !parent.get("computed")
  ) {
    // const {useHook = () => {}} = {};
    // ({useHook = () => {}} = {});
    //
    // Kinda clowny, but we'd said we'd follow spec convention for
    // `IsAnonymousFunctionDefinition()` usage.
    id = parent.get("left");
  }
  if (id !== null && (id.isIdentifier() || id.isMemberExpression())) {
    return id;
  } else {
    return null;
  }
}
