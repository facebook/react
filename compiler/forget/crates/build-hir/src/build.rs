use bumpalo::collections::{CollectIn, String};
use estree::{ExpressionLike, FunctionDeclaration, Literal, LiteralValue, Statement};
use hir::{
    ArrayElement, BlockKind, Environment, Function, GotoKind, Identifier, InstructionValue,
    LoadLocal, Place, PrimitiveValue, TerminalValue,
};

use crate::builder::Builder;

/// Converts a React function in ESTree format into HIR. Returns the HIR
/// if it was constructed sucessfully, otherwise a list of diagnostics
/// if the input could be not be converted to HIR.
///
/// Failures generally include nonsensical input (`delete 1`) or syntax
/// that is not yet supported.
pub fn build<'a>(
    environment: &'a Environment<'a>,
    fun: FunctionDeclaration,
) -> Result<Function<'a>, Diagnostic> {
    let mut builder = Builder::new(environment);

    lower_statement(environment, &mut builder, fun.body.unwrap(), None)?;

    // In case the function did not explicitly return, terminate the final
    // block with an explicit `return undefined`. If the function *did* return,
    // this will be unreachable and get pruned later.
    let implicit_return_value = lower_value_to_temporary(
        environment,
        &mut builder,
        InstructionValue::Primitive(hir::Primitive {
            value: PrimitiveValue::Undefined,
        }),
    );
    builder.terminate(
        TerminalValue::ReturnTerminal(hir::ReturnTerminal {
            value: implicit_return_value,
        }),
        hir::BlockKind::Block,
    );

    let body = builder.build()?;
    Ok(Function {
        body,
        is_async: fun.is_async,
        is_generator: fun.is_generator,
    })
}

/// Convert a statement to HIR. This will often result in multiple instructions and blocks
/// being created as statements often describe control flow.
fn lower_statement<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    stmt: Statement,
    label: Option<String<'a>>,
) -> Result<(), Diagnostic> {
    match stmt {
        Statement::BlockStatement(stmt) => {
            for stmt in stmt.body {
                lower_statement(env, builder, stmt, None)?;
            }
        }
        Statement::BreakStatement(stmt) => {
            let block = builder.resolve_break(stmt.label)?;
            builder.terminate(
                TerminalValue::GotoTerminal(hir::GotoTerminal {
                    block,
                    kind: GotoKind::Break,
                }),
                BlockKind::Block,
            );
        }
        Statement::ContinueStatement(stmt) => {
            let block = builder.resolve_continue(stmt.label)?;
            builder.terminate(
                TerminalValue::GotoTerminal(hir::GotoTerminal {
                    block,
                    kind: GotoKind::Continue,
                }),
                BlockKind::Block,
            );
        }
        Statement::ReturnStatement(stmt) => {
            let value = match stmt.argument {
                Some(argument) => lower_expression_to_temporary(env, builder, argument),
                None => lower_value_to_temporary(
                    env,
                    builder,
                    InstructionValue::Primitive(hir::Primitive {
                        value: PrimitiveValue::Undefined,
                    }),
                ),
            };
            builder.terminate(
                TerminalValue::ReturnTerminal(hir::ReturnTerminal { value }),
                BlockKind::Block,
            );
        }
        Statement::ExpressionStatement(stmt) => {
            // TODO: port the logic for emitting an ExpressionStatement instr if the instr
            // was a logical or conditional. is that even necessary anymore?
            lower_expression_to_temporary(env, builder, stmt.expression);
        }
        Statement::EmptyStatement(_) => {
            // no-op
        }
        _ => todo!(),
    }
    Ok(())
}

/// Shortcut for lowering an expression and saving the result to a temporary
fn lower_expression_to_temporary<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    expr: ExpressionLike,
) -> Place<'a> {
    let value = lower_expression(env, builder, expr);
    lower_value_to_temporary(env, builder, value)
}

/// Converts an ESTree Expression into an HIR InstructionValue. Note that while only a single
/// InstructionValue is returned, this function is recursive and may cause multiple instructions
/// to be emitted, possibly across multiple basic blocks (in the case of expressions with control
/// flow semenatics such as logical, conditional, and optional expressions).
fn lower_expression<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    expr: ExpressionLike,
) -> InstructionValue<'a> {
    match expr {
        ExpressionLike::Literal(expr) => InstructionValue::Primitive(hir::Primitive {
            value: lower_primitive(env, builder, *expr),
        }),
        ExpressionLike::ArrayExpression(expr) => {
            let elements = expr
                .elements
                .into_iter()
                .map(|expr| match expr {
                    ExpressionLike::SpreadElement(expr) => ArrayElement::Spread(
                        lower_expression_to_temporary(env, builder, expr.argument),
                    ),
                    _ => ArrayElement::Place(lower_expression_to_temporary(env, builder, expr)),
                })
                .collect_in(env.allocator);
            InstructionValue::Array(hir::Array { elements })
        }
        // Cases that cannot appear in expression position but which are included in ExpressionLike
        // to make serialization easier
        ExpressionLike::SpreadElement(_) => {
            panic!("SpreadElement may not appear in normal expression position")
        }
        _ => todo!(),
    }
}

/// Given an already lowered InstructionValue:
/// - if the instruction is a LoadLocal for a temporary location, avoid the indirection
///   and return the place that the LoadLocal loads from
/// - otherwise, create a new temporary place, push an instruction to associate the value with
///   that temporary, and return a clone of the temporary
fn lower_value_to_temporary<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    value: InstructionValue<'a>,
) -> Place<'a> {
    if let InstructionValue::LoadLocal(LoadLocal {
        place:
            place @ Place {
                identifier: Identifier { name: None, .. },
                ..
            },
    }) = value
    {
        return place;
    }
    let place = build_temporary_place(env, builder);
    builder.push(todo!("clone `place`"), value);
    return place;
}

/// Constructs a temporary Identifier and Place wrapper, which can be used as an Instruction lvalue
/// or other places where a temporary target is required
fn build_temporary_place<'a>(env: &'a Environment<'a>, builder: &mut Builder<'a>) -> Place<'a> {
    Place {
        identifier: builder.make_temporary(),
        effect: None,
    }
}

/// Converts an ESTree literal into a HIR primitive
fn lower_primitive<'a>(
    env: &'a Environment<'a>,
    _builder: &mut Builder<'a>,
    literal: Literal,
) -> PrimitiveValue<'a> {
    match literal.value {
        LiteralValue::Boolean(bool) => PrimitiveValue::Boolean(bool),
        LiteralValue::Null => PrimitiveValue::Null,
        LiteralValue::Number(value) => PrimitiveValue::Number(f64::from(value).into()),
        LiteralValue::String(s) => PrimitiveValue::String(String::from_str_in(&s, &env.allocator)),
        _ => todo!(),
    }
}

type Diagnostic = ();
