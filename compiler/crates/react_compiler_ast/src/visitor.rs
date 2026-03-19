//! AST visitor with automatic scope tracking.
//!
//! Provides a [`Visitor`] trait with enter/leave hooks for specific node types,
//! and an [`AstWalker`] that traverses the AST while tracking the active scope
//! via the scope tree's `node_to_scope` map.

use crate::declarations::*;
use crate::expressions::*;
use crate::jsx::*;
use crate::patterns::*;
use crate::scope::{ScopeId, ScopeInfo};
use crate::statements::*;
use crate::Program;

/// Trait for visiting Babel AST nodes. All methods default to no-ops.
/// Override specific methods to intercept nodes of interest.
///
/// The `scope_stack` parameter provides the current scope context during traversal.
/// The active scope is `scope_stack.last()`.
pub trait Visitor {
    fn enter_function_declaration(
        &mut self,
        _node: &FunctionDeclaration,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn leave_function_declaration(
        &mut self,
        _node: &FunctionDeclaration,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn enter_function_expression(
        &mut self,
        _node: &FunctionExpression,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn leave_function_expression(
        &mut self,
        _node: &FunctionExpression,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn enter_arrow_function_expression(
        &mut self,
        _node: &ArrowFunctionExpression,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn leave_arrow_function_expression(
        &mut self,
        _node: &ArrowFunctionExpression,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn enter_object_method(&mut self, _node: &ObjectMethod, _scope_stack: &[ScopeId]) {}
    fn leave_object_method(&mut self, _node: &ObjectMethod, _scope_stack: &[ScopeId]) {}
    fn enter_assignment_expression(
        &mut self,
        _node: &AssignmentExpression,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn enter_update_expression(&mut self, _node: &UpdateExpression, _scope_stack: &[ScopeId]) {}
    fn enter_identifier(&mut self, _node: &Identifier, _scope_stack: &[ScopeId]) {}
    fn enter_jsx_identifier(&mut self, _node: &JSXIdentifier, _scope_stack: &[ScopeId]) {}
    fn enter_jsx_opening_element(
        &mut self,
        _node: &JSXOpeningElement,
        _scope_stack: &[ScopeId],
    ) {
    }
    fn leave_jsx_opening_element(
        &mut self,
        _node: &JSXOpeningElement,
        _scope_stack: &[ScopeId],
    ) {
    }
}

/// Walks the AST while tracking scope context via `node_to_scope`.
pub struct AstWalker<'a> {
    scope_info: &'a ScopeInfo,
    scope_stack: Vec<ScopeId>,
}

impl<'a> AstWalker<'a> {
    pub fn new(scope_info: &'a ScopeInfo) -> Self {
        AstWalker {
            scope_info,
            scope_stack: Vec::new(),
        }
    }

    /// Create a walker with an initial scope already on the stack.
    pub fn with_initial_scope(scope_info: &'a ScopeInfo, initial_scope: ScopeId) -> Self {
        AstWalker {
            scope_info,
            scope_stack: vec![initial_scope],
        }
    }

    pub fn scope_stack(&self) -> &[ScopeId] {
        &self.scope_stack
    }

    /// Try to push a scope for a node. Returns true if a scope was pushed.
    fn try_push_scope(&mut self, start: Option<u32>) -> bool {
        if let Some(start) = start {
            if let Some(&scope_id) = self.scope_info.node_to_scope.get(&start) {
                self.scope_stack.push(scope_id);
                return true;
            }
        }
        false
    }

    // ---- Public walk methods ----

    pub fn walk_program(&mut self, v: &mut impl Visitor, node: &Program) {
        let pushed = self.try_push_scope(node.base.start);
        for stmt in &node.body {
            self.walk_statement(v, stmt);
        }
        if pushed {
            self.scope_stack.pop();
        }
    }

    pub fn walk_block_statement(&mut self, v: &mut impl Visitor, node: &BlockStatement) {
        let pushed = self.try_push_scope(node.base.start);
        for stmt in &node.body {
            self.walk_statement(v, stmt);
        }
        if pushed {
            self.scope_stack.pop();
        }
    }

    pub fn walk_statement(&mut self, v: &mut impl Visitor, stmt: &Statement) {
        match stmt {
            Statement::BlockStatement(node) => self.walk_block_statement(v, node),
            Statement::ReturnStatement(node) => {
                if let Some(arg) = &node.argument {
                    self.walk_expression(v, arg);
                }
            }
            Statement::ExpressionStatement(node) => {
                self.walk_expression(v, &node.expression);
            }
            Statement::IfStatement(node) => {
                self.walk_expression(v, &node.test);
                self.walk_statement(v, &node.consequent);
                if let Some(alt) = &node.alternate {
                    self.walk_statement(v, alt);
                }
            }
            Statement::ForStatement(node) => {
                let pushed = self.try_push_scope(node.base.start);
                if let Some(init) = &node.init {
                    match init.as_ref() {
                        ForInit::VariableDeclaration(decl) => {
                            self.walk_variable_declaration(v, decl)
                        }
                        ForInit::Expression(expr) => self.walk_expression(v, expr),
                    }
                }
                if let Some(test) = &node.test {
                    self.walk_expression(v, test);
                }
                if let Some(update) = &node.update {
                    self.walk_expression(v, update);
                }
                self.walk_statement(v, &node.body);
                if pushed {
                    self.scope_stack.pop();
                }
            }
            Statement::WhileStatement(node) => {
                self.walk_expression(v, &node.test);
                self.walk_statement(v, &node.body);
            }
            Statement::DoWhileStatement(node) => {
                self.walk_statement(v, &node.body);
                self.walk_expression(v, &node.test);
            }
            Statement::ForInStatement(node) => {
                let pushed = self.try_push_scope(node.base.start);
                self.walk_for_in_of_left(v, &node.left);
                self.walk_expression(v, &node.right);
                self.walk_statement(v, &node.body);
                if pushed {
                    self.scope_stack.pop();
                }
            }
            Statement::ForOfStatement(node) => {
                let pushed = self.try_push_scope(node.base.start);
                self.walk_for_in_of_left(v, &node.left);
                self.walk_expression(v, &node.right);
                self.walk_statement(v, &node.body);
                if pushed {
                    self.scope_stack.pop();
                }
            }
            Statement::SwitchStatement(node) => {
                let pushed = self.try_push_scope(node.base.start);
                self.walk_expression(v, &node.discriminant);
                for case in &node.cases {
                    if let Some(test) = &case.test {
                        self.walk_expression(v, test);
                    }
                    for consequent in &case.consequent {
                        self.walk_statement(v, consequent);
                    }
                }
                if pushed {
                    self.scope_stack.pop();
                }
            }
            Statement::ThrowStatement(node) => {
                self.walk_expression(v, &node.argument);
            }
            Statement::TryStatement(node) => {
                self.walk_block_statement(v, &node.block);
                if let Some(handler) = &node.handler {
                    let pushed = self.try_push_scope(handler.base.start);
                    if let Some(param) = &handler.param {
                        self.walk_pattern(v, param);
                    }
                    self.walk_block_statement(v, &handler.body);
                    if pushed {
                        self.scope_stack.pop();
                    }
                }
                if let Some(finalizer) = &node.finalizer {
                    self.walk_block_statement(v, finalizer);
                }
            }
            Statement::LabeledStatement(node) => {
                self.walk_statement(v, &node.body);
            }
            Statement::VariableDeclaration(node) => {
                self.walk_variable_declaration(v, node);
            }
            Statement::FunctionDeclaration(node) => {
                self.walk_function_declaration_inner(v, node);
            }
            Statement::ClassDeclaration(node) => {
                if let Some(sc) = &node.super_class {
                    self.walk_expression(v, sc);
                }
            }
            Statement::WithStatement(node) => {
                self.walk_expression(v, &node.object);
                self.walk_statement(v, &node.body);
            }
            Statement::ExportNamedDeclaration(node) => {
                if let Some(decl) = &node.declaration {
                    self.walk_declaration(v, decl);
                }
            }
            Statement::ExportDefaultDeclaration(node) => {
                self.walk_export_default_decl(v, &node.declaration);
            }
            // No runtime expressions to traverse
            Statement::BreakStatement(_)
            | Statement::ContinueStatement(_)
            | Statement::EmptyStatement(_)
            | Statement::DebuggerStatement(_)
            | Statement::ImportDeclaration(_)
            | Statement::ExportAllDeclaration(_)
            | Statement::TSTypeAliasDeclaration(_)
            | Statement::TSInterfaceDeclaration(_)
            | Statement::TSEnumDeclaration(_)
            | Statement::TSModuleDeclaration(_)
            | Statement::TSDeclareFunction(_)
            | Statement::TypeAlias(_)
            | Statement::OpaqueType(_)
            | Statement::InterfaceDeclaration(_)
            | Statement::DeclareVariable(_)
            | Statement::DeclareFunction(_)
            | Statement::DeclareClass(_)
            | Statement::DeclareModule(_)
            | Statement::DeclareModuleExports(_)
            | Statement::DeclareExportDeclaration(_)
            | Statement::DeclareExportAllDeclaration(_)
            | Statement::DeclareInterface(_)
            | Statement::DeclareTypeAlias(_)
            | Statement::DeclareOpaqueType(_)
            | Statement::EnumDeclaration(_) => {}
        }
    }

    pub fn walk_expression(&mut self, v: &mut impl Visitor, expr: &Expression) {
        match expr {
            Expression::Identifier(node) => {
                v.enter_identifier(node, &self.scope_stack);
            }
            Expression::CallExpression(node) => {
                self.walk_expression(v, &node.callee);
                for arg in &node.arguments {
                    self.walk_expression(v, arg);
                }
            }
            Expression::MemberExpression(node) => {
                self.walk_expression(v, &node.object);
                if node.computed {
                    self.walk_expression(v, &node.property);
                }
            }
            Expression::OptionalCallExpression(node) => {
                self.walk_expression(v, &node.callee);
                for arg in &node.arguments {
                    self.walk_expression(v, arg);
                }
            }
            Expression::OptionalMemberExpression(node) => {
                self.walk_expression(v, &node.object);
                if node.computed {
                    self.walk_expression(v, &node.property);
                }
            }
            Expression::BinaryExpression(node) => {
                self.walk_expression(v, &node.left);
                self.walk_expression(v, &node.right);
            }
            Expression::LogicalExpression(node) => {
                self.walk_expression(v, &node.left);
                self.walk_expression(v, &node.right);
            }
            Expression::UnaryExpression(node) => {
                self.walk_expression(v, &node.argument);
            }
            Expression::UpdateExpression(node) => {
                v.enter_update_expression(node, &self.scope_stack);
                self.walk_expression(v, &node.argument);
            }
            Expression::ConditionalExpression(node) => {
                self.walk_expression(v, &node.test);
                self.walk_expression(v, &node.consequent);
                self.walk_expression(v, &node.alternate);
            }
            Expression::AssignmentExpression(node) => {
                v.enter_assignment_expression(node, &self.scope_stack);
                self.walk_pattern(v, &node.left);
                self.walk_expression(v, &node.right);
            }
            Expression::SequenceExpression(node) => {
                for expr in &node.expressions {
                    self.walk_expression(v, expr);
                }
            }
            Expression::ArrowFunctionExpression(node) => {
                let pushed = self.try_push_scope(node.base.start);
                v.enter_arrow_function_expression(node, &self.scope_stack);
                for param in &node.params {
                    self.walk_pattern(v, param);
                }
                match node.body.as_ref() {
                    ArrowFunctionBody::BlockStatement(block) => {
                        self.walk_block_statement(v, block);
                    }
                    ArrowFunctionBody::Expression(expr) => {
                        self.walk_expression(v, expr);
                    }
                }
                v.leave_arrow_function_expression(node, &self.scope_stack);
                if pushed {
                    self.scope_stack.pop();
                }
            }
            Expression::FunctionExpression(node) => {
                let pushed = self.try_push_scope(node.base.start);
                v.enter_function_expression(node, &self.scope_stack);
                for param in &node.params {
                    self.walk_pattern(v, param);
                }
                self.walk_block_statement(v, &node.body);
                v.leave_function_expression(node, &self.scope_stack);
                if pushed {
                    self.scope_stack.pop();
                }
            }
            Expression::ObjectExpression(node) => {
                for prop in &node.properties {
                    self.walk_object_expression_property(v, prop);
                }
            }
            Expression::ArrayExpression(node) => {
                for element in &node.elements {
                    if let Some(el) = element {
                        self.walk_expression(v, el);
                    }
                }
            }
            Expression::NewExpression(node) => {
                self.walk_expression(v, &node.callee);
                for arg in &node.arguments {
                    self.walk_expression(v, arg);
                }
            }
            Expression::TemplateLiteral(node) => {
                for expr in &node.expressions {
                    self.walk_expression(v, expr);
                }
            }
            Expression::TaggedTemplateExpression(node) => {
                self.walk_expression(v, &node.tag);
                for expr in &node.quasi.expressions {
                    self.walk_expression(v, expr);
                }
            }
            Expression::AwaitExpression(node) => {
                self.walk_expression(v, &node.argument);
            }
            Expression::YieldExpression(node) => {
                if let Some(arg) = &node.argument {
                    self.walk_expression(v, arg);
                }
            }
            Expression::SpreadElement(node) => {
                self.walk_expression(v, &node.argument);
            }
            Expression::ParenthesizedExpression(node) => {
                self.walk_expression(v, &node.expression);
            }
            Expression::AssignmentPattern(node) => {
                self.walk_pattern(v, &node.left);
                self.walk_expression(v, &node.right);
            }
            Expression::ClassExpression(node) => {
                if let Some(sc) = &node.super_class {
                    self.walk_expression(v, sc);
                }
            }
            // JSX
            Expression::JSXElement(node) => self.walk_jsx_element(v, node),
            Expression::JSXFragment(node) => self.walk_jsx_fragment(v, node),
            // TS/Flow wrappers - traverse inner expression
            Expression::TSAsExpression(node) => self.walk_expression(v, &node.expression),
            Expression::TSSatisfiesExpression(node) => self.walk_expression(v, &node.expression),
            Expression::TSNonNullExpression(node) => self.walk_expression(v, &node.expression),
            Expression::TSTypeAssertion(node) => self.walk_expression(v, &node.expression),
            Expression::TSInstantiationExpression(node) => {
                self.walk_expression(v, &node.expression)
            }
            Expression::TypeCastExpression(node) => self.walk_expression(v, &node.expression),
            // Leaf nodes
            Expression::StringLiteral(_)
            | Expression::NumericLiteral(_)
            | Expression::BooleanLiteral(_)
            | Expression::NullLiteral(_)
            | Expression::BigIntLiteral(_)
            | Expression::RegExpLiteral(_)
            | Expression::MetaProperty(_)
            | Expression::PrivateName(_)
            | Expression::Super(_)
            | Expression::Import(_)
            | Expression::ThisExpression(_) => {}
        }
    }

    pub fn walk_pattern(&mut self, v: &mut impl Visitor, pat: &PatternLike) {
        match pat {
            PatternLike::Identifier(node) => {
                v.enter_identifier(node, &self.scope_stack);
            }
            PatternLike::ObjectPattern(node) => {
                for prop in &node.properties {
                    match prop {
                        ObjectPatternProperty::ObjectProperty(p) => {
                            if p.computed {
                                self.walk_expression(v, &p.key);
                            }
                            self.walk_pattern(v, &p.value);
                        }
                        ObjectPatternProperty::RestElement(p) => {
                            self.walk_pattern(v, &p.argument);
                        }
                    }
                }
            }
            PatternLike::ArrayPattern(node) => {
                for element in &node.elements {
                    if let Some(el) = element {
                        self.walk_pattern(v, el);
                    }
                }
            }
            PatternLike::AssignmentPattern(node) => {
                self.walk_pattern(v, &node.left);
                self.walk_expression(v, &node.right);
            }
            PatternLike::RestElement(node) => {
                self.walk_pattern(v, &node.argument);
            }
            PatternLike::MemberExpression(node) => {
                self.walk_expression(v, &node.object);
                if node.computed {
                    self.walk_expression(v, &node.property);
                }
            }
        }
    }

    // ---- Private helper walk methods ----

    fn walk_for_in_of_left(&mut self, v: &mut impl Visitor, left: &ForInOfLeft) {
        match left {
            ForInOfLeft::VariableDeclaration(decl) => self.walk_variable_declaration(v, decl),
            ForInOfLeft::Pattern(pat) => self.walk_pattern(v, pat),
        }
    }

    fn walk_variable_declaration(&mut self, v: &mut impl Visitor, decl: &VariableDeclaration) {
        for declarator in &decl.declarations {
            self.walk_pattern(v, &declarator.id);
            if let Some(init) = &declarator.init {
                self.walk_expression(v, init);
            }
        }
    }

    fn walk_function_declaration_inner(
        &mut self,
        v: &mut impl Visitor,
        node: &FunctionDeclaration,
    ) {
        let pushed = self.try_push_scope(node.base.start);
        v.enter_function_declaration(node, &self.scope_stack);
        for param in &node.params {
            self.walk_pattern(v, param);
        }
        self.walk_block_statement(v, &node.body);
        v.leave_function_declaration(node, &self.scope_stack);
        if pushed {
            self.scope_stack.pop();
        }
    }

    fn walk_object_expression_property(
        &mut self,
        v: &mut impl Visitor,
        prop: &ObjectExpressionProperty,
    ) {
        match prop {
            ObjectExpressionProperty::ObjectProperty(p) => {
                if p.computed {
                    self.walk_expression(v, &p.key);
                }
                self.walk_expression(v, &p.value);
            }
            ObjectExpressionProperty::ObjectMethod(node) => {
                let pushed = self.try_push_scope(node.base.start);
                v.enter_object_method(node, &self.scope_stack);
                if node.computed {
                    self.walk_expression(v, &node.key);
                }
                for param in &node.params {
                    self.walk_pattern(v, param);
                }
                self.walk_block_statement(v, &node.body);
                v.leave_object_method(node, &self.scope_stack);
                if pushed {
                    self.scope_stack.pop();
                }
            }
            ObjectExpressionProperty::SpreadElement(p) => {
                self.walk_expression(v, &p.argument);
            }
        }
    }

    fn walk_declaration(&mut self, v: &mut impl Visitor, decl: &Declaration) {
        match decl {
            Declaration::FunctionDeclaration(node) => {
                self.walk_function_declaration_inner(v, node);
            }
            Declaration::ClassDeclaration(node) => {
                if let Some(sc) = &node.super_class {
                    self.walk_expression(v, sc);
                }
            }
            Declaration::VariableDeclaration(node) => {
                self.walk_variable_declaration(v, node);
            }
            // TS/Flow declarations - no runtime expressions
            _ => {}
        }
    }

    fn walk_export_default_decl(&mut self, v: &mut impl Visitor, decl: &ExportDefaultDecl) {
        match decl {
            ExportDefaultDecl::FunctionDeclaration(node) => {
                self.walk_function_declaration_inner(v, node);
            }
            ExportDefaultDecl::ClassDeclaration(node) => {
                if let Some(sc) = &node.super_class {
                    self.walk_expression(v, sc);
                }
            }
            ExportDefaultDecl::Expression(expr) => {
                self.walk_expression(v, expr);
            }
        }
    }

    fn walk_jsx_element(&mut self, v: &mut impl Visitor, node: &JSXElement) {
        v.enter_jsx_opening_element(&node.opening_element, &self.scope_stack);
        self.walk_jsx_element_name(v, &node.opening_element.name);
        v.leave_jsx_opening_element(&node.opening_element, &self.scope_stack);
        for attr in &node.opening_element.attributes {
            match attr {
                JSXAttributeItem::JSXAttribute(a) => {
                    if let Some(value) = &a.value {
                        match value {
                            JSXAttributeValue::JSXExpressionContainer(c) => {
                                self.walk_jsx_expr_container(v, c);
                            }
                            JSXAttributeValue::JSXElement(el) => {
                                self.walk_jsx_element(v, el);
                            }
                            JSXAttributeValue::JSXFragment(f) => {
                                self.walk_jsx_fragment(v, f);
                            }
                            JSXAttributeValue::StringLiteral(_) => {}
                        }
                    }
                }
                JSXAttributeItem::JSXSpreadAttribute(a) => {
                    self.walk_expression(v, &a.argument);
                }
            }
        }
        for child in &node.children {
            self.walk_jsx_child(v, child);
        }
    }

    fn walk_jsx_fragment(&mut self, v: &mut impl Visitor, node: &JSXFragment) {
        for child in &node.children {
            self.walk_jsx_child(v, child);
        }
    }

    fn walk_jsx_child(&mut self, v: &mut impl Visitor, child: &JSXChild) {
        match child {
            JSXChild::JSXElement(el) => self.walk_jsx_element(v, el),
            JSXChild::JSXFragment(f) => self.walk_jsx_fragment(v, f),
            JSXChild::JSXExpressionContainer(c) => self.walk_jsx_expr_container(v, c),
            JSXChild::JSXSpreadChild(s) => self.walk_expression(v, &s.expression),
            JSXChild::JSXText(_) => {}
        }
    }

    fn walk_jsx_expr_container(&mut self, v: &mut impl Visitor, node: &JSXExpressionContainer) {
        match &node.expression {
            JSXExpressionContainerExpr::Expression(expr) => self.walk_expression(v, expr),
            JSXExpressionContainerExpr::JSXEmptyExpression(_) => {}
        }
    }

    fn walk_jsx_element_name(&mut self, v: &mut impl Visitor, name: &JSXElementName) {
        match name {
            JSXElementName::JSXIdentifier(id) => {
                v.enter_jsx_identifier(id, &self.scope_stack);
            }
            JSXElementName::JSXMemberExpression(expr) => {
                self.walk_jsx_member_expression(v, expr);
            }
            JSXElementName::JSXNamespacedName(_) => {}
        }
    }

    fn walk_jsx_member_expression(
        &mut self,
        v: &mut impl Visitor,
        expr: &JSXMemberExpression,
    ) {
        match &*expr.object {
            JSXMemberExprObject::JSXIdentifier(id) => {
                v.enter_jsx_identifier(id, &self.scope_stack);
            }
            JSXMemberExprObject::JSXMemberExpression(inner) => {
                self.walk_jsx_member_expression(v, inner);
            }
        }
        v.enter_jsx_identifier(&expr.property, &self.scope_stack);
    }
}
