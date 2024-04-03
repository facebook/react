/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
use indexmap::IndexMap;
use react_diagnostics::Diagnostic;
use react_estree::{
    BreakStatement, ContinueStatement, ESTreeNode, LabeledStatement, SourceRange, SourceType,
    VariableDeclarationKind,
};
use react_utils::PointerAddress;

use crate::scope_view::{DeclarationView, ReferenceView, ScopeView};
use crate::ScopeManagerView;

pub struct ScopeManager {
    root: ScopeId,
    globals: IndexMap<String, DeclarationId>,

    // Storage of the semantic information
    scopes: Vec<Scope>,
    labels: Vec<Label>,
    declarations: Vec<Declaration>,
    references: Vec<Reference>,

    // Mapping of AST nodes (by pointer address) to semantic information
    // Not all nodes will have all types of information available
    pub(crate) node_scopes: IndexMap<AstNode, ScopeId>,
    pub(crate) node_labels: IndexMap<AstNode, LabelId>,
    pub(crate) node_declarations: IndexMap<AstNode, DeclarationId>,
    pub(crate) node_references: IndexMap<AstNode, ReferenceId>,
    pub(crate) diagnostics: Vec<Diagnostic>,
}

impl std::fmt::Debug for ScopeManager {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        std::fmt::Debug::fmt(&self.debug(), f)
    }
}

impl ScopeManager {
    pub(crate) fn new(source_type: SourceType, globals: Vec<String>) -> Self {
        let root_id = ScopeId(0);
        let root_kind = match source_type {
            SourceType::Module => ScopeKind::Module,
            SourceType::Script => ScopeKind::Global,
        };
        let mut manager = Self {
            root: root_id,
            globals: IndexMap::with_capacity(globals.len()),
            scopes: vec![Scope {
                id: root_id,
                kind: root_kind,
                parent: None,
                declarations: Default::default(),
                references: Default::default(),
                children: Default::default(),
            }],
            labels: Default::default(),
            declarations: Default::default(),
            references: Default::default(),
            node_scopes: Default::default(),
            node_labels: Default::default(),
            node_declarations: Default::default(),
            node_references: Default::default(),
            diagnostics: Default::default(),
        };
        for global in globals {
            let id = DeclarationId(manager.declarations.len());
            manager.globals.insert(global.clone(), id);
            manager.declarations.push(Declaration {
                id,
                kind: DeclarationKind::Global,
                name: global,
                scope: manager.root,
            });
        }

        manager
    }

    pub fn debug(&self) -> ScopeManagerView<'_> {
        ScopeManagerView { manager: self }
    }

    pub fn diagnostics(&mut self) -> Vec<Diagnostic> {
        std::mem::take(&mut self.diagnostics)
    }

    pub fn globals(&self) -> impl Iterator<Item = (&String, &DeclarationId)> {
        self.globals.iter()
    }

    pub fn root(&self) -> &Scope {
        &self.scopes[self.root.0]
    }

    pub fn scope(&self, id: ScopeId) -> &Scope {
        &self.scopes[id.0]
    }

    pub fn mut_scope(&mut self, id: ScopeId) -> &mut Scope {
        &mut self.scopes[id.0]
    }

    pub fn is_descendant_of(&self, maybe_descendant: ScopeId, maybe_ancestor: ScopeId) -> bool {
        let mut current = maybe_descendant;
        loop {
            if current == maybe_ancestor {
                return true;
            }
            let scope = self.scope(current);
            if let Some(parent) = scope.parent {
                current = parent;
            } else {
                return false;
            }
        }
    }

    pub fn label(&self, id: LabelId) -> &Label {
        &self.labels[id.0]
    }

    pub fn declaration(&self, id: DeclarationId) -> &Declaration {
        &self.declarations[id.0]
    }

    pub fn reference(&self, id: ReferenceId) -> &Reference {
        &self.references[id.0]
    }

    pub fn node_scope<T: ESTreeNode>(&self, node: &T) -> Option<&Scope> {
        self.node_scopes
            .get(&AstNode::from(node))
            .map(|id| &self.scopes[id.0])
    }

    pub fn node_scope_view<T: ESTreeNode>(&self, node: &T) -> Option<ScopeView<'_>> {
        self.node_scopes
            .get(&AstNode::from(node))
            .map(|id| ScopeView {
                manager: self,
                scope: &self.scopes[id.0],
            })
    }

    pub fn node_label(&self, node: &LabeledStatement) -> Option<&Label> {
        self.node_labels
            .get(&AstNode::from(node))
            .map(|id| &self.labels[id.0])
    }

    pub fn break_label(&self, node: &BreakStatement) -> Option<&Label> {
        self.node_labels
            .get(&AstNode::from(node))
            .map(|id| &self.labels[id.0])
    }

    pub fn continue_label(&self, node: &ContinueStatement) -> Option<&Label> {
        self.node_labels
            .get(&AstNode::from(node))
            .map(|id| &self.labels[id.0])
    }

    pub fn node_declaration<T: ESTreeNode>(&self, node: &T) -> Option<&Declaration> {
        self.node_declarations
            .get(&AstNode::from(node))
            .map(|id| &self.declarations[id.0])
    }

    pub fn node_declaration_view<T: ESTreeNode>(&self, node: &T) -> Option<DeclarationView<'_>> {
        self.node_declarations
            .get(&AstNode::from(node))
            .map(|id| DeclarationView {
                manager: self,
                declaration: &self.declarations[id.0],
            })
    }

    pub fn node_reference<T: ESTreeNode>(&self, node: &T) -> Option<&Reference> {
        self.node_references
            .get(&AstNode::from(node))
            .map(|id| &self.references[id.0])
    }

    pub fn node_reference_view<T: ESTreeNode>(&self, node: &T) -> Option<ReferenceView<'_>> {
        self.node_references
            .get(&AstNode::from(node))
            .map(|id| ReferenceView {
                manager: self,
                reference: &self.references[id.0],
            })
    }

    pub fn lookup_reference(
        &self,
        scope: ScopeId,
        name: &str,
        next_declaration: DeclarationId,
    ) -> Option<&Declaration> {
        let mut current = &self.scopes[scope.0];
        let mut tdz_limit = Some(next_declaration);
        loop {
            if let Some(id) = current.declarations.get(name) {
                let declaration = self.declaration(*id);

                // Basic static check for TDZ violations. If there is still a
                // tdz limit (see below where we reset when leaving function scopes)
                // then we check if the declaration is let/const and came after the
                // reference. If so it's a TDZ violation
                if let Some(tdz_limit) = tdz_limit {
                    if (declaration.kind == DeclarationKind::Let
                        || declaration.kind == DeclarationKind::Const)
                        && id.0 >= tdz_limit.0
                    {
                        return None;
                    }
                }
                return Some(declaration);
            }
            if let Some(parent) = current.parent {
                // When leaving a function scope, clear the tdz limit.
                // This means we won't report TDZ violations for references
                // inside functions to hoisted let/const variables defined
                // outside the function
                if current.kind == ScopeKind::Function {
                    tdz_limit = None;
                }
                current = &self.scopes[parent.0];
            } else {
                // Maybe it's a global!
                if let Some(id) = self.globals.get(name) {
                    let declaration = self.declaration(*id);
                    return Some(declaration);
                }
                return None;
            }
        }
    }

    pub(crate) fn root_id(&self) -> ScopeId {
        self.root
    }

    pub(crate) fn add_scope(&mut self, parent: ScopeId, kind: ScopeKind) -> ScopeId {
        let id = ScopeId(self.scopes.len());
        self.scopes.push(Scope {
            id,
            kind,
            parent: Some(parent),
            declarations: Default::default(),
            references: Default::default(),
            children: Default::default(),
        });
        self.scopes[parent.0].children.push(id);
        id
    }

    pub(crate) fn add_label(&mut self, scope: ScopeId, kind: LabelKind, name: String) -> LabelId {
        let id = LabelId(self.labels.len());
        self.labels.push(Label {
            id,
            kind,
            scope,
            name: Some(name),
        });
        id
    }

    pub(crate) fn add_anonymous_label(&mut self, scope: ScopeId, kind: LabelKind) -> LabelId {
        let id = LabelId(self.labels.len());
        self.labels.push(Label {
            id,
            kind,
            scope,
            name: None,
        });
        id
    }

    pub(crate) fn add_declaration(
        &mut self,
        scope_id: ScopeId,
        name: String,
        kind: DeclarationKind,
        range: Option<SourceRange>,
    ) -> DeclarationId {
        let scope = self.scope(scope_id);
        // Determine the scope to which this declaration should be hoisted. This mainly applies to var declarations
        let hoisted_scope_id = self.get_scope_for_declaration(scope_id, kind);

        // Check for redeclaration. The rules are roughly:
        // * `var` can be redeclared any number of times in a given scope. These redeclarations have no effect,
        //    subsequent declarations are equivalent to just reassigning a value to the original declaration.
        //    ie `var a = 1; var a = 2;` is equivalent to `var a; a = 1; a = 2`.
        // * Other forms (in strict mode) may not be redeclared in a given scope.
        // * This implies that `var` cannot conflict with other types of declarations, either in the scope
        //   at which they are declared or the scope to which the var will hoist:
        //   * `function() { {let a; var a;} }` conflicts at the declaration scope, even though the var will hoise above.
        //   * `function() { let a; { var a; } }` conflicts bc the var hoists to the scope w a conflicting let.
        match kind {
            DeclarationKind::Var => {
                if let Some(declaration) = scope.declarations.get(&name) {
                    let declaration = self.declaration(*declaration);
                    if is_block_scoped_declaration(declaration.kind) {
                        // Var cannot be declared in the same scope as let/const/class/import/etc
                        self.diagnostics
                            .push(Diagnostic::invalid_syntax("Duplicate declaration", range));
                    }
                } else if hoisted_scope_id != scope_id {
                    if let Some(declaration) = self.scope(hoisted_scope_id).declarations.get(&name)
                    {
                        let declaration = self.declaration(*declaration);
                        if is_block_scoped_declaration(declaration.kind) {
                            // Var cannot *hoist* to the same scope as let/const/class/import/etc
                            self.diagnostics
                                .push(Diagnostic::invalid_syntax("Duplicate declaration", range));
                        }
                    }
                }
                // Redeclaration of `var` in a given scope has no effect, subsequent declarations
                // are equivalent to re-declarations
                // ie `var a = 1; var a = 2;` is equivalent to `var a; a = 1; a = 2`.
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var#redeclarations
                if let Some(declaration) = self.scope(hoisted_scope_id).declarations.get(&name) {
                    let declaration = self.declaration(*declaration);
                    if declaration.kind == DeclarationKind::Var {
                        return declaration.id;
                    }
                }
            }
            DeclarationKind::CatchClause
            | DeclarationKind::Let
            | DeclarationKind::Const
            | DeclarationKind::Import
            | DeclarationKind::Class
            | DeclarationKind::Function => {
                // When duplicate declarations occur we report an error and then resolve references to the
                // first declaration. It doesn't really matter which declaration we refer to, because
                // semantic results are invalid if there are errors. The main consideration is that we do
                // not want to report a "cannot find declaration for `x`" reference error just because there
                // were duplicate declarations of `x`.
                if let Some(_declaration) = scope.declarations.get(&name) {
                    self.diagnostics
                        .push(Diagnostic::invalid_syntax("Duplicate declaration", range));
                }
            }
            DeclarationKind::Global => {
                unreachable!("Unexpected explicit declaration of global")
            }
        }

        // Always create a new declaration and id...
        let id = DeclarationId(self.declarations.len());
        self.declarations.push(Declaration {
            id,
            kind,
            name: name.clone(),
            scope: hoisted_scope_id,
        });
        // ...but only save the first declaration for a given name in each scope
        self.scopes[hoisted_scope_id.0]
            .declarations
            .entry(name)
            .or_insert(id);
        id
    }

    fn get_scope_for_declaration(&self, scope: ScopeId, kind: DeclarationKind) -> ScopeId {
        match kind {
            DeclarationKind::Let
            | DeclarationKind::Import
            | DeclarationKind::Const
            | DeclarationKind::CatchClause
            | DeclarationKind::Class => scope,
            DeclarationKind::Var | DeclarationKind::Function => {
                let mut current = scope;
                loop {
                    let scope = self.scope(current);
                    match scope.kind {
                        ScopeKind::Function
                        | ScopeKind::Global
                        | ScopeKind::Module
                        | ScopeKind::StaticBlock => {
                            return current;
                        }
                        _ => { /* no-op */ }
                    }
                    if let Some(parent) = &scope.parent {
                        current = *parent
                    } else {
                        unreachable!(
                            "Expected scope without a parent to be a Global or Module scope"
                        );
                    }
                }
            }
            DeclarationKind::Global => {
                unreachable!("Unexpected explicit declaration of global")
            }
        }
    }

    pub(crate) fn add_reference(
        &mut self,
        scope: ScopeId,
        kind: ReferenceKind,
        declaration: DeclarationId,
    ) -> ReferenceId {
        let id = ReferenceId(self.references.len());
        self.references.push(Reference {
            id,
            kind,
            declaration,
            scope,
        });
        self.scopes[scope.0].references.push(id);
        id
    }

    pub(crate) fn next_declaration_id(&self) -> DeclarationId {
        DeclarationId(self.declarations.len())
    }
}

fn is_block_scoped_declaration(kind: DeclarationKind) -> bool {
    match kind {
        DeclarationKind::Let
        | DeclarationKind::Const
        | DeclarationKind::Import
        | DeclarationKind::Class
        | DeclarationKind::Function
        | DeclarationKind::CatchClause => true,
        DeclarationKind::Var | DeclarationKind::Global => false,
    }
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub struct ScopeId(usize);

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub struct DeclarationId(usize);

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub struct ReferenceId(usize);

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub struct LabelId(usize);

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub enum ScopeKind {
    Block,
    CatchClause,
    Class,
    For,
    Function,
    Global,
    Module,
    StaticBlock,
    Switch,
}

#[derive(Debug, Clone)]
pub struct Scope {
    pub id: ScopeId,
    pub kind: ScopeKind,
    pub parent: Option<ScopeId>,
    pub declarations: IndexMap<String, DeclarationId>,
    pub references: Vec<ReferenceId>,
    pub children: Vec<ScopeId>,
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub enum LabelKind {
    Loop,
    Other,
}

#[derive(Debug, Clone)]
pub struct Label {
    pub id: LabelId,
    pub kind: LabelKind,
    pub scope: ScopeId,
    pub name: Option<String>,
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub enum DeclarationKind {
    Global,
    Class,
    Const,
    Var,
    Let,
    Function,
    CatchClause,
    Import,
}

impl From<VariableDeclarationKind> for DeclarationKind {
    fn from(value: VariableDeclarationKind) -> Self {
        match value {
            VariableDeclarationKind::Const => Self::Const,
            VariableDeclarationKind::Let => Self::Let,
            VariableDeclarationKind::Var => Self::Var,
        }
    }
}

#[derive(Debug, Clone)]
pub struct Declaration {
    pub id: DeclarationId,
    pub kind: DeclarationKind,
    pub name: String,
    pub scope: ScopeId,
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub enum ReferenceKind {
    Read,
    Write,
    ReadWrite,
}

#[derive(Debug, Clone)]
pub struct Reference {
    pub id: ReferenceId,
    pub kind: ReferenceKind,
    pub declaration: DeclarationId,
    pub scope: ScopeId,
}

#[derive(Debug, Hash, PartialEq, Eq, Clone, Copy)]
pub struct AstNode(PointerAddress);

impl AstNode {
    pub fn new<T: ESTreeNode>(node: &T) -> Self {
        Self(PointerAddress::new(node))
    }
}

impl<T> From<&T> for AstNode
where
    T: ESTreeNode,
{
    fn from(value: &T) -> Self {
        Self::new(value)
    }
}

impl<T> From<&mut T> for AstNode
where
    T: ESTreeNode,
{
    fn from(value: &mut T) -> Self {
        Self::new(value)
    }
}
