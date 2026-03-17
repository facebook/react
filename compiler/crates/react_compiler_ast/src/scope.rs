use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Identifies a scope in the scope table. Copy-able, used as an index.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ScopeId(pub u32);

/// Identifies a binding (variable declaration) in the binding table. Copy-able, used as an index.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct BindingId(pub u32);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopeData {
    pub id: ScopeId,
    pub parent: Option<ScopeId>,
    pub kind: ScopeKind,
    /// Bindings declared directly in this scope, keyed by name.
    /// Maps to BindingId for lookup in the binding table.
    pub bindings: HashMap<String, BindingId>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ScopeKind {
    Program,
    Function,
    Block,
    #[serde(rename = "for")]
    For,
    Class,
    Switch,
    Catch,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BindingData {
    pub id: BindingId,
    pub name: String,
    pub kind: BindingKind,
    /// The scope this binding is declared in.
    pub scope: ScopeId,
    /// The type of the declaration AST node (e.g., "FunctionDeclaration",
    /// "VariableDeclarator"). Used by the compiler to distinguish function
    /// declarations from variable declarations during hoisting.
    pub declaration_type: String,
    /// For import bindings: the source module and import details.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub import: Option<ImportBindingData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BindingKind {
    Var,
    Let,
    Const,
    Param,
    /// Import bindings (import declarations).
    Module,
    /// Function declarations (hoisted).
    Hoisted,
    /// Other local bindings (class declarations, etc.).
    Local,
    /// Binding kind not recognized by the serializer.
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportBindingData {
    /// The module specifier string (e.g., "react" in `import {useState} from 'react'`).
    pub source: String,
    pub kind: ImportBindingKind,
    /// For named imports: the imported name (e.g., "bar" in `import {bar as baz} from 'foo'`).
    /// None for default and namespace imports.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub imported: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImportBindingKind {
    Default,
    Named,
    Namespace,
}

/// Complete scope information for a program. Stored separately from the AST
/// and linked via position-based lookup maps.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopeInfo {
    /// All scopes, indexed by ScopeId. scopes[id.0] gives the ScopeData for that scope.
    pub scopes: Vec<ScopeData>,
    /// All bindings, indexed by BindingId. bindings[id.0] gives the BindingData.
    pub bindings: Vec<BindingData>,

    /// Maps an AST node's start offset to the scope it creates.
    pub node_to_scope: HashMap<u32, ScopeId>,

    /// Maps an Identifier AST node's start offset to the binding it resolves to.
    /// Only present for identifiers that resolve to a binding (not globals).
    pub reference_to_binding: HashMap<u32, BindingId>,

    /// Binding IDs of variables that are "context identifiers" — shared between
    /// a function and its nested closures via mutation. These need
    /// StoreContext/LoadContext instead of StoreLocal/LoadLocal.
    #[serde(default)]
    pub context_identifiers: Vec<BindingId>,

    /// The program-level (module) scope. Always scopes[0].
    pub program_scope: ScopeId,
}

impl ScopeInfo {
    /// Look up a binding by name starting from the given scope,
    /// walking up the parent chain. Returns None for globals.
    pub fn get_binding(&self, scope_id: ScopeId, name: &str) -> Option<BindingId> {
        let mut current = Some(scope_id);
        while let Some(id) = current {
            let scope = &self.scopes[id.0 as usize];
            if let Some(&binding_id) = scope.bindings.get(name) {
                return Some(binding_id);
            }
            current = scope.parent;
        }
        None
    }

    /// Look up the binding for an identifier reference by its AST node start offset.
    /// Returns None for globals/unresolved references.
    pub fn resolve_reference(&self, identifier_start: u32) -> Option<&BindingData> {
        self.reference_to_binding
            .get(&identifier_start)
            .map(|id| &self.bindings[id.0 as usize])
    }

    /// Get all bindings declared in a scope (for hoisting iteration).
    pub fn scope_bindings(&self, scope_id: ScopeId) -> impl Iterator<Item = &BindingData> {
        self.scopes[scope_id.0 as usize]
            .bindings
            .values()
            .map(|id| &self.bindings[id.0 as usize])
    }
}
