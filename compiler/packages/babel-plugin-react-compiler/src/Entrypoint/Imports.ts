/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/core';
import * as t from '@babel/types';
import {Scope as BabelScope} from '@babel/traverse';

import {CompilerError, ErrorSeverity} from '../CompilerError';
import {
  EnvironmentConfig,
  GeneratedSource,
  NonLocalBinding,
  NonLocalImportSpecifier,
} from '../HIR';
import {getOrInsertWith} from '../Utils/utils';
import {ExternalFunction, isHookName} from '../HIR/Environment';
import {Err, Ok, Result} from '../Utils/Result';
import {CompilerReactTarget} from './Options';
import {getReactCompilerRuntimeModule} from './Program';

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

export class ProgramContext {
  uids: Set<string> = new Set();
  hookPattern: string | null;
  scope: BabelScope;
  imports: Map<string, Map<string, NonLocalImportSpecifier>> = new Map();
  reactRuntimeModule: string;
  constructor(
    program: NodePath<t.Program>,
    reactRuntimeModule: CompilerReactTarget,
    hookPattern: string | null,
  ) {
    this.hookPattern = hookPattern;
    this.scope = program.scope;
    this.reactRuntimeModule = getReactCompilerRuntimeModule(reactRuntimeModule);
  }
  isHookName(name: string): boolean {
    if (this.hookPattern == null) {
      return isHookName(name);
    } else {
      const match = new RegExp(this.hookPattern).exec(name);
      return (
        match != null && typeof match[1] === 'string' && isHookName(match[1])
      );
    }
  }
  hasReference(name: string): boolean {
    return (
      this.uids.has(name) ||
      this.scope.hasBinding(name) ||
      this.scope.hasGlobal(name) ||
      this.scope.hasReference(name)
    );
  }
  newUid(name: string): string {
    /**
     * Don't call babel's generateUid for known hook imports, as
     * InferTypes might eventually type `HookKind` based on callee naming
     * convention and `_useFoo` is not named as a hook.
     *
     * Local uid generation is susceptible to check-before-use bugs since we're
     * checking for naming conflicts / references long before we actually insert
     * the import. (see similar logic in HIRBuilder:resolveBinding)
     */
    let uid;
    if (this.isHookName(name)) {
      uid = name;
      let i = 0;
      while (this.hasReference(uid)) {
        uid = `${name}_${i++}`;
      }
    } else if (!this.hasReference(name)) {
      uid = name;
    } else {
      uid = this.scope.generateUid(name);
    }
    this.uids.add(uid);
    return uid;
  }

  addMemoCacheImport(): NonLocalImportSpecifier {
    return this.addImportSpecifier(
      {
        source: this.reactRuntimeModule,
        importSpecifierName: 'c',
      },
      '_c',
    );
  }

  /**
   *
   * @param externalFunction
   * @param nameHint if defined, will be used as the name of the import specifier
   * @returns
   */
  addImportSpecifier(
    {source: module, importSpecifierName: specifier}: ExternalFunction,
    nameHint?: string,
  ): NonLocalImportSpecifier {
    const maybeBinding = this.imports.get(module)?.get(specifier);
    if (maybeBinding != null) {
      return {...maybeBinding};
    }

    const binding: NonLocalBinding = {
      kind: 'ImportSpecifier',
      name: this.newUid(nameHint ?? specifier),
      module,
      imported: specifier,
    };
    getOrInsertWith(this.imports, module, () => new Map()).set(specifier, {
      ...binding,
    });
    return binding;
  }

  addReference(name: string): void {
    this.uids.add(name);
  }

  assertGlobalBinding(
    name: string,
    localScope?: BabelScope,
  ): Result<void, CompilerError> {
    const scope = localScope ?? this.scope;
    if (!scope.hasReference(name) && !scope.hasBinding(name)) {
      return Ok(undefined);
    }
    const error = new CompilerError();
    error.push({
      severity: ErrorSeverity.Todo,
      reason: 'Encountered conflicting global in generated program',
      description: `Conflict from local binding ${name}`,
      loc: scope.getBinding(name)?.path.node.loc ?? null,
      suggestions: null,
    });
    return Err(error);
  }
}

export function addImportsToProgram(
  path: NodePath<t.Program>,
  programContext: ProgramContext,
): void {
  const stmts: Array<t.ImportDeclaration> = [];
  const sortedModules = [...programContext.imports.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [moduleName, importsMap] of sortedModules) {
    for (const [specifierName, loweredImport] of importsMap) {
      /**
       * Assert that the import identifier hasn't already be declared in the program.
       * Note: we use getBinding here since `Scope.hasBinding` pessimistically returns true
       * for all allocated uids (from `Scope.getUid`)
       */
      CompilerError.invariant(
        path.scope.getBinding(loweredImport.name) == null,
        {
          reason:
            'Encountered conflicting import specifiers in generated program',
          description: `Conflict from import ${loweredImport.module}:(${loweredImport.imported} as ${loweredImport.name}).`,
          loc: GeneratedSource,
          suggestions: null,
        },
      );
      CompilerError.invariant(
        loweredImport.module === moduleName &&
          loweredImport.imported === specifierName,
        {
          reason:
            'Found inconsistent import specifier. This is an internal bug.',
          description: `Expected import ${moduleName}:${specifierName} but found ${loweredImport.module}:${loweredImport.imported}`,
          loc: GeneratedSource,
        },
      );
    }
    const sortedImport: Array<NonLocalImportSpecifier> = [
      ...importsMap.values(),
    ].sort(({imported: a}, {imported: b}) => a.localeCompare(b));
    const importSpecifiers = sortedImport.map(specifier => {
      return t.importSpecifier(
        t.identifier(specifier.name),
        t.identifier(specifier.imported),
      );
    });

    stmts.push(
      t.importDeclaration(importSpecifiers, t.stringLiteral(moduleName)),
    );
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
