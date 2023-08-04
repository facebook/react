use forget_diagnostics::Diagnostic;
use forget_estree::{
    AssignmentOperator, AssignmentPropertyOrRestElement, AssignmentTarget, Expression,
    ExpressionOrSuper, ForInInit, ForInit, Function, FunctionBody, Identifier, JSXElementName,
    Pattern, Program, SourceRange, SourceType, Statement, VariableDeclarationKind, Visitor2,
};

use crate::{AstNode, DeclarationKind, LabelKind, ReferenceKind, ScopeId, ScopeKind, ScopeManager};

pub fn analyze(ast: &Program) -> ScopeManager {
    let mut analyzer = Analyzer::new();
    analyzer.visit_program(ast);
    analyzer.manager
}

struct Analyzer {
    manager: ScopeManager,
    current: ScopeId,
}

impl Analyzer {
    fn new() -> Self {
        let manager = ScopeManager::new();
        let current = manager.root_id();
        Self { manager, current }
    }

    fn enter<F>(&mut self, kind: ScopeKind, mut f: F) -> ScopeId
    where
        F: FnMut(&mut Self) -> (),
    {
        let scope = self.manager.add_scope(self.current, kind);
        let previous = std::mem::replace(&mut self.current, scope);
        f(self);
        let scope = std::mem::replace(&mut self.current, previous);
        scope
    }

    fn enter_scope(&mut self, kind: ScopeKind) -> ScopeId {
        let scope = self.manager.add_scope(self.current, kind);
        self.current = scope;
        scope
    }

    fn close_scope(&mut self, id: ScopeId) {
        assert_eq!(self.current, id, "Mismatched enter_scope/close_scope");
        let scope = self.manager.scope(self.current);
        self.current = scope.parent.unwrap();
    }

    fn visit_function(&mut self, function: &Function) {
        self.enter(ScopeKind::Function, |visitor| {
            for param in &function.params {
                // `this` parameters don't declare variables, nor can they have
                // default values
                if let Pattern::Identifier(param) = param {
                    if &param.name == "this" {
                        continue;
                    }
                }
                Analyzer::visit_declaration_pattern(
                    visitor,
                    param,
                    Some(DeclarationKind::FunctionDeclaration),
                );
            }

            if let Some(body) = &function.body {
                match body {
                    FunctionBody::BlockStatement(body) => {
                        // Skip calling visit_block_statement to avoid creating an extra
                        // block scope
                        for item in &body.body {
                            visitor.visit_statement(item);
                        }
                    }
                    FunctionBody::Expression(body) => {
                        visitor.visit_expression(body);
                    }
                }
            }
        });
    }

    fn visit_reference_identifier(
        &mut self,
        name: &str,
        ast: AstNode,
        kind: ReferenceKind,
        range: Option<SourceRange>,
    ) {
        let declaration = self.manager.lookup_declaration(self.current, name);
        if let Some(declaration) = declaration {
            let id = self
                .manager
                .add_reference(self.current, kind, declaration.id);
            self.manager.node_references.insert(ast, id);
        } else {
            // Oops, undefined variable
            self.manager
                .diagnostics
                .push(Diagnostic::invalid_syntax("Undefined variable", range));
        }
    }

    fn visit_declaration_identifier(
        &mut self,
        ast: &Identifier,
        decl_kind: Option<DeclarationKind>,
    ) {
        if let Some(decl_kind) = decl_kind {
            // Declaring a "new" variable, report an error if this is a duplicate
            // definition. In either case, we create a new declaration. Ie we
            // act as if shadowing is allowed in the language
            let previous_declaration = self.manager.lookup_declaration(self.current, &ast.name);
            if let Some(previous_declaration) = previous_declaration {
                if previous_declaration.scope == self.current {
                    // duplicate definition in the same scope
                    self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                        "Duplicate declaration",
                        ast.range,
                    ));
                }
            }
            let id = self
                .manager
                .add_declaration(self.current, ast.name.clone(), decl_kind);
            self.manager
                .node_declarations
                .insert(AstNode::from(ast), id);
        } else {
            // Referencing an existing variable, it should be defined
            if let Some(declaration) = self.manager.lookup_declaration(self.current, &ast.name) {
                let reference = self.manager.add_reference(
                    self.current,
                    ReferenceKind::ReadWrite,
                    declaration.id,
                );
                self.manager
                    .node_references
                    .insert(AstNode::from(ast), reference);
            } else {
                self.manager
                    .diagnostics
                    .push(Diagnostic::invalid_syntax("Undefined variable", ast.range));
            }
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
        // Record an anonymous label for the statement to resolve unlabeled break/continue
        let label = self
            .manager
            .add_anonymous_label(self.current, LabelKind::Loop);
        self.manager.node_labels.insert(ast, label);

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
        self.visit_statement(body);
        if let Some(for_scope) = for_scope {
            self.close_scope(for_scope);
        }
    }
}

impl Visitor2 for Analyzer {
    fn visit_function_declaration(&mut self, ast: &forget_estree::FunctionDeclaration) {
        if let Some(id) = &ast.function.id {
            let declaration = self.manager.add_declaration(
                self.current,
                id.name.clone(),
                DeclarationKind::FunctionDeclaration,
            );
            self.manager
                .node_declarations
                .insert(AstNode::from(id), declaration);
        }
        Analyzer::visit_function(self, &ast.function);
    }

    fn visit_function_expression(&mut self, ast: &forget_estree::FunctionExpression) {
        let mut function_scope: Option<ScopeId> = None;
        if let Some(id) = &ast.function.id {
            function_scope = Some(self.enter_scope(ScopeKind::Function));
            let declaration = self.manager.add_declaration(
                self.current,
                id.name.clone(),
                DeclarationKind::FunctionDeclaration,
            );
            self.manager
                .node_declarations
                .insert(AstNode::from(id), declaration);
        }

        Analyzer::visit_function(self, &ast.function);
        if let Some(function_scope) = function_scope {
            self.close_scope(function_scope);
        }
    }

    fn visit_arrow_function_expression(&mut self, ast: &forget_estree::ArrowFunctionExpression) {
        Analyzer::visit_function(self, &ast.function);
    }

    fn visit_assignment_expression(&mut self, ast: &forget_estree::AssignmentExpression) {
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

    fn visit_block_statement(&mut self, ast: &forget_estree::BlockStatement) {
        // Block statements create a new scope. In cases where we want to avoid
        // the new scope, such as function declarations, we avoid calling this
        // method and visit the block contents directly.
        self.enter(ScopeKind::Block, |visitor| {
            for stmt in &ast.body {
                visitor.visit_statement(stmt);
            }
        });
    }

    fn visit_break_statement(&mut self, ast: &forget_estree::BreakStatement) {
        if let Some(label_node) = &ast.label {
            if let Some(label) = self
                .manager
                .lookup_label(self.current, &label_node.name)
                .cloned()
            {
                self.manager
                    .node_labels
                    .insert(AstNode::from(ast), label.id);
                self.manager
                    .node_labels
                    .insert(AstNode::from(label_node), label.id);
            } else {
                self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                    "Unknown break label",
                    label_node.range,
                ));
            }
        } else {
            if let Some(label) = self.manager.lookup_break(self.current).cloned() {
                self.manager
                    .node_labels
                    .insert(AstNode::from(ast), label.id);
            } else {
                self.manager
                    .diagnostics
                    .push(Diagnostic::invalid_syntax("Invalid break", ast.range));
            }
        }
    }

    fn visit_catch_clause(&mut self, ast: &forget_estree::CatchClause) {
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

    fn visit_continue_statement(&mut self, ast: &forget_estree::ContinueStatement) {
        if let Some(label_node) = &ast.label {
            if let Some(label) = self
                .manager
                .lookup_label(self.current, &label_node.name)
                .cloned()
            {
                self.manager
                    .node_labels
                    .insert(AstNode::from(ast), label.id);
                self.manager
                    .node_labels
                    .insert(AstNode::from(label_node), label.id);
            } else {
                self.manager.diagnostics.push(Diagnostic::invalid_syntax(
                    "Unknown continue label",
                    label_node.range,
                ));
            }
        } else {
            if let Some(label) = self.manager.lookup_continue(self.current).cloned() {
                self.manager
                    .node_labels
                    .insert(AstNode::from(ast), label.id);
            } else {
                self.manager
                    .diagnostics
                    .push(Diagnostic::invalid_syntax("Invalid continue", ast.range));
            }
        }
    }

    fn visit_for_in_statement(&mut self, ast: &forget_estree::ForInStatement) {
        Analyzer::visit_for_in_of(
            self,
            AstNode::from(ast),
            &ast.left,
            &ast.right,
            &ast.body,
            ast.range,
        );
    }

    fn visit_for_of_statement(&mut self, ast: &forget_estree::ForOfStatement) {
        Analyzer::visit_for_in_of(
            self,
            AstNode::from(ast),
            &ast.left,
            &ast.right,
            &ast.body,
            ast.range,
        );
    }

    fn visit_for_statement(&mut self, ast: &forget_estree::ForStatement) {
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
        self.visit_statement(&ast.body);
        if let Some(for_scope) = for_scope {
            self.close_scope(for_scope);
        }
    }

    fn visit_identifier(&mut self, ast: &forget_estree::Identifier) {
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

    fn visit_labeled_statement(&mut self, ast: &forget_estree::LabeledStatement) {
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
        self.visit_statement(body);
    }

    fn visit_member_expression(&mut self, ast: &forget_estree::MemberExpression) {
        self.visit_expression_or_super(&ast.object);
        if ast.is_computed {
            self.visit_expression_or_private_identifier(&ast.property);
        }
    }

    fn visit_meta_property(&mut self, _ast: &forget_estree::MetaProperty) {
        // no-op, these are all builtins
    }

    fn visit_private_identifier(&mut self, _ast: &forget_estree::PrivateIdentifier) {
        // no-op, these refere to class properties
    }

    fn visit_private_name(&mut self, _ast: &forget_estree::PrivateName) {
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

    fn visit_program(&mut self, ast: &forget_estree::Program) {
        if ast.source_type == SourceType::Module {
            self.enter(ScopeKind::Module, |visitor| {
                for item in &ast.body {
                    visitor.visit_module_item(item);
                }
            });
        } else {
            for item in &ast.body {
                self.visit_module_item(item);
            }
        }
    }

    fn visit_property(&mut self, ast: &forget_estree::Property) {
        if ast.is_computed {
            self.visit_expression(&ast.key);
        }
        self.visit_expression(&ast.value);
    }

    fn visit_switch_statement(&mut self, ast: &forget_estree::SwitchStatement) {
        self.visit_expression(&ast.discriminant);
        self.enter(ScopeKind::Switch, |visitor| {
            for case_ in &ast.cases {
                visitor.visit_switch_case(case_);
            }
        });
    }

    fn visit_variable_declaration(&mut self, ast: &forget_estree::VariableDeclaration) {
        let kind = ast.kind;
        for declaration in &ast.declarations {
            Analyzer::visit_declaration_pattern(self, &declaration.id, Some(kind.into()));
            if let Some(init) = &declaration.init {
                self.visit_expression(init);
            }
        }
    }

    fn visit_jsxattribute(&mut self, ast: &forget_estree::JSXAttribute) {
        // NOTE: skip visiting the attribute name, attributes are like non-computed
        // object properties where the identifier is not a variable reference
        if let Some(value) = &ast.value {
            self.visit_jsxattribute_value(value);
        }
    }

    fn visit_jsxclosing_element(&mut self, _ast: &forget_estree::JSXClosingElement) {
        // no-op, should not be counted as a reference
    }

    fn visit_jsxidentifier(&mut self, ast: &forget_estree::JSXIdentifier) {
        Analyzer::visit_reference_identifier(
            self,
            &ast.name,
            AstNode::from(ast),
            ReferenceKind::Read,
            ast.range,
        );
    }

    fn visit_jsxfragment(&mut self, ast: &forget_estree::JSXFragment) {
        // TODO: record the pragmas
        for child in &ast.children {
            self.visit_jsxchild_item(child);
        }
    }

    fn visit_jsxmember_expression(&mut self, ast: &forget_estree::JSXMemberExpression) {
        // NOTE: ignore the 'property' since JSX doesn't support computed properties
        self.visit_jsxmember_expression_or_identifier(&ast.object);
    }

    fn visit_jsxnamespaced_name(&mut self, ast: &forget_estree::JSXNamespacedName) {
        // NOTE: ignore the 'name' since it doesn't refer to a variable
        self.visit_jsxidentifier(&ast.namespace);
    }

    fn visit_jsxopening_element(&mut self, ast: &forget_estree::JSXOpeningElement) {
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
                        "Expected JSXOpenintElement.name to be non-empty",
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
