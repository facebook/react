/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::collections::HashSet;

use react_diagnostics::Diagnostic;
use react_estree::{
    AssignmentPropertyOrRestElement, AssignmentTarget, BlockStatement, Expression,
    ExpressionOrSpread, ExpressionOrSuper, ForInit, Function, IntoFunction, JsValue, Pattern,
    Statement, VariableDeclaration, VariableDeclarationKind,
};
use react_hir::{
    ArrayDestructureItem, BlockKind, BranchTerminal, Destructure, DestructurePattern, Environment,
    ForTerminal, GotoKind, Identifier, IdentifierOperand, InstructionKind, InstructionValue,
    JSXAttribute, JSXElement, LValue, LoadGlobal, LoadLocal, ObjectDestructureItem,
    ObjectDestructureProperty, PlaceOrSpread, TerminalValue,
};

use crate::builder::{Builder, LoopScope};
use crate::context::get_context_identifiers;
use crate::error::BuildHIRError;

/// Converts a React function in ESTree format into HIR. Returns the HIR
/// if it was constructed sucessfully, otherwise a list of diagnostics
/// if the input could be not be converted to HIR.
///
/// Failures generally include nonsensical input (`delete 1`) or syntax
/// that is not yet supported.
pub fn build(env: &Environment, fun: &Function) -> Result<Box<react_hir::Function>, Diagnostic> {
    let mut builder = Builder::new(env);

    let mut params = Vec::with_capacity(fun.params.len());
    for param in &fun.params {
        match param {
            Pattern::Identifier(param) => {
                let identifier = lower_identifier_for_assignment(
                    env,
                    &mut builder,
                    InstructionKind::Let,
                    param,
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

    match &fun.body {
        Some(react_estree::FunctionBody::BlockStatement(body)) => {
            lower_block_statement(env, &mut builder, body)?
        }
        Some(react_estree::FunctionBody::Expression(body)) => {
            lower_expression(env, &mut builder, body)?;
        }
        None => {
            return Err(Diagnostic::invalid_syntax(
                BuildHIRError::EmptyFunction,
                fun.range,
            ));
        }
    }

    // In case the function did not explicitly return, terminate the final
    // block with an explicit `return undefined`. If the function *did* return,
    // this will be unreachable and get pruned later.
    let implicit_return_value = builder.push(InstructionValue::Primitive(react_hir::Primitive {
        value: JsValue::Undefined,
    }));
    builder.terminate(
        TerminalValue::Return(react_hir::ReturnTerminal {
            value: implicit_return_value,
        }),
        react_hir::BlockKind::Block,
    );

    let body = builder.build()?;
    Ok(Box::new(react_hir::Function {
        id: fun.id.as_ref().map(|id| id.name.clone()),
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
    stmt: &BlockStatement,
) -> Result<(), Diagnostic> {
    for stmt in &stmt.body {
        lower_statement(env, builder, stmt, None)?;
    }
    Ok(())
}

/// Convert a statement to HIR. This will often result in multiple instructions and blocks
/// being created as statements often describe control flow.
fn lower_statement(
    env: &Environment,
    builder: &mut Builder,
    stmt: &Statement,
    label: Option<String>,
) -> Result<(), Diagnostic> {
    match stmt {
        Statement::BlockStatement(stmt) => {
            lower_block_statement(env, builder, stmt)?;
        }
        Statement::BreakStatement(stmt) => {
            let block = builder.resolve_break(stmt.label.as_ref())?;
            builder.terminate(
                TerminalValue::Goto(react_hir::GotoTerminal {
                    block,
                    kind: GotoKind::Break,
                }),
                BlockKind::Block,
            );
        }
        Statement::ContinueStatement(stmt) => {
            let block = builder.resolve_continue(stmt.label.as_ref())?;
            builder.terminate(
                TerminalValue::Goto(react_hir::GotoTerminal {
                    block,
                    kind: GotoKind::Continue,
                }),
                BlockKind::Block,
            );
        }
        Statement::ReturnStatement(stmt) => {
            let value = match &stmt.argument {
                Some(argument) => lower_expression(env, builder, argument)?,
                None => builder.push(InstructionValue::Primitive(react_hir::Primitive {
                    value: JsValue::Undefined,
                })),
            };
            builder.terminate(
                TerminalValue::Return(react_hir::ReturnTerminal { value }),
                BlockKind::Block,
            );
        }
        Statement::ExpressionStatement(stmt) => {
            lower_expression(env, builder, &stmt.expression)?;
        }
        Statement::EmptyStatement(_) => {
            // no-op
        }
        Statement::VariableDeclaration(stmt) => {
            lower_variable_declaration(env, builder, stmt)?;
        }
        Statement::IfStatement(stmt) => {
            // block for what follows the if statement, though this may
            // not be reachable
            let fallthrough_block = builder.reserve(BlockKind::Block);

            let consequent_block = builder.enter(BlockKind::Block, |builder| {
                lower_statement(env, builder, &stmt.consequent, None)?;
                Ok(TerminalValue::Goto(react_hir::GotoTerminal {
                    block: fallthrough_block.id,
                    kind: GotoKind::Break,
                }))
            })?;

            let alternate_block = builder.enter(BlockKind::Block, |builder| {
                if let Some(alternate) = &stmt.alternate {
                    lower_statement(env, builder, alternate, None)?;
                }
                Ok(TerminalValue::Goto(react_hir::GotoTerminal {
                    block: fallthrough_block.id,
                    kind: GotoKind::Break,
                }))
            })?;

            let test = lower_expression(env, builder, &stmt.test)?;
            let terminal = TerminalValue::If(react_hir::IfTerminal {
                test,
                consequent: consequent_block,
                alternate: alternate_block,
                fallthrough: Some(fallthrough_block.id),
            });
            builder.terminate_with_fallthrough(terminal, fallthrough_block);
        }
        Statement::ForStatement(stmt) => {
            // Block for the loop's test condition
            let test_block = builder.reserve(BlockKind::Loop);

            // Block for code following the loop
            let fallthrough_block = builder.reserve(BlockKind::Block);

            let init_block = builder.enter(BlockKind::Loop, |builder| {
                if let Some(ForInit::VariableDeclaration(decl)) = &stmt.init {
                    lower_variable_declaration(env, builder, decl)?;
                    Ok(TerminalValue::Goto(react_hir::GotoTerminal {
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

            let update_block = stmt
                .update
                .as_ref()
                .map(|update| {
                    builder.enter(BlockKind::Loop, |builder| {
                        lower_expression(env, builder, update)?;
                        Ok(TerminalValue::Goto(react_hir::GotoTerminal {
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
                    lower_statement(env, builder, &stmt.body, None)?;
                    Ok(TerminalValue::Goto(react_hir::GotoTerminal {
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

            if let Some(test) = &stmt.test {
                let test_value = lower_expression(env, builder, test)?;
                let terminal = TerminalValue::Branch(BranchTerminal {
                    test: test_value,
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

fn lower_variable_declaration(
    env: &Environment,
    builder: &mut Builder,
    stmt: &VariableDeclaration,
) -> Result<(), Diagnostic> {
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
    for declaration in &stmt.declarations {
        if let Some(init) = &declaration.init {
            let value = lower_expression(env, builder, init)?;
            lower_assignment_pattern(env, builder, kind, &declaration.id, value)?;
        } else {
            match &declaration.id {
                Pattern::Identifier(id) => {
                    let identifier = env.resolve_variable_declaration(id.as_ref(), &id.name);
                    if let Some(identifier) = identifier {
                        builder.push(InstructionValue::DeclareLocal(react_hir::DeclareLocal {
                            lvalue: LValue {
                                identifier: IdentifierOperand {
                                    identifier,
                                    effect: None,
                                },
                                kind,
                            },
                        }));
                    } else {
                        return Err(Diagnostic::invariant(
                            BuildHIRError::VariableDeclarationBindingIsNonLocal,
                            id.range,
                        ));
                    }
                }
                _ => {
                    return Err(Diagnostic::invalid_syntax(
                        "Expected an identifier for variable declaration without an intializer. Destructuring requires an initial value",
                        declaration.range,
                    ));
                }
            }
        }
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
    expr: &Expression,
) -> Result<IdentifierOperand, Diagnostic> {
    let value = match expr {
        Expression::Identifier(expr) => {
            let identifier = env.resolve_variable_reference(expr.as_ref());
            if let Some(identifier) = identifier {
                let place = IdentifierOperand {
                    effect: None,
                    identifier,
                };
                InstructionValue::LoadLocal(LoadLocal { place })
            } else {
                InstructionValue::LoadGlobal(LoadGlobal {
                    name: expr.name.clone(),
                })
            }
        }
        Expression::Literal(expr) => InstructionValue::Primitive(react_hir::Primitive {
            value: expr.value.clone(),
        }),
        Expression::NumericLiteral(expr) => InstructionValue::Primitive(react_hir::Primitive {
            value: JsValue::Number(expr.value),
        }),
        Expression::BooleanLiteral(expr) => InstructionValue::Primitive(react_hir::Primitive {
            value: JsValue::Boolean(expr.value),
        }),
        Expression::StringLiteral(expr) => InstructionValue::Primitive(react_hir::Primitive {
            value: JsValue::String(expr.value.clone()),
        }),
        Expression::NullLiteral(_expr) => InstructionValue::Primitive(react_hir::Primitive {
            value: JsValue::Null,
        }),
        Expression::ArrayExpression(expr) => {
            let mut elements = Vec::with_capacity(expr.elements.len());
            for expr in &expr.elements {
                let element = match expr {
                    Some(react_estree::ExpressionOrSpread::SpreadElement(expr)) => Some(
                        PlaceOrSpread::Spread(lower_expression(env, builder, &expr.argument)?),
                    ),
                    Some(react_estree::ExpressionOrSpread::Expression(expr)) => {
                        Some(PlaceOrSpread::Place(lower_expression(env, builder, expr)?))
                    }
                    None => None,
                };
                elements.push(element);
            }
            InstructionValue::Array(react_hir::Array { elements })
        }

        Expression::AssignmentExpression(expr) => match expr.operator {
            react_estree::AssignmentOperator::Equals => {
                let right = lower_expression(env, builder, &expr.right)?;
                return lower_assignment(
                    env,
                    builder,
                    InstructionKind::Reassign,
                    &expr.left,
                    right,
                );
            }
            _ => todo!("lower assignment expr {:#?}", expr),
        },

        Expression::BinaryExpression(expr) => {
            let left = lower_expression(env, builder, &expr.left)?;
            let right = lower_expression(env, builder, &expr.right)?;
            InstructionValue::Binary(react_hir::Binary {
                left,
                operator: expr.operator,
                right,
            })
        }

        Expression::FunctionExpression(expr) => {
            InstructionValue::Function(lower_function(env, builder, expr.as_ref())?)
        }

        Expression::ArrowFunctionExpression(expr) => {
            InstructionValue::Function(lower_function(env, builder, expr.as_ref())?)
        }

        Expression::CallExpression(expr) => {
            let callee_expr = match &expr.callee {
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
            let arguments = lower_arguments(env, builder, &expr.arguments)?;
            InstructionValue::Call(react_hir::Call { callee, arguments })
        }

        Expression::JSXElement(expr) => {
            InstructionValue::JSXElement(lower_jsx_element(env, builder, expr)?)
        }

        _ => todo!("Lower expr {expr:#?}"),
    };
    Ok(builder.push(value))
}

fn lower_arguments(
    env: &Environment,
    builder: &mut Builder,
    args: &[ExpressionOrSpread],
) -> Result<Vec<PlaceOrSpread>, Diagnostic> {
    let mut arguments = Vec::with_capacity(args.len());
    for arg in args {
        let element = match arg {
            react_estree::ExpressionOrSpread::SpreadElement(arg) => {
                PlaceOrSpread::Spread(lower_expression(env, builder, &arg.argument)?)
            }
            react_estree::ExpressionOrSpread::Expression(arg) => {
                PlaceOrSpread::Place(lower_expression(env, builder, arg)?)
            }
        };
        arguments.push(element);
    }
    Ok(arguments)
}

fn lower_function<T: IntoFunction>(
    env: &Environment,
    _builder: &mut Builder,
    function: &T,
) -> Result<react_hir::FunctionExpression, Diagnostic> {
    let context_identifiers = get_context_identifiers(env, function);
    let mut context = Vec::new();
    let mut seen = HashSet::new();
    for declaration_id in context_identifiers {
        if let Some(identifier) = env.resolve_declaration_id(declaration_id) {
            if !seen.insert(identifier.id) {
                continue;
            }
            context.push(IdentifierOperand {
                effect: None,
                identifier,
            });
        }
    }
    let mut fun = build(env, function.function())?;
    fun.context = context;
    Ok(react_hir::FunctionExpression {
        // TODO: collect dependencies!
        dependencies: Default::default(),
        lowered_function: fun,
    })
}

fn lower_jsx_element(
    env: &Environment,
    builder: &mut Builder,
    expr: &react_estree::JSXElement,
) -> Result<JSXElement, Diagnostic> {
    let props: Result<Vec<JSXAttribute>, Diagnostic> = expr
        .opening_element
        .attributes
        .iter()
        .map(|attr| lower_jsx_attribute(env, builder, attr))
        .collect();
    let _props = props?;
    let children: Result<Vec<IdentifierOperand>, Diagnostic> = expr
        .children
        .iter()
        .map(|child| {
            let child = lower_jsx_child(env, builder, child)?;
            Ok(child)
        })
        .collect();
    let _children = children?;
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
    _env: &Environment,
    _builder: &mut Builder,
    _attr: &react_estree::JSXAttributeOrSpread,
) -> Result<JSXAttribute, Diagnostic> {
    todo!("lower jsx attribute")
}

fn lower_jsx_child(
    _env: &Environment,
    _builder: &mut Builder,
    _child: &react_estree::JSXChildItem,
) -> Result<IdentifierOperand, Diagnostic> {
    todo!("lower jsx child")
}

fn lower_assignment(
    env: &Environment,
    builder: &mut Builder,
    kind: InstructionKind,
    lvalue: &AssignmentTarget,
    value: IdentifierOperand,
) -> Result<IdentifierOperand, Diagnostic> {
    Ok(match lvalue {
        AssignmentTarget::Pattern(lvalue) => {
            lower_assignment_pattern(env, builder, kind, lvalue, value)?
        }
        _ => todo!("lower assignment for {:#?}", lvalue),
    })
}

// TODO: change the success type to void, no caller uses it
fn lower_assignment_pattern(
    env: &Environment,
    builder: &mut Builder,
    kind: InstructionKind,
    lvalue: &Pattern,
    value: IdentifierOperand,
) -> Result<IdentifierOperand, Diagnostic> {
    Ok(match lvalue {
        Pattern::Identifier(lvalue) => {
            let identifier = lower_identifier_for_assignment(env, builder, kind, lvalue)?;
            builder.push(InstructionValue::StoreLocal(react_hir::StoreLocal {
                lvalue: LValue { identifier, kind },
                value,
            }))
        }
        Pattern::ArrayPattern(lvalue) => {
            let mut items = Vec::with_capacity(lvalue.elements.len());
            let mut followups: Vec<(Identifier, &Pattern)> = Vec::new();
            for element in &lvalue.elements {
                match element {
                    None => items.push(ArrayDestructureItem::Hole),
                    Some(Pattern::Identifier(element)) => {
                        let identifier =
                            lower_identifier_for_assignment(env, builder, kind, element)?;
                        items.push(ArrayDestructureItem::Value(identifier));
                    }
                    Some(Pattern::RestElement(element)) => {
                        if let Pattern::Identifier(element) = &element.argument {
                            let identifier = lower_identifier_for_assignment(
                                env,
                                builder,
                                kind,
                                element.as_ref(),
                            )?;
                            items.push(ArrayDestructureItem::Spread(identifier));
                        } else {
                            let temporary = env.new_temporary();
                            items.push(ArrayDestructureItem::Spread(IdentifierOperand {
                                identifier: temporary.clone(),
                                effect: None,
                            }));
                            followups.push((temporary, &element.argument));
                        }
                    }
                    Some(element) => {
                        let temporary = env.new_temporary();
                        items.push(ArrayDestructureItem::Value(IdentifierOperand {
                            identifier: temporary.clone(),
                            effect: None,
                        }));
                        followups.push((temporary, element));
                    }
                }
            }
            let temporary = builder.push(InstructionValue::Destructure(Destructure {
                kind,
                pattern: DestructurePattern::Array(items),
                value,
            }));
            for (temporary, pattern) in followups {
                lower_assignment_pattern(
                    env,
                    builder,
                    kind,
                    pattern,
                    IdentifierOperand {
                        identifier: temporary,
                        effect: None,
                    },
                )?;
            }
            temporary
        }
        Pattern::ObjectPattern(lvalue) => {
            let mut properties = Vec::with_capacity(lvalue.properties.len());
            let mut followups: Vec<(Identifier, &Pattern)> = Vec::new();

            for property in &lvalue.properties {
                match property {
                    AssignmentPropertyOrRestElement::RestElement(property) => {
                        if let Pattern::Identifier(element) = &property.argument {
                            let identifier = lower_identifier_for_assignment(
                                env,
                                builder,
                                kind,
                                element.as_ref(),
                            )?;
                            properties.push(ObjectDestructureItem::Spread(identifier));
                        } else {
                            let temporary = env.new_temporary();
                            properties.push(ObjectDestructureItem::Spread(IdentifierOperand {
                                identifier: temporary.clone(),
                                effect: None,
                            }));
                            followups.push((temporary, &property.argument));
                        }
                    }
                    AssignmentPropertyOrRestElement::AssignmentProperty(property) => {
                        if property.is_computed {
                            return Err(Diagnostic::todo(
                                "Handle computed properties in ObjectPattern",
                                property.range,
                            ));
                        }
                        let key = if let Expression::Identifier(key) = &property.key {
                            key.name.as_str()
                        } else {
                            return Err(Diagnostic::todo(
                                "Support non-identifier object keys in non-computed ObjectPattern",
                                property.range,
                            ));
                        };
                        if let Pattern::Identifier(value) = &property.value {
                            let value = lower_identifier_for_assignment(env, builder, kind, value)?;
                            properties.push(ObjectDestructureItem::Property(
                                ObjectDestructureProperty {
                                    name: key.to_string(),
                                    value,
                                },
                            ));
                        } else {
                            let temporary = env.new_temporary();
                            properties.push(ObjectDestructureItem::Property(
                                ObjectDestructureProperty {
                                    name: key.to_string(),
                                    value: IdentifierOperand {
                                        identifier: temporary.clone(),
                                        effect: None,
                                    },
                                },
                            ));
                            followups.push((temporary, &property.value));
                        }
                    }
                }
            }

            let temporary = builder.push(InstructionValue::Destructure(Destructure {
                kind,
                pattern: DestructurePattern::Object(properties),
                value,
            }));
            for (temporary, pattern) in followups {
                lower_assignment_pattern(
                    env,
                    builder,
                    kind,
                    pattern,
                    IdentifierOperand {
                        identifier: temporary,
                        effect: None,
                    },
                )?;
            }
            temporary
        }
        _ => todo!("lower assignment pattern for {:#?}", lvalue),
    })
}

fn lower_identifier_for_assignment(
    env: &Environment,
    _builder: &mut Builder,
    kind: InstructionKind,
    node: &react_estree::Identifier,
) -> Result<IdentifierOperand, Diagnostic> {
    match kind {
        InstructionKind::Reassign => {
            let identifier = env.resolve_variable_reference(node);
            if let Some(identifier) = identifier {
                Ok(IdentifierOperand {
                    identifier,
                    effect: None,
                })
            } else {
                // Reassigning a global
                Err(
                    Diagnostic::invalid_react(BuildHIRError::ReassignedGlobal, node.range)
                        .annotate(format!("Cannot reassign `{}`", &node.name), node.range),
                )
            }
        }
        _ => {
            // Declaration
            let identifier = env.resolve_variable_declaration(node, &node.name).unwrap();
            Ok(IdentifierOperand {
                identifier,
                effect: None,
            })
        }
    }
}
