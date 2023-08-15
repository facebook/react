use forget_diagnostics::Diagnostic;
use forget_estree::{
    BreakStatement, ContinueStatement, ESTreeNode, LabeledStatement, SourceRange, SourceType,
    VariableDeclarationKind,
};
use forget_utils::PointerAddress;
use indexmap::IndexMap;

use crate::scope_view::{DeclarationView, ReferenceView, ScopeView};

pub struct ScopeManager {
    root: ScopeId,

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
    pub(crate) fn new(source_type: SourceType) -> Self {
        let root_id = ScopeId(0);
        let root_kind = match source_type {
            SourceType::Module => ScopeKind::Module,
            SourceType::Script => ScopeKind::Global,
        };
        Self {
            root: root_id,
            scopes: vec![Scope {
                id: root_id,
                kind: root_kind,
                parent: None,
                declarations: Default::default(),
                references: Default::default(),
                children: Default::default(),
                unresolved: Default::default(),
            }],
            labels: Default::default(),
            declarations: Default::default(),
            references: Default::default(),
            node_scopes: Default::default(),
            node_labels: Default::default(),
            node_declarations: Default::default(),
            node_references: Default::default(),
            diagnostics: Default::default(),
        }
    }

    pub fn debug(&self) -> ScopeView<'_> {
        let root = self.root();
        ScopeView {
            manager: self,
            scope: root,
        }
    }

    pub fn diagnostics(&mut self) -> Vec<Diagnostic> {
        std::mem::take(&mut self.diagnostics)
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

    pub fn lookup_declaration(&self, scope: ScopeId, name: &str) -> Option<&Declaration> {
        let mut current = &self.scopes[scope.0];
        loop {
            if let Some(id) = current.declarations.get(name) {
                return Some(&self.declarations[id.0]);
            }
            if let Some(parent) = current.parent {
                current = &self.scopes[parent.0];
            } else {
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
            unresolved: Default::default(),
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
        scope: ScopeId,
        name: String,
        kind: DeclarationKind,
    ) -> DeclarationId {
        let hoisted_scope = self.get_scope_for_declaration(scope, kind);

        let id = DeclarationId(self.declarations.len());
        self.declarations.push(Declaration {
            id,
            kind,
            name: name.clone(),
            scope: hoisted_scope,
        });
        self.scopes[hoisted_scope.0].declarations.insert(name, id);
        id
    }

    fn get_scope_for_declaration(&self, scope: ScopeId, kind: DeclarationKind) -> ScopeId {
        match kind {
            DeclarationKind::Let
            | DeclarationKind::Import
            | DeclarationKind::Const
            | DeclarationKind::CatchClause
            | DeclarationKind::For => scope,
            DeclarationKind::Var => {
                let mut current = scope;
                loop {
                    let scope = self.scope(current);
                    match scope.kind {
                        ScopeKind::Function | ScopeKind::Global | ScopeKind::StaticBlock => {
                            return current;
                        }
                        _ => { /* no-op */ }
                    }
                    if let Some(parent) = &scope.parent {
                        current = *parent
                    } else {
                        unreachable!("Expected scope without a parent to be a Global scope");
                    }
                }
            }
            DeclarationKind::FunctionDeclaration => {
                let mut current = scope;
                loop {
                    let scope = self.scope(current);
                    match scope.kind {
                        ScopeKind::Function
                        | ScopeKind::Module
                        | ScopeKind::Global
                        | ScopeKind::StaticBlock => {
                            return current;
                        }
                        _ => { /* no-op */ }
                    }
                    if let Some(parent) = &scope.parent {
                        current = *parent
                    } else {
                        unreachable!("Expected scope without a parent to be a Global scope");
                    }
                }
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

    pub(crate) fn push_unresolved_reference(
        &mut self,
        scope: ScopeId,
        reference: UnresolvedReference,
    ) {
        self.scopes[scope.0].unresolved.push(reference);
    }

    pub(crate) fn add_unresolved_reference(
        &mut self,
        scope: ScopeId,
        ast: AstNode,
        name: String,
        kind: ReferenceKind,
        range: Option<SourceRange>,
    ) {
        self.scopes[scope.0].unresolved.push(UnresolvedReference {
            ast,
            scope,
            name,
            kind,
            range,
        });
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
    pub unresolved: Vec<UnresolvedReference>,
}

#[derive(Debug, Clone)]
pub struct UnresolvedReference {
    pub scope: ScopeId,
    pub ast: AstNode,
    pub name: String,
    pub kind: ReferenceKind,
    pub range: Option<SourceRange>,
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
    Const,
    Var,
    Let,
    FunctionDeclaration,
    For,
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
