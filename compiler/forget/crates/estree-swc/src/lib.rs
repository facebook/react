use std::{io::stderr, num::NonZeroU32, sync::Arc};

use estree::{Binding, BindingId};
use swc::Compiler;
use swc_core::common::errors::Handler;
use swc_core::common::source_map::Pos;
use swc_core::common::{FileName, FilePathMapping, Mark, SourceMap, Span, SyntaxContext, GLOBALS};
use swc_core::ecma::ast::{
    AssignOp, BinaryOp, BlockStmt, Decl, EsVersion, Expr, Ident, Lit, MemberExpr, ModuleItem, Pat,
    PatOrExpr, Program, Stmt, UnaryOp, VarDecl, VarDeclKind, VarDeclOrExpr,
};
use swc_core::ecma::parser::Syntax;
use swc_core::ecma::transforms::base::resolver;
use swc_core::ecma::visit::FoldWith;

/// Parses source text into an estree::Program via SWC, internally performing the parsing
/// and SWC -> ESTree conversion.
pub fn parse(source: &str, file: &str) -> Result<estree::Program, Box<dyn std::error::Error>> {
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

fn convert_program(cx: &Context, program: &Program) -> estree::Program {
    let mut program_items: Vec<estree::ModuleItem>;
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
                program_items.push(estree::ModuleItem::Statement(Box::new(convert_statement(
                    cx, item,
                ))));
            }
        }
    };
    estree::Program {
        source_type: if program.is_script() {
            estree::SourceType::Script
        } else {
            estree::SourceType::Module
        },
        body: program_items,
        comments: None,
        loc: None,
        range: None,
    }
}

fn convert_module_item(cx: &Context, item: &ModuleItem) -> estree::ModuleItem {
    match item {
        ModuleItem::Stmt(item) => {
            estree::ModuleItem::Statement(Box::new(convert_statement(cx, item)))
        }
        _ => todo!("translate module item {:#?}", item),
    }
}

fn convert_span(span: &Span) -> Option<estree::SourceRange> {
    Some(estree::SourceRange {
        start: span.lo().to_u32(),
        end: NonZeroU32::new(span.hi().to_u32())?,
    })
}

fn convert_decl_kind(kind: &VarDeclKind) -> estree::VariableDeclarationKind {
    match kind {
        VarDeclKind::Const => estree::VariableDeclarationKind::Const,
        VarDeclKind::Let => estree::VariableDeclarationKind::Let,
        VarDeclKind::Var => estree::VariableDeclarationKind::Var,
    }
}

fn convert_block_statement(cx: &Context, stmt: &BlockStmt) -> estree::BlockStatement {
    let mut body: Vec<estree::Statement> = Vec::with_capacity(stmt.stmts.len());
    for stmt in &stmt.stmts {
        body.push(convert_statement(cx, stmt));
    }
    estree::BlockStatement {
        body,
        loc: None,
        range: convert_span(&stmt.span),
    }
}

fn convert_statement(cx: &Context, stmt: &Stmt) -> estree::Statement {
    match stmt {
        Stmt::Decl(Decl::Fn(item)) => {
            let name = item.ident.sym.to_string();
            estree::Statement::FunctionDeclaration(Box::new(estree::FunctionDeclaration {
                id: Some(estree::Identifier {
                    name,
                    binding: convert_binding(cx, item.ident.span.ctxt),
                    loc: None,
                    range: convert_span(&item.ident.span),
                }),
                params: item
                    .function
                    .params
                    .iter()
                    .map(|param| convert_pattern(cx, &param.pat))
                    .collect(),
                body: item.function.body.as_ref().map(|body| {
                    estree::Statement::BlockStatement(Box::new(convert_block_statement(cx, body)))
                }),
                is_async: item.function.is_async,
                is_generator: item.function.is_generator,
                loc: None,
                range: convert_span(&item.function.span),
            }))
        }
        Stmt::Decl(Decl::Var(item)) => {
            estree::Statement::VariableDeclaration(Box::new(convert_variable_declaration(cx, item)))
        }
        Stmt::Block(item) => {
            estree::Statement::BlockStatement(Box::new(convert_block_statement(cx, item)))
        }
        Stmt::Break(item) => estree::Statement::BreakStatement(Box::new(estree::BreakStatement {
            label: item
                .label
                .as_ref()
                .map(|label| convert_identifier(cx, label)),
            loc: None,
            range: convert_span(&item.span),
        })),
        Stmt::Continue(item) => {
            estree::Statement::ContinueStatement(Box::new(estree::ContinueStatement {
                label: item
                    .label
                    .as_ref()
                    .map(|label| convert_identifier(cx, label)),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Debugger(item) => {
            estree::Statement::DebuggerStatement(Box::new(estree::DebuggerStatement {
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::DoWhile(item) => {
            estree::Statement::DoWhileStatement(Box::new(estree::DoWhileStatement {
                body: convert_statement(cx, &item.body),
                test: convert_expression(cx, &item.test),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Empty(item) => estree::Statement::EmptyStatement(Box::new(estree::EmptyStatement {
            loc: None,
            range: convert_span(&item.span),
        })),
        Stmt::Expr(item) => {
            let expression = convert_expression(cx, &item.expr);
            estree::Statement::ExpressionStatement(Box::new(estree::ExpressionStatement {
                expression,
                directive: None,
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::For(item) => estree::Statement::ForStatement(Box::new(estree::ForStatement {
            init: item.init.as_ref().map(|init| match init {
                VarDeclOrExpr::Expr(init) => {
                    estree::ForInit::Expression(Box::new(convert_expression(cx, init)))
                }
                VarDeclOrExpr::VarDecl(init) => {
                    assert_eq!(init.decls.len(), 1);
                    estree::ForInit::VariableDeclaration(Box::new(convert_variable_declaration(
                        cx, init,
                    )))
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
        })),
        Stmt::Return(item) => {
            estree::Statement::ReturnStatement(Box::new(estree::ReturnStatement {
                argument: item.arg.as_ref().map(|arg| convert_expression(cx, arg)),
                loc: None,
                range: convert_span(&item.span),
            }))
        }
        Stmt::Throw(item) => estree::Statement::ThrowStatement(Box::new(estree::ThrowStatement {
            argument: convert_expression(cx, &item.arg),
            loc: None,
            range: convert_span(&item.span),
        })),
        Stmt::If(item) => estree::Statement::IfStatement(Box::new(estree::IfStatement {
            test: convert_expression(cx, &item.test),
            consequent: convert_statement(cx, &item.cons),
            alternate: item.alt.as_ref().map(|alt| convert_statement(cx, alt)),
            loc: None,
            range: convert_span(&item.span),
        })),
        _ => todo!("translate statement {:#?}", stmt),
    }
}

fn convert_variable_declaration(cx: &Context, decl: &VarDecl) -> estree::VariableDeclaration {
    estree::VariableDeclaration {
        kind: convert_decl_kind(&decl.kind),
        declarations: decl
            .decls
            .iter()
            .map(|declarator| estree::VariableDeclarator {
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

fn convert_expression(cx: &Context, expr: &Expr) -> estree::ExpressionLike {
    match expr {
        Expr::Ident(expr) => {
            estree::ExpressionLike::Identifier(Box::new(convert_identifier(cx, expr)))
        }
        Expr::Array(expr) => {
            estree::ExpressionLike::ArrayExpression(Box::new(estree::ArrayExpression {
                elements: expr
                    .elems
                    .iter()
                    .map(|item| {
                        // TODO: represent holes in array expressions
                        let value = item.as_ref().unwrap();
                        match value.spread {
                            Some(spread) => estree::ExpressionLike::SpreadElement(Box::new(
                                estree::SpreadElement {
                                    argument: convert_expression(cx, &value.expr),
                                    loc: None,
                                    range: convert_span(&spread),
                                },
                            )),
                            None => convert_expression(cx, &value.expr),
                        }
                    })
                    .collect(),
                loc: None,
                range: convert_span(&expr.span),
            }))
        }
        Expr::Await(expr) => {
            estree::ExpressionLike::AwaitExpression(Box::new(estree::AwaitExpression {
                argument: convert_expression(cx, &expr.arg),
                loc: None,
                range: convert_span(&expr.span),
            }))
        }
        Expr::Unary(expr) => {
            estree::ExpressionLike::UnaryExpression(Box::new(estree::UnaryExpression {
                operator: convert_unary_operator(expr.op),
                is_prefix: false,
                argument: convert_expression(cx, &expr.arg),
                loc: None,
                range: convert_span(&expr.span),
            }))
        }
        Expr::Bin(expr) => match convert_binary_operator(expr.op) {
            Operator::Binary(op) => {
                estree::ExpressionLike::BinaryExpression(Box::new(estree::BinaryExpression {
                    operator: op,
                    left: convert_expression(cx, &expr.left),
                    right: convert_expression(cx, &expr.right),
                    loc: None,
                    range: convert_span(&expr.span),
                }))
            }
            Operator::Logical(op) => {
                estree::ExpressionLike::LogicalExpression(Box::new(estree::LogicalExpression {
                    operator: op,
                    left: convert_expression(cx, &expr.left),
                    right: convert_expression(cx, &expr.right),
                    loc: None,
                    range: convert_span(&expr.span),
                }))
            }
        },
        Expr::Lit(expr) => {
            let (value, range) = match expr {
                Lit::Bool(expr) => (
                    estree::LiteralValue::Boolean(expr.value),
                    convert_span(&expr.span),
                ),
                Lit::Num(expr) => (
                    estree::LiteralValue::Number(expr.value.into()),
                    convert_span(&expr.span),
                ),
                Lit::Str(expr) => (
                    estree::LiteralValue::String(expr.value.to_string()),
                    convert_span(&expr.span),
                ),
                Lit::Null(expr) => (estree::LiteralValue::Null, convert_span(&expr.span)),
                _ => todo!(),
            };
            estree::ExpressionLike::Literal(Box::new(estree::Literal {
                value,
                raw: None,
                loc: None,
                range,
            }))
        }
        Expr::Assign(expr) => {
            estree::ExpressionLike::AssignmentExpression(Box::new(estree::AssignmentExpression {
                operator: convert_assignment_operator(expr.op),
                left: convert_assignment_target(cx, &expr.left),
                right: convert_expression(cx, &expr.right),
                loc: None,
                range: convert_span(&expr.span),
            }))
        }
        _ => todo!("translate expression {:#?}", expr),
    }
}

fn convert_assignment_target(cx: &Context, target: &PatOrExpr) -> estree::AssignmentTarget {
    match target {
        PatOrExpr::Pat(target) => {
            estree::AssignmentTarget::Pattern(Box::new(convert_pattern(cx, target)))
        }
        PatOrExpr::Expr(target) => {
            if let Expr::Member(target) = target.as_ref() {
                estree::AssignmentTarget::MemberExpression(Box::new(convert_member_expression(
                    cx, target,
                )))
            } else {
                panic!(
                    "Invalid input, expected either a pattern or member expression, got {:#?}",
                    target
                )
            }
        }
    }
}

fn convert_member_expression(_cx: &Context, _expr: &MemberExpr) -> estree::MemberExpression {
    todo!("convert member expression")
}

fn convert_unary_operator(op: UnaryOp) -> estree::UnaryOperator {
    match op {
        UnaryOp::Bang => estree::UnaryOperator::Exclamation,
        UnaryOp::Delete => estree::UnaryOperator::Delete,
        UnaryOp::Minus => estree::UnaryOperator::Minus,
        UnaryOp::Plus => estree::UnaryOperator::Plus,
        UnaryOp::Tilde => estree::UnaryOperator::Tilde,
        UnaryOp::TypeOf => estree::UnaryOperator::Typeof,
        UnaryOp::Void => estree::UnaryOperator::Void,
    }
}

fn convert_assignment_operator(op: AssignOp) -> estree::AssignmentOperator {
    match op {
        AssignOp::Assign => estree::AssignmentOperator::Equals,
        AssignOp::AddAssign => estree::AssignmentOperator::PlusEquals,
        _ => todo!("translate assignment operator"),
    }
}

enum Operator {
    Binary(estree::BinaryOperator),
    Logical(estree::LogicalOperator),
}

fn convert_binary_operator(op: BinaryOp) -> Operator {
    match op {
        BinaryOp::Add => Operator::Binary(estree::BinaryOperator::Plus),
        BinaryOp::BitAnd => Operator::Binary(estree::BinaryOperator::Ampersand),
        BinaryOp::BitOr => Operator::Binary(estree::BinaryOperator::Pipe),
        BinaryOp::BitXor => Operator::Binary(estree::BinaryOperator::Caret),
        BinaryOp::Div => Operator::Binary(estree::BinaryOperator::Slash),
        BinaryOp::EqEq => Operator::Binary(estree::BinaryOperator::EqualsEquals),
        BinaryOp::EqEqEq => Operator::Binary(estree::BinaryOperator::TripleEquals),
        BinaryOp::Exp => Operator::Binary(estree::BinaryOperator::AsteriskAsterisk),
        BinaryOp::Gt => Operator::Binary(estree::BinaryOperator::GreaterThan),
        BinaryOp::GtEq => Operator::Binary(estree::BinaryOperator::GreaterThanEquals),
        BinaryOp::In => Operator::Binary(estree::BinaryOperator::In),
        BinaryOp::InstanceOf => Operator::Binary(estree::BinaryOperator::Instanceof),
        BinaryOp::LShift => Operator::Binary(estree::BinaryOperator::LtLt),
        BinaryOp::Lt => Operator::Binary(estree::BinaryOperator::LessThan),
        BinaryOp::LtEq => Operator::Binary(estree::BinaryOperator::LessThanEquals),
        BinaryOp::Mod => Operator::Binary(estree::BinaryOperator::Percent),
        BinaryOp::Mul => Operator::Binary(estree::BinaryOperator::Asterisk),
        BinaryOp::NotEq => Operator::Binary(estree::BinaryOperator::NotEquals),
        BinaryOp::NotEqEq => Operator::Binary(estree::BinaryOperator::NotTripleEquals),
        BinaryOp::RShift => Operator::Binary(estree::BinaryOperator::GtGt),
        BinaryOp::Sub => Operator::Binary(estree::BinaryOperator::Minus),
        BinaryOp::ZeroFillRShift => Operator::Binary(estree::BinaryOperator::GtGtGt),

        BinaryOp::LogicalAnd => Operator::Logical(estree::LogicalOperator::AmpersandAmpersand),
        BinaryOp::LogicalOr => Operator::Logical(estree::LogicalOperator::PipePipe),
        BinaryOp::NullishCoalescing => Operator::Logical(estree::LogicalOperator::QuestionQuestion),
    }
}

fn convert_pattern(cx: &Context, pat: &Pat) -> estree::Pattern {
    match pat {
        Pat::Ident(pat) => estree::Pattern::Identifier(Box::new(estree::Identifier {
            name: pat.id.sym.to_string(),
            binding: convert_binding(cx, pat.id.span.ctxt),
            loc: None,
            range: convert_span(&pat.span),
        })),
        _ => todo!("translate pattern {:#?}", pat),
    }
}

fn convert_binding(context: &Context, binding_cx: SyntaxContext) -> Option<Binding> {
    let id = BindingId::new(NonZeroU32::new(binding_cx.as_u32()).unwrap());
    if binding_cx.as_u32() == context.top_level_mark.as_u32() {
        Some(Binding::Global)
    } else if binding_cx.as_u32() == context.unresolved_mark.as_u32() {
        Some(Binding::Module(id))
    } else {
        Some(Binding::Local(id))
    }
}

fn convert_identifier(cx: &Context, identifier: &Ident) -> estree::Identifier {
    let name = identifier.sym.as_ref().to_string();
    estree::Identifier {
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
