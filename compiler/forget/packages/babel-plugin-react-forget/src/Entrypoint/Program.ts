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
  ErrorSeverity,
} from "../CompilerError";
import { GeneratedSource } from "../HIR";
import { getOrInsertDefault } from "../Utils/utils";
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

export function compileProgram(
  program: NodePath<t.Program>,
  pass: CompilerPass
): void {
  let hasForgetCompiledCode: boolean = false;

  function visitFn(
    fn: NodePath<t.FunctionDeclaration>,
    pass: CompilerPass
  ): void {
    try {
      const compiled = compileFn(fn, pass.opts.environment);
      if (fn.node.id == null) {
        CompilerError.invariant(
          "FunctionDeclaration must have a name",
          fn.node.loc ?? GeneratedSource
        );
      }
      const originalIdent = fn.node.id;

      if (pass.opts.gating != null) {
        // Rename existing function
        fn.node.id = addSuffix(fn.node.id, "_uncompiled");

        // Rename and append compiled function
        if (compiled.id == null) {
          CompilerError.invariant(
            "FunctionDeclaration must produce a name",
            fn.node.loc ?? GeneratedSource
          );
        }
        compiled.id = addSuffix(compiled.id, "_forget");
        const compiledFn = fn.insertAfter(compiled)[0];
        compiledFn.skip();

        // Build and append gating test
        compiledFn.insertAfter(
          buildGatingTest({
            originalFnDecl: fn,
            compiledIdent: compiled.id,
            originalIdent,
            gating: pass.opts.gating,
          })
        );
        if (pass.opts.instrumentForget != null) {
          const instrumentFnName =
            pass.opts.instrumentForget.importSpecifierName;
          addInstrumentForget(fn, originalIdent.name, instrumentFnName);
          addInstrumentForget(compiledFn, originalIdent.name, instrumentFnName);
        }
      } else {
        fn.replaceWith(compiled);
        if (pass.opts.instrumentForget != null) {
          const instrumentFnName =
            pass.opts.instrumentForget.importSpecifierName;
          addInstrumentForget(fn, originalIdent.name, instrumentFnName);
        }
      }

      hasForgetCompiledCode = true;
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
    } finally {
      // We are generating a new FunctionDeclaration node, so we must skip over it or this
      // traversal will loop infinitely.
      fn.skip();
    }
  }

  const visitor = {
    FunctionDeclaration(
      fn: NodePath<t.FunctionDeclaration>,
      pass: CompilerPass
    ): void {
      if (!shouldCompile(fn, pass)) {
        return;
      }

      visitFn(fn, pass);
    },

    ArrowFunctionExpression(
      fn: NodePath<t.ArrowFunctionExpression>,
      pass: CompilerPass
    ): void {
      if (!shouldCompile(fn, pass)) {
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

      visitFn(loweredFn, pass);
    },
  };

  const options = parsePluginOptions(pass.opts);

  const violations = [];
  const fileComments = pass.comments;
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

    const reason = `One or more React eslint rules is disabled`;
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
          severity: ErrorSeverity.InvalidInput,
          codeframe: null,
          loc: violation.loc ?? null,
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

  program.traverse(visitor, {
    ...pass,
    opts: { ...pass.opts, ...options },
    filename: pass.filename ?? null,
  });

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

function shouldCompile(
  fn: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>,
  pass: CompilerPass
): boolean {
  if (pass.opts.enableOnlyOnUseForgetDirective) {
    const body = fn.get("body");
    if (!body.isBlockStatement()) {
      return false;
    }
    if (!hasAnyUseForgetDirectives(body.node.directives)) {
      return false;
    }
  }

  if (fn.scope.getProgramParent() !== fn.scope.parent) {
    return false;
  }

  return true;
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
      codeframe: null,
      loc: fn.node.loc ?? null,
    });
  }
  const variableDeclarator = fn.parentPath;

  if (!variableDeclarator.parentPath.isVariableDeclaration()) {
    return new CompilerErrorDetail({
      reason: "ArrowFunctionExpression was not a single declaration",
      severity: ErrorSeverity.Todo,
      description: `Handle ${variableDeclarator.parentPath.type}`,
      codeframe: null,
      loc: fn.node.loc ?? null,
    });
  }
  const variableDeclaration = variableDeclarator.parentPath;

  const id = variableDeclarator.get("id");
  if (!id.isIdentifier()) {
    return new CompilerErrorDetail({
      reason: "ArrowFunctionExpression was not an identifier",
      severity: ErrorSeverity.Todo,
      description: `Handle ${id.type}`,
      codeframe: null,
      loc: fn.node.loc ?? null,
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

  if (!body.isBlockStatement()) {
    CompilerError.invariant(
      "Body must be a BlockStatement",
      body.node.loc ?? GeneratedSource
    );
  }
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
      CompilerError.invalidInput(
        `[InvalidConfig] Encountered conflicting import specifier for ${importSpecifierName} in Forget config.`,
        GeneratedSource
      );
    }
    if (path.scope.hasBinding(importSpecifierName)) {
      CompilerError.invalidInput(
        `[InvalidConfig] Encountered conflicting import specifiers for ${importSpecifierName} in generated program.`,
        GeneratedSource
      );
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

type GatingTestOptions = {
  originalFnDecl: NodePath<t.FunctionDeclaration>;
  compiledIdent: t.Identifier;
  originalIdent: t.Identifier;
  gating: ExternalFunction;
};
function buildGatingTest({
  originalFnDecl,
  compiledIdent,
  originalIdent,
  gating,
}: GatingTestOptions): t.Node | t.Node[] {
  const testVarDecl = t.variableDeclaration("const", [
    t.variableDeclarator(
      originalIdent,
      t.conditionalExpression(
        t.callExpression(t.identifier(gating.importSpecifierName), []),
        compiledIdent,
        originalFnDecl.node.id!
      )
    ),
  ]);

  // Re-export new declaration
  const parent = originalFnDecl.parentPath;
  if (t.isExportDefaultDeclaration(parent)) {
    // Re-add uncompiled function
    parent.replaceWith(originalFnDecl)[0].skip();

    // Add test and synthesize new export
    return [testVarDecl, t.exportDefaultDeclaration(originalIdent)];
  } else if (t.isExportNamedDeclaration(parent)) {
    // Re-add uncompiled function
    parent.replaceWith(originalFnDecl)[0].skip();

    // Add and export test
    return t.exportNamedDeclaration(testVarDecl);
  }

  // Just add the test, no need for re-export
  return testVarDecl;
}

function addSuffix(id: t.Identifier, suffix: string): t.Identifier {
  return t.identifier(`${id.name}${suffix}`);
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
