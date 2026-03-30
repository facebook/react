// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use react_compiler_ast::{
    common::{BaseNode, Position, SourceLocation},
    declarations::*,
    expressions::*,
    jsx::*,
    literals::*,
    operators::*,
    patterns::*,
    statements::*,
    File, Program, SourceType,
};
use swc_common::{Span, Spanned};
use swc_ecma_ast as swc;

/// Helper to convert SWC's Wtf8Atom (which doesn't impl Display) to a String.
fn wtf8_to_string(value: &swc_atoms::Wtf8Atom) -> String {
    value.to_string_lossy().into_owned()
}

/// Converts an SWC Module AST to the React compiler's Babel-compatible AST.
pub fn convert_module(module: &swc::Module, source_text: &str) -> File {
    convert_module_with_source_type(module, source_text, SourceType::Module)
}

/// Converts an SWC Module AST to the React compiler's Babel-compatible AST
/// with an explicit source type.
pub fn convert_module_with_source_type(
    module: &swc::Module,
    source_text: &str,
    source_type: SourceType,
) -> File {
    let ctx = ConvertCtx::new(source_text);
    let base = ctx.make_base_node(module.span);

    let mut body: Vec<Statement> = Vec::new();
    let mut directives: Vec<Directive> = Vec::new();
    let mut past_directives = false;

    for item in &module.body {
        if !past_directives {
            if let Some(dir) = try_extract_directive(item, &ctx) {
                directives.push(dir);
                continue;
            }
            past_directives = true;
        }
        body.push(ctx.convert_module_item(item));
    }

    File {
        base: ctx.make_base_node(module.span),
        program: Program {
            base,
            body,
            directives,
            source_type,
            interpreter: None,
            source_file: None,
        },
        comments: vec![],
        errors: vec![],
    }
}

fn try_extract_directive(item: &swc::ModuleItem, ctx: &ConvertCtx) -> Option<Directive> {
    if let swc::ModuleItem::Stmt(swc::Stmt::Expr(expr_stmt)) = item {
        if let swc::Expr::Lit(swc::Lit::Str(s)) = &*expr_stmt.expr {
            return Some(Directive {
                base: ctx.make_base_node(expr_stmt.span),
                value: DirectiveLiteral {
                    base: ctx.make_base_node(s.span),
                    value: wtf8_to_string(&s.value),
                },
            });
        }
    }
    None
}

struct ConvertCtx<'a> {
    #[allow(dead_code)]
    source_text: &'a str,
    line_offsets: Vec<u32>,
}

impl<'a> ConvertCtx<'a> {
    fn new(source_text: &'a str) -> Self {
        let mut line_offsets = vec![0u32];
        for (i, ch) in source_text.char_indices() {
            if ch == '\n' {
                line_offsets.push((i + 1) as u32);
            }
        }
        Self {
            source_text,
            line_offsets,
        }
    }

    fn make_base_node(&self, span: Span) -> BaseNode {
        BaseNode {
            node_type: None,
            start: Some(span.lo.0),
            end: Some(span.hi.0),
            loc: Some(self.source_location(span)),
            range: None,
            extra: None,
            leading_comments: None,
            inner_comments: None,
            trailing_comments: None,
        }
    }

    fn position(&self, offset: u32) -> Position {
        let line_idx = match self.line_offsets.binary_search(&offset) {
            Ok(idx) => idx,
            Err(idx) => idx.saturating_sub(1),
        };
        let line_start = self.line_offsets[line_idx];
        Position {
            line: (line_idx as u32) + 1,
            column: offset - line_start,
            index: Some(offset),
        }
    }

    fn source_location(&self, span: Span) -> SourceLocation {
        SourceLocation {
            start: self.position(span.lo.0),
            end: self.position(span.hi.0),
            filename: None,
            identifier_name: None,
        }
    }

    fn convert_module_item(&self, item: &swc::ModuleItem) -> Statement {
        match item {
            swc::ModuleItem::Stmt(stmt) => self.convert_statement(stmt),
            swc::ModuleItem::ModuleDecl(decl) => self.convert_module_decl(decl),
        }
    }

    fn convert_module_decl(&self, decl: &swc::ModuleDecl) -> Statement {
        match decl {
            swc::ModuleDecl::Import(d) => {
                Statement::ImportDeclaration(self.convert_import_declaration(d))
            }
            swc::ModuleDecl::ExportDecl(d) => {
                Statement::ExportNamedDeclaration(self.convert_export_decl(d))
            }
            swc::ModuleDecl::ExportNamed(d) => {
                Statement::ExportNamedDeclaration(self.convert_export_named(d))
            }
            swc::ModuleDecl::ExportDefaultDecl(d) => {
                Statement::ExportDefaultDeclaration(self.convert_export_default_decl(d))
            }
            swc::ModuleDecl::ExportDefaultExpr(d) => {
                Statement::ExportDefaultDeclaration(self.convert_export_default_expr(d))
            }
            swc::ModuleDecl::ExportAll(d) => {
                Statement::ExportAllDeclaration(self.convert_export_all(d))
            }
            swc::ModuleDecl::TsImportEquals(d) => Statement::EmptyStatement(EmptyStatement {
                base: self.make_base_node(d.span),
            }),
            swc::ModuleDecl::TsExportAssignment(d) => {
                Statement::EmptyStatement(EmptyStatement {
                    base: self.make_base_node(d.span),
                })
            }
            swc::ModuleDecl::TsNamespaceExport(d) => {
                Statement::EmptyStatement(EmptyStatement {
                    base: self.make_base_node(d.span),
                })
            }
        }
    }

    // ===== Statements =====

    fn convert_statement(&self, stmt: &swc::Stmt) -> Statement {
        match stmt {
            swc::Stmt::Block(s) => Statement::BlockStatement(self.convert_block_statement(s)),
            swc::Stmt::Break(s) => Statement::BreakStatement(BreakStatement {
                base: self.make_base_node(s.span),
                label: s
                    .label
                    .as_ref()
                    .map(|l| self.convert_ident_to_identifier(l)),
            }),
            swc::Stmt::Continue(s) => Statement::ContinueStatement(ContinueStatement {
                base: self.make_base_node(s.span),
                label: s
                    .label
                    .as_ref()
                    .map(|l| self.convert_ident_to_identifier(l)),
            }),
            swc::Stmt::Debugger(s) => Statement::DebuggerStatement(DebuggerStatement {
                base: self.make_base_node(s.span),
            }),
            swc::Stmt::DoWhile(s) => Statement::DoWhileStatement(DoWhileStatement {
                base: self.make_base_node(s.span),
                test: Box::new(self.convert_expression(&s.test)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            swc::Stmt::Empty(s) => Statement::EmptyStatement(EmptyStatement {
                base: self.make_base_node(s.span),
            }),
            swc::Stmt::Expr(s) => Statement::ExpressionStatement(ExpressionStatement {
                base: self.make_base_node(s.span),
                expression: Box::new(self.convert_expression(&s.expr)),
            }),
            swc::Stmt::ForIn(s) => Statement::ForInStatement(ForInStatement {
                base: self.make_base_node(s.span),
                left: Box::new(self.convert_for_head(&s.left)),
                right: Box::new(self.convert_expression(&s.right)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            swc::Stmt::ForOf(s) => Statement::ForOfStatement(ForOfStatement {
                base: self.make_base_node(s.span),
                left: Box::new(self.convert_for_head(&s.left)),
                right: Box::new(self.convert_expression(&s.right)),
                body: Box::new(self.convert_statement(&s.body)),
                is_await: s.is_await,
            }),
            swc::Stmt::For(s) => Statement::ForStatement(ForStatement {
                base: self.make_base_node(s.span),
                init: s
                    .init
                    .as_ref()
                    .map(|i| Box::new(self.convert_var_decl_or_expr_to_for_init(i))),
                test: s
                    .test
                    .as_ref()
                    .map(|t| Box::new(self.convert_expression(t))),
                update: s
                    .update
                    .as_ref()
                    .map(|u| Box::new(self.convert_expression(u))),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            swc::Stmt::If(s) => Statement::IfStatement(IfStatement {
                base: self.make_base_node(s.span),
                test: Box::new(self.convert_expression(&s.test)),
                consequent: Box::new(self.convert_statement(&s.cons)),
                alternate: s.alt.as_ref().map(|a| Box::new(self.convert_statement(a))),
            }),
            swc::Stmt::Labeled(s) => Statement::LabeledStatement(LabeledStatement {
                base: self.make_base_node(s.span),
                label: self.convert_ident_to_identifier(&s.label),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            swc::Stmt::Return(s) => Statement::ReturnStatement(ReturnStatement {
                base: self.make_base_node(s.span),
                argument: s
                    .arg
                    .as_ref()
                    .map(|a| Box::new(self.convert_expression(a))),
            }),
            swc::Stmt::Switch(s) => Statement::SwitchStatement(SwitchStatement {
                base: self.make_base_node(s.span),
                discriminant: Box::new(self.convert_expression(&s.discriminant)),
                cases: s
                    .cases
                    .iter()
                    .map(|c| SwitchCase {
                        base: self.make_base_node(c.span),
                        test: c
                            .test
                            .as_ref()
                            .map(|t| Box::new(self.convert_expression(t))),
                        consequent: c
                            .cons
                            .iter()
                            .map(|s| self.convert_statement(s))
                            .collect(),
                    })
                    .collect(),
            }),
            swc::Stmt::Throw(s) => Statement::ThrowStatement(ThrowStatement {
                base: self.make_base_node(s.span),
                argument: Box::new(self.convert_expression(&s.arg)),
            }),
            swc::Stmt::Try(s) => Statement::TryStatement(TryStatement {
                base: self.make_base_node(s.span),
                block: self.convert_block_statement(&s.block),
                handler: s.handler.as_ref().map(|h| self.convert_catch_clause(h)),
                finalizer: s
                    .finalizer
                    .as_ref()
                    .map(|f| self.convert_block_statement(f)),
            }),
            swc::Stmt::While(s) => Statement::WhileStatement(WhileStatement {
                base: self.make_base_node(s.span),
                test: Box::new(self.convert_expression(&s.test)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            swc::Stmt::With(s) => Statement::WithStatement(WithStatement {
                base: self.make_base_node(s.span),
                object: Box::new(self.convert_expression(&s.obj)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            swc::Stmt::Decl(d) => self.convert_decl_to_statement(d),
        }
    }

    fn convert_decl_to_statement(&self, decl: &swc::Decl) -> Statement {
        match decl {
            swc::Decl::Var(v) => Statement::VariableDeclaration(self.convert_variable_declaration(v)),
            swc::Decl::Fn(f) => Statement::FunctionDeclaration(self.convert_fn_decl(f)),
            swc::Decl::Class(c) => Statement::ClassDeclaration(self.convert_class_decl(c)),
            swc::Decl::TsTypeAlias(d) => Statement::TSTypeAliasDeclaration(self.convert_ts_type_alias(d)),
            swc::Decl::TsInterface(d) => Statement::TSInterfaceDeclaration(self.convert_ts_interface(d)),
            swc::Decl::TsEnum(d) => Statement::TSEnumDeclaration(self.convert_ts_enum(d)),
            swc::Decl::TsModule(d) => Statement::TSModuleDeclaration(self.convert_ts_module(d)),
            swc::Decl::Using(u) => Statement::VariableDeclaration(self.convert_using_decl(u)),
        }
    }

    fn convert_block_statement(&self, block: &swc::BlockStmt) -> BlockStatement {
        let mut body: Vec<Statement> = Vec::new();
        let mut directives: Vec<Directive> = Vec::new();
        let mut past_directives = false;

        for stmt in &block.stmts {
            if !past_directives {
                if let Some(dir) = self.try_extract_block_directive(stmt) {
                    directives.push(dir);
                    continue;
                }
                past_directives = true;
            }
            body.push(self.convert_statement(stmt));
        }

        BlockStatement {
            base: self.make_base_node(block.span),
            body,
            directives,
        }
    }

    /// Try to extract a directive from a statement in a block body.
    /// Directives are expression statements whose expression is a string literal.
    fn try_extract_block_directive(&self, stmt: &swc::Stmt) -> Option<Directive> {
        if let swc::Stmt::Expr(expr_stmt) = stmt {
            if let swc::Expr::Lit(swc::Lit::Str(s)) = &*expr_stmt.expr {
                return Some(Directive {
                    base: self.make_base_node(expr_stmt.span),
                    value: DirectiveLiteral {
                        base: self.make_base_node(s.span),
                        value: wtf8_to_string(&s.value),
                    },
                });
            }
        }
        None
    }

    fn convert_catch_clause(&self, clause: &swc::CatchClause) -> CatchClause {
        CatchClause {
            base: self.make_base_node(clause.span),
            param: clause.param.as_ref().map(|p| self.convert_pat(p)),
            body: self.convert_block_statement(&clause.body),
        }
    }

    fn convert_var_decl_or_expr_to_for_init(&self, init: &swc::VarDeclOrExpr) -> ForInit {
        match init {
            swc::VarDeclOrExpr::VarDecl(v) => ForInit::VariableDeclaration(self.convert_variable_declaration(v)),
            swc::VarDeclOrExpr::Expr(e) => ForInit::Expression(Box::new(self.convert_expression(e))),
        }
    }

    fn convert_for_head(&self, head: &swc::ForHead) -> ForInOfLeft {
        match head {
            swc::ForHead::VarDecl(v) => ForInOfLeft::VariableDeclaration(self.convert_variable_declaration(v)),
            swc::ForHead::Pat(p) => ForInOfLeft::Pattern(Box::new(self.convert_pat(p))),
            swc::ForHead::UsingDecl(u) => ForInOfLeft::VariableDeclaration(self.convert_using_decl(u)),
        }
    }

    fn convert_variable_declaration(&self, decl: &swc::VarDecl) -> VariableDeclaration {
        VariableDeclaration {
            base: self.make_base_node(decl.span),
            declarations: decl.decls.iter().map(|d| self.convert_variable_declarator(d)).collect(),
            kind: match decl.kind {
                swc::VarDeclKind::Var => VariableDeclarationKind::Var,
                swc::VarDeclKind::Let => VariableDeclarationKind::Let,
                swc::VarDeclKind::Const => VariableDeclarationKind::Const,
            },
            declare: if decl.declare { Some(true) } else { None },
        }
    }

    fn convert_using_decl(&self, decl: &swc::UsingDecl) -> VariableDeclaration {
        VariableDeclaration {
            base: self.make_base_node(decl.span),
            declarations: decl.decls.iter().map(|d| self.convert_variable_declarator(d)).collect(),
            kind: VariableDeclarationKind::Using,
            declare: None,
        }
    }

    fn convert_variable_declarator(&self, d: &swc::VarDeclarator) -> VariableDeclarator {
        VariableDeclarator {
            base: self.make_base_node(d.span),
            id: self.convert_pat(&d.name),
            init: d.init.as_ref().map(|e| Box::new(self.convert_expression(e))),
            definite: if d.definite { Some(true) } else { None },
        }
    }

    // ===== Expressions =====

    fn convert_expression(&self, expr: &swc::Expr) -> Expression {
        match expr {
            swc::Expr::Lit(lit) => self.convert_lit(lit),
            swc::Expr::Ident(id) => Expression::Identifier(self.convert_ident_to_identifier(id)),
            swc::Expr::This(t) => Expression::ThisExpression(ThisExpression { base: self.make_base_node(t.span) }),
            swc::Expr::Array(arr) => Expression::ArrayExpression(self.convert_array_expression(arr)),
            swc::Expr::Object(obj) => Expression::ObjectExpression(self.convert_object_expression(obj)),
            swc::Expr::Fn(f) => Expression::FunctionExpression(self.convert_fn_expr(f)),
            swc::Expr::Unary(un) => Expression::UnaryExpression(UnaryExpression {
                base: self.make_base_node(un.span),
                operator: self.convert_unary_operator(un.op),
                prefix: true,
                argument: Box::new(self.convert_expression(&un.arg)),
            }),
            swc::Expr::Update(up) => Expression::UpdateExpression(UpdateExpression {
                base: self.make_base_node(up.span),
                operator: self.convert_update_operator(up.op),
                argument: Box::new(self.convert_expression(&up.arg)),
                prefix: up.prefix,
            }),
            swc::Expr::Bin(bin) => {
                if let Some(log_op) = self.try_convert_logical_operator(bin.op) {
                    Expression::LogicalExpression(LogicalExpression {
                        base: self.make_base_node(bin.span),
                        operator: log_op,
                        left: Box::new(self.convert_expression(&bin.left)),
                        right: Box::new(self.convert_expression(&bin.right)),
                    })
                } else {
                    Expression::BinaryExpression(BinaryExpression {
                        base: self.make_base_node(bin.span),
                        operator: self.convert_binary_operator(bin.op),
                        left: Box::new(self.convert_expression(&bin.left)),
                        right: Box::new(self.convert_expression(&bin.right)),
                    })
                }
            }
            swc::Expr::Assign(a) => Expression::AssignmentExpression(self.convert_assignment_expression(a)),
            swc::Expr::Member(m) => Expression::MemberExpression(self.convert_member_expression(m)),
            swc::Expr::SuperProp(sp) => {
                let (property, computed) = self.convert_super_prop(&sp.prop);
                Expression::MemberExpression(MemberExpression {
                    base: self.make_base_node(sp.span),
                    object: Box::new(Expression::Super(Super { base: self.make_base_node(sp.obj.span) })),
                    property: Box::new(property),
                    computed,
                })
            }
            swc::Expr::Cond(c) => Expression::ConditionalExpression(ConditionalExpression {
                base: self.make_base_node(c.span),
                test: Box::new(self.convert_expression(&c.test)),
                consequent: Box::new(self.convert_expression(&c.cons)),
                alternate: Box::new(self.convert_expression(&c.alt)),
            }),
            swc::Expr::Call(call) => Expression::CallExpression(self.convert_call_expression(call)),
            swc::Expr::New(n) => Expression::NewExpression(NewExpression {
                base: self.make_base_node(n.span),
                callee: Box::new(self.convert_expression(&n.callee)),
                arguments: n.args.as_ref().map_or_else(Vec::new, |args| args.iter().map(|a| self.convert_expr_or_spread(a)).collect()),
                type_parameters: None,
                type_arguments: None,
            }),
            swc::Expr::Seq(seq) => Expression::SequenceExpression(SequenceExpression {
                base: self.make_base_node(seq.span),
                expressions: seq.exprs.iter().map(|e| self.convert_expression(e)).collect(),
            }),
            swc::Expr::Arrow(arrow) => Expression::ArrowFunctionExpression(self.convert_arrow_function(arrow)),
            swc::Expr::Class(class) => Expression::ClassExpression(self.convert_class_expression(class)),
            swc::Expr::Yield(y) => Expression::YieldExpression(YieldExpression {
                base: self.make_base_node(y.span),
                argument: y.arg.as_ref().map(|a| Box::new(self.convert_expression(a))),
                delegate: y.delegate,
            }),
            swc::Expr::Await(a) => Expression::AwaitExpression(AwaitExpression {
                base: self.make_base_node(a.span),
                argument: Box::new(self.convert_expression(&a.arg)),
            }),
            swc::Expr::MetaProp(mp) => {
                let (meta_name, prop_name) = match mp.kind {
                    swc::MetaPropKind::NewTarget => ("new", "target"),
                    swc::MetaPropKind::ImportMeta => ("import", "meta"),
                };
                Expression::MetaProperty(MetaProperty {
                    base: self.make_base_node(mp.span),
                    meta: Identifier { base: self.make_base_node(mp.span), name: meta_name.to_string(), type_annotation: None, optional: None, decorators: None },
                    property: Identifier { base: self.make_base_node(mp.span), name: prop_name.to_string(), type_annotation: None, optional: None, decorators: None },
                })
            }
            swc::Expr::Tpl(tpl) => Expression::TemplateLiteral(self.convert_template_literal(tpl)),
            swc::Expr::TaggedTpl(tag) => Expression::TaggedTemplateExpression(TaggedTemplateExpression {
                base: self.make_base_node(tag.span),
                tag: Box::new(self.convert_expression(&tag.tag)),
                quasi: self.convert_template_literal(&tag.tpl),
                type_parameters: None,
            }),
            swc::Expr::Paren(p) => Expression::ParenthesizedExpression(ParenthesizedExpression {
                base: self.make_base_node(p.span),
                expression: Box::new(self.convert_expression(&p.expr)),
            }),
            swc::Expr::OptChain(chain) => self.convert_opt_chain_expression(chain),
            swc::Expr::PrivateName(p) => Expression::PrivateName(PrivateName {
                base: self.make_base_node(p.span),
                id: Identifier { base: self.make_base_node(p.span), name: p.name.to_string(), type_annotation: None, optional: None, decorators: None },
            }),
            swc::Expr::JSXElement(el) => Expression::JSXElement(Box::new(self.convert_jsx_element(el))),
            swc::Expr::JSXFragment(frag) => Expression::JSXFragment(self.convert_jsx_fragment(frag)),
            swc::Expr::JSXEmpty(e) => Expression::Identifier(Identifier { base: self.make_base_node(e.span), name: "undefined".to_string(), type_annotation: None, optional: None, decorators: None }),
            swc::Expr::JSXMember(m) => Expression::Identifier(Identifier { base: self.make_base_node(m.prop.span), name: m.prop.sym.to_string(), type_annotation: None, optional: None, decorators: None }),
            swc::Expr::JSXNamespacedName(n) => Expression::Identifier(Identifier { base: self.make_base_node(n.name.span), name: format!("{}:{}", n.ns.sym, n.name.sym), type_annotation: None, optional: None, decorators: None }),
            swc::Expr::TsAs(e) => Expression::TSAsExpression(TSAsExpression { base: self.make_base_node(e.span), expression: Box::new(self.convert_expression(&e.expr)), type_annotation: Box::new(serde_json::Value::Null) }),
            swc::Expr::TsSatisfies(e) => Expression::TSSatisfiesExpression(TSSatisfiesExpression { base: self.make_base_node(e.span), expression: Box::new(self.convert_expression(&e.expr)), type_annotation: Box::new(serde_json::Value::Null) }),
            swc::Expr::TsTypeAssertion(e) => Expression::TSTypeAssertion(TSTypeAssertion { base: self.make_base_node(e.span), expression: Box::new(self.convert_expression(&e.expr)), type_annotation: Box::new(serde_json::Value::Null) }),
            swc::Expr::TsNonNull(e) => Expression::TSNonNullExpression(TSNonNullExpression { base: self.make_base_node(e.span), expression: Box::new(self.convert_expression(&e.expr)) }),
            swc::Expr::TsInstantiation(e) => Expression::TSInstantiationExpression(TSInstantiationExpression { base: self.make_base_node(e.span), expression: Box::new(self.convert_expression(&e.expr)), type_parameters: Box::new(serde_json::Value::Null) }),
            swc::Expr::TsConstAssertion(e) => {
                // "as const" → TSAsExpression with typeAnnotation: TSTypeReference { typeName: Identifier { name: "const" } }
                // This matches Babel's AST representation of `as const`.
                let type_ann = serde_json::json!({
                    "type": "TSTypeReference",
                    "typeName": {
                        "type": "Identifier",
                        "name": "const"
                    }
                });
                Expression::TSAsExpression(TSAsExpression {
                    base: self.make_base_node(e.span),
                    expression: Box::new(self.convert_expression(&e.expr)),
                    type_annotation: Box::new(type_ann),
                })
            }
            swc::Expr::Invalid(i) => Expression::Identifier(Identifier { base: self.make_base_node(i.span), name: "__invalid__".to_string(), type_annotation: None, optional: None, decorators: None }),
        }
    }

    fn convert_lit(&self, lit: &swc::Lit) -> Expression {
        match lit {
            swc::Lit::Str(s) => Expression::StringLiteral(StringLiteral { base: self.make_base_node(s.span), value: wtf8_to_string(&s.value) }),
            swc::Lit::Bool(b) => Expression::BooleanLiteral(BooleanLiteral { base: self.make_base_node(b.span), value: b.value }),
            swc::Lit::Null(n) => Expression::NullLiteral(NullLiteral { base: self.make_base_node(n.span) }),
            swc::Lit::Num(n) => Expression::NumericLiteral(NumericLiteral { base: self.make_base_node(n.span), value: n.value }),
            swc::Lit::BigInt(b) => Expression::BigIntLiteral(BigIntLiteral { base: self.make_base_node(b.span), value: b.value.to_string() }),
            swc::Lit::Regex(r) => Expression::RegExpLiteral(RegExpLiteral { base: self.make_base_node(r.span), pattern: r.exp.to_string(), flags: r.flags.to_string() }),
            swc::Lit::JSXText(t) => Expression::StringLiteral(StringLiteral { base: self.make_base_node(t.span), value: t.value.to_string() }),
        }
    }

    // ===== Optional chaining =====

    fn convert_opt_chain_expression(&self, chain: &swc::OptChainExpr) -> Expression {
        match &*chain.base {
            swc::OptChainBase::Member(m) => {
                let (property, computed) = self.convert_member_prop(&m.prop);
                Expression::OptionalMemberExpression(OptionalMemberExpression {
                    base: self.make_base_node(chain.span),
                    object: Box::new(self.convert_opt_chain_callee(&m.obj)),
                    property: Box::new(property),
                    computed,
                    optional: chain.optional,
                })
            }
            swc::OptChainBase::Call(call) => Expression::OptionalCallExpression(OptionalCallExpression {
                base: self.make_base_node(chain.span),
                callee: Box::new(self.convert_opt_chain_callee(&call.callee)),
                arguments: call.args.iter().map(|a| self.convert_expr_or_spread(a)).collect(),
                optional: chain.optional,
                type_parameters: None,
                type_arguments: None,
            }),
        }
    }

    fn convert_opt_chain_callee(&self, expr: &swc::Expr) -> Expression {
        if let swc::Expr::OptChain(chain) = expr {
            return self.convert_opt_chain_expression(chain);
        }
        self.convert_expression(expr)
    }

    // ===== Member expression =====

    fn convert_member_expression(&self, m: &swc::MemberExpr) -> MemberExpression {
        let (property, computed) = self.convert_member_prop(&m.prop);
        MemberExpression {
            base: self.make_base_node(m.span),
            object: Box::new(self.convert_expression(&m.obj)),
            property: Box::new(property),
            computed,
        }
    }

    fn convert_member_prop(&self, prop: &swc::MemberProp) -> (Expression, bool) {
        match prop {
            swc::MemberProp::Ident(id) => (Expression::Identifier(Identifier { base: self.make_base_node(id.span), name: id.sym.to_string(), type_annotation: None, optional: None, decorators: None }), false),
            swc::MemberProp::Computed(c) => (self.convert_expression(&c.expr), true),
            swc::MemberProp::PrivateName(p) => (Expression::PrivateName(PrivateName { base: self.make_base_node(p.span), id: Identifier { base: self.make_base_node(p.span), name: p.name.to_string(), type_annotation: None, optional: None, decorators: None } }), false),
        }
    }

    fn convert_super_prop(&self, prop: &swc::SuperProp) -> (Expression, bool) {
        match prop {
            swc::SuperProp::Ident(id) => (Expression::Identifier(Identifier { base: self.make_base_node(id.span), name: id.sym.to_string(), type_annotation: None, optional: None, decorators: None }), false),
            swc::SuperProp::Computed(c) => (self.convert_expression(&c.expr), true),
        }
    }

    // ===== Call expression =====

    fn convert_call_expression(&self, call: &swc::CallExpr) -> CallExpression {
        CallExpression {
            base: self.make_base_node(call.span),
            callee: Box::new(self.convert_callee(&call.callee)),
            arguments: call.args.iter().map(|a| self.convert_expr_or_spread(a)).collect(),
            type_parameters: None,
            type_arguments: None,
            optional: None,
        }
    }

    fn convert_callee(&self, callee: &swc::Callee) -> Expression {
        match callee {
            swc::Callee::Expr(e) => self.convert_expression(e),
            swc::Callee::Super(s) => Expression::Super(Super { base: self.make_base_node(s.span) }),
            swc::Callee::Import(i) => Expression::Import(Import { base: self.make_base_node(i.span) }),
        }
    }

    fn convert_expr_or_spread(&self, arg: &swc::ExprOrSpread) -> Expression {
        if let Some(spread_span) = arg.spread {
            Expression::SpreadElement(SpreadElement {
                base: self.make_base_node(Span::new(spread_span.lo, arg.expr.span().hi)),
                argument: Box::new(self.convert_expression(&arg.expr)),
            })
        } else {
            self.convert_expression(&arg.expr)
        }
    }

    // ===== Function helpers =====

    fn convert_fn_decl(&self, func: &swc::FnDecl) -> FunctionDeclaration {
        let f = &func.function;
        let body = f.body.as_ref().map(|b| self.convert_block_statement(b)).unwrap_or_else(|| BlockStatement { base: self.make_base_node(f.span), body: vec![], directives: vec![] });
        FunctionDeclaration {
            base: self.make_base_node(f.span),
            id: Some(self.convert_ident_to_identifier(&func.ident)),
            params: self.convert_params(&f.params),
            body,
            generator: f.is_generator,
            is_async: f.is_async,
            declare: if func.declare { Some(true) } else { None },
            return_type: f.return_type.as_ref().map(|_| Box::new(serde_json::Value::Null)),
            type_parameters: f.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)),
            predicate: None,
            component_declaration: false,
            hook_declaration: false,
        }
    }

    fn convert_fn_expr(&self, func: &swc::FnExpr) -> FunctionExpression {
        let f = &func.function;
        let body = f.body.as_ref().map(|b| self.convert_block_statement(b)).unwrap_or_else(|| BlockStatement { base: self.make_base_node(f.span), body: vec![], directives: vec![] });
        FunctionExpression {
            base: self.make_base_node(f.span),
            id: func.ident.as_ref().map(|id| self.convert_ident_to_identifier(id)),
            params: self.convert_params(&f.params),
            body,
            generator: f.is_generator,
            is_async: f.is_async,
            return_type: f.return_type.as_ref().map(|_| Box::new(serde_json::Value::Null)),
            type_parameters: f.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)),
        }
    }

    fn convert_arrow_function(&self, arrow: &swc::ArrowExpr) -> ArrowFunctionExpression {
        let is_expression = matches!(&*arrow.body, swc::BlockStmtOrExpr::Expr(_));
        let body = match &*arrow.body {
            swc::BlockStmtOrExpr::BlockStmt(block) => ArrowFunctionBody::BlockStatement(self.convert_block_statement(block)),
            swc::BlockStmtOrExpr::Expr(expr) => ArrowFunctionBody::Expression(Box::new(self.convert_expression(expr))),
        };
        ArrowFunctionExpression {
            base: self.make_base_node(arrow.span),
            params: arrow.params.iter().map(|p| self.convert_pat(p)).collect(),
            body: Box::new(body),
            id: None,
            generator: arrow.is_generator,
            is_async: arrow.is_async,
            expression: Some(is_expression),
            return_type: arrow.return_type.as_ref().map(|_| Box::new(serde_json::Value::Null)),
            type_parameters: arrow.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)),
            predicate: None,
        }
    }

    fn convert_params(&self, params: &[swc::Param]) -> Vec<PatternLike> {
        params.iter().map(|p| self.convert_pat(&p.pat)).collect()
    }

    // ===== Patterns =====

    fn convert_pat(&self, pat: &swc::Pat) -> PatternLike {
        match pat {
            swc::Pat::Ident(id) => PatternLike::Identifier(self.convert_binding_ident(id)),
            swc::Pat::Array(arr) => PatternLike::ArrayPattern(self.convert_array_pattern(arr)),
            swc::Pat::Object(obj) => PatternLike::ObjectPattern(self.convert_object_pattern(obj)),
            swc::Pat::Assign(a) => PatternLike::AssignmentPattern(AssignmentPattern { base: self.make_base_node(a.span), left: Box::new(self.convert_pat(&a.left)), right: Box::new(self.convert_expression(&a.right)), type_annotation: None, decorators: None }),
            swc::Pat::Rest(r) => PatternLike::RestElement(RestElement { base: self.make_base_node(r.span), argument: Box::new(self.convert_pat(&r.arg)), type_annotation: None, decorators: None }),
            swc::Pat::Expr(e) => self.convert_expression_to_pattern(e),
            swc::Pat::Invalid(i) => PatternLike::Identifier(Identifier { base: self.make_base_node(i.span), name: "__invalid__".to_string(), type_annotation: None, optional: None, decorators: None }),
        }
    }

    fn convert_expression_to_pattern(&self, expr: &swc::Expr) -> PatternLike {
        match expr {
            swc::Expr::Ident(id) => PatternLike::Identifier(self.convert_ident_to_identifier(id)),
            swc::Expr::Member(m) => PatternLike::MemberExpression(self.convert_member_expression(m)),
            _ => PatternLike::Identifier(Identifier { base: self.make_base_node(expr.span()), name: "__unknown_target__".to_string(), type_annotation: None, optional: None, decorators: None }),
        }
    }

    fn convert_object_pattern(&self, obj: &swc::ObjectPat) -> ObjectPattern {
        let properties = obj.props.iter().map(|p| match p {
            swc::ObjectPatProp::KeyValue(kv) => ObjectPatternProperty::ObjectProperty(ObjectPatternProp {
                base: self.make_base_node(kv.span()),
                key: Box::new(self.convert_prop_name(&kv.key)),
                value: Box::new(self.convert_pat(&kv.value)),
                computed: matches!(kv.key, swc::PropName::Computed(_)),
                shorthand: false,
                decorators: None,
                method: None,
            }),
            swc::ObjectPatProp::Assign(a) => {
                let id = self.convert_ident_to_identifier(&a.key.id);
                let (value, shorthand) = if let Some(ref init) = a.value {
                    (Box::new(PatternLike::AssignmentPattern(AssignmentPattern { base: self.make_base_node(a.span), left: Box::new(PatternLike::Identifier(id.clone())), right: Box::new(self.convert_expression(init)), type_annotation: None, decorators: None })), true)
                } else {
                    (Box::new(PatternLike::Identifier(id.clone())), true)
                };
                ObjectPatternProperty::ObjectProperty(ObjectPatternProp { base: self.make_base_node(a.span), key: Box::new(Expression::Identifier(id)), value, computed: false, shorthand, decorators: None, method: None })
            }
            swc::ObjectPatProp::Rest(r) => ObjectPatternProperty::RestElement(RestElement { base: self.make_base_node(r.span), argument: Box::new(self.convert_pat(&r.arg)), type_annotation: None, decorators: None }),
        }).collect();
        ObjectPattern { base: self.make_base_node(obj.span), properties, type_annotation: obj.type_ann.as_ref().map(|_| Box::new(serde_json::Value::Null)), decorators: None }
    }

    fn convert_array_pattern(&self, arr: &swc::ArrayPat) -> ArrayPattern {
        ArrayPattern {
            base: self.make_base_node(arr.span),
            elements: arr.elems.iter().map(|e| e.as_ref().map(|p| self.convert_pat(p))).collect(),
            type_annotation: arr.type_ann.as_ref().map(|_| Box::new(serde_json::Value::Null)),
            decorators: None,
        }
    }

    // ===== AssignmentTarget =====

    fn convert_assign_target(&self, target: &swc::AssignTarget) -> PatternLike {
        match target {
            swc::AssignTarget::Simple(s) => self.convert_simple_assign_target(s),
            swc::AssignTarget::Pat(p) => self.convert_assign_target_pat(p),
        }
    }

    fn convert_simple_assign_target(&self, target: &swc::SimpleAssignTarget) -> PatternLike {
        match target {
            swc::SimpleAssignTarget::Ident(id) => PatternLike::Identifier(self.convert_binding_ident(id)),
            swc::SimpleAssignTarget::Member(m) => PatternLike::MemberExpression(self.convert_member_expression(m)),
            swc::SimpleAssignTarget::SuperProp(sp) => {
                let (property, computed) = self.convert_super_prop(&sp.prop);
                PatternLike::MemberExpression(MemberExpression { base: self.make_base_node(sp.span), object: Box::new(Expression::Super(Super { base: self.make_base_node(sp.obj.span) })), property: Box::new(property), computed })
            }
            swc::SimpleAssignTarget::Paren(p) => self.convert_expression_to_pattern(&p.expr),
            swc::SimpleAssignTarget::OptChain(o) => PatternLike::Identifier(Identifier { base: self.make_base_node(o.span), name: "__unknown_target__".to_string(), type_annotation: None, optional: None, decorators: None }),
            swc::SimpleAssignTarget::TsAs(e) => self.convert_expression_to_pattern(&e.expr),
            swc::SimpleAssignTarget::TsSatisfies(e) => self.convert_expression_to_pattern(&e.expr),
            swc::SimpleAssignTarget::TsNonNull(e) => self.convert_expression_to_pattern(&e.expr),
            swc::SimpleAssignTarget::TsTypeAssertion(e) => self.convert_expression_to_pattern(&e.expr),
            swc::SimpleAssignTarget::TsInstantiation(e) => self.convert_expression_to_pattern(&e.expr),
            swc::SimpleAssignTarget::Invalid(i) => PatternLike::Identifier(Identifier { base: self.make_base_node(i.span), name: "__invalid__".to_string(), type_annotation: None, optional: None, decorators: None }),
        }
    }

    fn convert_assign_target_pat(&self, target: &swc::AssignTargetPat) -> PatternLike {
        match target {
            swc::AssignTargetPat::Array(a) => PatternLike::ArrayPattern(self.convert_array_pattern(a)),
            swc::AssignTargetPat::Object(o) => PatternLike::ObjectPattern(self.convert_object_pattern(o)),
            swc::AssignTargetPat::Invalid(i) => PatternLike::Identifier(Identifier { base: self.make_base_node(i.span), name: "__invalid__".to_string(), type_annotation: None, optional: None, decorators: None }),
        }
    }

    fn convert_assignment_expression(&self, assign: &swc::AssignExpr) -> AssignmentExpression {
        AssignmentExpression {
            base: self.make_base_node(assign.span),
            operator: self.convert_assignment_operator(assign.op),
            left: Box::new(self.convert_assign_target(&assign.left)),
            right: Box::new(self.convert_expression(&assign.right)),
        }
    }

    // ===== Object expression =====

    fn convert_object_expression(&self, obj: &swc::ObjectLit) -> ObjectExpression {
        ObjectExpression {
            base: self.make_base_node(obj.span),
            properties: obj.props.iter().map(|p| self.convert_prop_or_spread(p)).collect(),
        }
    }

    fn convert_prop_or_spread(&self, prop: &swc::PropOrSpread) -> ObjectExpressionProperty {
        match prop {
            swc::PropOrSpread::Spread(s) => ObjectExpressionProperty::SpreadElement(SpreadElement { base: self.make_base_node(s.span()), argument: Box::new(self.convert_expression(&s.expr)) }),
            swc::PropOrSpread::Prop(p) => self.convert_prop(p),
        }
    }

    fn convert_prop(&self, prop: &swc::Prop) -> ObjectExpressionProperty {
        match prop {
            swc::Prop::Shorthand(id) => {
                let ident = self.convert_ident_to_identifier(id);
                ObjectExpressionProperty::ObjectProperty(ObjectProperty { base: self.make_base_node(id.span), key: Box::new(Expression::Identifier(ident.clone())), value: Box::new(Expression::Identifier(ident)), computed: false, shorthand: true, decorators: None, method: Some(false) })
            }
            swc::Prop::KeyValue(kv) => ObjectExpressionProperty::ObjectProperty(ObjectProperty { base: self.make_base_node(kv.span()), key: Box::new(self.convert_prop_name(&kv.key)), value: Box::new(self.convert_expression(&kv.value)), computed: matches!(kv.key, swc::PropName::Computed(_)), shorthand: false, decorators: None, method: Some(false) }),
            swc::Prop::Getter(g) => ObjectExpressionProperty::ObjectMethod(ObjectMethod {
                base: self.make_base_node(g.span), method: false, kind: ObjectMethodKind::Get, key: Box::new(self.convert_prop_name(&g.key)),
                params: vec![],
                body: g.body.as_ref().map(|b| self.convert_block_statement(b)).unwrap_or_else(|| BlockStatement { base: self.make_base_node(g.span), body: vec![], directives: vec![] }),
                computed: matches!(g.key, swc::PropName::Computed(_)), id: None, generator: false, is_async: false, decorators: None,
                return_type: g.type_ann.as_ref().map(|_| Box::new(serde_json::Value::Null)), type_parameters: None,
            }),
            swc::Prop::Setter(s) => ObjectExpressionProperty::ObjectMethod(ObjectMethod {
                base: self.make_base_node(s.span), method: false, kind: ObjectMethodKind::Set, key: Box::new(self.convert_prop_name(&s.key)),
                params: vec![self.convert_pat(&s.param)],
                body: s.body.as_ref().map(|b| self.convert_block_statement(b)).unwrap_or_else(|| BlockStatement { base: self.make_base_node(s.span), body: vec![], directives: vec![] }),
                computed: matches!(s.key, swc::PropName::Computed(_)), id: None, generator: false, is_async: false, decorators: None, return_type: None, type_parameters: None,
            }),
            swc::Prop::Method(m) => ObjectExpressionProperty::ObjectMethod(ObjectMethod {
                base: self.make_base_node(m.span()), method: true, kind: ObjectMethodKind::Method, key: Box::new(self.convert_prop_name(&m.key)),
                params: self.convert_params(&m.function.params),
                body: m.function.body.as_ref().map(|b| self.convert_block_statement(b)).unwrap_or_else(|| BlockStatement { base: self.make_base_node(m.function.span), body: vec![], directives: vec![] }),
                computed: matches!(m.key, swc::PropName::Computed(_)), id: None, generator: m.function.is_generator, is_async: m.function.is_async, decorators: None,
                return_type: m.function.return_type.as_ref().map(|_| Box::new(serde_json::Value::Null)),
                type_parameters: m.function.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)),
            }),
            swc::Prop::Assign(a) => {
                let ident = self.convert_ident_to_identifier(&a.key);
                ObjectExpressionProperty::ObjectProperty(ObjectProperty {
                    base: self.make_base_node(a.span), key: Box::new(Expression::Identifier(ident.clone())),
                    value: Box::new(Expression::AssignmentExpression(AssignmentExpression { base: self.make_base_node(a.span), operator: AssignmentOperator::Assign, left: Box::new(PatternLike::Identifier(ident)), right: Box::new(self.convert_expression(&a.value)) })),
                    computed: false, shorthand: true, decorators: None, method: Some(false),
                })
            }
        }
    }

    fn convert_array_expression(&self, arr: &swc::ArrayLit) -> ArrayExpression {
        ArrayExpression { base: self.make_base_node(arr.span), elements: arr.elems.iter().map(|e| e.as_ref().map(|elem| self.convert_expr_or_spread(elem))).collect() }
    }

    fn convert_template_literal(&self, tpl: &swc::Tpl) -> TemplateLiteral {
        TemplateLiteral {
            base: self.make_base_node(tpl.span),
            quasis: tpl.quasis.iter().map(|q| TemplateElement { base: self.make_base_node(q.span), value: TemplateElementValue { raw: q.raw.to_string(), cooked: q.cooked.as_ref().map(|c| wtf8_to_string(c)) }, tail: q.tail }).collect(),
            expressions: tpl.exprs.iter().map(|e| self.convert_expression(e)).collect(),
        }
    }

    // ===== Class =====

    fn convert_class_decl(&self, class: &swc::ClassDecl) -> ClassDeclaration {
        let c = &class.class;
        ClassDeclaration {
            base: self.make_base_node(c.span), id: Some(self.convert_ident_to_identifier(&class.ident)),
            super_class: c.super_class.as_ref().map(|s| Box::new(self.convert_expression(s))),
            body: ClassBody { base: self.make_base_node(c.span), body: vec![] },
            decorators: None, is_abstract: if c.is_abstract { Some(true) } else { None },
            declare: if class.declare { Some(true) } else { None }, implements: None, super_type_parameters: None,
            type_parameters: c.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)), mixins: None,
        }
    }

    fn convert_class_expression(&self, class: &swc::ClassExpr) -> ClassExpression {
        let c = &class.class;
        ClassExpression {
            base: self.make_base_node(c.span), id: class.ident.as_ref().map(|id| self.convert_ident_to_identifier(id)),
            super_class: c.super_class.as_ref().map(|s| Box::new(self.convert_expression(s))),
            body: ClassBody { base: self.make_base_node(c.span), body: vec![] },
            decorators: None, implements: None, super_type_parameters: None,
            type_parameters: c.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)),
        }
    }

    // ===== JSX =====

    fn convert_jsx_element(&self, el: &swc::JSXElement) -> JSXElement {
        let self_closing = el.closing.is_none();
        JSXElement {
            base: self.make_base_node(el.span),
            opening_element: self.convert_jsx_opening_element(&el.opening, self_closing),
            closing_element: el.closing.as_ref().map(|c| self.convert_jsx_closing_element(c)),
            children: el.children.iter().map(|c| self.convert_jsx_child(c)).collect(),
            self_closing: Some(self_closing),
        }
    }

    fn convert_jsx_opening_element(&self, el: &swc::JSXOpeningElement, self_closing: bool) -> JSXOpeningElement {
        JSXOpeningElement {
            base: self.make_base_node(el.span),
            name: self.convert_jsx_element_name(&el.name),
            attributes: el.attrs.iter().map(|a| self.convert_jsx_attr_or_spread(a)).collect(),
            self_closing,
            type_parameters: el.type_args.as_ref().map(|_| Box::new(serde_json::Value::Null)),
        }
    }

    fn convert_jsx_closing_element(&self, el: &swc::JSXClosingElement) -> JSXClosingElement {
        JSXClosingElement { base: self.make_base_node(el.span), name: self.convert_jsx_element_name(&el.name) }
    }

    fn convert_jsx_element_name(&self, name: &swc::JSXElementName) -> JSXElementName {
        match name {
            swc::JSXElementName::Ident(id) => JSXElementName::JSXIdentifier(JSXIdentifier { base: self.make_base_node(id.span), name: id.sym.to_string() }),
            swc::JSXElementName::JSXMemberExpr(m) => JSXElementName::JSXMemberExpression(self.convert_jsx_member_expression(m)),
            swc::JSXElementName::JSXNamespacedName(ns) => JSXElementName::JSXNamespacedName(JSXNamespacedName {
                base: self.make_base_node(ns.span()),
                namespace: JSXIdentifier { base: self.make_base_node(ns.ns.span), name: ns.ns.sym.to_string() },
                name: JSXIdentifier { base: self.make_base_node(ns.name.span), name: ns.name.sym.to_string() },
            }),
        }
    }

    fn convert_jsx_member_expression(&self, m: &swc::JSXMemberExpr) -> JSXMemberExpression {
        JSXMemberExpression {
            base: self.make_base_node(m.span()),
            object: Box::new(self.convert_jsx_object(&m.obj)),
            property: JSXIdentifier { base: self.make_base_node(m.prop.span), name: m.prop.sym.to_string() },
        }
    }

    fn convert_jsx_object(&self, obj: &swc::JSXObject) -> JSXMemberExprObject {
        match obj {
            swc::JSXObject::Ident(id) => JSXMemberExprObject::JSXIdentifier(JSXIdentifier { base: self.make_base_node(id.span), name: id.sym.to_string() }),
            swc::JSXObject::JSXMemberExpr(m) => JSXMemberExprObject::JSXMemberExpression(Box::new(self.convert_jsx_member_expression(m))),
        }
    }

    fn convert_jsx_attr_or_spread(&self, attr: &swc::JSXAttrOrSpread) -> JSXAttributeItem {
        match attr {
            swc::JSXAttrOrSpread::JSXAttr(a) => JSXAttributeItem::JSXAttribute(self.convert_jsx_attribute(a)),
            swc::JSXAttrOrSpread::SpreadElement(s) => JSXAttributeItem::JSXSpreadAttribute(JSXSpreadAttribute { base: self.make_base_node(s.span()), argument: Box::new(self.convert_expression(&s.expr)) }),
        }
    }

    fn convert_jsx_attribute(&self, attr: &swc::JSXAttr) -> JSXAttribute {
        JSXAttribute {
            base: self.make_base_node(attr.span),
            name: self.convert_jsx_attr_name(&attr.name),
            value: attr.value.as_ref().map(|v| self.convert_jsx_attr_value(v)),
        }
    }

    fn convert_jsx_attr_name(&self, name: &swc::JSXAttrName) -> JSXAttributeName {
        match name {
            swc::JSXAttrName::Ident(id) => JSXAttributeName::JSXIdentifier(JSXIdentifier { base: self.make_base_node(id.span), name: id.sym.to_string() }),
            swc::JSXAttrName::JSXNamespacedName(ns) => JSXAttributeName::JSXNamespacedName(JSXNamespacedName {
                base: self.make_base_node(ns.span()),
                namespace: JSXIdentifier { base: self.make_base_node(ns.ns.span), name: ns.ns.sym.to_string() },
                name: JSXIdentifier { base: self.make_base_node(ns.name.span), name: ns.name.sym.to_string() },
            }),
        }
    }

    fn convert_jsx_attr_value(&self, value: &swc::JSXAttrValue) -> JSXAttributeValue {
        match value {
            swc::JSXAttrValue::Str(s) => JSXAttributeValue::StringLiteral(StringLiteral { base: self.make_base_node(s.span), value: wtf8_to_string(&s.value) }),
            swc::JSXAttrValue::JSXExprContainer(ec) => JSXAttributeValue::JSXExpressionContainer(self.convert_jsx_expr_container(ec)),
            swc::JSXAttrValue::JSXElement(el) => JSXAttributeValue::JSXElement(Box::new(self.convert_jsx_element(el))),
            swc::JSXAttrValue::JSXFragment(frag) => JSXAttributeValue::JSXFragment(self.convert_jsx_fragment(frag)),
        }
    }

    fn convert_jsx_expr_container(&self, ec: &swc::JSXExprContainer) -> JSXExpressionContainer {
        JSXExpressionContainer {
            base: self.make_base_node(ec.span),
            expression: match &ec.expr {
                swc::JSXExpr::JSXEmptyExpr(e) => JSXExpressionContainerExpr::JSXEmptyExpression(JSXEmptyExpression { base: self.make_base_node(e.span) }),
                swc::JSXExpr::Expr(e) => JSXExpressionContainerExpr::Expression(Box::new(self.convert_expression(e))),
            },
        }
    }

    fn convert_jsx_child(&self, child: &swc::JSXElementChild) -> JSXChild {
        match child {
            swc::JSXElementChild::JSXText(t) => JSXChild::JSXText(JSXText { base: self.make_base_node(t.span), value: t.value.to_string() }),
            swc::JSXElementChild::JSXExprContainer(ec) => JSXChild::JSXExpressionContainer(self.convert_jsx_expr_container(ec)),
            swc::JSXElementChild::JSXSpreadChild(s) => JSXChild::JSXSpreadChild(JSXSpreadChild { base: self.make_base_node(s.span), expression: Box::new(self.convert_expression(&s.expr)) }),
            swc::JSXElementChild::JSXElement(el) => JSXChild::JSXElement(Box::new(self.convert_jsx_element(el))),
            swc::JSXElementChild::JSXFragment(frag) => JSXChild::JSXFragment(self.convert_jsx_fragment(frag)),
        }
    }

    fn convert_jsx_fragment(&self, frag: &swc::JSXFragment) -> JSXFragment {
        JSXFragment {
            base: self.make_base_node(frag.span),
            opening_fragment: JSXOpeningFragment { base: self.make_base_node(frag.opening.span) },
            closing_fragment: JSXClosingFragment { base: self.make_base_node(frag.closing.span) },
            children: frag.children.iter().map(|c| self.convert_jsx_child(c)).collect(),
        }
    }

    // ===== Import/Export =====

    fn convert_import_declaration(&self, decl: &swc::ImportDecl) -> ImportDeclaration {
        ImportDeclaration {
            base: self.make_base_node(decl.span),
            specifiers: decl.specifiers.iter().map(|s| self.convert_import_specifier(s)).collect(),
            source: StringLiteral { base: self.make_base_node(decl.src.span), value: wtf8_to_string(&decl.src.value) },
            import_kind: if decl.type_only { Some(ImportKind::Type) } else { Some(ImportKind::Value) },
            assertions: None,
            attributes: decl.with.as_ref().map(|with| self.convert_object_lit_to_import_attributes(with)),
        }
    }

    fn convert_object_lit_to_import_attributes(&self, obj: &swc::ObjectLit) -> Vec<ImportAttribute> {
        obj.props.iter().filter_map(|prop| {
            if let swc::PropOrSpread::Prop(p) = prop {
                if let swc::Prop::KeyValue(kv) = &**p {
                    let (key_name, key_span) = match &kv.key {
                        swc::PropName::Ident(id) => (id.sym.to_string(), id.span),
                        swc::PropName::Str(s) => (wtf8_to_string(&s.value), s.span),
                        swc::PropName::Num(n) => (n.value.to_string(), n.span),
                        _ => return None,
                    };
                    if let swc::Expr::Lit(swc::Lit::Str(s)) = &*kv.value {
                        return Some(ImportAttribute {
                            base: self.make_base_node(kv.span()),
                            key: Identifier { base: self.make_base_node(key_span), name: key_name, type_annotation: None, optional: None, decorators: None },
                            value: StringLiteral { base: self.make_base_node(s.span), value: wtf8_to_string(&s.value) },
                        });
                    }
                }
            }
            None
        }).collect()
    }

    fn convert_import_specifier(&self, spec: &swc::ImportSpecifier) -> ImportSpecifier {
        match spec {
            swc::ImportSpecifier::Named(s) => {
                let local = self.convert_ident_to_identifier(&s.local);
                let imported = s.imported.as_ref().map(|i| match i {
                    swc::ModuleExportName::Ident(id) => ModuleExportName::Identifier(self.convert_ident_to_identifier(id)),
                    swc::ModuleExportName::Str(s) => ModuleExportName::StringLiteral(StringLiteral { base: self.make_base_node(s.span), value: wtf8_to_string(&s.value) }),
                }).unwrap_or_else(|| ModuleExportName::Identifier(local.clone()));
                ImportSpecifier::ImportSpecifier(ImportSpecifierData { base: self.make_base_node(s.span), local, imported, import_kind: if s.is_type_only { Some(ImportKind::Type) } else { Some(ImportKind::Value) } })
            }
            swc::ImportSpecifier::Default(s) => ImportSpecifier::ImportDefaultSpecifier(ImportDefaultSpecifierData { base: self.make_base_node(s.span), local: self.convert_ident_to_identifier(&s.local) }),
            swc::ImportSpecifier::Namespace(s) => ImportSpecifier::ImportNamespaceSpecifier(ImportNamespaceSpecifierData { base: self.make_base_node(s.span), local: self.convert_ident_to_identifier(&s.local) }),
        }
    }

    fn convert_export_decl(&self, decl: &swc::ExportDecl) -> ExportNamedDeclaration {
        ExportNamedDeclaration { base: self.make_base_node(decl.span), declaration: Some(Box::new(self.convert_decl_to_declaration(&decl.decl))), specifiers: vec![], source: None, export_kind: Some(ExportKind::Value), assertions: None, attributes: None }
    }

    fn convert_export_named(&self, decl: &swc::NamedExport) -> ExportNamedDeclaration {
        ExportNamedDeclaration {
            base: self.make_base_node(decl.span), declaration: None,
            specifiers: decl.specifiers.iter().map(|s| self.convert_export_specifier(s)).collect(),
            source: decl.src.as_ref().map(|s| StringLiteral { base: self.make_base_node(s.span), value: wtf8_to_string(&s.value) }),
            export_kind: if decl.type_only { Some(ExportKind::Type) } else { Some(ExportKind::Value) },
            assertions: None, attributes: decl.with.as_ref().map(|with| self.convert_object_lit_to_import_attributes(with)),
        }
    }

    fn convert_export_default_decl(&self, decl: &swc::ExportDefaultDecl) -> ExportDefaultDeclaration {
        let declaration = match &decl.decl {
            swc::DefaultDecl::Fn(f) => {
                let func = &f.function;
                let body = func.body.as_ref().map(|b| self.convert_block_statement(b)).unwrap_or_else(|| BlockStatement { base: self.make_base_node(func.span), body: vec![], directives: vec![] });
                ExportDefaultDecl::FunctionDeclaration(FunctionDeclaration { base: self.make_base_node(func.span), id: f.ident.as_ref().map(|id| self.convert_ident_to_identifier(id)), params: self.convert_params(&func.params), body, generator: func.is_generator, is_async: func.is_async, declare: None, return_type: func.return_type.as_ref().map(|_| Box::new(serde_json::Value::Null)), type_parameters: func.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)), predicate: None, component_declaration: false, hook_declaration: false })
            }
            swc::DefaultDecl::Class(c) => {
                let class = &c.class;
                ExportDefaultDecl::ClassDeclaration(ClassDeclaration { base: self.make_base_node(class.span), id: c.ident.as_ref().map(|id| self.convert_ident_to_identifier(id)), super_class: class.super_class.as_ref().map(|s| Box::new(self.convert_expression(s))), body: ClassBody { base: self.make_base_node(class.span), body: vec![] }, decorators: None, is_abstract: if class.is_abstract { Some(true) } else { None }, declare: None, implements: None, super_type_parameters: None, type_parameters: class.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)), mixins: None })
            }
            swc::DefaultDecl::TsInterfaceDecl(_) => ExportDefaultDecl::Expression(Box::new(Expression::NullLiteral(NullLiteral { base: self.make_base_node(decl.span) }))),
        };
        ExportDefaultDeclaration { base: self.make_base_node(decl.span), declaration: Box::new(declaration), export_kind: None }
    }

    fn convert_export_default_expr(&self, decl: &swc::ExportDefaultExpr) -> ExportDefaultDeclaration {
        ExportDefaultDeclaration { base: self.make_base_node(decl.span), declaration: Box::new(ExportDefaultDecl::Expression(Box::new(self.convert_expression(&decl.expr)))), export_kind: None }
    }

    fn convert_export_all(&self, decl: &swc::ExportAll) -> ExportAllDeclaration {
        ExportAllDeclaration {
            base: self.make_base_node(decl.span),
            source: StringLiteral { base: self.make_base_node(decl.src.span), value: wtf8_to_string(&decl.src.value) },
            export_kind: if decl.type_only { Some(ExportKind::Type) } else { Some(ExportKind::Value) },
            assertions: None, attributes: decl.with.as_ref().map(|with| self.convert_object_lit_to_import_attributes(with)),
        }
    }

    fn convert_decl_to_declaration(&self, decl: &swc::Decl) -> Declaration {
        match decl {
            swc::Decl::Var(v) => Declaration::VariableDeclaration(self.convert_variable_declaration(v)),
            swc::Decl::Fn(f) => Declaration::FunctionDeclaration(self.convert_fn_decl(f)),
            swc::Decl::Class(c) => Declaration::ClassDeclaration(self.convert_class_decl(c)),
            swc::Decl::TsTypeAlias(d) => Declaration::TSTypeAliasDeclaration(self.convert_ts_type_alias(d)),
            swc::Decl::TsInterface(d) => Declaration::TSInterfaceDeclaration(self.convert_ts_interface(d)),
            swc::Decl::TsEnum(d) => Declaration::TSEnumDeclaration(self.convert_ts_enum(d)),
            swc::Decl::TsModule(d) => Declaration::TSModuleDeclaration(self.convert_ts_module(d)),
            swc::Decl::Using(u) => Declaration::VariableDeclaration(self.convert_using_decl(u)),
        }
    }

    fn convert_export_specifier(&self, spec: &swc::ExportSpecifier) -> ExportSpecifier {
        match spec {
            swc::ExportSpecifier::Named(s) => {
                let local = self.convert_module_export_name(&s.orig);
                let exported = s.exported.as_ref().map(|e| self.convert_module_export_name(e)).unwrap_or_else(|| local.clone());
                ExportSpecifier::ExportSpecifier(ExportSpecifierData { base: self.make_base_node(s.span), local, exported, export_kind: if s.is_type_only { Some(ExportKind::Type) } else { Some(ExportKind::Value) } })
            }
            swc::ExportSpecifier::Default(s) => ExportSpecifier::ExportDefaultSpecifier(ExportDefaultSpecifierData { base: self.make_base_node(s.exported.span), exported: self.convert_ident_to_identifier(&s.exported) }),
            swc::ExportSpecifier::Namespace(s) => ExportSpecifier::ExportNamespaceSpecifier(ExportNamespaceSpecifierData { base: self.make_base_node(s.span), exported: self.convert_module_export_name(&s.name) }),
        }
    }

    fn convert_module_export_name(&self, name: &swc::ModuleExportName) -> ModuleExportName {
        match name {
            swc::ModuleExportName::Ident(id) => ModuleExportName::Identifier(self.convert_ident_to_identifier(id)),
            swc::ModuleExportName::Str(s) => ModuleExportName::StringLiteral(StringLiteral { base: self.make_base_node(s.span), value: wtf8_to_string(&s.value) }),
        }
    }

    // ===== TS declarations =====

    fn convert_ts_type_alias(&self, d: &swc::TsTypeAliasDecl) -> TSTypeAliasDeclaration {
        TSTypeAliasDeclaration { base: self.make_base_node(d.span), id: self.convert_ident_to_identifier(&d.id), type_annotation: Box::new(serde_json::Value::Null), type_parameters: d.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)), declare: if d.declare { Some(true) } else { None } }
    }

    fn convert_ts_interface(&self, d: &swc::TsInterfaceDecl) -> TSInterfaceDeclaration {
        TSInterfaceDeclaration { base: self.make_base_node(d.span), id: self.convert_ident_to_identifier(&d.id), body: Box::new(serde_json::Value::Null), type_parameters: d.type_params.as_ref().map(|_| Box::new(serde_json::Value::Null)), extends: if d.extends.is_empty() { None } else { Some(vec![]) }, declare: if d.declare { Some(true) } else { None } }
    }

    fn convert_ts_enum(&self, d: &swc::TsEnumDecl) -> TSEnumDeclaration {
        TSEnumDeclaration { base: self.make_base_node(d.span), id: self.convert_ident_to_identifier(&d.id), members: vec![], declare: if d.declare { Some(true) } else { None }, is_const: if d.is_const { Some(true) } else { None } }
    }

    fn convert_ts_module(&self, d: &swc::TsModuleDecl) -> TSModuleDeclaration {
        TSModuleDeclaration { base: self.make_base_node(d.span), id: Box::new(serde_json::Value::Null), body: Box::new(serde_json::Value::Null), declare: if d.declare { Some(true) } else { None }, global: if d.global { Some(true) } else { None } }
    }

    // ===== Identifiers =====

    fn convert_ident_to_identifier(&self, id: &swc::Ident) -> Identifier {
        Identifier { base: self.make_base_node(id.span), name: id.sym.to_string(), type_annotation: None, optional: if id.optional { Some(true) } else { None }, decorators: None }
    }

    fn convert_binding_ident(&self, id: &swc::BindingIdent) -> Identifier {
        Identifier { base: self.make_base_node(id.id.span), name: id.id.sym.to_string(), type_annotation: id.type_ann.as_ref().map(|_| Box::new(serde_json::Value::Null)), optional: if id.id.optional { Some(true) } else { None }, decorators: None }
    }

    fn convert_prop_name(&self, key: &swc::PropName) -> Expression {
        match key {
            swc::PropName::Ident(id) => Expression::Identifier(Identifier { base: self.make_base_node(id.span), name: id.sym.to_string(), type_annotation: None, optional: None, decorators: None }),
            swc::PropName::Str(s) => Expression::StringLiteral(StringLiteral { base: self.make_base_node(s.span), value: wtf8_to_string(&s.value) }),
            swc::PropName::Num(n) => Expression::NumericLiteral(NumericLiteral { base: self.make_base_node(n.span), value: n.value }),
            swc::PropName::Computed(c) => self.convert_expression(&c.expr),
            swc::PropName::BigInt(b) => Expression::BigIntLiteral(BigIntLiteral { base: self.make_base_node(b.span), value: b.value.to_string() }),
        }
    }

    // ===== Operators =====

    fn convert_binary_operator(&self, op: swc::BinaryOp) -> BinaryOperator {
        match op {
            swc::BinaryOp::EqEq => BinaryOperator::Eq, swc::BinaryOp::NotEq => BinaryOperator::Neq,
            swc::BinaryOp::EqEqEq => BinaryOperator::StrictEq, swc::BinaryOp::NotEqEq => BinaryOperator::StrictNeq,
            swc::BinaryOp::Lt => BinaryOperator::Lt, swc::BinaryOp::LtEq => BinaryOperator::Lte,
            swc::BinaryOp::Gt => BinaryOperator::Gt, swc::BinaryOp::GtEq => BinaryOperator::Gte,
            swc::BinaryOp::LShift => BinaryOperator::Shl, swc::BinaryOp::RShift => BinaryOperator::Shr, swc::BinaryOp::ZeroFillRShift => BinaryOperator::UShr,
            swc::BinaryOp::Add => BinaryOperator::Add, swc::BinaryOp::Sub => BinaryOperator::Sub,
            swc::BinaryOp::Mul => BinaryOperator::Mul, swc::BinaryOp::Div => BinaryOperator::Div,
            swc::BinaryOp::Mod => BinaryOperator::Rem, swc::BinaryOp::Exp => BinaryOperator::Exp,
            swc::BinaryOp::BitOr => BinaryOperator::BitOr, swc::BinaryOp::BitXor => BinaryOperator::BitXor, swc::BinaryOp::BitAnd => BinaryOperator::BitAnd,
            swc::BinaryOp::In => BinaryOperator::In, swc::BinaryOp::InstanceOf => BinaryOperator::Instanceof,
            swc::BinaryOp::LogicalOr | swc::BinaryOp::LogicalAnd | swc::BinaryOp::NullishCoalescing => BinaryOperator::Eq,
        }
    }

    fn try_convert_logical_operator(&self, op: swc::BinaryOp) -> Option<LogicalOperator> {
        match op {
            swc::BinaryOp::LogicalOr => Some(LogicalOperator::Or),
            swc::BinaryOp::LogicalAnd => Some(LogicalOperator::And),
            swc::BinaryOp::NullishCoalescing => Some(LogicalOperator::NullishCoalescing),
            _ => None,
        }
    }

    fn convert_unary_operator(&self, op: swc::UnaryOp) -> UnaryOperator {
        match op {
            swc::UnaryOp::Minus => UnaryOperator::Neg, swc::UnaryOp::Plus => UnaryOperator::Plus,
            swc::UnaryOp::Bang => UnaryOperator::Not, swc::UnaryOp::Tilde => UnaryOperator::BitNot,
            swc::UnaryOp::TypeOf => UnaryOperator::TypeOf, swc::UnaryOp::Void => UnaryOperator::Void, swc::UnaryOp::Delete => UnaryOperator::Delete,
        }
    }

    fn convert_update_operator(&self, op: swc::UpdateOp) -> UpdateOperator {
        match op { swc::UpdateOp::PlusPlus => UpdateOperator::Increment, swc::UpdateOp::MinusMinus => UpdateOperator::Decrement }
    }

    fn convert_assignment_operator(&self, op: swc::AssignOp) -> AssignmentOperator {
        match op {
            swc::AssignOp::Assign => AssignmentOperator::Assign,
            swc::AssignOp::AddAssign => AssignmentOperator::AddAssign, swc::AssignOp::SubAssign => AssignmentOperator::SubAssign,
            swc::AssignOp::MulAssign => AssignmentOperator::MulAssign, swc::AssignOp::DivAssign => AssignmentOperator::DivAssign,
            swc::AssignOp::ModAssign => AssignmentOperator::RemAssign, swc::AssignOp::ExpAssign => AssignmentOperator::ExpAssign,
            swc::AssignOp::LShiftAssign => AssignmentOperator::ShlAssign, swc::AssignOp::RShiftAssign => AssignmentOperator::ShrAssign,
            swc::AssignOp::ZeroFillRShiftAssign => AssignmentOperator::UShrAssign,
            swc::AssignOp::BitOrAssign => AssignmentOperator::BitOrAssign, swc::AssignOp::BitXorAssign => AssignmentOperator::BitXorAssign, swc::AssignOp::BitAndAssign => AssignmentOperator::BitAndAssign,
            swc::AssignOp::OrAssign => AssignmentOperator::OrAssign, swc::AssignOp::AndAssign => AssignmentOperator::AndAssign, swc::AssignOp::NullishAssign => AssignmentOperator::NullishAssign,
        }
    }
}
