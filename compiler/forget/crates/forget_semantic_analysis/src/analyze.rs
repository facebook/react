use forget_diagnostics::Diagnostic;
use forget_estree::{
    BreakStatement, ContinueStatement, ESTreeNode, Identifier, LabeledStatement, Program,
    Statement, Visitor,
};
use forget_utils::PointerAddress;
use indexmap::IndexMap;

pub fn analyze(ast: &Program) -> SemanticAnalysis {
    let mut analyzer = Analyzer::new();
    analyzer.visit_program(ast);
    analyzer.results
}

pub struct SemanticAnalysis {
    root: ScopeId,

    // Storage of the semantic information
    scopes: Vec<Scope>,
    labels: Vec<Label>,
    declarations: Vec<Declaration>,
    references: Vec<Reference>,

    // Mapping of AST nodes (by pointer address) to semantic information
    // Not all nodes will have all types of information available
    node_scopes: IndexMap<AstNode, ScopeId>,
    node_labels: IndexMap<AstNode, LabelId>,
    node_declarations: IndexMap<AstNode, DeclarationId>,
    node_references: IndexMap<AstNode, ReferenceId>,
    diagnostics: Vec<Diagnostic>,
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct SemanticAnalysisDebug<'a> {
    root: ScopeId,

    // Storage of the semantic information
    scopes: &'a Vec<Scope>,
    labels: &'a Vec<Label>,
    declarations: &'a Vec<Declaration>,
    references: &'a Vec<Reference>,
}

impl SemanticAnalysis {
    fn new() -> Self {
        let root_id = ScopeId(0);
        Self {
            root: root_id,
            scopes: vec![Scope {
                id: root_id,
                kind: ScopeKind::Global,
                parent: None,
                labels: Default::default(),
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
        }
    }

    pub fn debug(&self) -> SemanticAnalysisDebug<'_> {
        SemanticAnalysisDebug {
            root: self.root,
            scopes: &self.scopes,
            labels: &self.labels,
            declarations: &self.declarations,
            references: &self.references,
        }
    }

    pub fn root(&self) -> &Scope {
        &self.scopes[self.root.0]
    }

    pub fn scope(&self, id: ScopeId) -> &Scope {
        &self.scopes[id.0]
    }

    pub fn label(&self, id: LabelId) -> &Label {
        &self.labels[id.0]
    }

    pub fn declaration(&self, id: DeclarationId) -> &Declaration {
        &self.declarations[id.0]
    }

    pub fn reference(&self, id: ScopeId) -> &Reference {
        &self.references[id.0]
    }

    pub fn node_scope<T: ESTreeNode>(&self, node: &T) -> Option<&Scope> {
        self.node_scopes
            .get(&AstNode::from(node))
            .map(|id| &self.scopes[id.0])
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

    pub fn node_declaration(&self, node: &Identifier) -> Option<&Declaration> {
        self.node_declarations
            .get(&AstNode::from(node))
            .map(|id| &self.declarations[id.0])
    }

    pub fn node_reference(&self, node: &Identifier) -> Option<&Reference> {
        self.node_references
            .get(&AstNode::from(node))
            .map(|id| &self.references[id.0])
    }

    pub fn lookup_label(&self, scope: ScopeId, name: &str) -> Option<&Label> {
        let mut current = &self.scopes[scope.0];
        loop {
            if let Some(id) = current.labels.get(name) {
                return Some(&self.labels[id.0]);
            }
            if let Some(parent) = current.parent {
                current = &self.scopes[parent.0];
            } else {
                return None;
            }
        }
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
            labels: Default::default(),
            declarations: Default::default(),
            references: Default::default(),
            children: Default::default(),
        });
        self.scopes[parent.0].children.push(id);
        id
    }

    pub(crate) fn add_label(&mut self, scope: ScopeId, kind: LabelKind, name: String) -> LabelId {
        let id = LabelId(self.labels.len());
        self.labels.push(Label { id, kind, scope });
        self.scopes[scope.0].labels.insert(name, id);
        id
    }

    pub(crate) fn add_declaration(
        &mut self,
        scope: ScopeId,
        name: String,
        kind: DeclarationKind,
    ) -> DeclarationId {
        let id = DeclarationId(self.declarations.len());
        self.declarations.push(Declaration { id, kind, scope });
        self.scopes[scope.0].declarations.insert(name, id);
        id
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
    Global,
    Function,
    Class,
    Block,
}

#[derive(Debug, Clone)]
pub struct Scope {
    pub id: ScopeId,
    pub kind: ScopeKind,
    pub parent: Option<ScopeId>,
    pub labels: IndexMap<String, LabelId>,
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
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Copy, Clone)]
pub enum DeclarationKind {
    Const,
    Var,
    Let,
}

#[derive(Debug, Clone)]
pub struct Declaration {
    pub id: DeclarationId,
    pub kind: DeclarationKind,
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
struct AstNode(PointerAddress);

impl AstNode {
    fn new<T: ESTreeNode>(node: &T) -> Self {
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

struct Analyzer {
    results: SemanticAnalysis,
    current: ScopeId,
    is_lvalue: bool,
}

impl Analyzer {
    fn new() -> Self {
        let results = SemanticAnalysis::new();
        let current = results.root_id();
        Self {
            results,
            current,
            is_lvalue: false,
        }
    }

    fn enter<F>(&mut self, kind: ScopeKind, mut f: F) -> ScopeId
    where
        F: FnMut(&mut Self) -> (),
    {
        let scope = self.results.add_scope(self.current, kind);
        let previous = std::mem::replace(&mut self.current, scope);
        f(self);
        let scope = std::mem::replace(&mut self.current, previous);
        scope
    }
}

impl<'ast> Visitor<'ast> for Analyzer {
    fn visit_function_declaration(
        &mut self,
        declaration: &'ast forget_estree::FunctionDeclaration,
    ) {
        let scope = self.enter(ScopeKind::Function, |visitor| {
            visitor.visit_function(&declaration.function);
        });
        self.results
            .node_scopes
            .insert(AstNode::from(declaration), scope);
    }

    fn visit_statement(&mut self, stmt: &'ast forget_estree::Statement) {
        match stmt {
            Statement::LabeledStatement(stmt) => {
                let inner = &stmt.body;
                let kind = match inner {
                    Statement::ForStatement(_)
                    | Statement::ForInStatement(_)
                    | Statement::ForOfStatement(_)
                    | Statement::WhileStatement(_)
                    | Statement::DoWhileStatement(_) => LabelKind::Loop,
                    _ => LabelKind::Other,
                };
                let id = self
                    .results
                    .add_label(self.current, kind, stmt.label.name.clone());
                self.results
                    .node_labels
                    .insert(AstNode::from(stmt.as_ref()), id);
                self.visit_statement(&stmt.body);
            }
            Statement::BreakStatement(stmt) => {
                if let Some(label) = &stmt.label {
                    if let Some(label) = self.results.lookup_label(self.current, &label.name) {
                        self.results
                            .node_labels
                            .insert(AstNode::from(stmt.as_ref()), label.id);
                    } else {
                        self.results.diagnostics.push(Diagnostic::invalid_syntax(
                            "Undefined break label",
                            label.range,
                        ));
                    }
                }
            }
            Statement::ContinueStatement(stmt) => {
                if let Some(label_node) = &stmt.label {
                    if let Some(label) = self.results.lookup_label(self.current, &label_node.name) {
                        if label.kind == LabelKind::Loop {
                            self.results
                                .node_labels
                                .insert(AstNode::from(stmt.as_ref()), label.id);
                        } else {
                            self.results.diagnostics.push(Diagnostic::invalid_syntax(
                                "Invalid continue statement, can only continue to a label associated with a loop statement (for, for..in, for..of, etc)",
                                label_node.range,
                            ));
                        }
                    } else {
                        self.results.diagnostics.push(Diagnostic::invalid_syntax(
                            "Undefined continue label",
                            label_node.range,
                        ));
                    }
                }
            }
            Statement::BlockStatement(stmt) => {
                let scope = self.enter(ScopeKind::Block, |visitor| {
                    for item in &stmt.body {
                        visitor.visit_statement(item);
                    }
                });
                self.results
                    .node_scopes
                    .insert(AstNode::from(stmt.as_ref()), scope);
            }
            _ => {
                self.default_visit_statement(stmt);
            }
        }
    }

    fn visit_identifier(&mut self, identifier: &'ast Identifier) {
        if self.is_lvalue {
            let declaration = self
                .results
                .lookup_declaration(self.current, &identifier.name);
            if let Some(declaration) = declaration {
                let id = self.results.add_reference(
                    self.current,
                    ReferenceKind::ReadWrite,
                    declaration.id,
                );
                self.results
                    .node_references
                    .insert(AstNode::from(identifier), id);
            } else {
                let id = self.results.add_declaration(
                    self.current,
                    identifier.name.clone(),
                    DeclarationKind::Let,
                ); // TODO: determine the correct kind!
                self.results
                    .node_declarations
                    .insert(AstNode::from(identifier), id);
            }
        } else {
            let declaration = self
                .results
                .lookup_declaration(self.current, &identifier.name);
            if let Some(declaration) = declaration {
                let declaration_id = declaration.id;
                let id =
                    self.results
                        .add_reference(self.current, ReferenceKind::Read, declaration.id);
                self.results
                    .node_references
                    .insert(AstNode::from(identifier), id);
            } else {
                // Oops, undefined variable
                self.results.diagnostics.push(Diagnostic::invalid_syntax(
                    "Undefined variable",
                    identifier.range,
                ));
            }
        }
    }

    fn visit_literal(&mut self, _literal: &'ast forget_estree::Literal) {}

    fn visit_lvalue<F>(&mut self, f: F)
    where
        F: FnOnce(&mut Self) -> (),
    {
        let prev = self.is_lvalue;
        self.is_lvalue = true;
        f(self);
        self.is_lvalue = prev;
    }

    fn visit_rvalue<F>(&mut self, f: F)
    where
        F: FnOnce(&mut Self) -> (),
    {
        let prev = self.is_lvalue;
        self.is_lvalue = false;
        f(self);
        self.is_lvalue = prev;
    }
}
