use std::io::stderr;
use std::num::NonZeroU32;
use std::sync::Arc;

use forget_estree::{Binding, BindingId};
use swc::Compiler;
use swc_core::common::errors::Handler;
use swc_core::common::source_map::Pos;
use swc_core::common::{FileName, FilePathMapping, Mark, SourceMap, Span, SyntaxContext, GLOBALS};
use swc_core::ecma::ast::{
    AssignOp, BinaryOp, BlockStmt, BlockStmtOrExpr, Callee, Decl, EsVersion, Expr, ExprOrSpread,
    Function, Ident, Lit, MemberExpr, MemberProp, ModuleItem, Pat, PatOrExpr, Program, Stmt,
    UnaryOp, VarDecl, VarDeclKind, VarDeclOrExpr,
};
use swc_core::ecma::parser::Syntax;
use swc_core::ecma::transforms::base::resolver;
use swc_core::ecma::visit::FoldWith;

/// Parses source text into an forget_estree::Program via SWC, internally performing the parsing
/// and SWC -> ESTree conversion.
pub fn parse(
    source: &str,
    file: &str,
) -> Result<forget_estree::Program, Box<dyn std::error::Error>> {
    GLOBALS.set(&Default::default(), || {
        let cm = Arc::new(SourceMap::new(FilePathMapping::empty()));
        let c = Compiler::new(cm);
        let fm =
            c.cm.new_source_file(FileName::Real(file.into()), source.to_string());

        let handler = Handler::with_emitter_writer(Box::new(stderr()), Some(c.cm.clone()));

        let comments = c.comments().clone();
        let module = c.parse_js(
            fm.clone(),
            &handler,
            EsVersion::Es5,
            Syntax::Typescript(Default::default()),
            swc::config::IsModule::Bool(true),
            Some(&comments),
        )?;

        let context = Context {
            top_level_mark: Mark::new(),
            unresolved_mark: Mark::new(),
        };

        let module = c.run_transform(&handler, false, || {
            module.fold_with(&mut resolver(
                context.unresolved_mark,
                context.top_level_mark,
                true,
            ))
        });

        Ok(convert_program(&context, &module))
    })
}

#[derive(Debug)]
struct Context {
    unresolved_mark: Mark,
    top_level_mark: Mark,
}

fn convert_program(cx: &Context, program: &Program) -> forget_estree::Program {
    let mut program_items: Vec<forget_estree::ModuleItem>;
    match program {
        Program::Module(program) => {
            let body = &program.body;
            program_items = Vec::with_capacity(body.len());
            for item in body {
                program_items.push(convert_module_item(cx, item));
            }
        }
        Program::Script(program) => {
            let body = &program.body;
            program_items = Vec::with_capacity(body.len());
            for item in body {
                program_items.push(forget_estree::ModuleItem::Statement(convert_statement(
                    cx, item,
                )));
            }
        }
    };
    forget_estree::Program {
        source_type: if program.is_script() {
            forget_estree::SourceType::Script
        } else {
            forget_estree::SourceType::Module
        },
        body: program_items,
        // comments: None,
        loc: None,
        range: None,
    }
}

fn convert_module_item(cx: &Context, item: &ModuleItem) -> forget_estree::ModuleItem {
    match item {
        ModuleItem::Stmt(item) => forget_estree::ModuleItem::Statement(convert_statement(cx, item)),
        _ => todo!("translate module item {:#?}", item),
    }
}

fn convert_span(span: &Span) -> Option<forget_estree::SourceRange> {
    Some(forget_estree::SourceRange {
        start: span.lo().to_u32(),
        end: NonZeroU32::new(span.hi().to_u32())?,
    })
}

fn convert_decl_kind(kind: &VarDeclKind) -> forget_estree::VariableDeclarationKind {
    match kind {
        VarDeclKind::Const => forget_estree::VariableDeclarationKind::Const,
        VarDeclKind::Let => forget_estree::VariableDeclarationKind::Let,
        VarDeclKind::Var => forget_estree::VariableDeclarationKind::Var,
    }
}

fn convert_block_statement(cx: &Context, stmt: &BlockStmt) -> forget_estree::BlockStatement {
    let mut body: Vec<forget_estree::Statement> = Vec::with_capacity(stmt.stmts.len());
    for stmt in &stmt.stmts {
        body.push(convert_statement(cx, stmt));
    }
    forget_estree::BlockStatement {
        body,
        loc: None,
        range: convert_span(&stmt.span),
    }
}

fn convert_function(cx: &Context, id: Option<&Ident>, fun: &Function) -> forget_estree::Function {
    forget_estree::Function {
        id: id.map(|id| forget_estree::Identifier {
            name: id.sym.to_string(),
            binding: convert_binding(cx, id.span.ctxt),
            loc: None,
            range: convert_span(&id.span),
        }),
        params: fun
            .params
            .iter()
            .map(|param| convert_pattern(cx, &param.pat))
            .collect(),
        body: fun.body.as_ref().map(|body| {
            forget_estree::FunctionBody::BlockStatement(Box::new(convert_block_statement(cx, body)))
        }),
        is_async: fun.is_async,
        is_generator: fun.is_generator,
        loc: None,
        range: convert_span(&fun.span),
    }
}

fn convert_statement(cx: &Context, stmt: &Stmt) -> forget_estree::Statement {
    match stmt {
        Stmt::Decl(Decl::Fn(item)) => forget_estree::Statement::FunctionDeclaration(Box::new(
            forget_estree::FunctionDeclaration {
                function: convert_function(cx, Some(&item.ident), &item.function),
                loc: None,
                range: convert_span(&item.function.span),
            },
        )),
        Stmt::Decl(Decl::Var(item)) => forget_estree::Statement::VariableDeclaration(Box::new(
            convert_variable_declaration(cx, item),
        )),
        Stmt::Block(item) => {
            forget_estree::Statement::BlockStatement(Box::new(convert_block_statement(cx, item)))
        }
        Stmt::Break(item) => {
            forget_estree::Statement::BreakStatement(Box::new(forget_estree::BreakStatement {
                label: item
                    .label
                    .as_ref()
                    .map(|label| convert_identifier(cx, label)),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Continue(item) => forget_estree::Statement::ContinueStatement(Box::new(
            forget_estree::ContinueStatement {
                label: item
                    .label
                    .as_ref()
                    .map(|label| convert_identifier(cx, label)),
                loc: None,
                range: convert_span(&item.span),
            },
        )),
        Stmt::Debugger(item) => forget_estree::Statement::DebuggerStatement(Box::new(
            forget_estree::DebuggerStatement {
                loc: None,
                range: convert_span(&item.span),
            },
        )),
        Stmt::DoWhile(item) => {
            forget_estree::Statement::DoWhileStatement(Box::new(forget_estree::DoWhileStatement {
                body: convert_statement(cx, &item.body),
                test: convert_expression(cx, &item.test),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Empty(item) => {
            forget_estree::Statement::EmptyStatement(Box::new(forget_estree::EmptyStatement {
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Expr(item) => {
            let expression = convert_expression(cx, &item.expr);
            forget_estree::Statement::ExpressionStatement(Box::new(
                forget_estree::ExpressionStatement {
                    expression,
                    directive: None,
                    loc: None,
                    range: convert_span(&item.span),
                },
            ))
        }
        Stmt::For(item) => {
            forget_estree::Statement::ForStatement(Box::new(forget_estree::ForStatement {
                init: item.init.as_ref().map(|init| match init {
                    VarDeclOrExpr::Expr(init) => {
                        forget_estree::ForInit::Expression(convert_expression(cx, init))
                    }
                    VarDeclOrExpr::VarDecl(init) => {
                        assert_eq!(init.decls.len(), 1);
                        forget_estree::ForInit::VariableDeclaration(Box::new(
                            convert_variable_declaration(cx, init),
                        ))
                    }
                }),
                test: item.test.as_ref().map(|test| convert_expression(cx, test)),
                update: item
                    .update
                    .as_ref()
                    .map(|update| convert_expression(cx, update)),
                body: convert_statement(cx, &item.body),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Return(item) => {
            forget_estree::Statement::ReturnStatement(Box::new(forget_estree::ReturnStatement {
                argument: item.arg.as_ref().map(|arg| convert_expression(cx, arg)),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Throw(item) => {
            forget_estree::Statement::ThrowStatement(Box::new(forget_estree::ThrowStatement {
                argument: convert_expression(cx, &item.arg),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::If(item) => {
            forget_estree::Statement::IfStatement(Box::new(forget_estree::IfStatement {
                test: convert_expression(cx, &item.test),
                consequent: convert_statement(cx, &item.cons),
                alternate: item.alt.as_ref().map(|alt| convert_statement(cx, alt)),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        _ => todo!("translate statement {:#?}", stmt),
    }
}

fn convert_variable_declaration(
    cx: &Context,
    decl: &VarDecl,
) -> forget_estree::VariableDeclaration {
    forget_estree::VariableDeclaration {
        kind: convert_decl_kind(&decl.kind),
        declarations: decl
            .decls
            .iter()
            .map(|declarator| forget_estree::VariableDeclarator {
                id: convert_pattern(cx, &declarator.name),
                init: declarator
                    .init
                    .as_ref()
                    .map(|init| convert_expression(cx, init)),
                loc: None,
                range: convert_span(&decl.span),
            })
            .collect(),
        loc: None,
        range: convert_span(&decl.span),
    }
}

fn convert_expression(cx: &Context, expr: &Expr) -> forget_estree::Expression {
    match expr {
        Expr::Ident(expr) => {
            forget_estree::Expression::Identifier(Box::new(convert_identifier(cx, expr)))
        }
        Expr::Array(expr) => {
            forget_estree::Expression::ArrayExpression(Box::new(forget_estree::ArrayExpression {
                elements: expr
                    .elems
                    .iter()
                    .map(|item| match item {
                        Some(ExprOrSpread {
                            spread: Some(spread),
                            expr,
                        }) => Some(forget_estree::ExpressionOrSpread::SpreadElement(Box::new(
                            forget_estree::SpreadElement {
                                argument: convert_expression(cx, expr),
                                loc: None,
                                range: convert_span(&spread),
                            },
                        ))),
                        Some(ExprOrSpread { spread: None, expr }) => {
                            Some(forget_estree::ExpressionOrSpread::Expression(
                                convert_expression(cx, expr),
                            ))
                        }
                        None => None,
                    })
                    .collect(),
                loc: None,
                range: convert_span(&expr.span),
            }))
        }
        Expr::Call(expr) => {
            forget_estree::Expression::CallExpression(Box::new(forget_estree::CallExpression {
                callee: match &expr.callee {
                    Callee::Expr(callee) => {
                        forget_estree::ExpressionOrSuper::Expression(convert_expression(cx, callee))
                    }
                    _ => todo!(),
                },
                arguments: expr
                    .args
                    .iter()
                    .map(|arg| match arg {
                        ExprOrSpread {
                            spread: Some(spread),
                            expr,
                        } => forget_estree::ExpressionOrSpread::SpreadElement(Box::new(
                            forget_estree::SpreadElement {
                                argument: convert_expression(cx, expr),
                                loc: None,
                                range: convert_span(&spread),
                            },
                        )),
                        ExprOrSpread { spread: None, expr } => {
                            forget_estree::ExpressionOrSpread::Expression(convert_expression(
                                cx, expr,
                            ))
                        }
                    })
                    .collect(),
                is_optional: false,
                loc: None,
                range: convert_span(&expr.span),
            }))
        }
        Expr::Await(_expr) => {
            // forget_estree::Expression::AwaitExpression(Box::new(forget_estree::AwaitExpression {
            //     argument: convert_expression(cx, &expr.arg),
            //     loc: None,
            //     range: convert_span(&expr.span),
            // }))
            todo!("await expression")
        }
        Expr::Unary(expr) => {
            forget_estree::Expression::UnaryExpression(Box::new(forget_estree::UnaryExpression {
                operator: convert_unary_operator(expr.op),
                prefix: false,
                argument: convert_expression(cx, &expr.arg),
                loc: None,
                range: convert_span(&expr.span),
            }))
        }
        Expr::Bin(expr) => match convert_binary_operator(expr.op) {
            Operator::Binary(op) => forget_estree::Expression::BinaryExpression(Box::new(
                forget_estree::BinaryExpression {
                    operator: op,
                    left: convert_expression(cx, &expr.left),
                    right: convert_expression(cx, &expr.right),
                    loc: None,
                    range: convert_span(&expr.span),
                },
            )),
            Operator::Logical(op) => forget_estree::Expression::LogicalExpression(Box::new(
                forget_estree::LogicalExpression {
                    operator: op,
                    left: convert_expression(cx, &expr.left),
                    right: convert_expression(cx, &expr.right),
                    loc: None,
                    range: convert_span(&expr.span),
                },
            )),
        },
        Expr::Lit(expr) => {
            let (value, range) = match expr {
                Lit::Bool(expr) => (
                    forget_estree::JsValue::Bool(expr.value),
                    convert_span(&expr.span),
                ),
                Lit::Num(expr) => (
                    forget_estree::JsValue::Number(expr.value.into()),
                    convert_span(&expr.span),
                ),
                Lit::Str(expr) => (
                    forget_estree::JsValue::String(expr.value.to_string()),
                    convert_span(&expr.span),
                ),
                Lit::Null(expr) => (forget_estree::JsValue::Null, convert_span(&expr.span)),
                _ => todo!(),
            };
            forget_estree::Expression::Literal(Box::new(forget_estree::Literal {
                value,
                raw: None,
                loc: None,
                regex: None,
                range,
                bigint: None,
            }))
        }
        Expr::Assign(expr) => forget_estree::Expression::AssignmentExpression(Box::new(
            forget_estree::AssignmentExpression {
                operator: convert_assignment_operator(expr.op),
                left: convert_assignment_target(cx, &expr.left),
                right: convert_expression(cx, &expr.right),
                loc: None,
                range: convert_span(&expr.span),
            },
        )),
        Expr::Member(expr) => forget_estree::Expression::MemberExpression(Box::new(
            convert_member_expression(cx, expr),
        )),
        Expr::Fn(expr) => forget_estree::Expression::FunctionExpression(Box::new(
            forget_estree::FunctionExpression {
                function: convert_function(cx, expr.ident.as_ref(), &expr.function),
                loc: None,
                range: convert_span(&expr.function.span),
            },
        )),
        Expr::Arrow(expr) => forget_estree::Expression::ArrowFunctionExpression(Box::new(
            forget_estree::ArrowFunctionExpression {
                function: forget_estree::Function {
                    id: None,
                    body: match expr.body.as_ref() {
                        BlockStmtOrExpr::Expr(body) => Some(
                            forget_estree::FunctionBody::Expression(convert_expression(cx, body)),
                        ),
                        BlockStmtOrExpr::BlockStmt(body) => {
                            Some(forget_estree::FunctionBody::BlockStatement(Box::new(
                                convert_block_statement(cx, body),
                            )))
                        }
                    },
                    params: expr
                        .params
                        .iter()
                        .map(|param| convert_pattern(cx, param))
                        .collect(),
                    is_generator: expr.is_generator,
                    is_async: expr.is_async,
                    loc: None,
                    range: convert_span(&expr.span),
                },
                is_expression: true, // TODO
                loc: None,
                range: convert_span(&expr.span),
            },
        )),
        _ => todo!("translate expression {:#?}", expr),
    }
}

fn convert_assignment_target(cx: &Context, target: &PatOrExpr) -> forget_estree::AssignmentTarget {
    match target {
        PatOrExpr::Pat(target) => {
            forget_estree::AssignmentTarget::Pattern(convert_pattern(cx, target))
        }
        PatOrExpr::Expr(target) => match target.as_ref() {
            Expr::Member(target) => forget_estree::AssignmentTarget::Expression(
                forget_estree::Expression::MemberExpression(Box::new(convert_member_expression(
                    cx, target,
                ))),
            ),
            Expr::Ident(target) => forget_estree::AssignmentTarget::Pattern(
                forget_estree::Pattern::Identifier(Box::new(convert_identifier(cx, target))),
            ),
            _ => {
                panic!(
                    "Expected assignment target to be member expression or identifier, got {:#?}",
                    target
                )
            }
        },
    }
}

fn convert_member_expression(cx: &Context, expr: &MemberExpr) -> forget_estree::MemberExpression {
    let (is_computed, property) = match &expr.prop {
        MemberProp::Ident(prop) => (
            false,
            forget_estree::Expression::Identifier(Box::new(convert_identifier(cx, prop))),
        ),
        MemberProp::Computed(prop) => (true, convert_expression(cx, &prop.expr)),
        _ => {
            panic!("PrivateName member expression properties are not supported")
        }
    };
    forget_estree::MemberExpression {
        object: forget_estree::ExpressionOrSuper::Expression(convert_expression(cx, &expr.obj)),
        property,
        is_computed,
        is_optional: false,
        loc: None,
        range: convert_span(&expr.span),
    }
}

fn convert_unary_operator(op: UnaryOp) -> forget_estree::UnaryOperator {
    match op {
        UnaryOp::Bang => forget_estree::UnaryOperator::Negation,
        UnaryOp::Delete => forget_estree::UnaryOperator::Delete,
        UnaryOp::Minus => forget_estree::UnaryOperator::Minus,
        UnaryOp::Plus => forget_estree::UnaryOperator::Plus,
        UnaryOp::Tilde => forget_estree::UnaryOperator::Tilde,
        UnaryOp::TypeOf => forget_estree::UnaryOperator::Typeof,
        UnaryOp::Void => forget_estree::UnaryOperator::Void,
    }
}

fn convert_assignment_operator(op: AssignOp) -> forget_estree::AssignmentOperator {
    match op {
        AssignOp::Assign => forget_estree::AssignmentOperator::Equals,
        AssignOp::AddAssign => forget_estree::AssignmentOperator::PlusEquals,
        _ => todo!("translate assignment operator"),
    }
}

enum Operator {
    Binary(forget_estree::BinaryOperator),
    Logical(forget_estree::LogicalOperator),
}

fn convert_binary_operator(op: BinaryOp) -> Operator {
    match op {
        BinaryOp::Add => Operator::Binary(forget_estree::BinaryOperator::Add),
        BinaryOp::BitAnd => Operator::Binary(forget_estree::BinaryOperator::BinaryAnd),
        BinaryOp::BitOr => Operator::Binary(forget_estree::BinaryOperator::BinaryOr),
        BinaryOp::BitXor => Operator::Binary(forget_estree::BinaryOperator::BinaryXor),
        BinaryOp::Div => Operator::Binary(forget_estree::BinaryOperator::Divide),
        BinaryOp::EqEq => Operator::Binary(forget_estree::BinaryOperator::Equals),
        BinaryOp::EqEqEq => Operator::Binary(forget_estree::BinaryOperator::StrictEquals),
        // BinaryOp::Exp => Operator::Binary(forget_estree::BinaryOperator::AsteriskAsterisk),
        BinaryOp::Gt => Operator::Binary(forget_estree::BinaryOperator::GreaterThan),
        BinaryOp::GtEq => Operator::Binary(forget_estree::BinaryOperator::GreaterThanOrEqual),
        BinaryOp::In => Operator::Binary(forget_estree::BinaryOperator::In),
        BinaryOp::InstanceOf => Operator::Binary(forget_estree::BinaryOperator::Instanceof),
        BinaryOp::LShift => Operator::Binary(forget_estree::BinaryOperator::ShiftLeft),
        BinaryOp::Lt => Operator::Binary(forget_estree::BinaryOperator::LessThan),
        BinaryOp::LtEq => Operator::Binary(forget_estree::BinaryOperator::LessThanOrEqual),
        BinaryOp::Mod => Operator::Binary(forget_estree::BinaryOperator::Modulo),
        BinaryOp::Mul => Operator::Binary(forget_estree::BinaryOperator::Multiply),
        BinaryOp::NotEq => Operator::Binary(forget_estree::BinaryOperator::NotEquals),
        BinaryOp::NotEqEq => Operator::Binary(forget_estree::BinaryOperator::NotStrictEquals),
        BinaryOp::RShift => Operator::Binary(forget_estree::BinaryOperator::ShiftRight),
        BinaryOp::Sub => Operator::Binary(forget_estree::BinaryOperator::Subtract),
        BinaryOp::ZeroFillRShift => {
            Operator::Binary(forget_estree::BinaryOperator::UnsignedShiftRight)
        }

        BinaryOp::LogicalAnd => Operator::Logical(forget_estree::LogicalOperator::And),
        BinaryOp::LogicalOr => Operator::Logical(forget_estree::LogicalOperator::Or),
        BinaryOp::NullishCoalescing => {
            Operator::Logical(forget_estree::LogicalOperator::NullCoalescing)
        }

        _ => panic!("Unsupported binary operator `{}`", op),
    }
}

fn convert_pattern(cx: &Context, pat: &Pat) -> forget_estree::Pattern {
    match pat {
        Pat::Ident(pat) => {
            forget_estree::Pattern::Identifier(Box::new(forget_estree::Identifier {
                name: pat.id.sym.to_string(),
                binding: convert_binding(cx, pat.id.span.ctxt),
                loc: None,
                range: convert_span(&pat.span),
            }))
        }
        _ => todo!("translate pattern {:#?}", pat),
    }
}

fn convert_binding(context: &Context, binding_cx: SyntaxContext) -> Option<Binding> {
    let id = BindingId::new(binding_cx.as_u32());
    if binding_cx.as_u32() == context.top_level_mark.as_u32() {
        Some(Binding::Global)
    } else if binding_cx.as_u32() == context.unresolved_mark.as_u32() {
        Some(Binding::Module(id))
    } else {
        Some(Binding::Local(id))
    }
}

fn convert_identifier(cx: &Context, identifier: &Ident) -> forget_estree::Identifier {
    let name = identifier.sym.as_ref().to_string();
    forget_estree::Identifier {
        name,
        binding: convert_binding(cx, identifier.span.ctxt),
        loc: None,
        range: convert_span(&identifier.span),
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {}
}
