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
import { GeneratedSource } from "../HIR";
import { isComponentDeclaration } from "../Utils/ComponentDeclaration";
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
  fnPath: NodePath<t.FunctionDeclaration>,
  pass: CompilerPass
): boolean {
  let compiledFn: t.FunctionDeclaration | null = null;
  let hasForgetMutatedOriginalSource = false;
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
  }

  if (pass.opts.noEmit === true) {
    return false;
  }

  // Sucessfully compiled
  if (compiledFn != null) {
    // We are generating a new FunctionDeclaration node, so we must skip over it or this
    // traversal will loop infinitely.
    fnPath.skip();

    CompilerError.invariant(fnPath.node.id != null, {
      reason: "FunctionDeclaration must have a name",
      description: null,
      loc: fnPath.node.loc ?? GeneratedSource,
      suggestions: null,
    });
    const originalIdent = fnPath.node.id;

    insertNewFunctionDeclaration(fnPath, originalIdent, compiledFn, pass);
    hasForgetMutatedOriginalSource = true;
  }

  return hasForgetMutatedOriginalSource;
}

function insertNewFunctionDeclaration(
  fnPath: NodePath<t.FunctionDeclaration>,
  originalIdent: t.Identifier,
  compiledFn: t.FunctionDeclaration,
  pass: CompilerPass
): void {
  let gatedFn = null;
  if (pass.opts.gating != null) {
    gatedFn = insertGatedFunctionDeclaration(
      fnPath,
      compiledFn,
      originalIdent,
      pass.opts.gating
    );
  } else {
    fnPath.replaceWith(compiledFn);
  }

  if (pass.opts.instrumentForget != null) {
    const instrumentFnName = pass.opts.instrumentForget.importSpecifierName;
    addInstrumentForget(fnPath, originalIdent.name, instrumentFnName);
    if (pass.opts.gating != null) {
      CompilerError.invariant(gatedFn != null, {
        reason: "Should have inserted a gated function declaration",
        description: null,
        loc: null,
        suggestions: null,
      });
      addInstrumentForget(gatedFn, originalIdent.name, instrumentFnName);
    }
  }
}

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

      ArrowFunctionExpression(
        fn: NodePath<t.ArrowFunctionExpression>,
        pass: CompilerPass
      ): void {
        if (!shouldVisitNode(fn, pass)) {
          return;
        }

        const loweredFn = buildFunctionDeclaration(fn);
        if (loweredFn instanceof CompilerErrorDetail) {
          const error = new CompilerError();
          error.pushErrorDetail(loweredFn);

          const options = parsePluginOptions(pass.opts);
          if (options.logger != null) {
            options.logger.logEvent("err", error);
          }

          if (options.panicOnBailout || error.isCritical()) {
            throw error;
          } else {
            if (pass.opts.isDev) {
              log(error, pass.filename);
            }
          }
          return;
        }

        if (compileAndInsertNewFunctionDeclaration(loweredFn, pass) === true) {
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
  fn: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>,
  pass: CompilerPass
): boolean {
  if (fn.node.body.type === "BlockStatement") {
    const shouldSkip = hasAnyUseNoForgetDirectives(fn.node.body.directives);
    if (shouldSkip) {
      return false;
    }
  }

  if (pass.opts.enableOnlyOnReactScript && fn.isFunctionDeclaration()) {
    return isComponentDeclaration(fn.node);
  }

  if (pass.opts.enableOnlyOnUseForgetDirective) {
    const body = fn.get("body");
    if (body.isBlockStatement()) {
      return hasAnyUseForgetDirectives(body.node.directives);
    }
  }

  if (pass.opts.enableInferReactFunctions) {
    const isReactLike = isReactFunctionLike(fn);
    return isReactLike;
  }

  return fn.scope.getProgramParent() === fn.scope.parent;
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

function buildFunctionDeclaration(
  fn: NodePath<t.ArrowFunctionExpression>
): NodePath<t.FunctionDeclaration> | CompilerErrorDetail {
  if (!fn.parentPath.isVariableDeclarator()) {
    return new CompilerErrorDetail({
      reason:
        "ArrowFunctionExpression was not declared in a variable declaration",
      severity: ErrorSeverity.Todo,
      description: `Handle ${fn.parentPath.type}`,
      loc: fn.node.loc ?? null,
      suggestions: null,
    });
  }
  const variableDeclarator = fn.parentPath;

  if (!variableDeclarator.parentPath.isVariableDeclaration()) {
    return new CompilerErrorDetail({
      reason: "ArrowFunctionExpression was not a single declaration",
      severity: ErrorSeverity.Todo,
      description: `Handle ${variableDeclarator.parentPath.type}`,
      loc: fn.node.loc ?? null,
      suggestions: null,
    });
  }
  const variableDeclaration = variableDeclarator.parentPath;

  const id = variableDeclarator.get("id");
  if (!id.isIdentifier()) {
    return new CompilerErrorDetail({
      reason: "ArrowFunctionExpression was not an identifier",
      severity: ErrorSeverity.Todo,
      description: `Handle ${id.type}`,
      loc: fn.node.loc ?? null,
      suggestions: null,
    });
  }

  const rewrittenFn = variableDeclaration.replaceWith(
    t.functionDeclaration(
      id.node,
      fn.node.params,
      buildBlockStatement(fn),
      fn.node.generator,
      fn.node.async
    )
  )[0];
  fn.skip();
  return rewrittenFn;
}

function buildBlockStatement(
  fn: NodePath<t.ArrowFunctionExpression>
): t.BlockStatement {
  const body = fn.get("body");
  if (body.isExpression()) {
    const wrappedBody = body.replaceWith(
      t.blockStatement([t.returnStatement(body.node)])
    )[0];
    body.skip();

    return wrappedBody.node;
  }

  CompilerError.invariant(body.isBlockStatement(), {
    reason: "Body must be a BlockStatement",
    description: null,
    loc: body.node.loc ?? GeneratedSource,
    suggestions: null,
  });

  return body.node;
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
  return !!(
    path.parentPath.isCallExpression() &&
    path.parentPath.get("callee").isExpression() &&
    isReactFunction(path.parentPath.get("callee"), "memo")
  );
}

function isReactFunctionLike(
  node: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>
): boolean {
  const functionName = getFunctionName(node);
  if (functionName !== null) {
    if (!isComponentName(functionName) && !isHook(functionName)) {
      return false;
    }
  } else if (
    node.isExpression() &&
    !isForwardRefCallback(node) &&
    !isMemoCallback(node)
  ) {
    return false;
  } else {
    return false;
  }

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
  path: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>
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
