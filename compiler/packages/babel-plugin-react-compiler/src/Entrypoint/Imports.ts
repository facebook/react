/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/core';
import * as t from '@babel/types';
import {CompilerError, ErrorSeverity} from '../CompilerError';
import {EnvironmentConfig, GeneratedSource} from '../HIR';
import {getOrInsertDefault} from '../Utils/utils';
import {ImportedExternalFunction} from '../HIR/Environment';

export function validateRestrictedImports(
  path: NodePath<t.Program>,
  {validateBlocklistedImports}: EnvironmentConfig,
): CompilerError | null {
  if (
    validateBlocklistedImports == null ||
    validateBlocklistedImports.length === 0
  ) {
    return null;
  }
  const error = new CompilerError();
  const restrictedImports = new Set(validateBlocklistedImports);
  path.traverse({
    ImportDeclaration(importDeclPath) {
      if (restrictedImports.has(importDeclPath.node.source.value)) {
        error.push({
          severity: ErrorSeverity.Todo,
          reason: 'Bailing out due to blocklisted import',
          description: `Import from module ${importDeclPath.node.source.value}`,
          loc: importDeclPath.node.loc ?? null,
        });
      }
    },
  });
  if (error.hasErrors()) {
    return error;
  } else {
    return null;
  }
}

export function addImportsToProgram(
  path: NodePath<t.Program>,
  importList: Array<ImportedExternalFunction>,
): void {
  const sortedImports: Map<string, Array<ImportedExternalFunction>> = new Map();
  for (const import_ of importList) {
    /**
     * Assert that the import identifier hasn't already be declared in the program.
     * Note: we use getBinding here since `Scope.hasBinding` pessimistically returns true
     * for all allocated uids (from `Scope.getUid`)
     */
    CompilerError.invariant(path.scope.getBinding(import_.local) == null, {
      reason: 'Encountered conflicting import specifiers in generated program',
      description: `Conflict from import ${import_.source}:(${import_.importSpecifierName} as ${import_.local}).`,
      loc: GeneratedSource,
      suggestions: null,
    });
    const importSpecifierNameList = getOrInsertDefault(
      sortedImports,
      import_.source,
      [],
    );
    importSpecifierNameList.push(import_);
  }

  const stmts: Array<t.ImportDeclaration> = [];
  for (const [source, import_] of sortedImports) {
    const importSpecifiers = import_.map(specifier => {
      return t.importSpecifier(
        t.identifier(specifier.local),
        t.identifier(specifier.importSpecifierName),
      );
    });

    stmts.push(t.importDeclaration(importSpecifiers, t.stringLiteral(source)));
  }
  path.unshiftContainer('body', stmts);
}

/*
 * Matches `import { ... } from <moduleName>;`
 * but not `import * as React from <moduleName>;`
 */
function isNonNamespacedImport(
  importDeclPath: NodePath<t.ImportDeclaration>,
  moduleName: string,
): boolean {
  return (
    importDeclPath.get('source').node.value === moduleName &&
    importDeclPath
      .get('specifiers')
      .every(specifier => specifier.isImportSpecifier()) &&
    importDeclPath.node.importKind !== 'type' &&
    importDeclPath.node.importKind !== 'typeof'
  );
}

function hasExistingNonNamespacedImportOfModule(
  program: NodePath<t.Program>,
  moduleName: string,
): boolean {
  let hasExistingImport = false;
  program.traverse({
    ImportDeclaration(importDeclPath) {
      if (isNonNamespacedImport(importDeclPath, moduleName)) {
        hasExistingImport = true;
      }
    },
  });

  return hasExistingImport;
}

/*
 * If an existing import of React exists (ie `import { ... } from '<moduleName>'`), inject useMemoCache
 * into the list of destructured variables.
 */
function addMemoCacheFunctionSpecifierToExistingImport(
  program: NodePath<t.Program>,
  moduleName: string,
  identifierName: string,
): boolean {
  let didInsertUseMemoCache = false;
  program.traverse({
    ImportDeclaration(importDeclPath) {
      if (
        !didInsertUseMemoCache &&
        isNonNamespacedImport(importDeclPath, moduleName)
      ) {
        importDeclPath.pushContainer(
          'specifiers',
          t.importSpecifier(t.identifier(identifierName), t.identifier('c')),
        );
        didInsertUseMemoCache = true;
      }
    },
  });
  return didInsertUseMemoCache;
}

export function updateMemoCacheFunctionImport(
  program: NodePath<t.Program>,
  moduleName: string,
  useMemoCacheIdentifier: string,
): void {
  /*
   * If there isn't already an import of * as React, insert it so useMemoCache doesn't
   * throw
   */
  const hasExistingImport = hasExistingNonNamespacedImportOfModule(
    program,
    moduleName,
  );

  if (hasExistingImport) {
    const didUpdateImport = addMemoCacheFunctionSpecifierToExistingImport(
      program,
      moduleName,
      useMemoCacheIdentifier,
    );
    if (!didUpdateImport) {
      throw new Error(
        `Expected an ImportDeclaration of \`${moduleName}\` in order to update ImportSpecifiers with useMemoCache`,
      );
    }
  } else {
    addMemoCacheFunctionImportDeclaration(
      program,
      moduleName,
      useMemoCacheIdentifier,
    );
  }
}

function addMemoCacheFunctionImportDeclaration(
  program: NodePath<t.Program>,
  moduleName: string,
  localName: string,
): void {
  program.unshiftContainer(
    'body',
    t.importDeclaration(
      [t.importSpecifier(t.identifier(localName), t.identifier('c'))],
      t.stringLiteral(moduleName),
    ),
  );
}
