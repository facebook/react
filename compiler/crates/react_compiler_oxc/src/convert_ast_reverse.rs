// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Reverse AST converter: react_compiler_ast (Babel format) → OXC AST.
//!
//! This is the inverse of `convert_ast.rs`. It takes a `react_compiler_ast::File`
//! (which represents the compiler's Babel-compatible output) and produces OXC AST
//! nodes allocated in an OXC arena, suitable for code generation via `oxc_codegen`.

use oxc_allocator::{Allocator, FromIn};
use oxc_ast::ast as oxc;
use oxc_span::{Atom, Span, SPAN};
use react_compiler_ast::{
    common::BaseNode,
    declarations::*,
    expressions::*,
    jsx::*,
    operators::*,
    patterns::*,
    statements::*,
};

/// Set the span on an OXC Statement.
fn set_statement_span(stmt: &mut oxc::Statement<'_>, span: Span) {
    use oxc_span::GetSpanMut;
    match stmt {
        oxc::Statement::ImportDeclaration(d) => *d.span_mut() = span,
        oxc::Statement::VariableDeclaration(d) => *d.span_mut() = span,
        oxc::Statement::FunctionDeclaration(d) => *d.span_mut() = span,
        oxc::Statement::ExportNamedDeclaration(d) => *d.span_mut() = span,
        oxc::Statement::ExportDefaultDeclaration(d) => *d.span_mut() = span,
        oxc::Statement::ExportAllDeclaration(d) => *d.span_mut() = span,
        oxc::Statement::ExpressionStatement(s) => *s.span_mut() = span,
        oxc::Statement::IfStatement(s) => *s.span_mut() = span,
        oxc::Statement::ForStatement(s) => *s.span_mut() = span,
        oxc::Statement::WhileStatement(s) => *s.span_mut() = span,
        oxc::Statement::DoWhileStatement(s) => *s.span_mut() = span,
        oxc::Statement::ForInStatement(s) => *s.span_mut() = span,
        oxc::Statement::ForOfStatement(s) => *s.span_mut() = span,
        oxc::Statement::SwitchStatement(s) => *s.span_mut() = span,
        oxc::Statement::ThrowStatement(s) => *s.span_mut() = span,
        oxc::Statement::TryStatement(s) => *s.span_mut() = span,
        oxc::Statement::BreakStatement(s) => *s.span_mut() = span,
        oxc::Statement::ContinueStatement(s) => *s.span_mut() = span,
        oxc::Statement::LabeledStatement(s) => *s.span_mut() = span,
        oxc::Statement::BlockStatement(s) => *s.span_mut() = span,
        oxc::Statement::ReturnStatement(s) => *s.span_mut() = span,
        oxc::Statement::WithStatement(s) => *s.span_mut() = span,
        oxc::Statement::EmptyStatement(s) => *s.span_mut() = span,
        oxc::Statement::DebuggerStatement(s) => *s.span_mut() = span,
        _ => {} // ClassDeclaration etc. - leave as-is
    }
}

/// Convert a `react_compiler_ast::File` into an OXC `Program` allocated in the given arena.
pub fn convert_program_to_oxc<'a>(
    file: &react_compiler_ast::File,
    allocator: &'a Allocator,
) -> oxc::Program<'a> {
    let ctx = ReverseCtx::new(allocator);
    ctx.convert_program(&file.program)
}

struct ReverseCtx<'a> {
    allocator: &'a Allocator,
    builder: oxc_ast::AstBuilder<'a>,
}

impl<'a> ReverseCtx<'a> {
    fn new(allocator: &'a Allocator) -> Self {
        Self {
            allocator,
            builder: oxc_ast::AstBuilder::new(allocator),
        }
    }

    /// Allocate a string in the arena and return an Atom with lifetime 'a.
    fn atom(&self, s: &str) -> Atom<'a> {
        Atom::from_in(s, self.allocator)
    }

    /// Convert a BaseNode's start/end into an OXC Span.
    /// Returns SPAN (0,0) if the base has no position info.
    fn span_from_base(&self, base: &BaseNode) -> Span {
        match (base.start, base.end) {
            (Some(start), Some(end)) => Span::new(start, end),
            (Some(start), None) => Span::new(start, start),
            _ => SPAN,
        }
    }

    // ===== Program =====

    fn convert_program(&self, program: &react_compiler_ast::Program) -> oxc::Program<'a> {
        let source_type = match program.source_type {
            react_compiler_ast::SourceType::Module => oxc_span::SourceType::mjs(),
            react_compiler_ast::SourceType::Script => oxc_span::SourceType::cjs(),
        };

        // Use convert_statements_with_spans for the top-level body so that
        // original source positions are preserved. This allows comments from
        // the original source to be correctly attached to statements.
        let body = self.convert_statements_with_spans(&program.body);
        let directives = self.convert_directives(&program.directives);
        let comments = self.builder.vec();

        self.builder.program(
            SPAN,
            source_type,
            "",
            comments,
            None, // hashbang
            directives,
            body,
        )
    }

    // ===== Directives =====

    fn convert_directives(
        &self,
        directives: &[Directive],
    ) -> oxc_allocator::Vec<'a, oxc::Directive<'a>> {
        self.builder
            .vec_from_iter(directives.iter().map(|d| self.convert_directive(d)))
    }

    fn convert_directive(&self, d: &Directive) -> oxc::Directive<'a> {
        let expression = self.builder.string_literal(SPAN, self.atom(&d.value.value), None);
        self.builder.directive(SPAN, expression, self.atom(&d.value.value))
    }

    // ===== Statements =====

    /// Convert statements preserving span info from the Babel AST.
    /// This is used for top-level program body where span positions
    /// are needed for comment attachment.
    fn convert_statements_with_spans(
        &self,
        stmts: &[Statement],
    ) -> oxc_allocator::Vec<'a, oxc::Statement<'a>> {
        self.builder
            .vec_from_iter(stmts.iter().map(|s| {
                let span = self.get_statement_span(s);
                let mut oxc_stmt = self.convert_statement(s);
                if span != SPAN {
                    set_statement_span(&mut oxc_stmt, span);
                }
                oxc_stmt
            }))
    }

    /// Extract the span from a Babel AST Statement's base node.
    fn get_statement_span(&self, stmt: &Statement) -> Span {
        let base = match stmt {
            Statement::BlockStatement(s) => &s.base,
            Statement::ReturnStatement(s) => &s.base,
            Statement::ExpressionStatement(s) => &s.base,
            Statement::IfStatement(s) => &s.base,
            Statement::ForStatement(s) => &s.base,
            Statement::WhileStatement(s) => &s.base,
            Statement::DoWhileStatement(s) => &s.base,
            Statement::ForInStatement(s) => &s.base,
            Statement::ForOfStatement(s) => &s.base,
            Statement::SwitchStatement(s) => &s.base,
            Statement::ThrowStatement(s) => &s.base,
            Statement::TryStatement(s) => &s.base,
            Statement::BreakStatement(s) => &s.base,
            Statement::ContinueStatement(s) => &s.base,
            Statement::LabeledStatement(s) => &s.base,
            Statement::EmptyStatement(s) => &s.base,
            Statement::DebuggerStatement(s) => &s.base,
            Statement::WithStatement(s) => &s.base,
            Statement::VariableDeclaration(d) => &d.base,
            Statement::FunctionDeclaration(f) => &f.base,
            Statement::ClassDeclaration(c) => &c.base,
            Statement::ImportDeclaration(d) => &d.base,
            Statement::ExportNamedDeclaration(d) => &d.base,
            Statement::ExportDefaultDeclaration(d) => &d.base,
            Statement::ExportAllDeclaration(d) => &d.base,
            _ => return SPAN,
        };
        self.span_from_base(base)
    }

    fn convert_statement(&self, stmt: &Statement) -> oxc::Statement<'a> {
        match stmt {
            Statement::BlockStatement(s) => {
                self.builder
                    .statement_block(SPAN, self.convert_statement_vec(&s.body))
            }
            Statement::ReturnStatement(s) => self.builder.statement_return(
                SPAN,
                s.argument.as_ref().map(|a| self.convert_expression(a)),
            ),
            Statement::ExpressionStatement(s) => self
                .builder
                .statement_expression(SPAN, self.convert_expression(&s.expression)),
            Statement::IfStatement(s) => self.builder.statement_if(
                SPAN,
                self.convert_expression(&s.test),
                self.convert_statement(&s.consequent),
                s.alternate.as_ref().map(|a| self.convert_statement(a)),
            ),
            Statement::ForStatement(s) => {
                let init = s.init.as_ref().map(|i| self.convert_for_init(i));
                let test = s.test.as_ref().map(|t| self.convert_expression(t));
                let update = s.update.as_ref().map(|u| self.convert_expression(u));
                let body = self.convert_statement(&s.body);
                self.builder.statement_for(SPAN, init, test, update, body)
            }
            Statement::WhileStatement(s) => self.builder.statement_while(
                SPAN,
                self.convert_expression(&s.test),
                self.convert_statement(&s.body),
            ),
            Statement::DoWhileStatement(s) => self.builder.statement_do_while(
                SPAN,
                self.convert_statement(&s.body),
                self.convert_expression(&s.test),
            ),
            Statement::ForInStatement(s) => self.builder.statement_for_in(
                SPAN,
                self.convert_for_in_of_left(&s.left),
                self.convert_expression(&s.right),
                self.convert_statement(&s.body),
            ),
            Statement::ForOfStatement(s) => self.builder.statement_for_of(
                SPAN,
                s.is_await,
                self.convert_for_in_of_left(&s.left),
                self.convert_expression(&s.right),
                self.convert_statement(&s.body),
            ),
            Statement::SwitchStatement(s) => {
                let cases = self.builder.vec_from_iter(s.cases.iter().map(|c| {
                    self.builder.switch_case(
                        SPAN,
                        c.test.as_ref().map(|t| self.convert_expression(t)),
                        self.convert_statement_vec(&c.consequent),
                    )
                }));
                self.builder
                    .statement_switch(SPAN, self.convert_expression(&s.discriminant), cases)
            }
            Statement::ThrowStatement(s) => {
                self.builder
                    .statement_throw(SPAN, self.convert_expression(&s.argument))
            }
            Statement::TryStatement(s) => {
                let block = self.convert_block_statement(&s.block);
                let handler = s.handler.as_ref().map(|h| self.convert_catch_clause(h));
                let finalizer = s
                    .finalizer
                    .as_ref()
                    .map(|f| self.convert_block_statement(f));
                self.builder.statement_try(SPAN, block, handler, finalizer)
            }
            Statement::BreakStatement(s) => {
                let label = s
                    .label
                    .as_ref()
                    .map(|l| self.builder.label_identifier(SPAN, self.atom(&l.name)));
                self.builder.statement_break(SPAN, label)
            }
            Statement::ContinueStatement(s) => {
                let label = s
                    .label
                    .as_ref()
                    .map(|l| self.builder.label_identifier(SPAN, self.atom(&l.name)));
                self.builder.statement_continue(SPAN, label)
            }
            Statement::LabeledStatement(s) => {
                let label = self.builder.label_identifier(SPAN, self.atom(&s.label.name));
                self.builder
                    .statement_labeled(SPAN, label, self.convert_statement(&s.body))
            }
            Statement::EmptyStatement(_) => self.builder.statement_empty(SPAN),
            Statement::DebuggerStatement(_) => self.builder.statement_debugger(SPAN),
            Statement::WithStatement(s) => self.builder.statement_with(
                SPAN,
                self.convert_expression(&s.object),
                self.convert_statement(&s.body),
            ),
            Statement::VariableDeclaration(d) => {
                let decl = self.convert_variable_declaration(d);
                oxc::Statement::VariableDeclaration(self.builder.alloc(decl))
            }
            Statement::FunctionDeclaration(f) => {
                let func = self.convert_function_decl(f, oxc::FunctionType::FunctionDeclaration);
                oxc::Statement::FunctionDeclaration(self.builder.alloc(func))
            }
            Statement::ClassDeclaration(_c) => {
                // Class declarations are rare in compiler output
                todo!("ClassDeclaration reverse conversion")
            }
            Statement::ImportDeclaration(d) => {
                let decl = self.convert_import_declaration(d);
                oxc::Statement::ImportDeclaration(self.builder.alloc(decl))
            }
            Statement::ExportNamedDeclaration(d) => {
                let decl = self.convert_export_named_declaration(d);
                oxc::Statement::ExportNamedDeclaration(self.builder.alloc(decl))
            }
            Statement::ExportDefaultDeclaration(d) => {
                let decl = self.convert_export_default_declaration(d);
                oxc::Statement::ExportDefaultDeclaration(self.builder.alloc(decl))
            }
            Statement::ExportAllDeclaration(d) => {
                let decl = self.convert_export_all_declaration(d);
                oxc::Statement::ExportAllDeclaration(self.builder.alloc(decl))
            }
            // TS/Flow declarations - not emitted by the React compiler output
            Statement::TSTypeAliasDeclaration(_)
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
            | Statement::EnumDeclaration(_) => self.builder.statement_empty(SPAN),
        }
    }

    fn convert_statement_vec(
        &self,
        stmts: &[Statement],
    ) -> oxc_allocator::Vec<'a, oxc::Statement<'a>> {
        self.builder
            .vec_from_iter(stmts.iter().map(|s| self.convert_statement(s)))
    }

    fn convert_block_statement(&self, block: &BlockStatement) -> oxc::BlockStatement<'a> {
        self.builder
            .block_statement(SPAN, self.convert_statement_vec(&block.body))
    }

    fn convert_catch_clause(&self, clause: &CatchClause) -> oxc::CatchClause<'a> {
        let param = clause.param.as_ref().map(|p| {
            let pattern = self.convert_pattern_to_binding_pattern(p);
            self.builder.catch_parameter(
                SPAN,
                pattern,
                None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
            )
        });
        self.builder
            .catch_clause(SPAN, param, self.convert_block_statement(&clause.body))
    }

    fn convert_for_init(&self, init: &ForInit) -> oxc::ForStatementInit<'a> {
        match init {
            ForInit::VariableDeclaration(v) => {
                let decl = self.convert_variable_declaration(v);
                oxc::ForStatementInit::VariableDeclaration(self.builder.alloc(decl))
            }
            ForInit::Expression(e) => oxc::ForStatementInit::from(self.convert_expression(e)),
        }
    }

    fn convert_for_in_of_left(&self, left: &ForInOfLeft) -> oxc::ForStatementLeft<'a> {
        match left {
            ForInOfLeft::VariableDeclaration(v) => {
                let decl = self.convert_variable_declaration(v);
                oxc::ForStatementLeft::VariableDeclaration(self.builder.alloc(decl))
            }
            ForInOfLeft::Pattern(p) => {
                let target = self.convert_pattern_to_assignment_target(p);
                oxc::ForStatementLeft::from(target)
            }
        }
    }

    fn convert_variable_declaration(
        &self,
        decl: &VariableDeclaration,
    ) -> oxc::VariableDeclaration<'a> {
        let kind = match decl.kind {
            VariableDeclarationKind::Var => oxc::VariableDeclarationKind::Var,
            VariableDeclarationKind::Let => oxc::VariableDeclarationKind::Let,
            VariableDeclarationKind::Const => oxc::VariableDeclarationKind::Const,
            VariableDeclarationKind::Using => oxc::VariableDeclarationKind::Using,
        };
        let declarators = self.builder.vec_from_iter(
            decl.declarations
                .iter()
                .map(|d| self.convert_variable_declarator(d, kind)),
        );
        let declare = decl.declare.unwrap_or(false);
        self.builder
            .variable_declaration(SPAN, kind, declarators, declare)
    }

    fn convert_variable_declarator(
        &self,
        d: &VariableDeclarator,
        kind: oxc::VariableDeclarationKind,
    ) -> oxc::VariableDeclarator<'a> {
        let id = self.convert_pattern_to_binding_pattern(&d.id);
        let init = d.init.as_ref().map(|e| self.convert_expression(e));
        let definite = d.definite.unwrap_or(false);
        self.builder.variable_declarator(
            SPAN,
            kind,
            id,
            None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
            init,
            definite,
        )
    }

    // ===== Expressions =====

    fn convert_expression(&self, expr: &Expression) -> oxc::Expression<'a> {
        match expr {
            Expression::Identifier(id) => {
                self.builder
                    .expression_identifier(SPAN, self.atom(&id.name))
            }
            Expression::StringLiteral(lit) => {
                self.builder
                    .expression_string_literal(SPAN, self.atom(&lit.value), None)
            }
            Expression::NumericLiteral(lit) => {
                self.builder
                    .expression_numeric_literal(SPAN, lit.value, None, oxc::NumberBase::Decimal)
            }
            Expression::BooleanLiteral(lit) => {
                self.builder.expression_boolean_literal(SPAN, lit.value)
            }
            Expression::NullLiteral(_) => self.builder.expression_null_literal(SPAN),
            Expression::BigIntLiteral(lit) => self.builder.expression_big_int_literal(
                SPAN,
                self.atom(&lit.value),
                None,
                oxc::BigintBase::Decimal,
            ),
            Expression::RegExpLiteral(lit) => {
                let flags = self.parse_regexp_flags(&lit.flags);
                let pattern = oxc::RegExpPattern {
                    text: self.atom(&lit.pattern),
                    pattern: None,
                };
                let regex = oxc::RegExp { pattern, flags };
                self.builder.expression_reg_exp_literal(SPAN, regex, None)
            }
            Expression::CallExpression(call) => {
                let callee = self.convert_expression(&call.callee);
                let args = self.convert_arguments(&call.arguments);
                self.builder.expression_call(
                    SPAN,
                    callee,
                    None::<oxc_allocator::Box<'a, oxc::TSTypeParameterInstantiation<'a>>>,
                    args,
                    false,
                )
            }
            Expression::MemberExpression(m) => self.convert_member_expression(m),
            Expression::OptionalCallExpression(call) => {
                let callee = self.convert_expression_for_chain(&call.callee);
                let args = self.convert_arguments(&call.arguments);
                let chain_call = self.builder.chain_element_call_expression(
                    SPAN,
                    callee,
                    None::<oxc_allocator::Box<'a, oxc::TSTypeParameterInstantiation<'a>>>,
                    args,
                    call.optional,
                );
                self.builder.expression_chain(SPAN, chain_call)
            }
            Expression::OptionalMemberExpression(m) => {
                let chain_elem = self.convert_optional_member_to_chain_element(m);
                self.builder.expression_chain(SPAN, chain_elem)
            }
            Expression::BinaryExpression(bin) => {
                let op = self.convert_binary_operator(&bin.operator);
                self.builder.expression_binary(
                    SPAN,
                    self.convert_expression(&bin.left),
                    op,
                    self.convert_expression(&bin.right),
                )
            }
            Expression::LogicalExpression(log) => {
                let op = self.convert_logical_operator(&log.operator);
                self.builder.expression_logical(
                    SPAN,
                    self.convert_expression(&log.left),
                    op,
                    self.convert_expression(&log.right),
                )
            }
            Expression::UnaryExpression(un) => {
                let op = self.convert_unary_operator(&un.operator);
                self.builder
                    .expression_unary(SPAN, op, self.convert_expression(&un.argument))
            }
            Expression::UpdateExpression(up) => {
                let op = self.convert_update_operator(&up.operator);
                let arg = self.convert_expression_to_simple_assignment_target(&up.argument);
                self.builder.expression_update(SPAN, op, up.prefix, arg)
            }
            Expression::ConditionalExpression(cond) => self.builder.expression_conditional(
                SPAN,
                self.convert_expression(&cond.test),
                self.convert_expression(&cond.consequent),
                self.convert_expression(&cond.alternate),
            ),
            Expression::AssignmentExpression(assign) => {
                let op = self.convert_assignment_operator(&assign.operator);
                let left = self.convert_pattern_to_assignment_target(&assign.left);
                self.builder
                    .expression_assignment(SPAN, op, left, self.convert_expression(&assign.right))
            }
            Expression::SequenceExpression(seq) => {
                let exprs = self
                    .builder
                    .vec_from_iter(seq.expressions.iter().map(|e| self.convert_expression(e)));
                self.builder.expression_sequence(SPAN, exprs)
            }
            Expression::ArrowFunctionExpression(arrow) => self.convert_arrow_function(arrow),
            Expression::FunctionExpression(func) => {
                let f = self.convert_function_expr(func);
                oxc::Expression::FunctionExpression(self.builder.alloc(f))
            }
            Expression::ObjectExpression(obj) => {
                let properties = self.builder.vec_from_iter(
                    obj.properties
                        .iter()
                        .map(|p| self.convert_object_expression_property(p)),
                );
                self.builder.expression_object(SPAN, properties)
            }
            Expression::ArrayExpression(arr) => {
                let elements = self
                    .builder
                    .vec_from_iter(arr.elements.iter().map(|e| self.convert_array_element(e)));
                self.builder.expression_array(SPAN, elements)
            }
            Expression::NewExpression(n) => {
                let callee = self.convert_expression(&n.callee);
                let args = self.convert_arguments(&n.arguments);
                self.builder.expression_new(
                    SPAN,
                    callee,
                    None::<oxc_allocator::Box<'a, oxc::TSTypeParameterInstantiation<'a>>>,
                    args,
                )
            }
            Expression::TemplateLiteral(tl) => {
                let template = self.convert_template_literal(tl);
                oxc::Expression::TemplateLiteral(self.builder.alloc(template))
            }
            Expression::TaggedTemplateExpression(tag) => {
                let t = self.convert_expression(&tag.tag);
                let quasi = self.convert_template_literal(&tag.quasi);
                self.builder.expression_tagged_template(
                    SPAN,
                    t,
                    None::<oxc_allocator::Box<'a, oxc::TSTypeParameterInstantiation<'a>>>,
                    quasi,
                )
            }
            Expression::AwaitExpression(a) => {
                self.builder
                    .expression_await(SPAN, self.convert_expression(&a.argument))
            }
            Expression::YieldExpression(y) => self.builder.expression_yield(
                SPAN,
                y.delegate,
                y.argument.as_ref().map(|a| self.convert_expression(a)),
            ),
            Expression::SpreadElement(s) => {
                // SpreadElement can't be a standalone expression in OXC.
                // Return the argument directly as a fallback.
                self.convert_expression(&s.argument)
            }
            Expression::MetaProperty(mp) => {
                let meta = self
                    .builder
                    .identifier_name(SPAN, self.atom(&mp.meta.name));
                let property = self
                    .builder
                    .identifier_name(SPAN, self.atom(&mp.property.name));
                self.builder.expression_meta_property(SPAN, meta, property)
            }
            Expression::ClassExpression(_) => {
                todo!("ClassExpression reverse conversion")
            }
            Expression::PrivateName(_) => {
                self.builder
                    .expression_identifier(SPAN, self.atom("__private__"))
            }
            Expression::Super(_) => self.builder.expression_super(SPAN),
            Expression::Import(_) => {
                self.builder
                    .expression_identifier(SPAN, self.atom("__import__"))
            }
            Expression::ThisExpression(_) => self.builder.expression_this(SPAN),
            Expression::ParenthesizedExpression(p) => self
                .builder
                .expression_parenthesized(SPAN, self.convert_expression(&p.expression)),
            Expression::JSXElement(el) => {
                let element = self.convert_jsx_element(el);
                oxc::Expression::JSXElement(self.builder.alloc(element))
            }
            Expression::JSXFragment(frag) => {
                let fragment = self.convert_jsx_fragment(frag);
                oxc::Expression::JSXFragment(self.builder.alloc(fragment))
            }
            // TS expressions - strip the type wrapper, keep the expression
            Expression::TSAsExpression(e) => self.convert_expression(&e.expression),
            Expression::TSSatisfiesExpression(e) => self.convert_expression(&e.expression),
            Expression::TSNonNullExpression(e) => self
                .builder
                .expression_ts_non_null(SPAN, self.convert_expression(&e.expression)),
            Expression::TSTypeAssertion(e) => self.convert_expression(&e.expression),
            Expression::TSInstantiationExpression(e) => self.convert_expression(&e.expression),
            Expression::TypeCastExpression(e) => self.convert_expression(&e.expression),
            Expression::AssignmentPattern(p) => {
                let left = self.convert_pattern_to_assignment_target(&p.left);
                self.builder.expression_assignment(
                    SPAN,
                    oxc_syntax::operator::AssignmentOperator::Assign,
                    left,
                    self.convert_expression(&p.right),
                )
            }
        }
    }

    /// Convert an expression that may be used inside a chain (optional chaining).
    fn convert_expression_for_chain(&self, expr: &Expression) -> oxc::Expression<'a> {
        match expr {
            Expression::OptionalMemberExpression(m) => {
                self.convert_optional_member_to_expression(m)
            }
            Expression::OptionalCallExpression(call) => {
                let callee = self.convert_expression_for_chain(&call.callee);
                let args = self.convert_arguments(&call.arguments);
                let call_expr = self.builder.call_expression(
                    SPAN,
                    callee,
                    None::<oxc_allocator::Box<'a, oxc::TSTypeParameterInstantiation<'a>>>,
                    args,
                    call.optional,
                );
                oxc::Expression::CallExpression(self.builder.alloc(call_expr))
            }
            _ => self.convert_expression(expr),
        }
    }

    fn convert_member_expression(&self, m: &MemberExpression) -> oxc::Expression<'a> {
        let object = self.convert_expression(&m.object);
        if m.computed {
            let property = self.convert_expression(&m.property);
            oxc::Expression::ComputedMemberExpression(self.builder.alloc(
                self.builder
                    .computed_member_expression(SPAN, object, property, false),
            ))
        } else {
            let prop_name = self.expression_to_identifier_name(&m.property);
            oxc::Expression::StaticMemberExpression(self.builder.alloc(
                self.builder
                    .static_member_expression(SPAN, object, prop_name, false),
            ))
        }
    }

    fn convert_optional_member_to_chain_element(
        &self,
        m: &OptionalMemberExpression,
    ) -> oxc::ChainElement<'a> {
        let object = self.convert_expression_for_chain(&m.object);
        if m.computed {
            let property = self.convert_expression(&m.property);
            oxc::ChainElement::ComputedMemberExpression(self.builder.alloc(
                self.builder
                    .computed_member_expression(SPAN, object, property, m.optional),
            ))
        } else {
            let prop_name = self.expression_to_identifier_name(&m.property);
            oxc::ChainElement::StaticMemberExpression(self.builder.alloc(
                self.builder
                    .static_member_expression(SPAN, object, prop_name, m.optional),
            ))
        }
    }

    fn convert_optional_member_to_expression(
        &self,
        m: &OptionalMemberExpression,
    ) -> oxc::Expression<'a> {
        let object = self.convert_expression_for_chain(&m.object);
        if m.computed {
            let property = self.convert_expression(&m.property);
            oxc::Expression::ComputedMemberExpression(self.builder.alloc(
                self.builder
                    .computed_member_expression(SPAN, object, property, m.optional),
            ))
        } else {
            let prop_name = self.expression_to_identifier_name(&m.property);
            oxc::Expression::StaticMemberExpression(self.builder.alloc(
                self.builder
                    .static_member_expression(SPAN, object, prop_name, m.optional),
            ))
        }
    }

    fn expression_to_identifier_name(&self, expr: &Expression) -> oxc::IdentifierName<'a> {
        match expr {
            Expression::Identifier(id) => {
                self.builder.identifier_name(SPAN, self.atom(&id.name))
            }
            _ => self.builder.identifier_name(SPAN, self.atom("__unknown__")),
        }
    }

    fn convert_arguments(
        &self,
        args: &[Expression],
    ) -> oxc_allocator::Vec<'a, oxc::Argument<'a>> {
        self.builder
            .vec_from_iter(args.iter().map(|a| self.convert_argument(a)))
    }

    fn convert_argument(&self, arg: &Expression) -> oxc::Argument<'a> {
        match arg {
            Expression::SpreadElement(s) => self
                .builder
                .argument_spread_element(SPAN, self.convert_expression(&s.argument)),
            _ => oxc::Argument::from(self.convert_expression(arg)),
        }
    }

    fn convert_array_element(
        &self,
        elem: &Option<Expression>,
    ) -> oxc::ArrayExpressionElement<'a> {
        match elem {
            None => self.builder.array_expression_element_elision(SPAN),
            Some(Expression::SpreadElement(s)) => self
                .builder
                .array_expression_element_spread_element(
                    SPAN,
                    self.convert_expression(&s.argument),
                ),
            Some(e) => oxc::ArrayExpressionElement::from(self.convert_expression(e)),
        }
    }

    fn convert_object_expression_property(
        &self,
        prop: &ObjectExpressionProperty,
    ) -> oxc::ObjectPropertyKind<'a> {
        match prop {
            ObjectExpressionProperty::ObjectProperty(p) => {
                let key = self.convert_expression_to_property_key(&p.key);
                let value = self.convert_expression(&p.value);
                let method = p.method.unwrap_or(false);
                let obj_prop = self.builder.object_property(
                    SPAN,
                    oxc::PropertyKind::Init,
                    key,
                    value,
                    method,
                    p.shorthand,
                    p.computed,
                );
                oxc::ObjectPropertyKind::ObjectProperty(self.builder.alloc(obj_prop))
            }
            ObjectExpressionProperty::ObjectMethod(m) => {
                let kind = match m.kind {
                    ObjectMethodKind::Method => oxc::PropertyKind::Init,
                    ObjectMethodKind::Get => oxc::PropertyKind::Get,
                    ObjectMethodKind::Set => oxc::PropertyKind::Set,
                };
                let key = self.convert_expression_to_property_key(&m.key);
                let func = self.convert_object_method_to_function(m);
                let func_expr = oxc::Expression::FunctionExpression(self.builder.alloc(func));
                let obj_prop = self.builder.object_property(
                    SPAN,
                    kind,
                    key,
                    func_expr,
                    m.method,
                    false, // shorthand
                    m.computed,
                );
                oxc::ObjectPropertyKind::ObjectProperty(self.builder.alloc(obj_prop))
            }
            ObjectExpressionProperty::SpreadElement(s) => {
                let spread = self
                    .builder
                    .spread_element(SPAN, self.convert_expression(&s.argument));
                oxc::ObjectPropertyKind::SpreadProperty(self.builder.alloc(spread))
            }
        }
    }

    fn convert_expression_to_property_key(&self, expr: &Expression) -> oxc::PropertyKey<'a> {
        match expr {
            Expression::Identifier(id) => self
                .builder
                .property_key_static_identifier(SPAN, self.atom(&id.name)),
            Expression::StringLiteral(s) => {
                let lit = self.builder.string_literal(SPAN, self.atom(&s.value), None);
                oxc::PropertyKey::StringLiteral(self.builder.alloc(lit))
            }
            Expression::NumericLiteral(n) => {
                let lit =
                    self.builder
                        .numeric_literal(SPAN, n.value, None, oxc::NumberBase::Decimal);
                oxc::PropertyKey::NumericLiteral(self.builder.alloc(lit))
            }
            Expression::PrivateName(p) => self
                .builder
                .property_key_private_identifier(SPAN, self.atom(&p.id.name)),
            _ => oxc::PropertyKey::from(self.convert_expression(expr)),
        }
    }

    fn convert_template_literal(
        &self,
        tl: &react_compiler_ast::expressions::TemplateLiteral,
    ) -> oxc::TemplateLiteral<'a> {
        let quasis = self.builder.vec_from_iter(tl.quasis.iter().map(|q| {
            let raw = self.atom(&q.value.raw);
            let cooked = q.value.cooked.as_ref().map(|c| self.atom(c));
            let value = oxc::TemplateElementValue { raw, cooked };
            self.builder.template_element(SPAN, value, q.tail, false)
        }));
        let expressions = self
            .builder
            .vec_from_iter(tl.expressions.iter().map(|e| self.convert_expression(e)));
        self.builder.template_literal(SPAN, quasis, expressions)
    }

    // ===== Functions =====

    fn convert_function_decl(
        &self,
        f: &FunctionDeclaration,
        fn_type: oxc::FunctionType,
    ) -> oxc::Function<'a> {
        let id = f
            .id
            .as_ref()
            .map(|id| self.builder.binding_identifier(SPAN, self.atom(&id.name)));
        let params = self.convert_params_to_formal_parameters(&f.params);
        let body = self.convert_block_to_function_body(&f.body);
        self.builder.function(
            SPAN,
            fn_type,
            id,
            f.generator,
            f.is_async,
            f.declare.unwrap_or(false),
            None::<oxc_allocator::Box<'a, oxc::TSTypeParameterDeclaration<'a>>>,
            None::<oxc_allocator::Box<'a, oxc::TSThisParameter<'a>>>,
            params,
            None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
            Some(body),
        )
    }

    fn convert_function_expr(&self, f: &FunctionExpression) -> oxc::Function<'a> {
        let id = f
            .id
            .as_ref()
            .map(|id| self.builder.binding_identifier(SPAN, self.atom(&id.name)));
        let params = self.convert_params_to_formal_parameters(&f.params);
        let body = self.convert_block_to_function_body(&f.body);
        self.builder.function(
            SPAN,
            oxc::FunctionType::FunctionExpression,
            id,
            f.generator,
            f.is_async,
            false,
            None::<oxc_allocator::Box<'a, oxc::TSTypeParameterDeclaration<'a>>>,
            None::<oxc_allocator::Box<'a, oxc::TSThisParameter<'a>>>,
            params,
            None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
            Some(body),
        )
    }

    fn convert_object_method_to_function(&self, m: &ObjectMethod) -> oxc::Function<'a> {
        let params = self.convert_params_to_formal_parameters(&m.params);
        let body = self.convert_block_to_function_body(&m.body);
        self.builder.function(
            SPAN,
            oxc::FunctionType::FunctionExpression,
            None,
            m.generator,
            m.is_async,
            false,
            None::<oxc_allocator::Box<'a, oxc::TSTypeParameterDeclaration<'a>>>,
            None::<oxc_allocator::Box<'a, oxc::TSThisParameter<'a>>>,
            params,
            None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
            Some(body),
        )
    }

    fn convert_arrow_function(&self, arrow: &ArrowFunctionExpression) -> oxc::Expression<'a> {
        let is_expression = arrow.expression.unwrap_or(false);
        let params = self.convert_params_to_formal_parameters(&arrow.params);

        let body = match &*arrow.body {
            ArrowFunctionBody::BlockStatement(block) => self.convert_block_to_function_body(block),
            ArrowFunctionBody::Expression(expr) => {
                let oxc_expr = self.convert_expression(expr);
                let stmt = self.builder.statement_expression(SPAN, oxc_expr);
                let stmts = self.builder.vec_from_iter(std::iter::once(stmt));
                self.builder.function_body(SPAN, self.builder.vec(), stmts)
            }
        };

        self.builder.expression_arrow_function(
            SPAN,
            is_expression,
            arrow.is_async,
            None::<oxc_allocator::Box<'a, oxc::TSTypeParameterDeclaration<'a>>>,
            params,
            None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
            body,
        )
    }

    fn convert_block_to_function_body(&self, block: &BlockStatement) -> oxc::FunctionBody<'a> {
        let stmts = self.convert_statement_vec(&block.body);
        let directives = self.convert_directives(&block.directives);
        self.builder.function_body(SPAN, directives, stmts)
    }

    fn convert_params_to_formal_parameters(
        &self,
        params: &[PatternLike],
    ) -> oxc::FormalParameters<'a> {
        let mut items: Vec<oxc::FormalParameter<'a>> = Vec::new();
        let mut rest: Option<oxc::FormalParameterRest<'a>> = None;

        for param in params {
            match param {
                PatternLike::RestElement(r) => {
                    let arg = self.convert_pattern_to_binding_pattern(&r.argument);
                    let rest_elem = self.builder.binding_rest_element(SPAN, arg);
                    rest = Some(self.builder.formal_parameter_rest(
                        SPAN,
                        self.builder.vec(),
                        rest_elem,
                        None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
                    ));
                }
                PatternLike::AssignmentPattern(ap) => {
                    let pattern = self.convert_pattern_to_binding_pattern(&ap.left);
                    let init = self.convert_expression(&ap.right);
                    let fp = self.builder.formal_parameter(
                        SPAN,
                        self.builder.vec(), // decorators
                        pattern,
                        None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
                        Some(init),
                        false, // optional
                        None,  // accessibility
                        false, // readonly
                        false, // override
                    );
                    items.push(fp);
                }
                _ => {
                    let pattern = self.convert_pattern_to_binding_pattern(param);
                    let fp = self.builder.formal_parameter(
                        SPAN,
                        self.builder.vec(), // decorators
                        pattern,
                        None::<oxc_allocator::Box<'a, oxc::TSTypeAnnotation<'a>>>,
                        None::<oxc_allocator::Box<'a, oxc::Expression<'a>>>,
                        false, // optional
                        None,  // accessibility
                        false, // readonly
                        false, // override
                    );
                    items.push(fp);
                }
            }
        }

        let items_vec = self.builder.vec_from_iter(items);
        self.builder.formal_parameters(
            SPAN,
            oxc::FormalParameterKind::FormalParameter,
            items_vec,
            rest,
        )
    }

    // ===== Patterns → BindingPattern =====

    fn convert_pattern_to_binding_pattern(&self, pattern: &PatternLike) -> oxc::BindingPattern<'a> {
        match pattern {
            PatternLike::Identifier(id) => self
                .builder
                .binding_pattern_binding_identifier(SPAN, self.atom(&id.name)),
            PatternLike::ObjectPattern(obj) => {
                let mut properties: Vec<oxc::BindingProperty<'a>> = Vec::new();
                let mut rest: Option<oxc::BindingRestElement<'a>> = None;

                for prop in &obj.properties {
                    match prop {
                        ObjectPatternProperty::ObjectProperty(p) => {
                            let key = self.convert_expression_to_property_key(&p.key);
                            let value = self.convert_pattern_to_binding_pattern(&p.value);
                            let bp = self.builder.binding_property(
                                SPAN,
                                key,
                                value,
                                p.shorthand,
                                p.computed,
                            );
                            properties.push(bp);
                        }
                        ObjectPatternProperty::RestElement(r) => {
                            let arg = self.convert_pattern_to_binding_pattern(&r.argument);
                            rest = Some(self.builder.binding_rest_element(SPAN, arg));
                        }
                    }
                }

                let props_vec = self.builder.vec_from_iter(properties);
                self.builder
                    .binding_pattern_object_pattern(SPAN, props_vec, rest)
            }
            PatternLike::ArrayPattern(arr) => {
                let mut elements: Vec<Option<oxc::BindingPattern<'a>>> = Vec::new();
                let mut rest: Option<oxc::BindingRestElement<'a>> = None;

                for elem in &arr.elements {
                    match elem {
                        None => elements.push(None),
                        Some(PatternLike::RestElement(r)) => {
                            let arg = self.convert_pattern_to_binding_pattern(&r.argument);
                            rest = Some(self.builder.binding_rest_element(SPAN, arg));
                        }
                        Some(p) => {
                            elements.push(Some(self.convert_pattern_to_binding_pattern(p)));
                        }
                    }
                }

                let elems_vec = self.builder.vec_from_iter(elements);
                self.builder
                    .binding_pattern_array_pattern(SPAN, elems_vec, rest)
            }
            PatternLike::AssignmentPattern(ap) => {
                let left = self.convert_pattern_to_binding_pattern(&ap.left);
                let right = self.convert_expression(&ap.right);
                self.builder
                    .binding_pattern_assignment_pattern(SPAN, left, right)
            }
            PatternLike::RestElement(r) => self.convert_pattern_to_binding_pattern(&r.argument),
            PatternLike::MemberExpression(_) => self
                .builder
                .binding_pattern_binding_identifier(SPAN, self.atom("__member_pattern__")),
        }
    }

    // ===== Patterns → AssignmentTarget =====

    fn convert_pattern_to_assignment_target(
        &self,
        pattern: &PatternLike,
    ) -> oxc::AssignmentTarget<'a> {
        match pattern {
            PatternLike::Identifier(id) => self
                .builder
                .simple_assignment_target_assignment_target_identifier(
                    SPAN,
                    self.atom(&id.name),
                )
                .into(),
            PatternLike::MemberExpression(m) => {
                let object = self.convert_expression(&m.object);
                if m.computed {
                    let property = self.convert_expression(&m.property);
                    let mem =
                        self.builder
                            .computed_member_expression(SPAN, object, property, false);
                    oxc::AssignmentTarget::ComputedMemberExpression(self.builder.alloc(mem))
                } else {
                    let prop_name = self.expression_to_identifier_name(&m.property);
                    let mem =
                        self.builder
                            .static_member_expression(SPAN, object, prop_name, false);
                    oxc::AssignmentTarget::StaticMemberExpression(self.builder.alloc(mem))
                }
            }
            PatternLike::ObjectPattern(obj) => {
                let mut properties: Vec<oxc::AssignmentTargetProperty<'a>> = Vec::new();
                let mut rest: Option<oxc::AssignmentTargetRest<'a>> = None;

                for prop in &obj.properties {
                    match prop {
                        ObjectPatternProperty::ObjectProperty(p) => {
                            let key = self.convert_expression_to_property_key(&p.key);
                            let binding =
                                self.convert_pattern_to_assignment_target_maybe_default(&p.value);
                            let atp = self
                                .builder
                                .assignment_target_property_assignment_target_property_property(
                                    SPAN, key, binding, p.computed,
                                );
                            properties.push(atp);
                        }
                        ObjectPatternProperty::RestElement(r) => {
                            let target = self.convert_pattern_to_assignment_target(&r.argument);
                            rest = Some(self.builder.assignment_target_rest(SPAN, target));
                        }
                    }
                }

                let props_vec = self.builder.vec_from_iter(properties);
                self.builder
                    .assignment_target_pattern_object_assignment_target(SPAN, props_vec, rest)
                    .into()
            }
            PatternLike::ArrayPattern(arr) => {
                let mut elements: Vec<Option<oxc::AssignmentTargetMaybeDefault<'a>>> = Vec::new();
                let mut rest: Option<oxc::AssignmentTargetRest<'a>> = None;

                for elem in &arr.elements {
                    match elem {
                        None => elements.push(None),
                        Some(PatternLike::RestElement(r)) => {
                            let target = self.convert_pattern_to_assignment_target(&r.argument);
                            rest = Some(self.builder.assignment_target_rest(SPAN, target));
                        }
                        Some(p) => {
                            elements.push(Some(
                                self.convert_pattern_to_assignment_target_maybe_default(p),
                            ));
                        }
                    }
                }

                let elems_vec = self.builder.vec_from_iter(elements);
                self.builder
                    .assignment_target_pattern_array_assignment_target(SPAN, elems_vec, rest)
                    .into()
            }
            PatternLike::AssignmentPattern(ap) => {
                // For assignment LHS, use the left side
                self.convert_pattern_to_assignment_target(&ap.left)
            }
            PatternLike::RestElement(r) => self.convert_pattern_to_assignment_target(&r.argument),
        }
    }

    fn convert_pattern_to_assignment_target_maybe_default(
        &self,
        pattern: &PatternLike,
    ) -> oxc::AssignmentTargetMaybeDefault<'a> {
        match pattern {
            PatternLike::AssignmentPattern(ap) => {
                let binding = self.convert_pattern_to_assignment_target(&ap.left);
                let init = self.convert_expression(&ap.right);
                self.builder
                    .assignment_target_maybe_default_assignment_target_with_default(
                        SPAN, binding, init,
                    )
            }
            _ => {
                let target = self.convert_pattern_to_assignment_target(pattern);
                oxc::AssignmentTargetMaybeDefault::from(target)
            }
        }
    }

    fn convert_expression_to_simple_assignment_target(
        &self,
        expr: &Expression,
    ) -> oxc::SimpleAssignmentTarget<'a> {
        match expr {
            Expression::Identifier(id) => self
                .builder
                .simple_assignment_target_assignment_target_identifier(
                    SPAN,
                    self.atom(&id.name),
                ),
            Expression::MemberExpression(m) => {
                let object = self.convert_expression(&m.object);
                if m.computed {
                    let property = self.convert_expression(&m.property);
                    let mem =
                        self.builder
                            .computed_member_expression(SPAN, object, property, false);
                    oxc::SimpleAssignmentTarget::ComputedMemberExpression(self.builder.alloc(mem))
                } else {
                    let prop_name = self.expression_to_identifier_name(&m.property);
                    let mem =
                        self.builder
                            .static_member_expression(SPAN, object, prop_name, false);
                    oxc::SimpleAssignmentTarget::StaticMemberExpression(self.builder.alloc(mem))
                }
            }
            _ => self
                .builder
                .simple_assignment_target_assignment_target_identifier(
                    SPAN,
                    self.atom("__unknown__"),
                ),
        }
    }

    // ===== JSX =====

    fn convert_jsx_element(&self, el: &JSXElement) -> oxc::JSXElement<'a> {
        let opening = self.convert_jsx_opening_element(&el.opening_element);
        let children = self
            .builder
            .vec_from_iter(el.children.iter().map(|c| self.convert_jsx_child(c)));
        let closing = el
            .closing_element
            .as_ref()
            .map(|c| self.convert_jsx_closing_element(c));
        self.builder.jsx_element(SPAN, opening, children, closing)
    }

    fn convert_jsx_opening_element(
        &self,
        el: &JSXOpeningElement,
    ) -> oxc::JSXOpeningElement<'a> {
        let name = self.convert_jsx_element_name(&el.name);
        let attrs = self.builder.vec_from_iter(
            el.attributes
                .iter()
                .map(|a| self.convert_jsx_attribute_item(a)),
        );
        self.builder.jsx_opening_element(
            SPAN,
            name,
            None::<oxc_allocator::Box<'a, oxc::TSTypeParameterInstantiation<'a>>>,
            attrs,
        )
    }

    fn convert_jsx_closing_element(&self, el: &JSXClosingElement) -> oxc::JSXClosingElement<'a> {
        let name = self.convert_jsx_element_name(&el.name);
        self.builder.jsx_closing_element(SPAN, name)
    }

    fn convert_jsx_element_name(&self, name: &JSXElementName) -> oxc::JSXElementName<'a> {
        match name {
            JSXElementName::JSXIdentifier(id) => {
                let first_char = id.name.chars().next().unwrap_or('a');
                if first_char.is_uppercase() || id.name.contains('.') {
                    self.builder
                        .jsx_element_name_identifier_reference(SPAN, self.atom(&id.name))
                } else {
                    self.builder
                        .jsx_element_name_identifier(SPAN, self.atom(&id.name))
                }
            }
            JSXElementName::JSXMemberExpression(m) => {
                let member = self.convert_jsx_member_expression(m);
                self.builder.jsx_element_name_member_expression(
                    SPAN,
                    member.object,
                    member.property,
                )
            }
            JSXElementName::JSXNamespacedName(ns) => {
                let namespace = self
                    .builder
                    .jsx_identifier(SPAN, self.atom(&ns.namespace.name));
                let name = self.builder.jsx_identifier(SPAN, self.atom(&ns.name.name));
                self.builder
                    .jsx_element_name_namespaced_name(SPAN, namespace, name)
            }
        }
    }

    fn convert_jsx_member_expression(
        &self,
        m: &JSXMemberExpression,
    ) -> oxc::JSXMemberExpression<'a> {
        let object = self.convert_jsx_member_expression_object(&m.object);
        let property = self
            .builder
            .jsx_identifier(SPAN, self.atom(&m.property.name));
        self.builder.jsx_member_expression(SPAN, object, property)
    }

    fn convert_jsx_member_expression_object(
        &self,
        obj: &JSXMemberExprObject,
    ) -> oxc::JSXMemberExpressionObject<'a> {
        match obj {
            JSXMemberExprObject::JSXIdentifier(id) => self
                .builder
                .jsx_member_expression_object_identifier_reference(SPAN, self.atom(&id.name)),
            JSXMemberExprObject::JSXMemberExpression(m) => {
                let member = self.convert_jsx_member_expression(m);
                self.builder
                    .jsx_member_expression_object_member_expression(
                        SPAN,
                        member.object,
                        member.property,
                    )
            }
        }
    }

    fn convert_jsx_attribute_item(&self, item: &JSXAttributeItem) -> oxc::JSXAttributeItem<'a> {
        match item {
            JSXAttributeItem::JSXAttribute(attr) => {
                let name = self.convert_jsx_attribute_name(&attr.name);
                let value = attr
                    .value
                    .as_ref()
                    .map(|v| self.convert_jsx_attribute_value(v));
                self.builder.jsx_attribute_item_attribute(SPAN, name, value)
            }
            JSXAttributeItem::JSXSpreadAttribute(s) => self
                .builder
                .jsx_attribute_item_spread_attribute(
                    SPAN,
                    self.convert_expression(&s.argument),
                ),
        }
    }

    fn convert_jsx_attribute_name(&self, name: &JSXAttributeName) -> oxc::JSXAttributeName<'a> {
        match name {
            JSXAttributeName::JSXIdentifier(id) => self
                .builder
                .jsx_attribute_name_identifier(SPAN, self.atom(&id.name)),
            JSXAttributeName::JSXNamespacedName(ns) => {
                let namespace = self
                    .builder
                    .jsx_identifier(SPAN, self.atom(&ns.namespace.name));
                let name = self.builder.jsx_identifier(SPAN, self.atom(&ns.name.name));
                self.builder
                    .jsx_attribute_name_namespaced_name(SPAN, namespace, name)
            }
        }
    }

    fn convert_jsx_attribute_value(
        &self,
        value: &JSXAttributeValue,
    ) -> oxc::JSXAttributeValue<'a> {
        match value {
            JSXAttributeValue::StringLiteral(s) => self
                .builder
                .jsx_attribute_value_string_literal(SPAN, self.atom(&s.value), None),
            JSXAttributeValue::JSXExpressionContainer(ec) => {
                let expr = self.convert_jsx_expression_container_expr(&ec.expression);
                self.builder
                    .jsx_attribute_value_expression_container(SPAN, expr)
            }
            JSXAttributeValue::JSXElement(el) => {
                let element = self.convert_jsx_element(el);
                let opening = element.opening_element;
                let closing = element.closing_element;
                self.builder
                    .jsx_attribute_value_element(SPAN, opening, element.children, closing)
            }
            JSXAttributeValue::JSXFragment(frag) => {
                let fragment = self.convert_jsx_fragment(frag);
                self.builder.jsx_attribute_value_fragment(
                    SPAN,
                    fragment.opening_fragment,
                    fragment.children,
                    fragment.closing_fragment,
                )
            }
        }
    }

    fn convert_jsx_expression_container_expr(
        &self,
        expr: &JSXExpressionContainerExpr,
    ) -> oxc::JSXExpression<'a> {
        match expr {
            JSXExpressionContainerExpr::JSXEmptyExpression(_) => {
                self.builder.jsx_expression_empty_expression(SPAN)
            }
            JSXExpressionContainerExpr::Expression(e) => {
                oxc::JSXExpression::from(self.convert_expression(e))
            }
        }
    }

    fn convert_jsx_child(&self, child: &JSXChild) -> oxc::JSXChild<'a> {
        match child {
            JSXChild::JSXText(t) => {
                self.builder
                    .jsx_child_text(SPAN, self.atom(&t.value), None)
            }
            JSXChild::JSXElement(el) => {
                let element = self.convert_jsx_element(el);
                let opening = element.opening_element;
                let closing = element.closing_element;
                self.builder
                    .jsx_child_element(SPAN, opening, element.children, closing)
            }
            JSXChild::JSXFragment(frag) => {
                let fragment = self.convert_jsx_fragment(frag);
                self.builder.jsx_child_fragment(
                    SPAN,
                    fragment.opening_fragment,
                    fragment.children,
                    fragment.closing_fragment,
                )
            }
            JSXChild::JSXExpressionContainer(ec) => {
                let expr = self.convert_jsx_expression_container_expr(&ec.expression);
                self.builder.jsx_child_expression_container(SPAN, expr)
            }
            JSXChild::JSXSpreadChild(s) => self
                .builder
                .jsx_child_spread(SPAN, self.convert_expression(&s.expression)),
        }
    }

    fn convert_jsx_fragment(&self, frag: &JSXFragment) -> oxc::JSXFragment<'a> {
        let opening = self.builder.jsx_opening_fragment(SPAN);
        let closing = self.builder.jsx_closing_fragment(SPAN);
        let children = self
            .builder
            .vec_from_iter(frag.children.iter().map(|c| self.convert_jsx_child(c)));
        self.builder.jsx_fragment(SPAN, opening, children, closing)
    }

    // ===== Import/Export =====

    fn convert_import_declaration(
        &self,
        decl: &ImportDeclaration,
    ) -> oxc::ImportDeclaration<'a> {
        let specifiers = self
            .builder
            .vec_from_iter(decl.specifiers.iter().map(|s| self.convert_import_specifier(s)));
        let source = self
            .builder
            .string_literal(SPAN, self.atom(&decl.source.value), None);
        let import_kind = match decl.import_kind.as_ref() {
            Some(ImportKind::Type) => oxc::ImportOrExportKind::Type,
            _ => oxc::ImportOrExportKind::Value,
        };
        self.builder.import_declaration(
            SPAN,
            Some(specifiers),
            source,
            None, // phase
            None::<oxc_allocator::Box<'a, oxc::WithClause<'a>>>,
            import_kind,
        )
    }

    fn convert_import_specifier(
        &self,
        spec: &react_compiler_ast::declarations::ImportSpecifier,
    ) -> oxc::ImportDeclarationSpecifier<'a> {
        match spec {
            react_compiler_ast::declarations::ImportSpecifier::ImportSpecifier(s) => {
                let local = self
                    .builder
                    .binding_identifier(SPAN, self.atom(&s.local.name));
                let imported = self.convert_module_export_name(&s.imported);
                let import_kind = match s.import_kind.as_ref() {
                    Some(ImportKind::Type) => oxc::ImportOrExportKind::Type,
                    _ => oxc::ImportOrExportKind::Value,
                };
                let is = self
                    .builder
                    .import_specifier(SPAN, imported, local, import_kind);
                oxc::ImportDeclarationSpecifier::ImportSpecifier(self.builder.alloc(is))
            }
            react_compiler_ast::declarations::ImportSpecifier::ImportDefaultSpecifier(s) => {
                let local = self
                    .builder
                    .binding_identifier(SPAN, self.atom(&s.local.name));
                let ids = self.builder.import_default_specifier(SPAN, local);
                oxc::ImportDeclarationSpecifier::ImportDefaultSpecifier(self.builder.alloc(ids))
            }
            react_compiler_ast::declarations::ImportSpecifier::ImportNamespaceSpecifier(s) => {
                let local = self
                    .builder
                    .binding_identifier(SPAN, self.atom(&s.local.name));
                let ins = self.builder.import_namespace_specifier(SPAN, local);
                oxc::ImportDeclarationSpecifier::ImportNamespaceSpecifier(self.builder.alloc(ins))
            }
        }
    }

    fn convert_module_export_name(
        &self,
        name: &react_compiler_ast::declarations::ModuleExportName,
    ) -> oxc::ModuleExportName<'a> {
        match name {
            react_compiler_ast::declarations::ModuleExportName::Identifier(id) => {
                oxc::ModuleExportName::IdentifierName(
                    self.builder.identifier_name(SPAN, self.atom(&id.name)),
                )
            }
            react_compiler_ast::declarations::ModuleExportName::StringLiteral(s) => {
                oxc::ModuleExportName::StringLiteral(
                    self.builder.string_literal(SPAN, self.atom(&s.value), None),
                )
            }
        }
    }

    fn convert_export_named_declaration(
        &self,
        decl: &ExportNamedDeclaration,
    ) -> oxc::ExportNamedDeclaration<'a> {
        let declaration = decl.declaration.as_ref().map(|d| self.convert_declaration(d));
        let specifiers = self.builder.vec_from_iter(
            decl.specifiers
                .iter()
                .map(|s| self.convert_export_specifier(s)),
        );
        let source = decl
            .source
            .as_ref()
            .map(|s| self.builder.string_literal(SPAN, self.atom(&s.value), None));
        let export_kind = match decl.export_kind.as_ref() {
            Some(ExportKind::Type) => oxc::ImportOrExportKind::Type,
            _ => oxc::ImportOrExportKind::Value,
        };
        self.builder.export_named_declaration(
            SPAN,
            declaration,
            specifiers,
            source,
            export_kind,
            None::<oxc_allocator::Box<'a, oxc::WithClause<'a>>>,
        )
    }

    fn convert_declaration(&self, decl: &Declaration) -> oxc::Declaration<'a> {
        match decl {
            Declaration::FunctionDeclaration(f) => {
                let func = self.convert_function_decl(f, oxc::FunctionType::FunctionDeclaration);
                oxc::Declaration::FunctionDeclaration(self.builder.alloc(func))
            }
            Declaration::VariableDeclaration(v) => {
                let d = self.convert_variable_declaration(v);
                oxc::Declaration::VariableDeclaration(self.builder.alloc(d))
            }
            Declaration::ClassDeclaration(_) => {
                todo!("ClassDeclaration in export")
            }
            _ => {
                let d = self.builder.variable_declaration(
                    SPAN,
                    oxc::VariableDeclarationKind::Const,
                    self.builder.vec(),
                    true,
                );
                oxc::Declaration::VariableDeclaration(self.builder.alloc(d))
            }
        }
    }

    fn convert_export_specifier(
        &self,
        spec: &react_compiler_ast::declarations::ExportSpecifier,
    ) -> oxc::ExportSpecifier<'a> {
        match spec {
            react_compiler_ast::declarations::ExportSpecifier::ExportSpecifier(s) => {
                let local = self.convert_module_export_name(&s.local);
                let exported = self.convert_module_export_name(&s.exported);
                let export_kind = match s.export_kind.as_ref() {
                    Some(ExportKind::Type) => oxc::ImportOrExportKind::Type,
                    _ => oxc::ImportOrExportKind::Value,
                };
                self.builder
                    .export_specifier(SPAN, local, exported, export_kind)
            }
            react_compiler_ast::declarations::ExportSpecifier::ExportDefaultSpecifier(s) => {
                let name = oxc::ModuleExportName::IdentifierName(
                    self.builder
                        .identifier_name(SPAN, self.atom(&s.exported.name)),
                );
                let default_name = oxc::ModuleExportName::IdentifierName(
                    self.builder.identifier_name(SPAN, self.atom("default")),
                );
                self.builder.export_specifier(
                    SPAN,
                    name,
                    default_name,
                    oxc::ImportOrExportKind::Value,
                )
            }
            react_compiler_ast::declarations::ExportSpecifier::ExportNamespaceSpecifier(s) => {
                let exported = self.convert_module_export_name(&s.exported);
                let star = oxc::ModuleExportName::IdentifierName(
                    self.builder.identifier_name(SPAN, self.atom("*")),
                );
                self.builder.export_specifier(
                    SPAN,
                    star,
                    exported,
                    oxc::ImportOrExportKind::Value,
                )
            }
        }
    }

    fn convert_export_default_declaration(
        &self,
        decl: &ExportDefaultDeclaration,
    ) -> oxc::ExportDefaultDeclaration<'a> {
        let declaration = self.convert_export_default_decl(&decl.declaration);
        self.builder.export_default_declaration(SPAN, declaration)
    }

    fn convert_export_default_decl(
        &self,
        decl: &ExportDefaultDecl,
    ) -> oxc::ExportDefaultDeclarationKind<'a> {
        match decl {
            ExportDefaultDecl::FunctionDeclaration(f) => {
                let func = self.convert_function_decl(f, oxc::FunctionType::FunctionDeclaration);
                oxc::ExportDefaultDeclarationKind::FunctionDeclaration(self.builder.alloc(func))
            }
            ExportDefaultDecl::ClassDeclaration(_) => {
                todo!("ClassDeclaration in export default")
            }
            ExportDefaultDecl::Expression(e) => {
                oxc::ExportDefaultDeclarationKind::from(self.convert_expression(e))
            }
        }
    }

    fn convert_export_all_declaration(
        &self,
        decl: &ExportAllDeclaration,
    ) -> oxc::ExportAllDeclaration<'a> {
        let source = self
            .builder
            .string_literal(SPAN, self.atom(&decl.source.value), None);
        let export_kind = match decl.export_kind.as_ref() {
            Some(ExportKind::Type) => oxc::ImportOrExportKind::Type,
            _ => oxc::ImportOrExportKind::Value,
        };
        self.builder.export_all_declaration(
            SPAN,
            None, // exported
            source,
            None::<oxc_allocator::Box<'a, oxc::WithClause<'a>>>,
            export_kind,
        )
    }

    // ===== Operators =====

    fn convert_binary_operator(
        &self,
        op: &BinaryOperator,
    ) -> oxc_syntax::operator::BinaryOperator {
        use oxc_syntax::operator::BinaryOperator as OxcBinOp;
        match op {
            BinaryOperator::Add => OxcBinOp::Addition,
            BinaryOperator::Sub => OxcBinOp::Subtraction,
            BinaryOperator::Mul => OxcBinOp::Multiplication,
            BinaryOperator::Div => OxcBinOp::Division,
            BinaryOperator::Rem => OxcBinOp::Remainder,
            BinaryOperator::Exp => OxcBinOp::Exponential,
            BinaryOperator::Eq => OxcBinOp::Equality,
            BinaryOperator::StrictEq => OxcBinOp::StrictEquality,
            BinaryOperator::Neq => OxcBinOp::Inequality,
            BinaryOperator::StrictNeq => OxcBinOp::StrictInequality,
            BinaryOperator::Lt => OxcBinOp::LessThan,
            BinaryOperator::Lte => OxcBinOp::LessEqualThan,
            BinaryOperator::Gt => OxcBinOp::GreaterThan,
            BinaryOperator::Gte => OxcBinOp::GreaterEqualThan,
            BinaryOperator::Shl => OxcBinOp::ShiftLeft,
            BinaryOperator::Shr => OxcBinOp::ShiftRight,
            BinaryOperator::UShr => OxcBinOp::ShiftRightZeroFill,
            BinaryOperator::BitOr => OxcBinOp::BitwiseOR,
            BinaryOperator::BitXor => OxcBinOp::BitwiseXOR,
            BinaryOperator::BitAnd => OxcBinOp::BitwiseAnd,
            BinaryOperator::In => OxcBinOp::In,
            BinaryOperator::Instanceof => OxcBinOp::Instanceof,
            BinaryOperator::Pipeline => OxcBinOp::BitwiseOR, // no pipeline in OXC
        }
    }

    fn convert_logical_operator(
        &self,
        op: &LogicalOperator,
    ) -> oxc_syntax::operator::LogicalOperator {
        use oxc_syntax::operator::LogicalOperator as OxcLogOp;
        match op {
            LogicalOperator::Or => OxcLogOp::Or,
            LogicalOperator::And => OxcLogOp::And,
            LogicalOperator::NullishCoalescing => OxcLogOp::Coalesce,
        }
    }

    fn convert_unary_operator(
        &self,
        op: &UnaryOperator,
    ) -> oxc_syntax::operator::UnaryOperator {
        use oxc_syntax::operator::UnaryOperator as OxcUnOp;
        match op {
            UnaryOperator::Neg => OxcUnOp::UnaryNegation,
            UnaryOperator::Plus => OxcUnOp::UnaryPlus,
            UnaryOperator::Not => OxcUnOp::LogicalNot,
            UnaryOperator::BitNot => OxcUnOp::BitwiseNot,
            UnaryOperator::TypeOf => OxcUnOp::Typeof,
            UnaryOperator::Void => OxcUnOp::Void,
            UnaryOperator::Delete => OxcUnOp::Delete,
            UnaryOperator::Throw => OxcUnOp::Void, // no throw-as-unary in OXC
        }
    }

    fn convert_update_operator(
        &self,
        op: &UpdateOperator,
    ) -> oxc_syntax::operator::UpdateOperator {
        use oxc_syntax::operator::UpdateOperator as OxcUpOp;
        match op {
            UpdateOperator::Increment => OxcUpOp::Increment,
            UpdateOperator::Decrement => OxcUpOp::Decrement,
        }
    }

    fn convert_assignment_operator(
        &self,
        op: &AssignmentOperator,
    ) -> oxc_syntax::operator::AssignmentOperator {
        use oxc_syntax::operator::AssignmentOperator as OxcAssOp;
        match op {
            AssignmentOperator::Assign => OxcAssOp::Assign,
            AssignmentOperator::AddAssign => OxcAssOp::Addition,
            AssignmentOperator::SubAssign => OxcAssOp::Subtraction,
            AssignmentOperator::MulAssign => OxcAssOp::Multiplication,
            AssignmentOperator::DivAssign => OxcAssOp::Division,
            AssignmentOperator::RemAssign => OxcAssOp::Remainder,
            AssignmentOperator::ExpAssign => OxcAssOp::Exponential,
            AssignmentOperator::ShlAssign => OxcAssOp::ShiftLeft,
            AssignmentOperator::ShrAssign => OxcAssOp::ShiftRight,
            AssignmentOperator::UShrAssign => OxcAssOp::ShiftRightZeroFill,
            AssignmentOperator::BitOrAssign => OxcAssOp::BitwiseOR,
            AssignmentOperator::BitXorAssign => OxcAssOp::BitwiseXOR,
            AssignmentOperator::BitAndAssign => OxcAssOp::BitwiseAnd,
            AssignmentOperator::OrAssign => OxcAssOp::LogicalOr,
            AssignmentOperator::AndAssign => OxcAssOp::LogicalAnd,
            AssignmentOperator::NullishAssign => OxcAssOp::LogicalNullish,
        }
    }

    fn parse_regexp_flags(&self, flags_str: &str) -> oxc::RegExpFlags {
        let mut flags = oxc::RegExpFlags::empty();
        for ch in flags_str.chars() {
            match ch {
                'd' => flags |= oxc::RegExpFlags::D,
                'g' => flags |= oxc::RegExpFlags::G,
                'i' => flags |= oxc::RegExpFlags::I,
                'm' => flags |= oxc::RegExpFlags::M,
                's' => flags |= oxc::RegExpFlags::S,
                'u' => flags |= oxc::RegExpFlags::U,
                'v' => flags |= oxc::RegExpFlags::V,
                'y' => flags |= oxc::RegExpFlags::Y,
                _ => {}
            }
        }
        flags
    }
}
