/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {NodePath} from '@babel/core';
import type * as t from '@babel/types';

export interface ScopeData {
  id: number;
  parent: number | null;
  kind: string;
  bindings: Record<string, number>;
}

export interface BindingData {
  id: number;
  name: string;
  kind: string;
  scope: number;
  declarationType: string;
  declarationStart?: number;
  import?: ImportBindingData;
}

export interface ImportBindingData {
  source: string;
  kind: string;
  imported?: string;
}

export interface ScopeInfo {
  scopes: Array<ScopeData>;
  bindings: Array<BindingData>;
  nodeToScope: Record<number, number>;
  referenceToBinding: Record<number, number>;
  referenceLocs: Record<number, [number, number, number, number]>;
  programScope: number;
}

/**
 * Recursively map identifier references inside a pattern (including destructuring)
 * to a binding. Only maps identifiers that match the binding name.
 */
function mapPatternIdentifiers(
  path: NodePath,
  bindingId: number,
  bindingName: string,
  referenceToBinding: Record<number, number>,
): void {
  if (path.isIdentifier()) {
    if (path.node.name === bindingName) {
      const start = path.node.start;
      if (start != null) {
        referenceToBinding[start] = bindingId;
      }
    }
  } else if (path.isArrayPattern()) {
    for (const element of path.get('elements')) {
      if (element.node != null) {
        mapPatternIdentifiers(element as NodePath, bindingId, bindingName, referenceToBinding);
      }
    }
  } else if (path.isObjectPattern()) {
    for (const prop of path.get('properties')) {
      if (prop.isRestElement()) {
        mapPatternIdentifiers(prop.get('argument'), bindingId, bindingName, referenceToBinding);
      } else if (prop.isObjectProperty()) {
        mapPatternIdentifiers(prop.get('value') as NodePath, bindingId, bindingName, referenceToBinding);
      }
    }
  } else if (path.isAssignmentPattern()) {
    mapPatternIdentifiers(path.get('left') as NodePath, bindingId, bindingName, referenceToBinding);
  } else if (path.isRestElement()) {
    mapPatternIdentifiers(path.get('argument'), bindingId, bindingName, referenceToBinding);
  } else if (path.isMemberExpression()) {
    // MemberExpression in LVal position (e.g., a.b = ...)
    const obj = path.get('object');
    if (obj.isIdentifier() && obj.node.name === bindingName) {
      const start = obj.node.start;
      if (start != null) {
        referenceToBinding[start] = bindingId;
      }
    }
  }
}

/**
 * Extract scope information from a Babel Program path.
 * Converts Babel's scope tree into the flat ScopeInfo format
 * expected by the Rust compiler.
 */
export function extractScopeInfo(program: NodePath<t.Program>): ScopeInfo {
  const scopes: Array<ScopeData> = [];
  const bindings: Array<BindingData> = [];
  const nodeToScope: Record<number, number> = {};
  const referenceToBinding: Record<number, number> = {};
  const referenceLocs: Record<number, [number, number, number, number]> = {};

  // Map from Babel scope uid to our scope id
  const scopeUidToId = new Map<string, number>();

  // Helper to register a scope and its bindings
  function registerScope(
    babelScope: ReturnType<NodePath['scope']['constructor']> & {
      uid: number;
      parent: {uid: number} | null;
      bindings: Record<string, any>;
    },
    path: NodePath | null,
  ): void {
    const uid = String(babelScope.uid);
    if (scopeUidToId.has(uid)) return;

    const scopeId = scopes.length;
    scopeUidToId.set(uid, scopeId);

    // Determine parent scope id
    let parentId: number | null = null;
    if (babelScope.parent) {
      const parentUid = String(babelScope.parent.uid);
      if (scopeUidToId.has(parentUid)) {
        parentId = scopeUidToId.get(parentUid)!;
      }
    }

    // Determine scope kind
    const kind = path != null ? getScopeKind(path) : 'program';

    // Collect bindings declared in this scope
    const scopeBindings: Record<string, number> = {};
    const ownBindings = babelScope.bindings;
    for (const name of Object.keys(ownBindings)) {
      const babelBinding = ownBindings[name];
      if (!babelBinding) continue;

      const bindingId = bindings.length;
      scopeBindings[name] = bindingId;

      const bindingData: BindingData = {
        id: bindingId,
        name,
        kind: getBindingKind(babelBinding),
        scope: scopeId,
        declarationType: babelBinding.path.node.type,
        declarationStart: babelBinding.identifier.start ?? undefined,
      };

      // Check for import bindings
      if (babelBinding.kind === 'module') {
        const importData = getImportData(babelBinding);
        if (importData) {
          bindingData.import = importData;
        }
      }

      bindings.push(bindingData);

      // Map identifier references to bindings
      for (const ref of babelBinding.referencePaths) {
        const start = ref.node.start;
        if (start != null) {
          referenceToBinding[start] = bindingId;
          if (ref.node.loc != null) {
            referenceLocs[start] = [
              ref.node.loc.start.line,
              ref.node.loc.start.column,
              ref.node.loc.end.line,
              ref.node.loc.end.column,
            ];
          }
        }
      }

      // Map constant violations (LHS of assignments like `a = b`, `a++`, `for (a of ...)`)
      for (const violation of babelBinding.constantViolations) {
        if (violation.isAssignmentExpression()) {
          const left = violation.get('left');
          mapPatternIdentifiers(left, bindingId, babelBinding.identifier.name, referenceToBinding);
        } else if (violation.isUpdateExpression()) {
          const arg = violation.get('argument');
          if (arg.isIdentifier()) {
            const start = arg.node.start;
            if (start != null) {
              referenceToBinding[start] = bindingId;
            }
          }
        } else if (
          violation.isForOfStatement() ||
          violation.isForInStatement()
        ) {
          const left = violation.get('left');
          mapPatternIdentifiers(left, bindingId, babelBinding.identifier.name, referenceToBinding);
        }
      }

      // Map the binding identifier itself
      const bindingStart = babelBinding.identifier.start;
      if (bindingStart != null) {
        referenceToBinding[bindingStart] = bindingId;
      }
    }

    // Map AST node to scope
    if (path != null) {
      const nodeStart = path.node.start;
      if (nodeStart != null) {
        nodeToScope[nodeStart] = scopeId;
      }
    }

    scopes.push({
      id: scopeId,
      parent: parentId,
      kind,
      bindings: scopeBindings,
    });
  }

  // Register the program scope first (program.traverse doesn't visit the Program node itself)
  registerScope(program.scope as any, program);

  // Collect all child scopes by traversing the program
  program.traverse({
    enter(path) {
      registerScope(path.scope as any, path);
    },
  });

  // Program scope should always be id 0
  const programScopeUid = String(program.scope.uid);
  const programScopeId = scopeUidToId.get(programScopeUid) ?? 0;

  return {
    scopes,
    bindings,
    nodeToScope,
    referenceToBinding,
    referenceLocs,
    programScope: programScopeId,
  };
}

function getScopeKind(path: NodePath): string {
  if (path.isProgram()) return 'program';
  if (path.isFunction()) return 'function';
  if (
    path.isForStatement() ||
    path.isForInStatement() ||
    path.isForOfStatement()
  )
    return 'for';
  if (path.isClassDeclaration() || path.isClassExpression()) return 'class';
  if (path.isSwitchStatement()) return 'switch';
  if (path.isCatchClause()) return 'catch';
  return 'block';
}

function getBindingKind(binding: {kind: string; path: NodePath}): string {
  switch (binding.kind) {
    case 'var':
      return 'var';
    case 'let':
      return 'let';
    case 'const':
      return 'const';
    case 'param':
      return 'param';
    case 'module':
      return 'module';
    case 'hoisted':
      return 'hoisted';
    case 'local':
      return 'local';
    default:
      return 'unknown';
  }
}

function getImportData(binding: {
  path: NodePath;
}): ImportBindingData | undefined {
  const decl = binding.path;
  if (
    !decl.isImportSpecifier() &&
    !decl.isImportDefaultSpecifier() &&
    !decl.isImportNamespaceSpecifier()
  ) {
    return undefined;
  }

  const importDecl = decl.parentPath;
  if (!importDecl?.isImportDeclaration()) {
    return undefined;
  }

  const source = importDecl.node.source.value;

  if (decl.isImportDefaultSpecifier()) {
    return {source, kind: 'default'};
  }
  if (decl.isImportNamespaceSpecifier()) {
    return {source, kind: 'namespace'};
  }
  if (decl.isImportSpecifier()) {
    const imported = decl.node.imported;
    const importedName =
      imported.type === 'Identifier' ? imported.name : imported.value;
    return {source, kind: 'named', imported: importedName};
  }
  return undefined;
}
