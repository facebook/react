import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { CompilerError } from "../CompilerError";
import { GeneratedSource } from "../HIR";
import { getOrInsertDefault } from "../Utils/utils";
import { ExternalFunction } from "./Options";

export function addImportsToProgram(
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
export function isNonNamespacedImportOfReact(
  importDeclPath: NodePath<t.ImportDeclaration>
): boolean {
  return (
    importDeclPath.get("source").node.value === "react" &&
    importDeclPath
      .get("specifiers")
      .every((specifier) => specifier.isImportSpecifier())
  );
}
