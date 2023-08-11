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
import { getOrInsertDefault } from "../Utils/utils";
import { insertGatedFunctionDeclaration } from "./Gating";
import { addInstrumentForget } from "./Instrumentation";
import { ExternalFunction, PluginOptions, parsePluginOptions } from "./Options";
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

/**
 * Runs the Compiler pipeline and mutates the source AST to include the newly compiled function.
 * Returns a boolean denoting if the AST was mutated or not.
 */
function compileAndInsertNewFunctionDeclaration(
  fnPath: NodePath<t.FunctionDeclaration>,
  pass: CompilerPass
): boolean {
  let compiledFn: t.FunctionDeclaration | null;
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
      if (pass.opts.gating != null && gatedFn != null) {
        addInstrumentForget(gatedFn, originalIdent.name, instrumentFnName);
      }
    }
    return true;
  }

  return false;
}

export function compileProgram(
  program: NodePath<t.Program>,
  pass: CompilerPass
): void {
  const options = parsePluginOptions(pass.opts);
  const violations = [];
  const fileComments = pass.comments;
  let hasForgetCompiledCode: boolean = false;
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

        hasForgetCompiledCode = compileAndInsertNewFunctionDeclaration(
          fn,
          pass
        );
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

        hasForgetCompiledCode = compileAndInsertNewFunctionDeclaration(
          loweredFn,
          pass
        );
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
  if (hasForgetCompiledCode) {
    let didInsertUseMemoCache = false;
    let hasExistingReactImport = false;
    program.traverse({
      CallExpression(callExprPath) {
        const callee = callExprPath.get("callee");
        const args = callExprPath.get("arguments");
        if (
          callee.isIdentifier() &&
          callee.node.name === "useMemoCache" &&
          args.length === 1 &&
          args[0].isNumericLiteral()
        ) {
          didInsertUseMemoCache = true;
        }
      },
      ImportDeclaration(importDeclPath) {
        if (isNonNamespacedImportOfReact(importDeclPath)) {
          hasExistingReactImport = true;
        }
      },
    });
    // If Forget did successfully compile inject/update an import of
    // `import {unstable_useMemoCache as useMemoCache} from 'react'` and rename
    // `React.unstable_useMemoCache(n)` to `useMemoCache(n)`;
    if (didInsertUseMemoCache) {
      if (hasExistingReactImport) {
        let didUpdateImport = false;
        program.traverse({
          ImportDeclaration(importDeclPath) {
            if (isNonNamespacedImportOfReact(importDeclPath)) {
              importDeclPath.pushContainer(
                "specifiers",
                t.importSpecifier(
                  t.identifier("useMemoCache"),
                  t.identifier("unstable_useMemoCache")
                )
              );
              didUpdateImport = true;
            }
          },
        });
        if (didUpdateImport === false) {
          throw new Error(
            "Expected an ImportDeclaration of react in order to update ImportSpecifiers with useMemoCache"
          );
        }
      } else {
        program.unshiftContainer(
          "body",
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier("useMemoCache"),
                t.identifier("unstable_useMemoCache")
              ),
            ],
            t.stringLiteral("react")
          )
        );
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
  if (pass.opts.enableOnlyOnReactScript && fn.isFunctionDeclaration()) {
    return isComponentDeclaration(fn.node);
  }

  if (pass.opts.enableOnlyOnUseForgetDirective) {
    const body = fn.get("body");
    if (body.isBlockStatement()) {
      return hasAnyUseForgetDirectives(body.node.directives);
    }
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

function addImportsToProgram(
  path: NodePath<t.Program>,
  importList: Array<ExternalFunction>
): void {
  const identifiers: Set<string> = new Set();
  const sortedImports: Map<string, Array<string>> = new Map();
  for (const { importSpecifierName, source } of importList) {
    // Codegen currently does not rename import specifiers, so we do additional
    // validation here
    if (identifiers.has(importSpecifierName)) {
      CompilerError.invalidConfig({
        reason: `Encountered conflicting import specifier for ${importSpecifierName} in Forget config.`,
        description: null,
        loc: GeneratedSource,
        suggestions: null,
      });
    }
    if (path.scope.hasBinding(importSpecifierName)) {
      CompilerError.invalidConfig({
        reason: `Encountered conflicting import specifiers for ${importSpecifierName} in generated program.`,
        description: null,
        loc: GeneratedSource,
        suggestions: null,
      });
    }
    identifiers.add(importSpecifierName);

    const importSpecifierNameList = getOrInsertDefault(
      sortedImports,
      source,
      []
    );
    importSpecifierNameList.push(importSpecifierName);
  }

  const stmts: Array<t.ImportDeclaration> = [];
  for (const [source, importSpecifierNameList] of sortedImports) {
    const importSpecifiers = importSpecifierNameList.map((name) => {
      const id = t.identifier(name);
      return t.importSpecifier(id, id);
    });

    stmts.push(t.importDeclaration(importSpecifiers, t.stringLiteral(source)));
  }
  path.unshiftContainer("body", stmts);
}

/**
 * Matches `import { ... } from 'react';`
 * but not `import * as React from 'react';`
 */
function isNonNamespacedImportOfReact(
  importDeclPath: NodePath<t.ImportDeclaration>
): boolean {
  return (
    importDeclPath.get("source").node.value === "react" &&
    importDeclPath
      .get("specifiers")
      .every((specifier) => specifier.isImportSpecifier())
  );
}
