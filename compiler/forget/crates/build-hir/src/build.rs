use bumpalo::collections::{String, Vec};
use estree::{
    AssignmentTarget, BinaryExpression, BlockStatement, Expression, ForInit, ForStatement,
    FunctionDeclaration, IfStatement, JsValue, Literal, Pattern, Statement,
    VariableDeclarationKind,
};
use hir::{
    ArrayElement, BlockKind, BranchTerminal, Environment, ForTerminal, Function, GotoKind,
    IdentifierOperand, InstrIx, InstructionKind, InstructionValue, LValue, LoadGlobal, LoadLocal,
    Operand, PrimitiveValue, TerminalValue,
};

use crate::{
    builder::{Binding, Builder, LoopScope},
    error::DiagnosticError,
    BuildDiagnostic, ErrorSeverity,
};

/// Converts a React function in ESTree format into HIR. Returns the HIR
/// if it was constructed sucessfully, otherwise a list of diagnostics
/// if the input could be not be converted to HIR.
///
/// Failures generally include nonsensical input (`delete 1`) or syntax
/// that is not yet supported.
pub fn build<'a>(
    env: &'a Environment<'a>,
    fun: FunctionDeclaration,
) -> Result<&'a mut Function<'a>, BuildDiagnostic> {
    let mut builder = Builder::new(env);

    match fun.function.body {
        Some(estree::FunctionBody::BlockStatement(body)) => {
            lower_block_statement(env, &mut builder, *body)?
        }
        Some(estree::FunctionBody::Expression(body)) => {
            lower_expression(env, &mut builder, body)?;
        }
        None => {
            return Err(BuildDiagnostic::new(
                DiagnosticError::EmptyFunction,
                ErrorSeverity::InvalidSyntax,
                fun.range,
            ));
        }
    }

    let mut params = Vec::with_capacity_in(fun.function.params.len(), &env.allocator);
    for param in fun.function.params {
        match param {
            Pattern::Identifier(param) => {
                let identifier = lower_identifier_for_assignment(
                    env,
                    &mut builder,
                    InstructionKind::Let,
                    *param,
                )?;
                params.push(identifier);
            }
        }
    }

    // In case the function did not explicitly return, terminate the final
    // block with an explicit `return undefined`. If the function *did* return,
    // this will be unreachable and get pruned later.
    let implicit_return_value = builder.push(InstructionValue::Primitive(hir::Primitive {
        value: PrimitiveValue::Undefined,
    }));
    builder.terminate(
        TerminalValue::Return(hir::ReturnTerminal {
            value: Operand {
                ix: implicit_return_value,
                effect: None,
            },
        }),
        hir::BlockKind::Block,
    );

    let body = builder.build()?;
    Ok(env.alloc(Function {
        id: fun
            .function
            .id
            .map(|id| String::from_str_in(&id.name, &env.allocator)),
        body,
        params,
        is_async: fun.function.is_async,
        is_generator: fun.function.is_generator,
    }))
}

fn lower_block_statement<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    stmt: BlockStatement,
) -> Result<(), BuildDiagnostic> {
    for stmt in stmt.body {
        lower_statement(env, builder, stmt, None)?;
    }
    Ok(())
}

/// Convert a statement to HIR. This will often result in multiple instructions and blocks
/// being created as statements often describe control flow.
fn lower_statement<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    stmt: Statement,
    label: Option<String<'a>>,
) -> Result<(), BuildDiagnostic> {
    match stmt {
        Statement::BlockStatement(stmt) => {
            lower_block_statement(env, builder, *stmt)?;
        }
        Statement::BreakStatement(stmt) => {
            let block = builder.resolve_break(stmt.label.as_ref())?;
            builder.terminate(
                TerminalValue::Goto(hir::GotoTerminal {
                    block,
                    kind: GotoKind::Break,
                }),
                BlockKind::Block,
            );
        }
        Statement::ContinueStatement(stmt) => {
            let block = builder.resolve_continue(stmt.label.as_ref())?;
            builder.terminate(
                TerminalValue::Goto(hir::GotoTerminal {
                    block,
                    kind: GotoKind::Continue,
                }),
                BlockKind::Block,
            );
        }
        Statement::ReturnStatement(stmt) => {
            let ix = match stmt.argument {
                Some(argument) => lower_expression(env, builder, argument)?,
                None => builder.push(InstructionValue::Primitive(hir::Primitive {
                    value: PrimitiveValue::Undefined,
                })),
            };
            builder.terminate(
                TerminalValue::Return(hir::ReturnTerminal {
                    value: Operand { ix, effect: None },
                }),
                BlockKind::Block,
            );
        }
        Statement::ExpressionStatement(stmt) => {
            lower_expression(env, builder, stmt.expression)?;
        }
        Statement::EmptyStatement(_) => {
            // no-op
        }
        Statement::VariableDeclaration(stmt) => {
            let kind = match stmt.kind {
                VariableDeclarationKind::Const => InstructionKind::Const,
                VariableDeclarationKind::Let => InstructionKind::Let,
                VariableDeclarationKind::Var => {
                    return Err(BuildDiagnostic::new(
                        DiagnosticError::VariableDeclarationKindIsVar,
                        ErrorSeverity::Unsupported,
                        stmt.range,
                    ));
                }
            };
            for declaration in stmt.declarations {
                if let Some(init) = declaration.init {
                    let value = lower_expression(env, builder, init)?;
                    lower_assignment(
                        env,
                        builder,
                        kind,
                        AssignmentTarget::Pattern(declaration.id.into()),
                        value,
                    )?;
                } else {
                    if let Pattern::Identifier(id) = declaration.id {
                        // TODO: handle unbound variables
                        let binding = builder.resolve_binding(&id)?;
                        let identifier = match binding {
                            Binding::Local(identifier) => identifier,
                            _ => {
                                return Err(BuildDiagnostic::new(
                                    DiagnosticError::VariableDeclarationBindingIsNonLocal,
                                    ErrorSeverity::Invariant,
                                    id.range,
                                ));
                            }
                        };
                        builder.push(InstructionValue::DeclareLocal(hir::DeclareLocal {
                            lvalue: LValue {
                                identifier: IdentifierOperand {
                                    identifier,
                                    effect: None,
                                },
                                kind,
                            },
                        }));
                    }
                }
            }
        }
        Statement::IfStatement(stmt) => {
            // block for what follows the if statement, though this may
            // not be reachable
            let fallthrough_block = builder.reserve(BlockKind::Block);

            let IfStatement {
                test,
                consequent,
                alternate,
                ..
            } = *stmt;

            let consequent_block = builder.enter(BlockKind::Block, |builder| {
                lower_statement(env, builder, consequent, None)?;
                Ok(TerminalValue::Goto(hir::GotoTerminal {
                    block: fallthrough_block.id,
                    kind: GotoKind::Break,
                }))
            })?;

            let alternate_block = builder.enter(BlockKind::Block, |builder| {
                if let Some(alternate) = alternate {
                    lower_statement(env, builder, alternate, None)?;
                }
                Ok(TerminalValue::Goto(hir::GotoTerminal {
                    block: fallthrough_block.id,
                    kind: GotoKind::Break,
                }))
            })?;

            let test = lower_expression(env, builder, test)?;
            let terminal = TerminalValue::If(hir::IfTerminal {
                test: Operand {
                    ix: test,
                    effect: None,
                },
                consequent: consequent_block,
                alternate: alternate_block,
                fallthrough: Some(fallthrough_block.id),
            });
            builder.terminate_with_fallthrough(terminal, fallthrough_block);
        }
        Statement::ForStatement(stmt) => {
            let ForStatement {
                init,
                test,
                update,
                body,
                ..
            } = *stmt;

            // Block for the loop's test condition
            let test_block = builder.reserve(BlockKind::Loop);

            // Block for code following the loop
            let fallthrough_block = builder.reserve(BlockKind::Block);

            let init_block = builder.enter(BlockKind::Loop, |builder| {
                if let Some(ForInit::VariableDeclaration(decl)) = init {
                    lower_statement(env, builder, Statement::VariableDeclaration(decl), None)?;
                    Ok(TerminalValue::Goto(hir::GotoTerminal {
                        block: test_block.id,
                        kind: GotoKind::Break,
                    }))
                } else {
                    Err(BuildDiagnostic::new(
                        DiagnosticError::ForStatementIsMissingInitializer,
                        ErrorSeverity::Todo,
                        None,
                    ))
                }
            })?;

            let update_block = update
                .map(|update| {
                    builder.enter(BlockKind::Loop, |builder| {
                        lower_expression(env, builder, update)?;
                        Ok(TerminalValue::Goto(hir::GotoTerminal {
                            block: test_block.id,
                            kind: GotoKind::Break,
                        }))
                    })
                })
                .transpose()?;

            let body_block = builder.enter(BlockKind::Block, |builder| {
                let loop_ = LoopScope {
                    label,
                    continue_block: update_block.unwrap_or(test_block.id),
                    break_block: fallthrough_block.id,
                };
                builder.enter_loop(loop_, |builder| {
                    lower_statement(env, builder, body, None)?;
                    Ok(TerminalValue::Goto(hir::GotoTerminal {
                        block: update_block.unwrap_or(test_block.id),
                        kind: GotoKind::Continue,
                    }))
                })
            })?;

            let terminal = TerminalValue::For(ForTerminal {
                body: body_block,
                init: init_block,
                test: test_block.id,
                fallthrough: fallthrough_block.id,
                update: update_block,
            });
            builder.terminate_with_fallthrough(terminal, test_block);

            if let Some(test) = test {
                let test_value = lower_expression(env, builder, test)?;
                let terminal = TerminalValue::Branch(BranchTerminal {
                    test: Operand {
                        ix: test_value,
                        effect: None,
                    },
                    consequent: body_block,
                    alternate: fallthrough_block.id,
                });
                builder.terminate_with_fallthrough(terminal, fallthrough_block);
            } else {
                return Err(BuildDiagnostic::new(
                    DiagnosticError::ForStatementIsMissingTest,
                    ErrorSeverity::Todo,
                    stmt.range,
                ));
            }
        }
        _ => todo!("Lower {stmt:#?}"),
    }
    Ok(())
}

/// Converts an ESTree Expression into an HIR InstructionValue. Note that while only a single
/// InstructionValue is returned, this function is recursive and may cause multiple instructions
/// to be emitted, possibly across multiple basic blocks (in the case of expressions with control
/// flow semenatics such as logical, conditional, and optional expressions).
fn lower_expression<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    expr: Expression,
) -> Result<InstrIx, BuildDiagnostic> {
    let value = match expr {
        Expression::Identifier(expr) => {
            // TODO: handle unbound variables
            let binding = builder.resolve_binding(&expr)?;
            match binding {
                Binding::Local(identifier) => {
                    let place = IdentifierOperand {
                        effect: None,
                        identifier,
                    };
                    InstructionValue::LoadLocal(LoadLocal { place })
                }
                Binding::Module(..) | Binding::Global => InstructionValue::LoadGlobal(LoadGlobal {
                    name: String::from_str_in(&expr.name, &env.allocator),
                }),
            }
        }
        Expression::Literal(expr) => InstructionValue::Primitive(hir::Primitive {
            value: lower_primitive(env, builder, *expr),
        }),
        Expression::ArrayExpression(expr) => {
            let mut elements = Vec::with_capacity_in(expr.elements.len(), &env.allocator);
            for expr in expr.elements {
                let element = match expr {
                    Some(estree::ExpressionOrSpread::SpreadElement(expr)) => {
                        Some(ArrayElement::Spread(Operand {
                            ix: lower_expression(env, builder, expr.argument)?,
                            effect: None,
                        }))
                    }
                    Some(estree::ExpressionOrSpread::Expression(expr)) => {
                        Some(ArrayElement::Place(Operand {
                            ix: lower_expression(env, builder, expr)?,
                            effect: None,
                        }))
                    }
                    None => None,
                };
                elements.push(element);
            }
            InstructionValue::Array(hir::Array { elements })
        }

        Expression::AssignmentExpression(expr) => match expr.operator {
            estree::AssignmentOperator::Equals => {
                let right = lower_expression(env, builder, expr.right)?;
                return Ok(lower_assignment(
                    env,
                    builder,
                    InstructionKind::Reassign,
                    expr.left,
                    right,
                )?);
            }
            _ => todo!("lower assignment expr {:#?}", expr),
        },

        Expression::BinaryExpression(expr) => {
            let BinaryExpression {
                left,
                operator,
                right,
                ..
            } = *expr;
            let left = lower_expression(env, builder, left)?;
            let right = lower_expression(env, builder, right)?;
            InstructionValue::Binary(hir::Binary {
                left: Operand {
                    ix: left,
                    effect: None,
                },
                operator,
                right: Operand {
                    ix: right,
                    effect: None,
                },
            })
        }

        _ => todo!("Lower expr {expr:#?}"),
    };
    Ok(builder.push(value))
}

fn lower_assignment<'a>(
    env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    kind: InstructionKind,
    lvalue: AssignmentTarget,
    value: InstrIx,
) -> Result<InstrIx, BuildDiagnostic> {
    Ok(match lvalue {
        AssignmentTarget::Pattern(lvalue) => match lvalue {
            Pattern::Identifier(lvalue) => {
                let identifier = lower_identifier_for_assignment(env, builder, kind, *lvalue)?;
                builder.push(InstructionValue::StoreLocal(hir::StoreLocal {
                    lvalue: LValue { identifier, kind },
                    value: Operand {
                        ix: value,
                        effect: None,
                    },
                }))
            }
            _ => todo!("lower assignment pattern for {:#?}", lvalue),
        },
        _ => todo!("lower assignment for {:#?}", lvalue),
    })
}

fn lower_identifier_for_assignment<'a>(
    _env: &'a Environment<'a>,
    builder: &mut Builder<'a>,
    _kind: InstructionKind,
    identifier: estree::Identifier,
) -> Result<IdentifierOperand<'a>, BuildDiagnostic> {
    let binding = builder.resolve_binding(&identifier)?;
    match binding {
        Binding::Module(..) | Binding::Global => Err(BuildDiagnostic::new(
            DiagnosticError::ReassignedGlobal,
            ErrorSeverity::InvalidReact,
            identifier.range,
        )),
        Binding::Local(id) => Ok(IdentifierOperand {
            identifier: id,
            effect: None,
        }),
    }
}

/// Converts an ESTree literal into a HIR primitive
fn lower_primitive<'a>(
    env: &'a Environment<'a>,
    _builder: &mut Builder<'a>,
    literal: Literal,
) -> PrimitiveValue<'a> {
    match literal.value {
        JsValue::Bool(bool) => PrimitiveValue::Boolean(bool),
        JsValue::Null => PrimitiveValue::Null,
        JsValue::Number(value) => PrimitiveValue::Number(f64::from(value).into()),
        JsValue::String(s) => PrimitiveValue::String(String::from_str_in(&s, &env.allocator)),
        _ => todo!("Lower literal {literal:#?}"),
    }
}
