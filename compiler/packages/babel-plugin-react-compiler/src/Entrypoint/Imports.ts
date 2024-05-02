/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { CompilerError } from "../CompilerError";
import { ExternalFunction, GeneratedSource } from "../HIR";
import { getOrInsertDefault } from "../Utils/utils";
import { PluginOptions } from "./Options";

export function addImportsToProgram(
  path: NodePath<t.Program>,
  importList: Array<ExternalFunction>
): void {
  const identifiers: Set<string> = new Set();
  const sortedImports: Map<string, Array<string>> = new Map();
  for (const { importSpecifierName, source } of importList) {
    /*
     * Codegen currently does not rename import specifiers, so we do additional
     * validation here
     */
    CompilerError.invariant(identifiers.has(importSpecifierName) === false, {
      reason: `Encountered conflicting import specifier for ${importSpecifierName} in Forget config.`,
      description: null,
      loc: GeneratedSource,
      suggestions: null,
    });
    CompilerError.invariant(
      path.scope.hasBinding(importSpecifierName) === false,
      {
        reason: `Encountered conflicting import specifiers for ${importSpecifierName} in generated program.`,
        description: null,
        loc: GeneratedSource,
        suggestions: null,
      }
    );
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

/*
 * Matches `import { ... } from <moduleName>;`
 * but not `import * as React from <moduleName>;`
 */
function isNonNamespacedImport(
  importDeclPath: NodePath<t.ImportDeclaration>,
  moduleName: string
): boolean {
  return (
    importDeclPath.get("source").node.value === moduleName &&
    importDeclPath
      .get("specifiers")
      .every((specifier) => specifier.isImportSpecifier()) &&
    importDeclPath.node.importKind !== "type" &&
    importDeclPath.node.importKind !== "typeof"
  );
}

function findExistingImports(
  program: NodePath<t.Program>,
  moduleName: string
): {
  didInsertUseMemoCache: boolean;
  hasExistingImport: boolean;
} {
  let didInsertUseMemoCache = false;
  let hasExistingImport = false;
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
      if (isNonNamespacedImport(importDeclPath, moduleName)) {
        hasExistingImport = true;
      }
    },
  });

  return {
    didInsertUseMemoCache,
    hasExistingImport,
  };
}

/*
 * If an existing import of React exists (ie `import {useMemo} from 'react'`), inject useMemoCache
 * into the list of destructured variables.
 */
function updateExistingImportDeclaration(
  program: NodePath<t.Program>,
  moduleName: string
): boolean {
  let didInsertUseMemoCache = false;
  program.traverse({
    ImportDeclaration(importDeclPath) {
      if (
        !didInsertUseMemoCache &&
        isNonNamespacedImport(importDeclPath, moduleName)
      ) {
        importDeclPath.pushContainer(
          "specifiers",
          t.importSpecifier(t.identifier("useMemoCache"), t.identifier("c"))
        );
        didInsertUseMemoCache = true;
      }
    },
  });
  return didInsertUseMemoCache;
}

export function updateUseMemoCacheImport(
  program: NodePath<t.Program>,
  options: PluginOptions
): void {
  const moduleName = options.runtimeModule ?? "react/compiler-runtime";
  /*
   * If there isn't already an import of * as React, insert it so useMemoCache doesn't
   * throw
   */
  const { didInsertUseMemoCache, hasExistingImport } = findExistingImports(
    program,
    moduleName
  );

  if (!didInsertUseMemoCache) {
    // useMemoCache was not generated, nothing to do
    return;
  }

  if (hasExistingImport) {
    const didUpdateImport = updateExistingImportDeclaration(
      program,
      moduleName
    );
    if (!didUpdateImport) {
      throw new Error(
        `Expected an ImportDeclaration of \`${moduleName}\` in order to update ImportSpecifiers with useMemoCache`
      );
    }
  } else {
    addUseMemoCacheImportDeclaration(program, moduleName);
  }
}

function addUseMemoCacheImportDeclaration(
  program: NodePath<t.Program>,
  moduleName: string
): void {
  program.unshiftContainer(
    "body",
    t.importDeclaration(
      [t.importSpecifier(t.identifier("useMemoCache"), t.identifier("c"))],
      t.stringLiteral(moduleName)
    )
  );
}
