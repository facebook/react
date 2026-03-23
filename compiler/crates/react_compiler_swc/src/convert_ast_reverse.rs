// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Reverse AST converter: react_compiler_ast (Babel format) → SWC AST.
//!
//! This is the inverse of `convert_ast.rs`. It takes a `react_compiler_ast::File`
//! (which represents the compiler's Babel-compatible output) and produces SWC AST
//! nodes suitable for code generation via `swc_codegen`.

use swc_atoms::{Atom, Wtf8Atom};
use swc_common::{BytePos, Span, SyntaxContext, DUMMY_SP};
use swc_ecma_ast::*;

use react_compiler_ast::{
    declarations::{
        ExportAllDeclaration, ExportDefaultDecl as BabelExportDefaultDecl,
        ExportDefaultDeclaration, ExportKind, ExportNamedDeclaration,
        ImportDeclaration, ImportKind,
    },
    expressions::{self as babel_expr, Expression as BabelExpr},

    operators::*,
    patterns::*,
    statements::{self as babel_stmt, Statement as BabelStmt},
};

/// Convert a `react_compiler_ast::File` into an SWC `Module`.
pub fn convert_program_to_swc(file: &react_compiler_ast::File) -> Module {
    let ctx = ReverseCtx;
    ctx.convert_program(&file.program)
}

struct ReverseCtx;

impl ReverseCtx {
    /// Convert a BaseNode's start/end to an SWC Span.
    fn span(&self, base: &react_compiler_ast::common::BaseNode) -> Span {
        match (base.start, base.end) {
            (Some(start), Some(end)) => Span::new(BytePos(start), BytePos(end)),
            _ => DUMMY_SP,
        }
    }

    fn atom(&self, s: &str) -> Atom {
        Atom::from(s)
    }

    fn wtf8(&self, s: &str) -> Wtf8Atom {
        Wtf8Atom::from(s)
    }

    fn ident(&self, name: &str, span: Span) -> Ident {
        Ident {
            sym: self.atom(name),
            span,
            ctxt: SyntaxContext::empty(),
            optional: false,
        }
    }

    fn ident_name(&self, name: &str, span: Span) -> IdentName {
        IdentName {
            sym: self.atom(name),
            span,
        }
    }

    fn binding_ident(&self, name: &str, span: Span) -> BindingIdent {
        BindingIdent {
            id: self.ident(name, span),
            type_ann: None,
        }
    }

    // ===== Program =====

    fn convert_program(&self, program: &react_compiler_ast::Program) -> Module {
        let body = program
            .body
            .iter()
            .map(|s| self.convert_statement_to_module_item(s))
            .collect();

        Module {
            span: DUMMY_SP,
            body,
            shebang: None,
        }
    }

    fn convert_statement_to_module_item(&self, stmt: &BabelStmt) -> ModuleItem {
        match stmt {
            BabelStmt::ImportDeclaration(d) => {
                ModuleItem::ModuleDecl(ModuleDecl::Import(self.convert_import_declaration(d)))
            }
            BabelStmt::ExportNamedDeclaration(d) => {
                self.convert_export_named_to_module_item(d)
            }
            BabelStmt::ExportDefaultDeclaration(d) => {
                self.convert_export_default_to_module_item(d)
            }
            BabelStmt::ExportAllDeclaration(d) => {
                ModuleItem::ModuleDecl(ModuleDecl::ExportAll(self.convert_export_all_declaration(d)))
            }
            _ => ModuleItem::Stmt(self.convert_statement(stmt)),
        }
    }

    // ===== Statements =====

    fn convert_statement(&self, stmt: &BabelStmt) -> Stmt {
        match stmt {
            BabelStmt::BlockStatement(s) => Stmt::Block(self.convert_block_statement(s)),
            BabelStmt::ReturnStatement(s) => Stmt::Return(ReturnStmt {
                span: self.span(&s.base),
                arg: s
                    .argument
                    .as_ref()
                    .map(|a| Box::new(self.convert_expression(a))),
            }),
            BabelStmt::ExpressionStatement(s) => Stmt::Expr(ExprStmt {
                span: self.span(&s.base),
                expr: Box::new(self.convert_expression(&s.expression)),
            }),
            BabelStmt::IfStatement(s) => Stmt::If(IfStmt {
                span: self.span(&s.base),
                test: Box::new(self.convert_expression(&s.test)),
                cons: Box::new(self.convert_statement(&s.consequent)),
                alt: s
                    .alternate
                    .as_ref()
                    .map(|a| Box::new(self.convert_statement(a))),
            }),
            BabelStmt::ForStatement(s) => {
                let init = s.init.as_ref().map(|i| self.convert_for_init(i));
                let test = s
                    .test
                    .as_ref()
                    .map(|t| Box::new(self.convert_expression(t)));
                let update = s
                    .update
                    .as_ref()
                    .map(|u| Box::new(self.convert_expression(u)));
                let body = Box::new(self.convert_statement(&s.body));
                Stmt::For(ForStmt {
                    span: self.span(&s.base),
                    init,
                    test,
                    update,
                    body,
                })
            }
            BabelStmt::WhileStatement(s) => Stmt::While(WhileStmt {
                span: self.span(&s.base),
                test: Box::new(self.convert_expression(&s.test)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            BabelStmt::DoWhileStatement(s) => Stmt::DoWhile(DoWhileStmt {
                span: self.span(&s.base),
                test: Box::new(self.convert_expression(&s.test)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            BabelStmt::ForInStatement(s) => Stmt::ForIn(ForInStmt {
                span: self.span(&s.base),
                left: self.convert_for_in_of_left(&s.left),
                right: Box::new(self.convert_expression(&s.right)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            BabelStmt::ForOfStatement(s) => Stmt::ForOf(ForOfStmt {
                span: self.span(&s.base),
                is_await: s.is_await,
                left: self.convert_for_in_of_left(&s.left),
                right: Box::new(self.convert_expression(&s.right)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            BabelStmt::SwitchStatement(s) => {
                let cases = s
                    .cases
                    .iter()
                    .map(|c| SwitchCase {
                        span: self.span(&c.base),
                        test: c
                            .test
                            .as_ref()
                            .map(|t| Box::new(self.convert_expression(t))),
                        cons: c
                            .consequent
                            .iter()
                            .map(|s| self.convert_statement(s))
                            .collect(),
                    })
                    .collect();
                Stmt::Switch(SwitchStmt {
                    span: self.span(&s.base),
                    discriminant: Box::new(self.convert_expression(&s.discriminant)),
                    cases,
                })
            }
            BabelStmt::ThrowStatement(s) => Stmt::Throw(ThrowStmt {
                span: self.span(&s.base),
                arg: Box::new(self.convert_expression(&s.argument)),
            }),
            BabelStmt::TryStatement(s) => {
                let block = self.convert_block_statement(&s.block);
                let handler = s.handler.as_ref().map(|h| self.convert_catch_clause(h));
                let finalizer = s
                    .finalizer
                    .as_ref()
                    .map(|f| self.convert_block_statement(f));
                Stmt::Try(Box::new(TryStmt {
                    span: self.span(&s.base),
                    block,
                    handler,
                    finalizer,
                }))
            }
            BabelStmt::BreakStatement(s) => Stmt::Break(BreakStmt {
                span: self.span(&s.base),
                label: s.label.as_ref().map(|l| self.ident(&l.name, DUMMY_SP)),
            }),
            BabelStmt::ContinueStatement(s) => Stmt::Continue(ContinueStmt {
                span: self.span(&s.base),
                label: s.label.as_ref().map(|l| self.ident(&l.name, DUMMY_SP)),
            }),
            BabelStmt::LabeledStatement(s) => Stmt::Labeled(LabeledStmt {
                span: self.span(&s.base),
                label: self.ident(&s.label.name, DUMMY_SP),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            BabelStmt::EmptyStatement(s) => Stmt::Empty(EmptyStmt {
                span: self.span(&s.base),
            }),
            BabelStmt::DebuggerStatement(s) => Stmt::Debugger(DebuggerStmt {
                span: self.span(&s.base),
            }),
            BabelStmt::WithStatement(s) => Stmt::With(WithStmt {
                span: self.span(&s.base),
                obj: Box::new(self.convert_expression(&s.object)),
                body: Box::new(self.convert_statement(&s.body)),
            }),
            BabelStmt::VariableDeclaration(d) => {
                Stmt::Decl(Decl::Var(Box::new(self.convert_variable_declaration(d))))
            }
            BabelStmt::FunctionDeclaration(f) => {
                Stmt::Decl(Decl::Fn(self.convert_function_declaration(f)))
            }
            BabelStmt::ClassDeclaration(c) => {
                let ident = c
                    .id
                    .as_ref()
                    .map(|id| self.ident(&id.name, self.span(&id.base)))
                    .unwrap_or_else(|| self.ident("_anonymous", DUMMY_SP));
                let super_class = c
                    .super_class
                    .as_ref()
                    .map(|s| Box::new(self.convert_expression(s)));
                Stmt::Decl(Decl::Class(ClassDecl {
                    ident,
                    declare: c.declare.unwrap_or(false),
                    class: Box::new(Class {
                        span: self.span(&c.base),
                        ctxt: SyntaxContext::empty(),
                        decorators: vec![],
                        body: vec![],
                        super_class,
                        is_abstract: false,
                        type_params: None,
                        super_type_params: None,
                        implements: vec![],
                    }),
                }))
            }
            // Import/export handled in convert_statement_to_module_item
            BabelStmt::ImportDeclaration(_)
            | BabelStmt::ExportNamedDeclaration(_)
            | BabelStmt::ExportDefaultDeclaration(_)
            | BabelStmt::ExportAllDeclaration(_) => Stmt::Empty(EmptyStmt { span: DUMMY_SP }),
            // TS/Flow declarations - not emitted by the React compiler output
            BabelStmt::TSTypeAliasDeclaration(_)
            | BabelStmt::TSInterfaceDeclaration(_)
            | BabelStmt::TSEnumDeclaration(_)
            | BabelStmt::TSModuleDeclaration(_)
            | BabelStmt::TSDeclareFunction(_)
            | BabelStmt::TypeAlias(_)
            | BabelStmt::OpaqueType(_)
            | BabelStmt::InterfaceDeclaration(_)
            | BabelStmt::DeclareVariable(_)
            | BabelStmt::DeclareFunction(_)
            | BabelStmt::DeclareClass(_)
            | BabelStmt::DeclareModule(_)
            | BabelStmt::DeclareModuleExports(_)
            | BabelStmt::DeclareExportDeclaration(_)
            | BabelStmt::DeclareExportAllDeclaration(_)
            | BabelStmt::DeclareInterface(_)
            | BabelStmt::DeclareTypeAlias(_)
            | BabelStmt::DeclareOpaqueType(_)
            | BabelStmt::EnumDeclaration(_) => Stmt::Empty(EmptyStmt { span: DUMMY_SP }),
        }
    }

    fn convert_block_statement(&self, block: &babel_stmt::BlockStatement) -> BlockStmt {
        BlockStmt {
            span: self.span(&block.base),
            ctxt: SyntaxContext::empty(),
            stmts: block.body.iter().map(|s| self.convert_statement(s)).collect(),
        }
    }

    fn convert_catch_clause(&self, clause: &babel_stmt::CatchClause) -> CatchClause {
        let param = clause.param.as_ref().map(|p| self.convert_pattern(p));
        CatchClause {
            span: self.span(&clause.base),
            param,
            body: self.convert_block_statement(&clause.body),
        }
    }

    fn convert_for_init(&self, init: &babel_stmt::ForInit) -> VarDeclOrExpr {
        match init {
            babel_stmt::ForInit::VariableDeclaration(v) => {
                VarDeclOrExpr::VarDecl(Box::new(self.convert_variable_declaration(v)))
            }
            babel_stmt::ForInit::Expression(e) => {
                VarDeclOrExpr::Expr(Box::new(self.convert_expression(e)))
            }
        }
    }

    fn convert_for_in_of_left(&self, left: &babel_stmt::ForInOfLeft) -> ForHead {
        match left {
            babel_stmt::ForInOfLeft::VariableDeclaration(v) => {
                ForHead::VarDecl(Box::new(self.convert_variable_declaration(v)))
            }
            babel_stmt::ForInOfLeft::Pattern(p) => ForHead::Pat(Box::new(self.convert_pattern(p))),
        }
    }

    fn convert_variable_declaration(
        &self,
        decl: &babel_stmt::VariableDeclaration,
    ) -> VarDecl {
        let kind = match decl.kind {
            babel_stmt::VariableDeclarationKind::Var => VarDeclKind::Var,
            babel_stmt::VariableDeclarationKind::Let => VarDeclKind::Let,
            babel_stmt::VariableDeclarationKind::Const => VarDeclKind::Const,
            babel_stmt::VariableDeclarationKind::Using => VarDeclKind::Var, // SWC doesn't have Using
        };
        let decls = decl
            .declarations
            .iter()
            .map(|d| self.convert_variable_declarator(d))
            .collect();
        let declare = decl.declare.unwrap_or(false);
        VarDecl {
            span: self.span(&decl.base),
            ctxt: SyntaxContext::empty(),
            kind,
            declare,
            decls,
        }
    }

    fn convert_variable_declarator(&self, d: &babel_stmt::VariableDeclarator) -> VarDeclarator {
        let name = self.convert_pattern(&d.id);
        let init = d.init.as_ref().map(|e| Box::new(self.convert_expression(e)));
        let definite = d.definite.unwrap_or(false);
        VarDeclarator {
            span: self.span(&d.base),
            name,
            init,
            definite,
        }
    }

    // ===== Expressions =====

    fn convert_expression(&self, expr: &BabelExpr) -> Expr {
        match expr {
            BabelExpr::Identifier(id) => {
                let span = self.span(&id.base);
                Expr::Ident(self.ident(&id.name, span))
            }
            BabelExpr::StringLiteral(lit) => Expr::Lit(Lit::Str(Str {
                span: self.span(&lit.base),
                value: self.wtf8(&lit.value),
                raw: None,
            })),
            BabelExpr::NumericLiteral(lit) => Expr::Lit(Lit::Num(Number {
                span: self.span(&lit.base),
                value: lit.value,
                raw: None,
            })),
            BabelExpr::BooleanLiteral(lit) => Expr::Lit(Lit::Bool(Bool {
                span: self.span(&lit.base),
                value: lit.value,
            })),
            BabelExpr::NullLiteral(lit) => Expr::Lit(Lit::Null(Null {
                span: self.span(&lit.base),
            })),
            BabelExpr::BigIntLiteral(lit) => Expr::Lit(Lit::BigInt(BigInt {
                span: self.span(&lit.base),
                value: Box::new(lit.value.parse().unwrap_or_default()),
                raw: None,
            })),
            BabelExpr::RegExpLiteral(lit) => Expr::Lit(Lit::Regex(Regex {
                span: self.span(&lit.base),
                exp: self.atom(&lit.pattern),
                flags: self.atom(&lit.flags),
            })),
            BabelExpr::CallExpression(call) => {
                let callee = self.convert_expression(&call.callee);
                let args = self.convert_arguments(&call.arguments);
                Expr::Call(CallExpr {
                    span: self.span(&call.base),
                    ctxt: SyntaxContext::empty(),
                    callee: Callee::Expr(Box::new(callee)),
                    args,
                    type_args: None,
                })
            }
            BabelExpr::MemberExpression(m) => self.convert_member_expression(m),
            BabelExpr::OptionalCallExpression(call) => {
                let callee = self.convert_expression_for_chain(&call.callee);
                let args = self.convert_arguments(&call.arguments);
                let base = OptChainBase::Call(OptCall {
                    span: self.span(&call.base),
                    ctxt: SyntaxContext::empty(),
                    callee: Box::new(callee),
                    args,
                    type_args: None,
                });
                Expr::OptChain(OptChainExpr {
                    span: self.span(&call.base),
                    optional: call.optional,
                    base: Box::new(base),
                })
            }
            BabelExpr::OptionalMemberExpression(m) => {
                let base = self.convert_optional_member_to_chain_base(m);
                Expr::OptChain(OptChainExpr {
                    span: self.span(&m.base),
                    optional: m.optional,
                    base: Box::new(base),
                })
            }
            BabelExpr::BinaryExpression(bin) => {
                let op = self.convert_binary_operator(&bin.operator);
                Expr::Bin(BinExpr {
                    span: self.span(&bin.base),
                    op,
                    left: Box::new(self.convert_expression(&bin.left)),
                    right: Box::new(self.convert_expression(&bin.right)),
                })
            }
            BabelExpr::LogicalExpression(log) => {
                let op = self.convert_logical_operator(&log.operator);
                Expr::Bin(BinExpr {
                    span: self.span(&log.base),
                    op,
                    left: Box::new(self.convert_expression(&log.left)),
                    right: Box::new(self.convert_expression(&log.right)),
                })
            }
            BabelExpr::UnaryExpression(un) => {
                let op = self.convert_unary_operator(&un.operator);
                Expr::Unary(UnaryExpr {
                    span: self.span(&un.base),
                    op,
                    arg: Box::new(self.convert_expression(&un.argument)),
                })
            }
            BabelExpr::UpdateExpression(up) => {
                let op = self.convert_update_operator(&up.operator);
                Expr::Update(UpdateExpr {
                    span: self.span(&up.base),
                    op,
                    prefix: up.prefix,
                    arg: Box::new(self.convert_expression(&up.argument)),
                })
            }
            BabelExpr::ConditionalExpression(cond) => Expr::Cond(CondExpr {
                span: self.span(&cond.base),
                test: Box::new(self.convert_expression(&cond.test)),
                cons: Box::new(self.convert_expression(&cond.consequent)),
                alt: Box::new(self.convert_expression(&cond.alternate)),
            }),
            BabelExpr::AssignmentExpression(assign) => {
                let op = self.convert_assignment_operator(&assign.operator);
                let left = self.convert_pattern_to_assign_target(&assign.left);
                Expr::Assign(AssignExpr {
                    span: self.span(&assign.base),
                    op,
                    left,
                    right: Box::new(self.convert_expression(&assign.right)),
                })
            }
            BabelExpr::SequenceExpression(seq) => {
                let exprs = seq
                    .expressions
                    .iter()
                    .map(|e| Box::new(self.convert_expression(e)))
                    .collect();
                Expr::Seq(SeqExpr {
                    span: self.span(&seq.base),
                    exprs,
                })
            }
            BabelExpr::ArrowFunctionExpression(arrow) => self.convert_arrow_function(arrow),
            BabelExpr::FunctionExpression(func) => {
                let ident = func
                    .id
                    .as_ref()
                    .map(|id| self.ident(&id.name, self.span(&id.base)));
                let params = self.convert_params(&func.params);
                let body = Some(self.convert_block_statement(&func.body));
                Expr::Fn(FnExpr {
                    ident,
                    function: Box::new(Function {
                        params,
                        decorators: vec![],
                        span: self.span(&func.base),
                        ctxt: SyntaxContext::empty(),
                        body,
                        is_generator: func.generator,
                        is_async: func.is_async,
                        type_params: None,
                        return_type: None,
                    }),
                })
            }
            BabelExpr::ObjectExpression(obj) => {
                let props = obj
                    .properties
                    .iter()
                    .map(|p| self.convert_object_expression_property(p))
                    .collect();
                Expr::Object(ObjectLit {
                    span: self.span(&obj.base),
                    props,
                })
            }
            BabelExpr::ArrayExpression(arr) => {
                let elems = arr
                    .elements
                    .iter()
                    .map(|e| self.convert_array_element(e))
                    .collect();
                Expr::Array(ArrayLit {
                    span: self.span(&arr.base),
                    elems,
                })
            }
            BabelExpr::NewExpression(n) => {
                let callee = Box::new(self.convert_expression(&n.callee));
                let args = Some(self.convert_arguments(&n.arguments));
                Expr::New(NewExpr {
                    span: self.span(&n.base),
                    ctxt: SyntaxContext::empty(),
                    callee,
                    args,
                    type_args: None,
                })
            }
            BabelExpr::TemplateLiteral(tl) => {
                let template = self.convert_template_literal(tl);
                Expr::Tpl(template)
            }
            BabelExpr::TaggedTemplateExpression(tag) => {
                let t = Box::new(self.convert_expression(&tag.tag));
                let tpl = Box::new(self.convert_template_literal(&tag.quasi));
                Expr::TaggedTpl(TaggedTpl {
                    span: self.span(&tag.base),
                    ctxt: SyntaxContext::empty(),
                    tag: t,
                    type_params: None,
                    tpl,
                })
            }
            BabelExpr::AwaitExpression(a) => Expr::Await(AwaitExpr {
                span: self.span(&a.base),
                arg: Box::new(self.convert_expression(&a.argument)),
            }),
            BabelExpr::YieldExpression(y) => Expr::Yield(YieldExpr {
                span: self.span(&y.base),
                delegate: y.delegate,
                arg: y
                    .argument
                    .as_ref()
                    .map(|a| Box::new(self.convert_expression(a))),
            }),
            BabelExpr::SpreadElement(s) => {
                // SpreadElement can't be a standalone expression in SWC.
                // Return the argument directly as a fallback.
                self.convert_expression(&s.argument)
            }
            BabelExpr::MetaProperty(mp) => Expr::MetaProp(MetaPropExpr {
                span: self.span(&mp.base),
                kind: match (mp.meta.name.as_str(), mp.property.name.as_str()) {
                    ("new", "target") => MetaPropKind::NewTarget,
                    ("import", "meta") => MetaPropKind::ImportMeta,
                    _ => MetaPropKind::NewTarget,
                },
            }),
            BabelExpr::ClassExpression(c) => {
                let ident = c
                    .id
                    .as_ref()
                    .map(|id| self.ident(&id.name, self.span(&id.base)));
                let super_class = c
                    .super_class
                    .as_ref()
                    .map(|s| Box::new(self.convert_expression(s)));
                Expr::Class(ClassExpr {
                    ident,
                    class: Box::new(Class {
                        span: self.span(&c.base),
                        ctxt: SyntaxContext::empty(),
                        decorators: vec![],
                        body: vec![],
                        super_class,
                        is_abstract: false,
                        type_params: None,
                        super_type_params: None,
                        implements: vec![],
                    }),
                })
            }
            BabelExpr::PrivateName(p) => {
                Expr::PrivateName(PrivateName {
                    span: self.span(&p.base),
                    name: self.atom(&p.id.name),
                })
            }
            BabelExpr::Super(s) => Expr::Ident(self.ident("super", self.span(&s.base))),
            BabelExpr::Import(i) => Expr::Ident(self.ident("import", self.span(&i.base))),
            BabelExpr::ThisExpression(t) => Expr::This(ThisExpr {
                span: self.span(&t.base),
            }),
            BabelExpr::ParenthesizedExpression(p) => Expr::Paren(ParenExpr {
                span: self.span(&p.base),
                expr: Box::new(self.convert_expression(&p.expression)),
            }),
            BabelExpr::JSXElement(el) => {
                let element = self.convert_jsx_element(el.as_ref());
                Expr::JSXElement(Box::new(element))
            }
            BabelExpr::JSXFragment(frag) => {
                let fragment = self.convert_jsx_fragment(frag);
                Expr::JSXFragment(fragment)
            }
            // TS expressions - strip the type wrapper, keep the expression
            BabelExpr::TSAsExpression(e) => self.convert_expression(&e.expression),
            BabelExpr::TSSatisfiesExpression(e) => self.convert_expression(&e.expression),
            BabelExpr::TSNonNullExpression(e) => {
                Expr::TsNonNull(TsNonNullExpr {
                    span: self.span(&e.base),
                    expr: Box::new(self.convert_expression(&e.expression)),
                })
            }
            BabelExpr::TSTypeAssertion(e) => self.convert_expression(&e.expression),
            BabelExpr::TSInstantiationExpression(e) => self.convert_expression(&e.expression),
            BabelExpr::TypeCastExpression(e) => self.convert_expression(&e.expression),
            BabelExpr::AssignmentPattern(p) => {
                let left = self.convert_pattern_to_assign_target(&p.left);
                Expr::Assign(AssignExpr {
                    span: self.span(&p.base),
                    op: AssignOp::Assign,
                    left,
                    right: Box::new(self.convert_expression(&p.right)),
                })
            }
        }
    }

    /// Convert an expression that may be used inside a chain (optional chaining).
    fn convert_expression_for_chain(&self, expr: &BabelExpr) -> Expr {
        match expr {
            BabelExpr::OptionalMemberExpression(m) => {
                self.convert_optional_member_to_member_expr(m)
            }
            BabelExpr::OptionalCallExpression(call) => {
                let callee = self.convert_expression_for_chain(&call.callee);
                let args = self.convert_arguments(&call.arguments);
                Expr::Call(CallExpr {
                    span: self.span(&call.base),
                    ctxt: SyntaxContext::empty(),
                    callee: Callee::Expr(Box::new(callee)),
                    args,
                    type_args: None,
                })
            }
            _ => self.convert_expression(expr),
        }
    }

    fn convert_member_expression(&self, m: &babel_expr::MemberExpression) -> Expr {
        let object = Box::new(self.convert_expression(&m.object));
        if m.computed {
            let property = self.convert_expression(&m.property);
            Expr::Member(MemberExpr {
                span: self.span(&m.base),
                obj: object,
                prop: MemberProp::Computed(ComputedPropName {
                    span: DUMMY_SP,
                    expr: Box::new(property),
                }),
            })
        } else {
            let prop_name = self.expression_to_ident_name(&m.property);
            Expr::Member(MemberExpr {
                span: self.span(&m.base),
                obj: object,
                prop: MemberProp::Ident(prop_name),
            })
        }
    }

    fn convert_optional_member_to_chain_base(
        &self,
        m: &babel_expr::OptionalMemberExpression,
    ) -> OptChainBase {
        let object = Box::new(self.convert_expression_for_chain(&m.object));
        if m.computed {
            let property = self.convert_expression(&m.property);
            OptChainBase::Member(MemberExpr {
                span: self.span(&m.base),
                obj: object,
                prop: MemberProp::Computed(ComputedPropName {
                    span: DUMMY_SP,
                    expr: Box::new(property),
                }),
            })
        } else {
            let prop_name = self.expression_to_ident_name(&m.property);
            OptChainBase::Member(MemberExpr {
                span: self.span(&m.base),
                obj: object,
                prop: MemberProp::Ident(prop_name),
            })
        }
    }

    fn convert_optional_member_to_member_expr(
        &self,
        m: &babel_expr::OptionalMemberExpression,
    ) -> Expr {
        let object = Box::new(self.convert_expression_for_chain(&m.object));
        if m.computed {
            let property = self.convert_expression(&m.property);
            Expr::Member(MemberExpr {
                span: self.span(&m.base),
                obj: object,
                prop: MemberProp::Computed(ComputedPropName {
                    span: DUMMY_SP,
                    expr: Box::new(property),
                }),
            })
        } else {
            let prop_name = self.expression_to_ident_name(&m.property);
            Expr::Member(MemberExpr {
                span: self.span(&m.base),
                obj: object,
                prop: MemberProp::Ident(prop_name),
            })
        }
    }

    fn expression_to_ident_name(&self, expr: &BabelExpr) -> IdentName {
        match expr {
            BabelExpr::Identifier(id) => self.ident_name(&id.name, self.span(&id.base)),
            _ => self.ident_name("__unknown__", DUMMY_SP),
        }
    }

    fn convert_arguments(&self, args: &[BabelExpr]) -> Vec<ExprOrSpread> {
        args.iter().map(|a| self.convert_argument(a)).collect()
    }

    fn convert_argument(&self, arg: &BabelExpr) -> ExprOrSpread {
        match arg {
            BabelExpr::SpreadElement(s) => ExprOrSpread {
                spread: Some(self.span(&s.base)),
                expr: Box::new(self.convert_expression(&s.argument)),
            },
            _ => ExprOrSpread {
                spread: None,
                expr: Box::new(self.convert_expression(arg)),
            },
        }
    }

    fn convert_array_element(&self, elem: &Option<BabelExpr>) -> Option<ExprOrSpread> {
        match elem {
            None => None,
            Some(BabelExpr::SpreadElement(s)) => Some(ExprOrSpread {
                spread: Some(self.span(&s.base)),
                expr: Box::new(self.convert_expression(&s.argument)),
            }),
            Some(e) => Some(ExprOrSpread {
                spread: None,
                expr: Box::new(self.convert_expression(e)),
            }),
        }
    }

    fn convert_object_expression_property(
        &self,
        prop: &babel_expr::ObjectExpressionProperty,
    ) -> PropOrSpread {
        match prop {
            babel_expr::ObjectExpressionProperty::ObjectProperty(p) => {
                let key = self.convert_expression_to_prop_name(&p.key);
                let value = self.convert_expression(&p.value);
                let method = p.method.unwrap_or(false);

                if p.shorthand {
                    PropOrSpread::Prop(Box::new(Prop::Shorthand(match &*p.key {
                        BabelExpr::Identifier(id) => self.ident(&id.name, self.span(&id.base)),
                        _ => self.ident("__unknown__", DUMMY_SP),
                    })))
                } else if method {
                    // Method shorthand: { foo() {} }
                    // The value should be a function expression
                    let func = match value {
                        Expr::Fn(fn_expr) => *fn_expr.function,
                        _ => {
                            // Fallback: wrap in a key-value
                            return PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key,
                                value: Box::new(value),
                            })));
                        }
                    };
                    PropOrSpread::Prop(Box::new(Prop::Method(MethodProp {
                        key,
                        function: Box::new(func),
                    })))
                } else {
                    PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                        key,
                        value: Box::new(value),
                    })))
                }
            }
            babel_expr::ObjectExpressionProperty::ObjectMethod(m) => {
                let key = self.convert_expression_to_prop_name(&m.key);
                let func = self.convert_object_method_to_function(m);
                match m.kind {
                    babel_expr::ObjectMethodKind::Get => {
                        PropOrSpread::Prop(Box::new(Prop::Getter(GetterProp {
                            span: self.span(&m.base),
                            key,
                            type_ann: None,
                            body: func.body,
                        })))
                    }
                    babel_expr::ObjectMethodKind::Set => {
                        let param = func
                            .params
                            .into_iter()
                            .next()
                            .map(|p| Box::new(p.pat))
                            .unwrap_or_else(|| Box::new(Pat::Ident(self.binding_ident("_", DUMMY_SP))));
                        PropOrSpread::Prop(Box::new(Prop::Setter(SetterProp {
                            span: self.span(&m.base),
                            key,
                            this_param: None,
                            param,
                            body: func.body,
                        })))
                    }
                    babel_expr::ObjectMethodKind::Method => {
                        PropOrSpread::Prop(Box::new(Prop::Method(MethodProp {
                            key,
                            function: Box::new(func),
                        })))
                    }
                }
            }
            babel_expr::ObjectExpressionProperty::SpreadElement(s) => {
                PropOrSpread::Spread(SpreadElement {
                    dot3_token: self.span(&s.base),
                    expr: Box::new(self.convert_expression(&s.argument)),
                })
            }
        }
    }

    fn convert_expression_to_prop_name(&self, expr: &BabelExpr) -> PropName {
        match expr {
            BabelExpr::Identifier(id) => {
                PropName::Ident(self.ident_name(&id.name, self.span(&id.base)))
            }
            BabelExpr::StringLiteral(s) => PropName::Str(Str {
                span: self.span(&s.base),
                value: self.wtf8(&s.value),
                raw: None,
            }),
            BabelExpr::NumericLiteral(n) => PropName::Num(Number {
                span: self.span(&n.base),
                value: n.value,
                raw: None,
            }),
            _ => PropName::Computed(ComputedPropName {
                span: DUMMY_SP,
                expr: Box::new(self.convert_expression(expr)),
            }),
        }
    }

    fn convert_template_literal(&self, tl: &babel_expr::TemplateLiteral) -> Tpl {
        let quasis = tl
            .quasis
            .iter()
            .map(|q| {
                let cooked = q.value.cooked.as_ref().map(|c| self.wtf8(c));
                TplElement {
                    span: self.span(&q.base),
                    tail: q.tail,
                    cooked,
                    raw: self.atom(&q.value.raw),
                }
            })
            .collect();
        let exprs = tl
            .expressions
            .iter()
            .map(|e| Box::new(self.convert_expression(e)))
            .collect();
        Tpl {
            span: self.span(&tl.base),
            exprs,
            quasis,
        }
    }

    // ===== Functions =====

    fn convert_function_declaration(
        &self,
        f: &babel_stmt::FunctionDeclaration,
    ) -> FnDecl {
        let ident = f
            .id
            .as_ref()
            .map(|id| self.ident(&id.name, self.span(&id.base)))
            .unwrap_or_else(|| self.ident("_anonymous", DUMMY_SP));
        let params = self.convert_params(&f.params);
        let body = Some(self.convert_block_statement(&f.body));
        let declare = f.declare.unwrap_or(false);
        FnDecl {
            ident,
            declare,
            function: Box::new(Function {
                params,
                decorators: vec![],
                span: self.span(&f.base),
                ctxt: SyntaxContext::empty(),
                body,
                is_generator: f.generator,
                is_async: f.is_async,
                type_params: None,
                return_type: None,
            }),
        }
    }

    fn convert_object_method_to_function(&self, m: &babel_expr::ObjectMethod) -> Function {
        let params = self.convert_params(&m.params);
        let body = Some(self.convert_block_statement(&m.body));
        Function {
            params,
            decorators: vec![],
            span: self.span(&m.base),
            ctxt: SyntaxContext::empty(),
            body,
            is_generator: m.generator,
            is_async: m.is_async,
            type_params: None,
            return_type: None,
        }
    }

    fn convert_arrow_function(&self, arrow: &babel_expr::ArrowFunctionExpression) -> Expr {
        let is_expression = arrow.expression.unwrap_or(false);
        let params = arrow
            .params
            .iter()
            .map(|p| self.convert_pattern(p))
            .collect();

        let body: Box<BlockStmtOrExpr> = match &*arrow.body {
            babel_expr::ArrowFunctionBody::BlockStatement(block) => {
                Box::new(BlockStmtOrExpr::BlockStmt(
                    self.convert_block_statement(block),
                ))
            }
            babel_expr::ArrowFunctionBody::Expression(expr) => {
                if is_expression {
                    Box::new(BlockStmtOrExpr::Expr(Box::new(
                        self.convert_expression(expr),
                    )))
                } else {
                    // Wrap in block with return
                    let ret_stmt = Stmt::Return(ReturnStmt {
                        span: DUMMY_SP,
                        arg: Some(Box::new(self.convert_expression(expr))),
                    });
                    Box::new(BlockStmtOrExpr::BlockStmt(BlockStmt {
                        span: DUMMY_SP,
                        ctxt: SyntaxContext::empty(),
                        stmts: vec![ret_stmt],
                    }))
                }
            }
        };

        Expr::Arrow(ArrowExpr {
            span: self.span(&arrow.base),
            ctxt: SyntaxContext::empty(),
            params,
            body,
            is_async: arrow.is_async,
            is_generator: arrow.generator,
            return_type: None,
            type_params: None,
        })
    }

    fn convert_params(&self, params: &[PatternLike]) -> Vec<Param> {
        params
            .iter()
            .map(|p| Param {
                span: DUMMY_SP,
                decorators: vec![],
                pat: self.convert_pattern(p),
            })
            .collect()
    }

    // ===== Patterns =====

    fn convert_pattern(&self, pattern: &PatternLike) -> Pat {
        match pattern {
            PatternLike::Identifier(id) => {
                Pat::Ident(self.binding_ident(&id.name, self.span(&id.base)))
            }
            PatternLike::ObjectPattern(obj) => {
                let mut props: Vec<ObjectPatProp> = Vec::new();

                for prop in &obj.properties {
                    match prop {
                        ObjectPatternProperty::ObjectProperty(p) => {
                            if p.shorthand {
                                // Shorthand: { x } or { x = default }
                                let value = self.convert_pattern(&p.value);
                                match &*p.key {
                                    BabelExpr::Identifier(id) => {
                                        let key_ident =
                                            self.binding_ident(&id.name, self.span(&id.base));
                                        match value {
                                            Pat::Assign(assign_pat) => {
                                                props.push(ObjectPatProp::Assign(AssignPatProp {
                                                    span: self.span(&p.base),
                                                    key: key_ident,
                                                    value: Some(assign_pat.right),
                                                }));
                                            }
                                            _ => {
                                                props.push(ObjectPatProp::Assign(AssignPatProp {
                                                    span: self.span(&p.base),
                                                    key: key_ident,
                                                    value: None,
                                                }));
                                            }
                                        }
                                    }
                                    _ => {
                                        // Fallback to key-value
                                        let key =
                                            self.convert_expression_to_prop_name(&p.key);
                                        props.push(ObjectPatProp::KeyValue(KeyValuePatProp {
                                            key,
                                            value: Box::new(value),
                                        }));
                                    }
                                }
                            } else {
                                let key = self.convert_expression_to_prop_name(&p.key);
                                let value = self.convert_pattern(&p.value);
                                props.push(ObjectPatProp::KeyValue(KeyValuePatProp {
                                    key,
                                    value: Box::new(value),
                                }));
                            }
                        }
                        ObjectPatternProperty::RestElement(r) => {
                            let arg = Box::new(self.convert_pattern(&r.argument));
                            props.push(ObjectPatProp::Rest(RestPat {
                                span: self.span(&r.base),
                                dot3_token: self.span(&r.base),
                                arg,
                                type_ann: None,
                            }));
                        }
                    }
                }

                Pat::Object(ObjectPat {
                    span: self.span(&obj.base),
                    props,
                    optional: false,
                    type_ann: None,
                })
            }
            PatternLike::ArrayPattern(arr) => {
                let elems = arr
                    .elements
                    .iter()
                    .map(|e| e.as_ref().map(|p| self.convert_pattern(p)))
                    .collect();
                Pat::Array(ArrayPat {
                    span: self.span(&arr.base),
                    elems,
                    optional: false,
                    type_ann: None,
                })
            }
            PatternLike::AssignmentPattern(ap) => {
                let left = Box::new(self.convert_pattern(&ap.left));
                let right = Box::new(self.convert_expression(&ap.right));
                Pat::Assign(AssignPat {
                    span: self.span(&ap.base),
                    left,
                    right,
                })
            }
            PatternLike::RestElement(r) => {
                let arg = Box::new(self.convert_pattern(&r.argument));
                Pat::Rest(RestPat {
                    span: self.span(&r.base),
                    dot3_token: self.span(&r.base),
                    arg,
                    type_ann: None,
                })
            }
            PatternLike::MemberExpression(m) => {
                // MemberExpression in pattern position - convert to an expression pattern
                Pat::Expr(Box::new(self.convert_member_expression(m)))
            }
        }
    }

    // ===== Patterns → AssignmentTarget =====

    fn convert_pattern_to_assign_target(&self, pattern: &PatternLike) -> AssignTarget {
        match pattern {
            PatternLike::Identifier(id) => {
                AssignTarget::Simple(SimpleAssignTarget::Ident(
                    self.binding_ident(&id.name, self.span(&id.base)),
                ))
            }
            PatternLike::MemberExpression(m) => {
                let expr = self.convert_member_expression(m);
                match expr {
                    Expr::Member(member) => {
                        AssignTarget::Simple(SimpleAssignTarget::Member(member))
                    }
                    _ => AssignTarget::Simple(SimpleAssignTarget::Ident(
                        self.binding_ident("__unknown__", DUMMY_SP),
                    )),
                }
            }
            PatternLike::ObjectPattern(_obj) => {
                let pat = self.convert_pattern(pattern);
                match pat {
                    Pat::Object(obj_pat) => AssignTarget::Pat(AssignTargetPat::Object(obj_pat)),
                    _ => AssignTarget::Simple(SimpleAssignTarget::Ident(
                        self.binding_ident("__unknown__", DUMMY_SP),
                    )),
                }
            }
            PatternLike::ArrayPattern(_arr) => {
                let pat = self.convert_pattern(pattern);
                match pat {
                    Pat::Array(arr_pat) => AssignTarget::Pat(AssignTargetPat::Array(arr_pat)),
                    _ => AssignTarget::Simple(SimpleAssignTarget::Ident(
                        self.binding_ident("__unknown__", DUMMY_SP),
                    )),
                }
            }
            PatternLike::AssignmentPattern(ap) => {
                // For assignment LHS, use the left side
                self.convert_pattern_to_assign_target(&ap.left)
            }
            PatternLike::RestElement(r) => self.convert_pattern_to_assign_target(&r.argument),
        }
    }

    // ===== JSX =====

    fn convert_jsx_element(
        &self,
        el: &react_compiler_ast::jsx::JSXElement,
    ) -> swc_ecma_ast::JSXElement {
        let opening = self.convert_jsx_opening_element(&el.opening_element);
        let children: Vec<swc_ecma_ast::JSXElementChild> = el
            .children
            .iter()
            .map(|c| self.convert_jsx_child(c))
            .collect();
        let closing = el
            .closing_element
            .as_ref()
            .map(|c| self.convert_jsx_closing_element(c));
        swc_ecma_ast::JSXElement {
            span: self.span(&el.base),
            opening,
            children,
            closing,
        }
    }

    fn convert_jsx_opening_element(
        &self,
        el: &react_compiler_ast::jsx::JSXOpeningElement,
    ) -> swc_ecma_ast::JSXOpeningElement {
        let name = self.convert_jsx_element_name(&el.name);
        let attrs = el
            .attributes
            .iter()
            .map(|a| self.convert_jsx_attribute_item(a))
            .collect();
        swc_ecma_ast::JSXOpeningElement {
            span: self.span(&el.base),
            name,
            attrs,
            self_closing: el.self_closing,
            type_args: None,
        }
    }

    fn convert_jsx_closing_element(
        &self,
        el: &react_compiler_ast::jsx::JSXClosingElement,
    ) -> swc_ecma_ast::JSXClosingElement {
        let name = self.convert_jsx_element_name(&el.name);
        swc_ecma_ast::JSXClosingElement {
            span: self.span(&el.base),
            name,
        }
    }

    fn convert_jsx_element_name(
        &self,
        name: &react_compiler_ast::jsx::JSXElementName,
    ) -> swc_ecma_ast::JSXElementName {
        match name {
            react_compiler_ast::jsx::JSXElementName::JSXIdentifier(id) => {
                swc_ecma_ast::JSXElementName::Ident(self.ident(&id.name, self.span(&id.base)))
            }
            react_compiler_ast::jsx::JSXElementName::JSXMemberExpression(m) => {
                let member = self.convert_jsx_member_expression(m);
                swc_ecma_ast::JSXElementName::JSXMemberExpr(member)
            }
            react_compiler_ast::jsx::JSXElementName::JSXNamespacedName(ns) => {
                let namespace = self.ident_name(&ns.namespace.name, self.span(&ns.namespace.base));
                let name = self.ident_name(&ns.name.name, self.span(&ns.name.base));
                swc_ecma_ast::JSXElementName::JSXNamespacedName(swc_ecma_ast::JSXNamespacedName {
                    span: DUMMY_SP,
                    ns: namespace,
                    name,
                })
            }
        }
    }

    fn convert_jsx_member_expression(
        &self,
        m: &react_compiler_ast::jsx::JSXMemberExpression,
    ) -> swc_ecma_ast::JSXMemberExpr {
        let obj = self.convert_jsx_member_expression_object(&m.object);
        let prop = self.ident_name(&m.property.name, self.span(&m.property.base));
        swc_ecma_ast::JSXMemberExpr { span: DUMMY_SP, obj, prop }
    }

    fn convert_jsx_member_expression_object(
        &self,
        obj: &react_compiler_ast::jsx::JSXMemberExprObject,
    ) -> swc_ecma_ast::JSXObject {
        match obj {
            react_compiler_ast::jsx::JSXMemberExprObject::JSXIdentifier(id) => {
                swc_ecma_ast::JSXObject::Ident(self.ident(&id.name, self.span(&id.base)))
            }
            react_compiler_ast::jsx::JSXMemberExprObject::JSXMemberExpression(m) => {
                let member = self.convert_jsx_member_expression(m);
                swc_ecma_ast::JSXObject::JSXMemberExpr(Box::new(member))
            }
        }
    }

    fn convert_jsx_attribute_item(
        &self,
        item: &react_compiler_ast::jsx::JSXAttributeItem,
    ) -> swc_ecma_ast::JSXAttrOrSpread {
        match item {
            react_compiler_ast::jsx::JSXAttributeItem::JSXAttribute(attr) => {
                let name = self.convert_jsx_attribute_name(&attr.name);
                let value = attr
                    .value
                    .as_ref()
                    .map(|v| self.convert_jsx_attribute_value(v));
                swc_ecma_ast::JSXAttrOrSpread::JSXAttr(swc_ecma_ast::JSXAttr {
                    span: self.span(&attr.base),
                    name,
                    value,
                })
            }
            react_compiler_ast::jsx::JSXAttributeItem::JSXSpreadAttribute(s) => {
                swc_ecma_ast::JSXAttrOrSpread::SpreadElement(SpreadElement {
                    dot3_token: self.span(&s.base),
                    expr: Box::new(self.convert_expression(&s.argument)),
                })
            }
        }
    }

    fn convert_jsx_attribute_name(
        &self,
        name: &react_compiler_ast::jsx::JSXAttributeName,
    ) -> swc_ecma_ast::JSXAttrName {
        match name {
            react_compiler_ast::jsx::JSXAttributeName::JSXIdentifier(id) => {
                swc_ecma_ast::JSXAttrName::Ident(self.ident_name(&id.name, self.span(&id.base)))
            }
            react_compiler_ast::jsx::JSXAttributeName::JSXNamespacedName(ns) => {
                let namespace = self.ident_name(&ns.namespace.name, self.span(&ns.namespace.base));
                let name = self.ident_name(&ns.name.name, self.span(&ns.name.base));
                swc_ecma_ast::JSXAttrName::JSXNamespacedName(swc_ecma_ast::JSXNamespacedName {
                    span: DUMMY_SP,
                    ns: namespace,
                    name,
                })
            }
        }
    }

    fn convert_jsx_attribute_value(
        &self,
        value: &react_compiler_ast::jsx::JSXAttributeValue,
    ) -> swc_ecma_ast::JSXAttrValue {
        match value {
            react_compiler_ast::jsx::JSXAttributeValue::StringLiteral(s) => {
                swc_ecma_ast::JSXAttrValue::Str(Str {
                    span: self.span(&s.base),
                    value: self.wtf8(&s.value),
                    raw: None,
                })
            }
            react_compiler_ast::jsx::JSXAttributeValue::JSXExpressionContainer(ec) => {
                let expr = self.convert_jsx_expression_container_expr(&ec.expression);
                swc_ecma_ast::JSXAttrValue::JSXExprContainer(swc_ecma_ast::JSXExprContainer {
                    span: self.span(&ec.base),
                    expr,
                })
            }
            react_compiler_ast::jsx::JSXAttributeValue::JSXElement(el) => {
                let element = self.convert_jsx_element(el.as_ref());
                swc_ecma_ast::JSXAttrValue::JSXElement(Box::new(element))
            }
            react_compiler_ast::jsx::JSXAttributeValue::JSXFragment(frag) => {
                let fragment = self.convert_jsx_fragment(frag);
                swc_ecma_ast::JSXAttrValue::JSXFragment(fragment)
            }
        }
    }

    fn convert_jsx_expression_container_expr(
        &self,
        expr: &react_compiler_ast::jsx::JSXExpressionContainerExpr,
    ) -> swc_ecma_ast::JSXExpr {
        match expr {
            react_compiler_ast::jsx::JSXExpressionContainerExpr::JSXEmptyExpression(e) => {
                swc_ecma_ast::JSXExpr::JSXEmptyExpr(swc_ecma_ast::JSXEmptyExpr {
                    span: self.span(&e.base),
                })
            }
            react_compiler_ast::jsx::JSXExpressionContainerExpr::Expression(e) => {
                swc_ecma_ast::JSXExpr::Expr(Box::new(self.convert_expression(e)))
            }
        }
    }

    fn convert_jsx_child(
        &self,
        child: &react_compiler_ast::jsx::JSXChild,
    ) -> swc_ecma_ast::JSXElementChild {
        match child {
            react_compiler_ast::jsx::JSXChild::JSXText(t) => {
                swc_ecma_ast::JSXElementChild::JSXText(swc_ecma_ast::JSXText {
                    span: self.span(&t.base),
                    value: self.atom(&t.value),
                    raw: self.atom(&t.value),
                })
            }
            react_compiler_ast::jsx::JSXChild::JSXElement(el) => {
                let element = self.convert_jsx_element(el.as_ref());
                swc_ecma_ast::JSXElementChild::JSXElement(Box::new(element))
            }
            react_compiler_ast::jsx::JSXChild::JSXFragment(frag) => {
                let fragment = self.convert_jsx_fragment(frag);
                swc_ecma_ast::JSXElementChild::JSXFragment(fragment)
            }
            react_compiler_ast::jsx::JSXChild::JSXExpressionContainer(ec) => {
                let expr = self.convert_jsx_expression_container_expr(&ec.expression);
                swc_ecma_ast::JSXElementChild::JSXExprContainer(swc_ecma_ast::JSXExprContainer {
                    span: self.span(&ec.base),
                    expr,
                })
            }
            react_compiler_ast::jsx::JSXChild::JSXSpreadChild(s) => {
                swc_ecma_ast::JSXElementChild::JSXSpreadChild(swc_ecma_ast::JSXSpreadChild {
                    span: self.span(&s.base),
                    expr: Box::new(self.convert_expression(&s.expression)),
                })
            }
        }
    }

    fn convert_jsx_fragment(
        &self,
        frag: &react_compiler_ast::jsx::JSXFragment,
    ) -> swc_ecma_ast::JSXFragment {
        let children = frag
            .children
            .iter()
            .map(|c| self.convert_jsx_child(c))
            .collect();
        swc_ecma_ast::JSXFragment {
            span: self.span(&frag.base),
            opening: swc_ecma_ast::JSXOpeningFragment {
                span: self.span(&frag.opening_fragment.base),
            },
            children,
            closing: swc_ecma_ast::JSXClosingFragment {
                span: self.span(&frag.closing_fragment.base),
            },
        }
    }

    // ===== Import/Export =====

    fn convert_import_declaration(&self, decl: &ImportDeclaration) -> swc_ecma_ast::ImportDecl {
        let specifiers = decl
            .specifiers
            .iter()
            .map(|s| self.convert_import_specifier(s))
            .collect();
        let src = Box::new(Str {
            span: self.span(&decl.source.base),
            value: self.wtf8(&decl.source.value),
            raw: None,
        });
        let type_only = matches!(decl.import_kind.as_ref(), Some(ImportKind::Type));
        swc_ecma_ast::ImportDecl {
            span: self.span(&decl.base),
            specifiers,
            src,
            type_only,
            with: None,
            phase: Default::default(),
        }
    }

    fn convert_import_specifier(
        &self,
        spec: &react_compiler_ast::declarations::ImportSpecifier,
    ) -> swc_ecma_ast::ImportSpecifier {
        match spec {
            react_compiler_ast::declarations::ImportSpecifier::ImportSpecifier(s) => {
                let local = self.ident(&s.local.name, self.span(&s.local.base));
                let imported = Some(self.convert_module_export_name(&s.imported));
                let is_type_only = matches!(s.import_kind.as_ref(), Some(ImportKind::Type));
                swc_ecma_ast::ImportSpecifier::Named(ImportNamedSpecifier {
                    span: self.span(&s.base),
                    local,
                    imported,
                    is_type_only,
                })
            }
            react_compiler_ast::declarations::ImportSpecifier::ImportDefaultSpecifier(s) => {
                let local = self.ident(&s.local.name, self.span(&s.local.base));
                swc_ecma_ast::ImportSpecifier::Default(ImportDefaultSpecifier {
                    span: self.span(&s.base),
                    local,
                })
            }
            react_compiler_ast::declarations::ImportSpecifier::ImportNamespaceSpecifier(s) => {
                let local = self.ident(&s.local.name, self.span(&s.local.base));
                swc_ecma_ast::ImportSpecifier::Namespace(ImportStarAsSpecifier {
                    span: self.span(&s.base),
                    local,
                })
            }
        }
    }

    fn convert_module_export_name(
        &self,
        name: &react_compiler_ast::declarations::ModuleExportName,
    ) -> swc_ecma_ast::ModuleExportName {
        match name {
            react_compiler_ast::declarations::ModuleExportName::Identifier(id) => {
                swc_ecma_ast::ModuleExportName::Ident(self.ident(&id.name, self.span(&id.base)))
            }
            react_compiler_ast::declarations::ModuleExportName::StringLiteral(s) => {
                swc_ecma_ast::ModuleExportName::Str(Str {
                    span: self.span(&s.base),
                    value: self.wtf8(&s.value),
                    raw: None,
                })
            }
        }
    }

    fn convert_export_named_to_module_item(
        &self,
        decl: &ExportNamedDeclaration,
    ) -> ModuleItem {
        // If there's a declaration, emit as ExportDecl
        if let Some(declaration) = &decl.declaration {
            let swc_decl = self.convert_declaration(declaration);
            return ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(ExportDecl {
                span: self.span(&decl.base),
                decl: swc_decl,
            }));
        }
        self.convert_export_named_specifiers(decl)
    }

    fn convert_declaration(
        &self,
        decl: &react_compiler_ast::declarations::Declaration,
    ) -> Decl {
        match decl {
            react_compiler_ast::declarations::Declaration::FunctionDeclaration(f) => {
                Decl::Fn(self.convert_function_declaration(f))
            }
            react_compiler_ast::declarations::Declaration::VariableDeclaration(v) => {
                Decl::Var(Box::new(self.convert_variable_declaration(v)))
            }
            react_compiler_ast::declarations::Declaration::ClassDeclaration(c) => {
                let ident = c
                    .id
                    .as_ref()
                    .map(|id| self.ident(&id.name, self.span(&id.base)))
                    .unwrap_or_else(|| self.ident("_anonymous", DUMMY_SP));
                let super_class = c
                    .super_class
                    .as_ref()
                    .map(|s| Box::new(self.convert_expression(s)));
                Decl::Class(ClassDecl {
                    ident,
                    declare: c.declare.unwrap_or(false),
                    class: Box::new(Class {
                        span: self.span(&c.base),
                        ctxt: SyntaxContext::empty(),
                        decorators: vec![],
                        body: vec![],
                        super_class,
                        is_abstract: false,
                        type_params: None,
                        super_type_params: None,
                        implements: vec![],
                    }),
                })
            }
            _ => {
                Decl::Var(Box::new(VarDecl {
                    span: DUMMY_SP,
                    ctxt: SyntaxContext::empty(),
                    kind: VarDeclKind::Const,
                    declare: true,
                    decls: vec![],
                }))
            }
        }
    }

    fn convert_export_named_specifiers(
        &self,
        decl: &ExportNamedDeclaration,
    ) -> ModuleItem {
        let specifiers = decl
            .specifiers
            .iter()
            .map(|s| self.convert_export_specifier(s))
            .collect();
        let src = decl.source.as_ref().map(|s| {
            Box::new(Str {
                span: self.span(&s.base),
                value: self.wtf8(&s.value),
                raw: None,
            })
        });
        let type_only = matches!(decl.export_kind.as_ref(), Some(ExportKind::Type));

        ModuleItem::ModuleDecl(ModuleDecl::ExportNamed(NamedExport {
            span: self.span(&decl.base),
            specifiers,
            src,
            type_only,
            with: None,
        }))
    }

    fn convert_export_specifier(
        &self,
        spec: &react_compiler_ast::declarations::ExportSpecifier,
    ) -> swc_ecma_ast::ExportSpecifier {
        match spec {
            react_compiler_ast::declarations::ExportSpecifier::ExportSpecifier(s) => {
                let orig = self.convert_module_export_name(&s.local);
                let exported = Some(self.convert_module_export_name(&s.exported));
                let is_type_only = matches!(s.export_kind.as_ref(), Some(ExportKind::Type));
                swc_ecma_ast::ExportSpecifier::Named(ExportNamedSpecifier {
                    span: self.span(&s.base),
                    orig,
                    exported,
                    is_type_only,
                })
            }
            react_compiler_ast::declarations::ExportSpecifier::ExportDefaultSpecifier(s) => {
                swc_ecma_ast::ExportSpecifier::Default(swc_ecma_ast::ExportDefaultSpecifier {
                    exported: self.ident(&s.exported.name, self.span(&s.exported.base)),
                })
            }
            react_compiler_ast::declarations::ExportSpecifier::ExportNamespaceSpecifier(s) => {
                let name = self.convert_module_export_name(&s.exported);
                swc_ecma_ast::ExportSpecifier::Namespace(ExportNamespaceSpecifier {
                    span: self.span(&s.base),
                    name,
                })
            }
        }
    }

    fn convert_export_default_to_module_item(
        &self,
        decl: &ExportDefaultDeclaration,
    ) -> ModuleItem {
        let span = self.span(&decl.base);
        match &*decl.declaration {
            BabelExportDefaultDecl::FunctionDeclaration(f) => {
                let fd = self.convert_function_declaration(f);
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(
                    swc_ecma_ast::ExportDefaultDecl {
                        span,
                        decl: swc_ecma_ast::DefaultDecl::Fn(FnExpr {
                            ident: Some(fd.ident),
                            function: fd.function,
                        }),
                    },
                ))
            }
            BabelExportDefaultDecl::ClassDeclaration(c) => {
                let ident = c
                    .id
                    .as_ref()
                    .map(|id| self.ident(&id.name, self.span(&id.base)));
                let super_class = c
                    .super_class
                    .as_ref()
                    .map(|s| Box::new(self.convert_expression(s)));
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(
                    swc_ecma_ast::ExportDefaultDecl {
                        span,
                        decl: swc_ecma_ast::DefaultDecl::Class(ClassExpr {
                            ident,
                            class: Box::new(Class {
                                span,
                                ctxt: SyntaxContext::empty(),
                                decorators: vec![],
                                body: vec![],
                                super_class,
                                is_abstract: false,
                                type_params: None,
                                super_type_params: None,
                                implements: vec![],
                            }),
                        }),
                    },
                ))
            }
            BabelExportDefaultDecl::Expression(e) => {
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(ExportDefaultExpr {
                    span,
                    expr: Box::new(self.convert_expression(e)),
                }))
            }
        }
    }

    fn convert_export_all_declaration(
        &self,
        decl: &ExportAllDeclaration,
    ) -> swc_ecma_ast::ExportAll {
        let src = Box::new(Str {
            span: self.span(&decl.source.base),
            value: self.wtf8(&decl.source.value),
            raw: None,
        });
        let type_only = matches!(decl.export_kind.as_ref(), Some(ExportKind::Type));
        swc_ecma_ast::ExportAll {
            span: self.span(&decl.base),
            src,
            type_only,
            with: None,
        }
    }

    // ===== Operators =====

    fn convert_binary_operator(&self, op: &BinaryOperator) -> BinaryOp {
        match op {
            BinaryOperator::Add => BinaryOp::Add,
            BinaryOperator::Sub => BinaryOp::Sub,
            BinaryOperator::Mul => BinaryOp::Mul,
            BinaryOperator::Div => BinaryOp::Div,
            BinaryOperator::Rem => BinaryOp::Mod,
            BinaryOperator::Exp => BinaryOp::Exp,
            BinaryOperator::Eq => BinaryOp::EqEq,
            BinaryOperator::StrictEq => BinaryOp::EqEqEq,
            BinaryOperator::Neq => BinaryOp::NotEq,
            BinaryOperator::StrictNeq => BinaryOp::NotEqEq,
            BinaryOperator::Lt => BinaryOp::Lt,
            BinaryOperator::Lte => BinaryOp::LtEq,
            BinaryOperator::Gt => BinaryOp::Gt,
            BinaryOperator::Gte => BinaryOp::GtEq,
            BinaryOperator::Shl => BinaryOp::LShift,
            BinaryOperator::Shr => BinaryOp::RShift,
            BinaryOperator::UShr => BinaryOp::ZeroFillRShift,
            BinaryOperator::BitOr => BinaryOp::BitOr,
            BinaryOperator::BitXor => BinaryOp::BitXor,
            BinaryOperator::BitAnd => BinaryOp::BitAnd,
            BinaryOperator::In => BinaryOp::In,
            BinaryOperator::Instanceof => BinaryOp::InstanceOf,
            BinaryOperator::Pipeline => BinaryOp::BitOr, // no pipeline in SWC
        }
    }

    fn convert_logical_operator(&self, op: &LogicalOperator) -> BinaryOp {
        match op {
            LogicalOperator::Or => BinaryOp::LogicalOr,
            LogicalOperator::And => BinaryOp::LogicalAnd,
            LogicalOperator::NullishCoalescing => BinaryOp::NullishCoalescing,
        }
    }

    fn convert_unary_operator(&self, op: &UnaryOperator) -> UnaryOp {
        match op {
            UnaryOperator::Neg => UnaryOp::Minus,
            UnaryOperator::Plus => UnaryOp::Plus,
            UnaryOperator::Not => UnaryOp::Bang,
            UnaryOperator::BitNot => UnaryOp::Tilde,
            UnaryOperator::TypeOf => UnaryOp::TypeOf,
            UnaryOperator::Void => UnaryOp::Void,
            UnaryOperator::Delete => UnaryOp::Delete,
            UnaryOperator::Throw => UnaryOp::Void, // no throw-as-unary in SWC
        }
    }

    fn convert_update_operator(&self, op: &UpdateOperator) -> UpdateOp {
        match op {
            UpdateOperator::Increment => UpdateOp::PlusPlus,
            UpdateOperator::Decrement => UpdateOp::MinusMinus,
        }
    }

    fn convert_assignment_operator(&self, op: &AssignmentOperator) -> AssignOp {
        match op {
            AssignmentOperator::Assign => AssignOp::Assign,
            AssignmentOperator::AddAssign => AssignOp::AddAssign,
            AssignmentOperator::SubAssign => AssignOp::SubAssign,
            AssignmentOperator::MulAssign => AssignOp::MulAssign,
            AssignmentOperator::DivAssign => AssignOp::DivAssign,
            AssignmentOperator::RemAssign => AssignOp::ModAssign,
            AssignmentOperator::ExpAssign => AssignOp::ExpAssign,
            AssignmentOperator::ShlAssign => AssignOp::LShiftAssign,
            AssignmentOperator::ShrAssign => AssignOp::RShiftAssign,
            AssignmentOperator::UShrAssign => AssignOp::ZeroFillRShiftAssign,
            AssignmentOperator::BitOrAssign => AssignOp::BitOrAssign,
            AssignmentOperator::BitXorAssign => AssignOp::BitXorAssign,
            AssignmentOperator::BitAndAssign => AssignOp::BitAndAssign,
            AssignmentOperator::OrAssign => AssignOp::OrAssign,
            AssignmentOperator::AndAssign => AssignOp::AndAssign,
            AssignmentOperator::NullishAssign => AssignOp::NullishAssign,
        }
    }
}
