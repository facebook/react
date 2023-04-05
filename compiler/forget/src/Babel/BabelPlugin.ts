/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference path="./plugin-syntax-jsx.d.ts" />

import type * as BabelCore from "@babel/core";
import jsx from "@babel/plugin-syntax-jsx";
import * as t from "@babel/types";
import { CompilerError } from "../CompilerError";
import { compile } from "../CompilerPipeline";
import { GeneratedSource } from "../HIR";
import {
  GatingOptions,
  parsePluginOptions,
  PluginOptions,
} from "./PluginOptions";

type BabelPluginPass = {
  opts: PluginOptions;
};

function hasUseForgetDirective(directives: t.Directive[]): boolean {
  for (const directive of directives) {
    if (directive.value.value === "use forget") {
      return true;
    }
  }
  return false;
}

/**
 * The React Forget Babel Plugin
 * @param {*} _babel
 * @returns
 */
export default function ReactForgetBabelPlugin(
  _babel: typeof BabelCore
): BabelCore.PluginObj {
  let hasForgetCompiledCode: boolean = false;

  function visitFn(
    fn: BabelCore.NodePath<t.FunctionDeclaration>,
    pass: BabelPluginPass
  ): void {
    hasForgetCompiledCode = true;
    const compiled = compile(fn, pass.opts.environment);

    if (pass.opts.gating != null) {
      // Rename existing function
      if (fn.node.id == null) {
        CompilerError.invariant(
          "FunctionDeclaration must have a name",
          fn.node.loc ?? GeneratedSource
        );
      }
      const original = fn.node.id;
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
          originalIdent: original,
          gating: pass.opts.gating,
        })
      );
    } else {
      fn.replaceWith(compiled);
    }

    // We are generating a new FunctionDeclaration node, so we must skip over it or this
    // traversal will loop infinitely.
    fn.skip();
  }

  const visitor = {
    FunctionDeclaration(
      fn: BabelCore.NodePath<t.FunctionDeclaration>,
      pass: BabelPluginPass
    ): void {
      if (!shouldCompile(fn, pass)) {
        return;
      }

      visitFn(fn, pass);
    },

    ArrowFunctionExpression(
      fn: BabelCore.NodePath<t.ArrowFunctionExpression>,
      pass: BabelPluginPass
    ): void {
      if (!shouldCompile(fn, pass)) {
        return;
      }

      visitFn(buildFunctionDeclaration(fn), pass);
    },
  };

  return {
    name: "react-forget",
    inherits: jsx,
    visitor: {
      // Note: Babel does some "smart" merging of visitors across plugins, so even if A is inserted
      // prior to B, if A does not have a Program visitor and B does, B will run first. We always
      // want Forget to run true to source as possible.
      Program(path, pass): void {
        const options = parsePluginOptions(pass.opts);
        try {
          path.traverse(visitor, {
            ...pass,
            opts: { ...pass.opts, ...options },
          });

          if (options.gating != null && hasForgetCompiledCode) {
            path.unshiftContainer(
              "body",
              buildImportForGatingModule(options.gating)
            );
          }
        } catch (err) {
          if (options.logger && err) {
            options.logger.logEvent("err", err);
          }
          throw err;
        }
      },
    },
  };
}

function shouldCompile(
  fn: BabelCore.NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression>,
  pass: BabelPluginPass
): boolean {
  if (pass.opts.enableOnlyOnUseForgetDirective) {
    const body = fn.get("body");
    if (!body.isBlockStatement()) {
      return false;
    }
    if (!hasUseForgetDirective(body.node.directives)) {
      return false;
    }
  }

  if (fn.scope.getProgramParent() !== fn.scope.parent) {
    return false;
  }

  return true;
}

function buildFunctionDeclaration(
  fn: BabelCore.NodePath<t.ArrowFunctionExpression>
): BabelCore.NodePath<t.FunctionDeclaration> {
  if (!fn.parentPath.isVariableDeclarator()) {
    CompilerError.invariant(
      "ArrowFunctionExpression must be declared in variable declaration",
      fn.node.loc ?? GeneratedSource
    );
  }
  const variableDeclarator = fn.parentPath;

  if (!variableDeclarator.parentPath.isVariableDeclaration()) {
    CompilerError.invariant(
      "ArrowFunctionExpression must be a single declaration",
      fn.node.loc ?? GeneratedSource
    );
  }
  const variableDeclaration = variableDeclarator.parentPath;

  const id = variableDeclarator.get("id");
  if (!id.isIdentifier()) {
    CompilerError.invariant(
      "ArrowFunctionExpression must have an id",
      fn.node.loc ?? GeneratedSource
    );
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
  fn: BabelCore.NodePath<t.ArrowFunctionExpression>
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

type GatingTestOptions = {
  originalFnDecl: BabelCore.NodePath<t.FunctionDeclaration>;
  compiledIdent: t.Identifier;
  originalIdent: t.Identifier;
  gating: GatingOptions;
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
        t.callExpression(buildSpecifierIdent(gating), []),
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

function buildImportForGatingModule(
  gating: GatingOptions
): t.ImportDeclaration {
  const specifierIdent = buildSpecifierIdent(gating);
  return t.importDeclaration(
    [t.importSpecifier(specifierIdent, specifierIdent)],
    t.stringLiteral(gating.source)
  );
}

function buildSpecifierIdent(gating: GatingOptions): t.Identifier {
  return t.identifier(gating.importSpecifierName);
}
