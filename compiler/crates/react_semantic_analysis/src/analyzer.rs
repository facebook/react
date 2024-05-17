/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
use react_diagnostics::Diagnostic;
use react_estree::{
    AssignmentOperator, AssignmentPropertyOrRestElement, AssignmentTarget, Expression,
    ExpressionOrPrivateIdentifier, ExpressionOrSuper, ForInInit, ForInit, FunctionBody, Identifier,
    ImportDeclarationSpecifier, IntoClass, IntoFunction, JSXElementName, Pattern, Program,
    SourceRange, Statement, VariableDeclarationKind, Visitor,
};

use crate::{
    AstNode, DeclarationId, DeclarationKind, Label, LabelId, LabelKind, ReferenceKind, ScopeId,
    ScopeKind, ScopeManager,
};

pub fn analyze(ast: &Program, options: AnalyzeOptions) -> ScopeManager {
    let mut analyzer = Analyzer::new(ast, options);
    analyzer.visit_program(ast);
    analyzer.complete()
}

#[derive(Debug, Default)]
pub struct AnalyzeOptions {
    pub globals: Vec<String>,
}

struct Analyzer {
    manager: ScopeManager,
    labels: Vec<LabelId>,
    current: ScopeId,
    unresolved: Vec<UnresolvedReference>,
}

#[derive(Debug, Clone)]
pub struct UnresolvedReference {
    pub scope: ScopeId,
    pub ast: AstNode,
    pub name: String,
    pub kind: ReferenceKind,
    pub range: Option<SourceRange>,
    // The next declaration id at the time the reference was created
    // this is used to detect a subset of TDZ violations, where a
    // reference is trivially known to refer to a let/const declaration
    // that cannot have been initialized yet.
    pub next_declaration: DeclarationId,
}

impl Analyzer {
    fn new(program: &Program, options: AnalyzeOptions) -> Self {
        let manager = ScopeManager::new(program.source_type, options.globals);
        let current = manager.root_id();
        let labels = Default::default();
        Self {
            manager,
            labels,
            current,
            unresolved: Default::default(),
        }
    }

    fn complete(mut self) -> ScopeManager {
        for reference in self.unresolved {
            if let Some(declaration) = self.manager.lookup_reference(
                reference.scope,
                &reference.name,
                reference.next_declaration,
            ) {
                let id =
                    self.manager
                        .add_reference(reference.scope, reference.kind, declaration.id);
                self.manager.node_references.insert(reference.ast, id);
            } else {
                self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                    "Undefined variable",
                    reference.range,
                ));
            }
        }
        self.manager
    }

    fn enter_label<F>(&mut self, id: LabelId, mut f: F)
    where
        F: FnMut(&mut Self),
    {
        self.labels.push(id);
        f(self);
        let last = self.labels.pop().unwrap();
        assert_eq!(last, id);
    }

    fn lookup_break(&self, name: Option<&str>) -> Option<&Label> {
        for id in self.labels.iter().rev() {
            let label = self.manager.label(*id);
            match (name, &label.name) {
                // If this is a labeled break, only return if an exact match
                // is in scope
                (Some(name), Some(label_name)) if name == label_name => {
                    return Some(label);
                }
                // If this is an unlabeld break, return the innermost label id
                (None, _) => {
                    return Some(label);
                }
                _ => { /* no-op */ }
            }
        }
        None
    }

    fn lookup_continue(&self, name: Option<&str>) -> Option<&Label> {
        for id in self.labels.iter().rev() {
            let label = self.manager.label(*id);
            match (name, &label.name) {
                // If this is a labeled break, only return if an exact match
                // is in scope
                (Some(name), Some(label_name)) if &name == label_name => {
                    return Some(label);
                }
                // If this is an unlabeld break, return the innermost label id
                (None, _) => {
                    return Some(label);
                }
                _ => { /* no-op */ }
            }
        }
        None
    }

    fn enter<F>(&mut self, kind: ScopeKind, mut f: F) -> ScopeId
    where
        F: FnMut(&mut Self),
    {
        let scope = self.enter_scope(kind);
        f(self);
        self.close_scope(scope);
        scope
    }

    fn enter_scope(&mut self, kind: ScopeKind) -> ScopeId {
        let scope = self.manager.add_scope(self.current, kind);
        self.current = scope;
        scope
    }

    fn close_scope(&mut self, id: ScopeId) {
        assert_eq!(self.current, id, "Mismatched enter_scope/close_scope");
        let scope = self.manager.mut_scope(self.current);
        let parent = scope.parent.unwrap();
        self.current = parent;
    }

    fn visit_function<T: IntoFunction>(&mut self, node: &T) {
        assert_eq!(self.manager.scope(self.current).kind, ScopeKind::Function);
        let function = node.function();
        for param in &function.params {
            // `this` parameters don't declare variables, nor can they have
            // default values
            if let Pattern::Identifier(param) = param {
                if &param.name == "this" {
                    continue;
                }
            }
            Analyzer::visit_declaration_pattern(self, param, Some(DeclarationKind::Function));
        }

        if let Some(body) = &function.body {
            match body {
                FunctionBody::BlockStatement(body) => {
                    // Skip calling visit_block_statement to avoid creating an extra
                    // block scope
                    for item in &body.body {
                        self.visit_statement(item);
                    }
                }
                FunctionBody::Expression(body) => {
                    self.visit_expression(body);
                }
            }
        }
        self.manager
            .node_scopes
            .insert(AstNode::from(function), self.current);
    }

    fn visit_class<T: IntoClass>(&mut self, node: &T) {
        assert_eq!(self.manager.scope(self.current).kind, ScopeKind::Class);
        let class = node.class();
        if let Some(super_class) = &class.super_class {
            self.visit_expression(super_class);
        }

        self.visit_class_body(&class.body);
        self.manager
            .node_scopes
            .insert(AstNode::from(class), self.current);
    }

    fn visit_reference_identifier(
        &mut self,
        name: &str,
        ast: AstNode,
        kind: ReferenceKind,
        range: Option<SourceRange>,
    ) {
        self.unresolved.push(UnresolvedReference {
            scope: self.current,
            ast,
            name: name.to_string(),
            kind,
            range,
            next_declaration: self.manager.next_declaration_id(),
        });
    }

    fn visit_declaration_identifier(
        &mut self,
        ast: &Identifier,
        decl_kind: Option<DeclarationKind>,
    ) {
        if let Some(decl_kind) = decl_kind {
            let id =
                self.manager
                    .add_declaration(self.current, ast.name.clone(), decl_kind, ast.range);
            self.manager
                .node_declarations
                .insert(AstNode::from(ast), id);
        } else {
            // Re-assigning a variable
            self.unresolved.push(UnresolvedReference {
                scope: self.current,
                ast: AstNode::from(ast),
                name: ast.name.to_string(),
                kind: ReferenceKind::Write,
                range: ast.range,
                next_declaration: self.manager.next_declaration_id(),
            });
        }
    }

    fn visit_declaration_pattern(&mut self, ast: &Pattern, decl_kind: Option<DeclarationKind>) {
        match ast {
            Pattern::Identifier(ast) => {
                self.visit_declaration_identifier(ast, decl_kind);
            }
            Pattern::ArrayPattern(ast) => {
                for pat in &ast.elements {
                    if let Some(pat) = pat {
                        self.visit_declaration_pattern(pat, decl_kind);
                    }
                }
            }
            Pattern::ObjectPattern(ast) => {
                for property in &ast.properties {
                    match property {
                        AssignmentPropertyOrRestElement::AssignmentProperty(property) => {
                            if property.is_computed {
                                self.visit_expression(&property.key);
                            }
                            self.visit_declaration_pattern(&property.value, decl_kind);
                        }
                        AssignmentPropertyOrRestElement::RestElement(property) => {
                            self.visit_declaration_pattern(&property.argument, decl_kind);
                        }
                    }
                }
            }
            Pattern::RestElement(ast) => {
                self.visit_declaration_pattern(&ast.argument, decl_kind);
            }
            Pattern::AssignmentPattern(ast) => {
                self.visit_expression(&ast.right);
                self.visit_declaration_pattern(&ast.left, decl_kind);
            }
        }
    }

    fn visit_for_in_of(
        &mut self,
        ast: AstNode,
        left: &ForInInit,
        right: &Expression,
        body: &Statement,
        _range: Option<SourceRange>,
    ) {
        let mut for_scope: Option<ScopeId> = None;
        match left {
            ForInInit::VariableDeclaration(left) => {
                if left.kind != VariableDeclarationKind::Var {
                    for_scope = Some(self.enter_scope(ScopeKind::For));
                }
                self.visit_variable_declaration(left);
            }
            ForInInit::Pattern(left) => {
                Analyzer::visit_declaration_pattern(self, left, None);
            }
        }
        self.visit_expression(right);
        let id = self
            .manager
            .add_anonymous_label(self.current, LabelKind::Loop);
        self.manager.node_labels.insert(ast, id);
        self.enter_label(id, |visitor| {
            visitor.visit_statement(body);
        });
        if let Some(for_scope) = for_scope {
            self.close_scope(for_scope);
        }
    }
}

impl Visitor for Analyzer {
    fn visit_import_declaration_specifier(
        &mut self,
        ast: &react_estree::ImportDeclarationSpecifier,
    ) {
        let kind = self.manager.scope(self.current).kind;
        if kind != ScopeKind::Module {
            self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                "`import` declarations are only allowed at the top-level of a module",
                ast.range(),
            ))
        }
        match ast {
            ImportDeclarationSpecifier::ImportDefaultSpecifier(specifier) => {
                Analyzer::visit_declaration_identifier(
                    self,
                    &specifier.local,
                    Some(DeclarationKind::Import),
                );
            }
            ImportDeclarationSpecifier::ImportSpecifier(specifier) => {
                // note: ignore the `imported` identifier
                Analyzer::visit_declaration_identifier(
                    self,
                    &specifier.local,
                    Some(DeclarationKind::Import),
                );
            }
            ImportDeclarationSpecifier::ImportNamespaceSpecifier(specifier) => {
                Analyzer::visit_declaration_identifier(
                    self,
                    &specifier.local,
                    Some(DeclarationKind::Import),
                );
            }
        }
    }

    fn visit_class_declaration(&mut self, ast: &react_estree::ClassDeclaration) {
        if let Some(id) = &ast.class.id {
            let declaration = self.manager.add_declaration(
                self.current,
                id.name.clone(),
                DeclarationKind::Class,
                id.range,
            );
            self.manager
                .node_declarations
                .insert(AstNode::from(id), declaration);
        }
        self.enter(ScopeKind::Class, |visitor| {
            Analyzer::visit_class(visitor, ast);
        });
    }

    fn visit_class_expression(&mut self, ast: &react_estree::ClassExpression) {
        self.enter(ScopeKind::Class, |visitor| {
            if let Some(id) = &ast.class.id {
                let declaration = visitor.manager.add_declaration(
                    visitor.current,
                    id.name.clone(),
                    DeclarationKind::Function,
                    id.range,
                );
                visitor
                    .manager
                    .node_declarations
                    .insert(AstNode::from(id), declaration);
            }

            Analyzer::visit_class(visitor, ast);
        });
    }

    fn visit_class_property(&mut self, ast: &react_estree::ClassProperty) {
        // Static (non-computed) property names do not introduce a new identifier
        // into any scope
        if ast.is_computed {
            self.visit_expression(&ast.key);
        }
        if let Some(value) = &ast.value {
            self.visit_expression(value)
        }
    }

    fn visit_class_private_property(&mut self, ast: &react_estree::ClassPrivateProperty) {
        // Static (non-computed) property names do not introduce a new identifier
        // into any scope
        match &ast.key {
            ExpressionOrPrivateIdentifier::Expression(key) => {
                self.visit_expression(key);
            }
            ExpressionOrPrivateIdentifier::PrivateIdentifier(_)
            | ExpressionOrPrivateIdentifier::PrivateName(_) => { /* no-op */ }
        }
        if let Some(value) = &ast.value {
            self.visit_expression(value)
        }
    }

    fn visit_static_block(&mut self, ast: &react_estree::StaticBlock) {
        self.enter(ScopeKind::StaticBlock, |visitor| {
            for statement in &ast.body {
                visitor.visit_statement(statement);
            }
        });
    }

    fn visit_method_definition(&mut self, ast: &react_estree::MethodDefinition) {
        // Static (non-computed) method names do not introduce a new identifier
        // into any scope
        if ast.is_computed {
            self.visit_expression(&ast.key)
        }
        self.visit_function_expression(&ast.value);
    }

    fn visit_function_declaration(&mut self, ast: &react_estree::FunctionDeclaration) {
        if let Some(id) = &ast.function.id {
            let declaration = self.manager.add_declaration(
                self.current,
                id.name.clone(),
                DeclarationKind::Function,
                id.range,
            );
            self.manager
                .node_declarations
                .insert(AstNode::from(id), declaration);
        }
        self.enter(ScopeKind::Function, |visitor| {
            Analyzer::visit_function(visitor, ast);
        });
    }

    fn visit_function_expression(&mut self, ast: &react_estree::FunctionExpression) {
        self.enter(ScopeKind::Function, |visitor| {
            if let Some(id) = &ast.function.id {
                let declaration = visitor.manager.add_declaration(
                    visitor.current,
                    id.name.clone(),
                    DeclarationKind::Function,
                    id.range,
                );
                visitor
                    .manager
                    .node_declarations
                    .insert(AstNode::from(id), declaration);
            }

            Analyzer::visit_function(visitor, ast);
        });
    }

    fn visit_arrow_function_expression(&mut self, ast: &react_estree::ArrowFunctionExpression) {
        self.enter(ScopeKind::Function, |visitor| {
            Analyzer::visit_function(visitor, ast);
        });
    }

    fn visit_assignment_expression(&mut self, ast: &react_estree::AssignmentExpression) {
        if ast.operator == AssignmentOperator::Equals {
            // "=" operator is a reassignment, straightforward
            match &ast.left {
                AssignmentTarget::Pattern(left) => {
                    Analyzer::visit_declaration_pattern(self, left, None);
                }
                AssignmentTarget::Expression(left) => match left {
                    Expression::MemberExpression(left) => {
                        let mut current = left;
                        // If this is a chain of member expressions, find the innermost .object
                        // If that's an identifier, record it as a Read.
                        // Technically we could probably just visit .object normally,
                        // but in case we want to change the Read to something else we do this
                        // expansion.
                        // TODO: revisit and maybe revert this to just visit ast.left normally
                        loop {
                            if current.is_computed {
                                self.visit_expression_or_private_identifier(&current.property);
                            }
                            match &current.object {
                                ExpressionOrSuper::Expression(object) => match object {
                                    Expression::MemberExpression(object) => {
                                        current = object;
                                    }
                                    Expression::Identifier(object) => {
                                        Analyzer::visit_reference_identifier(
                                            self,
                                            &object.name,
                                            AstNode::from(object.as_ref()),
                                            ReferenceKind::Read,
                                            object.range,
                                        );
                                        break;
                                    }
                                    _ => {
                                        self.visit_expression(object);
                                        break;
                                    }
                                },
                                ExpressionOrSuper::Super(object) => {
                                    self.visit_super(object);
                                    break;
                                }
                            }
                        }
                    }
                    _ => {
                        self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                            "Invalid AssignmentExpression, expected left-hand side to be a Pattern or MemberExpression",
                            ast.range
                        ));
                    }
                },
            }
            self.visit_expression(&ast.right);
        } else {
            // otherwise this is a update operator which reads and updates the value.
            // the left-hand side must be an identifier, which is a ReadWrite reference.
            let left: &Identifier;
            if let AssignmentTarget::Pattern(pat) = &ast.left {
                if let Pattern::Identifier(pat) = pat {
                    left = pat;
                } else {
                    self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                        "Expected AssignmentExpression.left to be an Identifier when using operator {}",
                        pat.range()
                    ));
                    // Visit the right-hand side anyway to find any errors there
                    self.visit_expression(&ast.right);
                    return;
                }
            } else {
                self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                    "Expected AssignmentExpression.left to be an Identifier when using operator {}",
                    ast.range,
                ));
                // Visit the right-hand side anyway to find any errors there
                self.visit_expression(&ast.right);
                return;
            }
            Analyzer::visit_reference_identifier(
                self,
                &left.name,
                AstNode::from(left),
                ReferenceKind::ReadWrite,
                left.range,
            );
            self.visit_expression(&ast.right);
        }
    }

    fn visit_block_statement(&mut self, ast: &react_estree::BlockStatement) {
        // Block statements create a new scope. In cases where we want to avoid
        // the new scope, such as function declarations, we avoid calling this
        // method and visit the block contents directly.
        self.enter(ScopeKind::Block, |visitor| {
            for stmt in &ast.body {
                visitor.visit_statement(stmt);
            }
        });
    }

    fn visit_break_statement(&mut self, ast: &react_estree::BreakStatement) {
        if let Some(label) = self.lookup_break(ast.label.as_ref().map(|ident| ident.name.as_str()))
        {
            let id = label.id;
            self.manager.node_labels.insert(AstNode::from(ast), id);
            if let Some(label_node) = &ast.label {
                self.manager
                    .node_labels
                    .insert(AstNode::from(label_node), id);
            }
        } else {
            self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                "Non-syntactic break, could not resolve break target",
                ast.range,
            ));
        }
    }

    fn visit_catch_clause(&mut self, ast: &react_estree::CatchClause) {
        // If a catch clause has a param for the value being caught, then
        // a new scope is created for that param.
        if let Some(param) = &ast.param {
            self.enter(ScopeKind::CatchClause, |visitor| {
                Analyzer::visit_declaration_pattern(
                    visitor,
                    param,
                    Some(DeclarationKind::CatchClause),
                );
                visitor.visit_block_statement(&ast.body);
            });
        } else {
            self.visit_block_statement(&ast.body);
        }
    }

    fn visit_continue_statement(&mut self, ast: &react_estree::ContinueStatement) {
        let range = ast
            .label
            .as_ref()
            .map(|label| label.range)
            .unwrap_or(ast.range);
        if let Some(label) =
            self.lookup_continue(ast.label.as_ref().map(|ident| ident.name.as_str()))
        {
            let id = label.id;
            if label.kind != LabelKind::Loop {
                self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                    "Invalid continue statement, the named label must be for a loop",
                    range,
                ));
            }
            self.manager.node_labels.insert(AstNode::from(ast), id);
            if let Some(label_node) = &ast.label {
                self.manager
                    .node_labels
                    .insert(AstNode::from(label_node), id);
            }
        } else {
            self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                "Non-syntactic continue, could not resolve continue target",
                range,
            ));
        }
    }

    fn visit_for_in_statement(&mut self, ast: &react_estree::ForInStatement) {
        Analyzer::visit_for_in_of(
            self,
            AstNode::from(ast),
            &ast.left,
            &ast.right,
            &ast.body,
            ast.range,
        );
    }

    fn visit_for_of_statement(&mut self, ast: &react_estree::ForOfStatement) {
        Analyzer::visit_for_in_of(
            self,
            AstNode::from(ast),
            &ast.left,
            &ast.right,
            &ast.body,
            ast.range,
        );
    }

    fn visit_for_statement(&mut self, ast: &react_estree::ForStatement) {
        let mut for_scope: Option<ScopeId> = None;
        if let Some(init) = &ast.init {
            if let ForInit::VariableDeclaration(init) = init {
                if init.kind != VariableDeclarationKind::Var {
                    for_scope = Some(self.enter_scope(ScopeKind::For));
                }
            }
        }
        if let Some(init) = &ast.init {
            self.visit_for_init(init);
        }
        if let Some(test) = &ast.test {
            self.visit_expression(test);
        }
        if let Some(update) = &ast.update {
            self.visit_expression(update);
        }
        let id = self
            .manager
            .add_anonymous_label(self.current, LabelKind::Loop);
        self.manager.node_labels.insert(AstNode::from(ast), id);
        self.enter_label(id, |visitor| {
            visitor.visit_statement(&ast.body);
        });
        if let Some(for_scope) = for_scope {
            self.close_scope(for_scope);
        }
    }

    fn visit_identifier(&mut self, ast: &react_estree::Identifier) {
        // `Identifier` is tricky in ESTree, because the same node type is used
        // for places that reference variables as those that are string names:
        // `x` is an Identifier, but so is the "y" in `x.y`.
        // We're careful to skip visiting any Identifier that is not a variable
        // reference, such that if we reach here it *should* be a variable
        // reference. We also take a different path for variable assignment so
        // that this must be a variable read.
        Analyzer::visit_reference_identifier(
            self,
            &ast.name,
            AstNode::from(ast),
            ReferenceKind::Read,
            ast.range,
        );
    }

    fn visit_labeled_statement(&mut self, ast: &react_estree::LabeledStatement) {
        let body = &ast.body;
        let kind = match body {
            Statement::ForStatement(_)
            | Statement::ForInStatement(_)
            | Statement::ForOfStatement(_)
            | Statement::WhileStatement(_)
            | Statement::DoWhileStatement(_) => LabelKind::Loop,
            _ => LabelKind::Other,
        };
        let id = self
            .manager
            .add_label(self.current, kind, ast.label.name.clone());
        self.manager.node_labels.insert(AstNode::from(ast), id);
        self.enter_label(id, |visitor| {
            visitor.visit_statement(body);
        })
    }

    fn visit_member_expression(&mut self, ast: &react_estree::MemberExpression) {
        self.visit_expression_or_super(&ast.object);
        if ast.is_computed {
            self.visit_expression_or_private_identifier(&ast.property);
        }
    }

    fn visit_meta_property(&mut self, _ast: &react_estree::MetaProperty) {
        // no-op, these are all builtins
    }

    fn visit_private_identifier(&mut self, _ast: &react_estree::PrivateIdentifier) {
        // no-op, these refere to class properties
    }

    fn visit_private_name(&mut self, _ast: &react_estree::PrivateName) {
        // no-op, these refere to class properties
    }

    fn visit_pattern(&mut self, _ast: &Pattern) {
        // This is an internal compiler error: all paths to a `Pattern` node should have been
        // covered such that this is unreachable:
        // - VariableDeclaration
        // - AssignmentExpression
        // - CatchClause
        unreachable!(
            "visit_pattern should not be called directly, call Analyzer::visit_declaration_pattern() instead"
        )
    }

    fn visit_property(&mut self, ast: &react_estree::Property) {
        if ast.is_computed {
            self.visit_expression(&ast.key);
        }
        self.visit_expression(&ast.value);
    }

    fn visit_switch_statement(&mut self, ast: &react_estree::SwitchStatement) {
        self.visit_expression(&ast.discriminant);
        let id = self
            .manager
            .add_anonymous_label(self.current, LabelKind::Other);
        self.manager.node_labels.insert(AstNode::from(ast), id);
        self.enter_label(id, |visitor| {
            visitor.enter(ScopeKind::Switch, |visitor| {
                for case_ in &ast.cases {
                    visitor.visit_switch_case(case_);
                }
            });
        });
    }

    fn visit_variable_declaration(&mut self, ast: &react_estree::VariableDeclaration) {
        let kind = ast.kind;
        for declaration in &ast.declarations {
            Analyzer::visit_declaration_pattern(self, &declaration.id, Some(kind.into()));
            if let Some(init) = &declaration.init {
                self.visit_expression(init);
            }
        }
    }

    fn visit_jsxattribute(&mut self, ast: &react_estree::JSXAttribute) {
        // NOTE: skip visiting the attribute name, attributes are like non-computed
        // object properties where the identifier is not a variable reference
        if let Some(value) = &ast.value {
            self.visit_jsxattribute_value(value);
        }
    }

    fn visit_jsxclosing_element(&mut self, _ast: &react_estree::JSXClosingElement) {
        // no-op, should not be counted as a reference
    }

    fn visit_jsxidentifier(&mut self, ast: &react_estree::JSXIdentifier) {
        Analyzer::visit_reference_identifier(
            self,
            &ast.name,
            AstNode::from(ast),
            ReferenceKind::Read,
            ast.range,
        );
    }

    fn visit_jsxfragment(&mut self, ast: &react_estree::JSXFragment) {
        // TODO: record the pragmas
        for child in &ast.children {
            self.visit_jsxchild_item(child);
        }
    }

    fn visit_jsxmember_expression(&mut self, ast: &react_estree::JSXMemberExpression) {
        // NOTE: ignore the 'property' since JSX doesn't support computed properties
        self.visit_jsxmember_expression_or_identifier(&ast.object);
    }

    fn visit_jsxnamespaced_name(&mut self, ast: &react_estree::JSXNamespacedName) {
        // NOTE: ignore the 'name' since it doesn't refer to a variable
        self.visit_jsxidentifier(&ast.namespace);
    }

    fn visit_jsxopening_element(&mut self, ast: &react_estree::JSXOpeningElement) {
        // TODO: record jsx pragma if root_name is not an FBT name
        let root_name = ast.name.root_name();

        match &ast.name {
            JSXElementName::JSXIdentifier(name) => {
                // lowercase names are builtins, only visit if this is a user-defined
                // component
                if let Some(first) = root_name.chars().next() {
                    if first == first.to_ascii_uppercase() {
                        self.visit_jsxidentifier(name);
                    }
                } else {
                    // TODO: this likely indicates a parse error, since a valid parse
                    // should never result in an empty JSXIdentifier node. but just in
                    // case we report this rather than silently fail
                    self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                        "Expected JSXOpeningElement.name to be non-empty",
                        name.range,
                    ));
                }
            }
            JSXElementName::JSXMemberExpression(name) => {
                if root_name != "this" {
                    self.visit_jsxmember_expression(name);
                }
            }
            JSXElementName::JSXNamespacedName(name) => {
                if root_name != "this" {
                    self.visit_jsxnamespaced_name(name);
                }
            }
        }

        for attribute in &ast.attributes {
            self.visit_jsxattribute_or_spread(attribute);
        }
    }
}
