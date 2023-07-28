use std::collections::HashSet;

use forget_diagnostics::Diagnostic;
use forget_estree::{
    AssignmentTarget, BinaryExpression, BlockStatement, Expression, ExpressionOrSpread,
    ExpressionOrSuper, ForInit, ForStatement, Function, IfStatement, JsValue, Literal, Pattern,
    Statement, VariableDeclarationKind,
};
use forget_hir::{
    BlockKind, BranchTerminal, Environment, ForTerminal, GotoKind, IdentifierOperand, InstrIx,
    InstructionKind, InstructionValue, JSXAttribute, JSXElement, LValue, LoadGlobal, LoadLocal,
    Operand, PlaceOrSpread, PrimitiveValue, TerminalValue,
};

use crate::builder::{Binding, Builder, LoopScope};
use crate::context::get_context_identifiers;
use crate::error::BuildHIRError;

/// Converts a React function in ESTree format into HIR. Returns the HIR
/// if it was constructed sucessfully, otherwise a list of diagnostics
/// if the input could be not be converted to HIR.
///
/// Failures generally include nonsensical input (`delete 1`) or syntax
/// that is not yet supported.
pub fn build(env: &Environment, fun: Function) -> Result<Box<forget_hir::Function>, Diagnostic> {
    let mut builder = Builder::new(env);

    match fun.body {
        Some(forget_estree::FunctionBody::BlockStatement(body)) => {
            lower_block_statement(env, &mut builder, *body)?
        }
        Some(forget_estree::FunctionBody::Expression(body)) => {
            lower_expression(env, &mut builder, body)?;
        }
        None => {
            return Err(Diagnostic::invalid_syntax(
                BuildHIRError::EmptyFunction,
                fun.range,
            ));
        }
    }

    let mut params = Vec::with_capacity(fun.params.len());
    for param in fun.params {
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
            _ => {
                return Err(Diagnostic::todo(
                    "Support non-identifier params",
                    param.range(),
                ));
            }
        }
    }

    // In case the function did not explicitly return, terminate the final
    // block with an explicit `return undefined`. If the function *did* return,
    // this will be unreachable and get pruned later.
    let implicit_return_value = builder.push(InstructionValue::Primitive(forget_hir::Primitive {
        value: PrimitiveValue::Undefined,
    }));
    builder.terminate(
        TerminalValue::Return(forget_hir::ReturnTerminal {
            value: Operand {
                ix: implicit_return_value,
                effect: None,
            },
        }),
        forget_hir::BlockKind::Block,
    );

    let body = builder.build()?;
    Ok(Box::new(forget_hir::Function {
        id: fun.id.map(|id| id.name),
        body,
        params,
        // TODO: populate context!
        context: Default::default(),
        is_async: fun.is_async,
        is_generator: fun.is_generator,
    }))
}

fn lower_block_statement(
    env: &Environment,
    builder: &mut Builder,
    stmt: BlockStatement,
) -> Result<(), Diagnostic> {
    for stmt in stmt.body {
        lower_statement(env, builder, stmt, None)?;
    }
    Ok(())
}

/// Convert a statement to HIR. This will often result in multiple instructions and blocks
/// being created as statements often describe control flow.
fn lower_statement(
    env: &Environment,
    builder: &mut Builder,
    stmt: Statement,
    label: Option<String>,
) -> Result<(), Diagnostic> {
    match stmt {
        Statement::BlockStatement(stmt) => {
            lower_block_statement(env, builder, *stmt)?;
        }
        Statement::BreakStatement(stmt) => {
            let block = builder.resolve_break(stmt.label.as_ref())?;
            builder.terminate(
                TerminalValue::Goto(forget_hir::GotoTerminal {
                    block,
                    kind: GotoKind::Break,
                }),
                BlockKind::Block,
            );
        }
        Statement::ContinueStatement(stmt) => {
            let block = builder.resolve_continue(stmt.label.as_ref())?;
            builder.terminate(
                TerminalValue::Goto(forget_hir::GotoTerminal {
                    block,
                    kind: GotoKind::Continue,
                }),
                BlockKind::Block,
            );
        }
        Statement::ReturnStatement(stmt) => {
            let ix = match stmt.argument {
                Some(argument) => lower_expression(env, builder, argument)?,
                None => builder.push(InstructionValue::Primitive(forget_hir::Primitive {
                    value: PrimitiveValue::Undefined,
                })),
            };
            builder.terminate(
                TerminalValue::Return(forget_hir::ReturnTerminal {
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
                    return Err(Diagnostic::unsupported(
                        BuildHIRError::VariableDeclarationKindIsVar,
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
                    match declaration.id {
                        Pattern::Identifier(id) => {
                            // TODO: handle unbound variables
                            let binding = builder.resolve_identifier(&id)?;
                            let identifier = match binding {
                                Binding::Local(identifier) => identifier,
                                _ => {
                                    return Err(Diagnostic::invariant(
                                        BuildHIRError::VariableDeclarationBindingIsNonLocal,
                                        id.range,
                                    ));
                                }
                            };
                            builder.push(InstructionValue::DeclareLocal(
                                forget_hir::DeclareLocal {
                                    lvalue: LValue {
                                        identifier: IdentifierOperand {
                                            identifier,
                                            effect: None,
                                        },
                                        kind,
                                    },
                                },
                            ));
                        }
                        _ => {
                            return Err(Diagnostic::todo(
                                "Handle non-identifier variable declarations",
                                declaration.range,
                            ));
                        }
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
                Ok(TerminalValue::Goto(forget_hir::GotoTerminal {
                    block: fallthrough_block.id,
                    kind: GotoKind::Break,
                }))
            })?;

            let alternate_block = builder.enter(BlockKind::Block, |builder| {
                if let Some(alternate) = alternate {
                    lower_statement(env, builder, alternate, None)?;
                }
                Ok(TerminalValue::Goto(forget_hir::GotoTerminal {
                    block: fallthrough_block.id,
                    kind: GotoKind::Break,
                }))
            })?;

            let test = lower_expression(env, builder, test)?;
            let terminal = TerminalValue::If(forget_hir::IfTerminal {
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
                    Ok(TerminalValue::Goto(forget_hir::GotoTerminal {
                        block: test_block.id,
                        kind: GotoKind::Break,
                    }))
                } else {
                    Err(Diagnostic::todo(
                        BuildHIRError::ForStatementIsMissingInitializer,
                        None,
                    ))
                }
            })?;

            let update_block = update
                .map(|update| {
                    builder.enter(BlockKind::Loop, |builder| {
                        lower_expression(env, builder, update)?;
                        Ok(TerminalValue::Goto(forget_hir::GotoTerminal {
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
                    Ok(TerminalValue::Goto(forget_hir::GotoTerminal {
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
                return Err(Diagnostic::todo(
                    BuildHIRError::ForStatementIsMissingTest,
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
fn lower_expression(
    env: &Environment,
    builder: &mut Builder,
    expr: Expression,
) -> Result<InstrIx, Diagnostic> {
    let value = match expr {
        Expression::Identifier(expr) => {
            // TODO: handle unbound variables
            let binding = builder.resolve_identifier(&expr)?;
            match binding {
                Binding::Local(identifier) => {
                    let place = IdentifierOperand {
                        effect: None,
                        identifier,
                    };
                    InstructionValue::LoadLocal(LoadLocal { place })
                }
                Binding::Module(..) | Binding::Global => {
                    InstructionValue::LoadGlobal(LoadGlobal { name: expr.name })
                }
            }
        }
        Expression::Literal(expr) => InstructionValue::Primitive(forget_hir::Primitive {
            value: lower_primitive(env, builder, *expr),
        }),
        Expression::ArrayExpression(expr) => {
            let mut elements = Vec::with_capacity(expr.elements.len());
            for expr in expr.elements {
                let element = match expr {
                    Some(forget_estree::ExpressionOrSpread::SpreadElement(expr)) => {
                        Some(PlaceOrSpread::Spread(Operand {
                            ix: lower_expression(env, builder, expr.argument)?,
                            effect: None,
                        }))
                    }
                    Some(forget_estree::ExpressionOrSpread::Expression(expr)) => {
                        Some(PlaceOrSpread::Place(Operand {
                            ix: lower_expression(env, builder, expr)?,
                            effect: None,
                        }))
                    }
                    None => None,
                };
                elements.push(element);
            }
            InstructionValue::Array(forget_hir::Array { elements })
        }

        Expression::AssignmentExpression(expr) => match expr.operator {
            forget_estree::AssignmentOperator::Equals => {
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
            InstructionValue::Binary(forget_hir::Binary {
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

        Expression::FunctionExpression(expr) => {
            InstructionValue::Function(lower_function(env, builder, expr.function)?)
        }

        Expression::ArrowFunctionExpression(expr) => {
            InstructionValue::Function(lower_function(env, builder, expr.function)?)
        }

        Expression::CallExpression(expr) => {
            let callee_expr = match expr.callee {
                ExpressionOrSuper::Super(callee) => {
                    return Err(Diagnostic::unsupported(
                        BuildHIRError::UnsupportedSuperExpression,
                        callee.range,
                    ));
                }
                ExpressionOrSuper::Expression(callee) => callee,
            };

            if matches!(&callee_expr, Expression::MemberExpression(_)) {
                return Err(Diagnostic::todo("Support method calls", expr.range));
            }

            let callee = lower_expression(env, builder, callee_expr)?;
            let arguments = lower_arguments(env, builder, expr.arguments)?;
            InstructionValue::Call(forget_hir::Call {
                callee: Operand {
                    ix: callee,
                    effect: None,
                },
                arguments,
            })
        }

        Expression::JSXElement(expr) => {
            InstructionValue::JSXElement(lower_jsx_element(env, builder, *expr)?)
        }

        _ => todo!("Lower expr {expr:#?}"),
    };
    Ok(builder.push(value))
}

fn lower_arguments(
    env: &Environment,
    builder: &mut Builder,
    args: Vec<ExpressionOrSpread>,
) -> Result<Vec<PlaceOrSpread>, Diagnostic> {
    let mut arguments = Vec::with_capacity(args.len());
    for arg in args {
        let element = match arg {
            forget_estree::ExpressionOrSpread::SpreadElement(arg) => {
                PlaceOrSpread::Spread(Operand {
                    ix: lower_expression(env, builder, arg.argument)?,
                    effect: None,
                })
            }
            forget_estree::ExpressionOrSpread::Expression(arg) => PlaceOrSpread::Place(Operand {
                ix: lower_expression(env, builder, arg)?,
                effect: None,
            }),
        };
        arguments.push(element);
    }
    Ok(arguments)
}

fn lower_function(
    env: &Environment,
    builder: &mut Builder,
    function: forget_estree::Function,
) -> Result<forget_hir::FunctionExpression, Diagnostic> {
    println!("get_context_identifiers() ...");
    let context_identifiers = get_context_identifiers(env, &function);
    println!("ok");
    let mut context = Vec::new();
    let mut seen = HashSet::new();
    for identifier in context_identifiers {
        match builder.resolve_identifier(identifier)? {
            Binding::Local(identifier) => {
                if !seen.insert(identifier.id) {
                    continue;
                }
                context.push(IdentifierOperand {
                    effect: None,
                    identifier,
                });
            }
            _ => {}
        }
    }
    let mut fun = build(env, function)?;
    fun.context = context;
    Ok(forget_hir::FunctionExpression {
        // TODO: collect dependencies!
        dependencies: Default::default(),
        lowered_function: fun,
    })
}

fn lower_jsx_element(
    env: &Environment,
    builder: &mut Builder,
    expr: forget_estree::JSXElement,
) -> Result<JSXElement, Diagnostic> {
    let props: Result<Vec<JSXAttribute>, Diagnostic> = expr
        .opening_element
        .attributes
        .into_iter()
        .map(|attr| lower_jsx_attribute(env, builder, attr))
        .collect();
    let props = props?;
    let children: Result<Vec<Operand>, Diagnostic> = expr
        .children
        .into_iter()
        .map(|child| {
            let ix = lower_jsx_child(env, builder, child)?;
            Ok(Operand { effect: None, ix })
        })
        .collect();
    let children = children?;
    todo!("lower jsx element");
    // Ok(JSXElement {
    //     tag: todo!(),
    //     props,
    //     children: if children.is_empty() {
    //         None
    //     } else {
    //         Some(children)
    //     },
    // })
}

fn lower_jsx_attribute(
    env: &Environment,
    builder: &mut Builder,
    attr: forget_estree::JSXAttributeOrSpread,
) -> Result<JSXAttribute, Diagnostic> {
    todo!("lower jsx attribute")
}

fn lower_jsx_child(
    env: &Environment,
    builder: &mut Builder,
    child: forget_estree::JSXChildItem,
) -> Result<InstrIx, Diagnostic> {
    todo!("lower jsx child")
}

fn lower_assignment(
    env: &Environment,
    builder: &mut Builder,
    kind: InstructionKind,
    lvalue: AssignmentTarget,
    value: InstrIx,
) -> Result<InstrIx, Diagnostic> {
    Ok(match lvalue {
        AssignmentTarget::Pattern(lvalue) => match lvalue {
            Pattern::Identifier(lvalue) => {
                let identifier = lower_identifier_for_assignment(env, builder, kind, *lvalue)?;
                builder.push(InstructionValue::StoreLocal(forget_hir::StoreLocal {
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

fn lower_identifier_for_assignment(
    _env: &Environment,
    builder: &mut Builder,
    _kind: InstructionKind,
    identifier: forget_estree::Identifier,
) -> Result<IdentifierOperand, Diagnostic> {
    let binding = builder.resolve_identifier(&identifier)?;
    match binding {
        Binding::Module(..) | Binding::Global => Err(Diagnostic::invalid_react(
            BuildHIRError::ReassignedGlobal,
            identifier.range,
        )
        .annotate(
            format!("Cannot reassign `{}`", &identifier.name),
            identifier.range,
        )),
        Binding::Local(id) => Ok(IdentifierOperand {
            identifier: id,
            effect: None,
        }),
    }
}

/// Converts an ESTree literal into a HIR primitive
fn lower_primitive(_env: &Environment, _builder: &mut Builder, literal: Literal) -> PrimitiveValue {
    match literal.value {
        JsValue::Bool(bool) => PrimitiveValue::Boolean(bool),
        JsValue::Null => PrimitiveValue::Null,
        JsValue::Number(value) => PrimitiveValue::Number(f64::from(value).into()),
        JsValue::String(s) => PrimitiveValue::String(s),
        _ => todo!("Lower literal {literal:#?}"),
    }
}
