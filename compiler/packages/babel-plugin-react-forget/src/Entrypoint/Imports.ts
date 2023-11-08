/*
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
 * Matches `import { ... } from 'react';`
 * but not `import * as React from 'react';`
 */
export function isNonNamespacedImportOfReact(
  importDeclPath: NodePath<t.ImportDeclaration>
): boolean {
  return (
    importDeclPath.get("source").node.value === "react" &&
    importDeclPath
      .get("specifiers")
      .every((specifier) => specifier.isImportSpecifier()) &&
    importDeclPath.node.importKind !== "type" &&
    importDeclPath.node.importKind !== "typeof"
  );
}

export function findExistingImports(program: NodePath<t.Program>): {
  didInsertUseMemoCache: boolean;
  hasExistingReactImport: boolean;
} {
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

  return {
    didInsertUseMemoCache,
    hasExistingReactImport,
  };
}

/*
 * If an existing import of React exists (ie `import {useMemo} from 'React'`), inject useMemoCache
 * into the list of destructured variables.
 */
export function updateExistingReactImportDeclaration(
  program: NodePath<t.Program>
): boolean {
  let didInsertUseMemoCache = false;
  program.traverse({
    ImportDeclaration(importDeclPath) {
      if (
        !didInsertUseMemoCache &&
        isNonNamespacedImportOfReact(importDeclPath)
      ) {
        importDeclPath.pushContainer(
          "specifiers",
          t.importSpecifier(
            t.identifier("useMemoCache"),
            t.identifier("unstable_useMemoCache")
          )
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
  /*
   * If there isn't already an import of * as React, insert it so useMemoCache doesn't
   * throw
   */
  const { didInsertUseMemoCache, hasExistingReactImport } =
    findExistingImports(program);

  // unstable_useMemoCache wasn't already imported, nothing to do
  if (!didInsertUseMemoCache) {
    return;
  }

  if (options.enableUseMemoCachePolyfill === false) {
    /*
     * If Forget did successfully compile inject/update an import of
     * `import {unstable_useMemoCache as useMemoCache} from 'react'` and rename
     * `React.unstable_useMemoCache(n)` to `useMemoCache(n)`;
     */
    if (hasExistingReactImport) {
      const didUpdateImport = updateExistingReactImportDeclaration(program);
      if (didUpdateImport === false) {
        throw new Error(
          "Expected an ImportDeclaration of react in order to update ImportSpecifiers with useMemoCache"
        );
      }
    } else {
      addUseMemoCacheImportDeclaration(program, "react");
    }
  } else {
    // import useMemoCache from userspace module
    addUseMemoCacheImportDeclaration(program, "react-forget-runtime");
  }
}

function addUseMemoCacheImportDeclaration(
  program: NodePath<t.Program>,
  moduleName: string
): void {
  program.unshiftContainer(
    "body",
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("useMemoCache"),
          t.identifier("unstable_useMemoCache")
        ),
      ],
      t.stringLiteral(moduleName)
    )
  );
}
