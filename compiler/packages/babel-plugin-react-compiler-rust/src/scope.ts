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
  contextIdentifiers: Array<number>;
  programScope: number;
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
        }
      }

      // Map constant violations (LHS of assignments like `a = b`, `a++`, `for (a of ...)`)
      for (const violation of babelBinding.constantViolations) {
        if (violation.isAssignmentExpression()) {
          const left = violation.get('left');
          if (left.isIdentifier()) {
            const start = left.node.start;
            if (start != null) {
              referenceToBinding[start] = bindingId;
            }
          }
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
          if (left.isIdentifier()) {
            const start = left.node.start;
            if (start != null) {
              referenceToBinding[start] = bindingId;
            }
          }
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

  // Compute context identifiers: variables shared between a function and its
  // nested closures via mutation. Matches findContextIdentifiers logic.
  const contextIdentifiers = computeContextIdentifiers(program, bindings, scopeUidToId);

  return {
    scopes,
    bindings,
    nodeToScope,
    referenceToBinding,
    contextIdentifiers,
    programScope: programScopeId,
  };
}

function computeContextIdentifiers(
  program: NodePath<t.Program>,
  bindings: Array<BindingData>,
  scopeUidToId: Map<string, number>,
): Array<number> {
  type IdentifierInfo = {
    reassigned: boolean;
    reassignedByInnerFn: boolean;
    referencedByInnerFn: boolean;
    bindingId: number;
  };

  const identifierInfoMap = new Map</* Babel binding */ object, IdentifierInfo>();
  const functionStack: Array<NodePath> = [];

  const withFunctionScope = {
    enter(path: NodePath) {
      functionStack.push(path);
    },
    exit() {
      functionStack.pop();
    },
  };

  function getOrCreateInfo(babelBinding: any, bindingId: number): IdentifierInfo {
    let info = identifierInfoMap.get(babelBinding);
    if (!info) {
      info = {
        reassigned: false,
        reassignedByInnerFn: false,
        referencedByInnerFn: false,
        bindingId,
      };
      identifierInfoMap.set(babelBinding, info);
    }
    return info;
  }

  function handleAssignment(lvalPath: NodePath): void {
    const node = lvalPath.node;
    if (!node) return;
    switch (node.type) {
      case 'Identifier': {
        const path = lvalPath as NodePath<t.Identifier>;
        const name = path.node.name;
        const binding = path.scope.getBinding(name);
        if (!binding) break;
        const uid = String(binding.scope.uid);
        const scopeId = scopeUidToId.get(uid);
        if (scopeId === undefined) break;
        // Find this binding's ID
        const bindingId = bindings.findIndex(
          b => b.name === name && b.scope === scopeId,
        );
        if (bindingId === -1) break;
        const info = getOrCreateInfo(binding, bindingId);
        info.reassigned = true;
        const currentFn = functionStack.at(-1) ?? null;
        if (currentFn != null) {
          const bindingAboveLambda = (currentFn as any).scope?.parent?.getBinding(name);
          if (binding === bindingAboveLambda) {
            info.reassignedByInnerFn = true;
          }
        }
        break;
      }
      case 'ArrayPattern': {
        for (const element of (lvalPath as NodePath<t.ArrayPattern>).get('elements')) {
          if (element.node) handleAssignment(element as NodePath);
        }
        break;
      }
      case 'ObjectPattern': {
        for (const property of (lvalPath as NodePath<t.ObjectPattern>).get('properties')) {
          if (property.isObjectProperty()) {
            handleAssignment(property.get('value') as NodePath);
          } else if (property.isRestElement()) {
            handleAssignment(property as NodePath);
          }
        }
        break;
      }
      case 'AssignmentPattern': {
        handleAssignment((lvalPath as NodePath<t.AssignmentPattern>).get('left'));
        break;
      }
      case 'RestElement': {
        handleAssignment((lvalPath as NodePath<t.RestElement>).get('argument'));
        break;
      }
      default:
        break;
    }
  }

  program.traverse({
    FunctionDeclaration: withFunctionScope,
    FunctionExpression: withFunctionScope,
    ArrowFunctionExpression: withFunctionScope,
    ObjectMethod: withFunctionScope,
    Identifier(path: NodePath<t.Identifier>) {
      if (!path.isReferencedIdentifier()) return;
      const name = path.node.name;
      const binding = path.scope.getBinding(name);
      if (!binding) return;
      const uid = String(binding.scope.uid);
      const scopeId = scopeUidToId.get(uid);
      if (scopeId === undefined) return;
      const bindingId = bindings.findIndex(
        b => b.name === name && b.scope === scopeId,
      );
      if (bindingId === -1) return;
      const currentFn = functionStack.at(-1) ?? null;
      if (currentFn != null) {
        const bindingAboveLambda = (currentFn as any).scope?.parent?.getBinding(name);
        if (binding === bindingAboveLambda) {
          const info = getOrCreateInfo(binding, bindingId);
          info.referencedByInnerFn = true;
        }
      }
    },
    AssignmentExpression(path: NodePath<t.AssignmentExpression>) {
      const left = path.get('left');
      if (left.isLVal()) {
        handleAssignment(left);
      }
    },
    UpdateExpression(path: NodePath<t.UpdateExpression>) {
      const argument = path.get('argument');
      if (argument.isLVal()) {
        handleAssignment(argument as NodePath);
      }
    },
  });

  const result: Array<number> = [];
  for (const info of identifierInfoMap.values()) {
    if (
      info.reassignedByInnerFn ||
      (info.reassigned && info.referencedByInnerFn)
    ) {
      result.push(info.bindingId);
    }
  }
  return result;
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
