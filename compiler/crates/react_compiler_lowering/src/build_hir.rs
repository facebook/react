use indexmap::{IndexMap, IndexSet};
use react_compiler_ast::scope::ScopeInfo;
use react_compiler_ast::File;
use react_compiler_diagnostics::{CompilerError, CompilerErrorDetail, ErrorCategory};
use react_compiler_hir::*;
use react_compiler_hir::environment::Environment;

use crate::hir_builder::HirBuilder;

// =============================================================================
// Source location conversion
// =============================================================================

/// Convert an AST SourceLocation to an HIR SourceLocation.
fn convert_loc(loc: &react_compiler_ast::common::SourceLocation) -> SourceLocation {
    SourceLocation {
        start: Position {
            line: loc.start.line,
            column: loc.start.column,
        },
        end: Position {
            line: loc.end.line,
            column: loc.end.column,
        },
    }
}

/// Convert an optional AST SourceLocation to an optional HIR SourceLocation.
fn convert_opt_loc(loc: &Option<react_compiler_ast::common::SourceLocation>) -> Option<SourceLocation> {
    loc.as_ref().map(convert_loc)
}

// =============================================================================
// Helper functions
// =============================================================================

fn build_temporary_place(builder: &mut HirBuilder, loc: Option<SourceLocation>) -> Place {
    let id = builder.make_temporary(loc.clone());
    Place {
        identifier: id,
        reactive: false,
        effect: Effect::Unknown,
        loc,
    }
}

fn lower_value_to_temporary(builder: &mut HirBuilder, value: InstructionValue) -> Place {
    let loc = value.loc().cloned();
    let place = build_temporary_place(builder, loc.clone());
    builder.push(Instruction {
        id: EvaluationOrder(0),
        lvalue: place.clone(),
        value,
        loc,
        effects: None,
    });
    place
}

fn lower_expression_to_temporary(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> Place {
    let value = lower_expression(builder, expr);
    lower_value_to_temporary(builder, value)
}

// =============================================================================
// Operator conversion
// =============================================================================

fn convert_binary_operator(op: &react_compiler_ast::operators::BinaryOperator) -> BinaryOperator {
    use react_compiler_ast::operators::BinaryOperator as AstOp;
    match op {
        AstOp::Add => BinaryOperator::Add,
        AstOp::Sub => BinaryOperator::Subtract,
        AstOp::Mul => BinaryOperator::Multiply,
        AstOp::Div => BinaryOperator::Divide,
        AstOp::Rem => BinaryOperator::Modulo,
        AstOp::Exp => BinaryOperator::Exponent,
        AstOp::Eq => BinaryOperator::Equal,
        AstOp::StrictEq => BinaryOperator::StrictEqual,
        AstOp::Neq => BinaryOperator::NotEqual,
        AstOp::StrictNeq => BinaryOperator::StrictNotEqual,
        AstOp::Lt => BinaryOperator::LessThan,
        AstOp::Lte => BinaryOperator::LessEqual,
        AstOp::Gt => BinaryOperator::GreaterThan,
        AstOp::Gte => BinaryOperator::GreaterEqual,
        AstOp::Shl => BinaryOperator::ShiftLeft,
        AstOp::Shr => BinaryOperator::ShiftRight,
        AstOp::UShr => BinaryOperator::UnsignedShiftRight,
        AstOp::BitOr => BinaryOperator::BitwiseOr,
        AstOp::BitXor => BinaryOperator::BitwiseXor,
        AstOp::BitAnd => BinaryOperator::BitwiseAnd,
        AstOp::In => BinaryOperator::In,
        AstOp::Instanceof => BinaryOperator::InstanceOf,
        AstOp::Pipeline => todo!("Pipeline operator not supported"),
    }
}

fn convert_unary_operator(op: &react_compiler_ast::operators::UnaryOperator) -> UnaryOperator {
    use react_compiler_ast::operators::UnaryOperator as AstOp;
    match op {
        AstOp::Neg => UnaryOperator::Minus,
        AstOp::Plus => UnaryOperator::Plus,
        AstOp::Not => UnaryOperator::Not,
        AstOp::BitNot => UnaryOperator::BitwiseNot,
        AstOp::TypeOf => UnaryOperator::TypeOf,
        AstOp::Void => UnaryOperator::Void,
        AstOp::Delete | AstOp::Throw => unreachable!("delete/throw handled separately"),
    }
}

// =============================================================================
// lower_identifier
// =============================================================================

/// Resolve an identifier to a Place.
///
/// For local/context identifiers, returns a Place referencing the binding's identifier.
/// For globals/imports, emits a LoadGlobal instruction and returns the temporary Place.
fn lower_identifier(
    builder: &mut HirBuilder,
    name: &str,
    start: u32,
    loc: Option<SourceLocation>,
) -> Place {
    let binding = builder.resolve_identifier(name, start);
    match binding {
        VariableBinding::Identifier { identifier, .. } => {
            Place {
                identifier,
                effect: Effect::Unknown,
                reactive: false,
                loc,
            }
        }
        _ => {
            if let VariableBinding::Global { ref name } = binding {
                if name == "eval" {
                    builder.record_error(CompilerErrorDetail {
                        category: ErrorCategory::UnsupportedSyntax,
                        reason: "The 'eval' function is not supported".to_string(),
                        description: Some(
                            "Eval is an anti-pattern in JavaScript, and the code executed cannot be evaluated by React Compiler".to_string(),
                        ),
                        loc: loc.clone(),
                        suggestions: None,
                    });
                }
            }
            let non_local_binding = match binding {
                VariableBinding::Global { name } => NonLocalBinding::Global { name },
                VariableBinding::ImportDefault { name, module } => {
                    NonLocalBinding::ImportDefault { name, module }
                }
                VariableBinding::ImportSpecifier {
                    name,
                    module,
                    imported,
                } => NonLocalBinding::ImportSpecifier {
                    name,
                    module,
                    imported,
                },
                VariableBinding::ImportNamespace { name, module } => {
                    NonLocalBinding::ImportNamespace { name, module }
                }
                VariableBinding::ModuleLocal { name } => NonLocalBinding::ModuleLocal { name },
                VariableBinding::Identifier { .. } => unreachable!(),
            };
            let instr_value = InstructionValue::LoadGlobal {
                binding: non_local_binding,
                loc: loc.clone(),
            };
            lower_value_to_temporary(builder, instr_value)
        }
    }
}

// =============================================================================
// lower_arguments
// =============================================================================

fn lower_arguments(
    builder: &mut HirBuilder,
    args: &[react_compiler_ast::expressions::Expression],
) -> Vec<PlaceOrSpread> {
    use react_compiler_ast::expressions::Expression;
    let mut result = Vec::new();
    for arg in args {
        match arg {
            Expression::SpreadElement(spread) => {
                let place = lower_expression_to_temporary(builder, &spread.argument);
                result.push(PlaceOrSpread::Spread(SpreadPattern { place }));
            }
            _ => {
                let place = lower_expression_to_temporary(builder, arg);
                result.push(PlaceOrSpread::Place(place));
            }
        }
    }
    result
}

fn convert_update_operator(op: &react_compiler_ast::operators::UpdateOperator) -> UpdateOperator {
    match op {
        react_compiler_ast::operators::UpdateOperator::Increment => UpdateOperator::Increment,
        react_compiler_ast::operators::UpdateOperator::Decrement => UpdateOperator::Decrement,
    }
}

// =============================================================================
// lower_member_expression
// =============================================================================

struct LoweredMemberExpression {
    object: Place,
    value: InstructionValue,
}

fn lower_member_expression(
    builder: &mut HirBuilder,
    member: &react_compiler_ast::expressions::MemberExpression,
) -> LoweredMemberExpression {
    use react_compiler_ast::expressions::Expression;
    let loc = convert_opt_loc(&member.base.loc);
    let object = lower_expression_to_temporary(builder, &member.object);

    if !member.computed {
        // Non-computed: property must be an identifier or numeric literal
        let property = match member.property.as_ref() {
            Expression::Identifier(id) => PropertyLiteral::String(id.name.clone()),
            Expression::NumericLiteral(lit) => {
                PropertyLiteral::Number(FloatValue::new(lit.value))
            }
            _ => {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: format!(
                        "(BuildHIR::lowerMemberExpression) Handle {:?} property",
                        member.property
                    ),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return LoweredMemberExpression {
                    object,
                    value: InstructionValue::UnsupportedNode { loc },
                };
            }
        };
        let value = InstructionValue::PropertyLoad {
            object: object.clone(),
            property,
            loc,
        };
        LoweredMemberExpression { object, value }
    } else {
        // Computed: check for numeric literal first (treated as PropertyLoad in TS)
        if let Expression::NumericLiteral(lit) = member.property.as_ref() {
            let property = PropertyLiteral::Number(FloatValue::new(lit.value));
            let value = InstructionValue::PropertyLoad {
                object: object.clone(),
                property,
                loc,
            };
            return LoweredMemberExpression { object, value };
        }
        // Otherwise lower property to temporary for ComputedLoad
        let property = lower_expression_to_temporary(builder, &member.property);
        let value = InstructionValue::ComputedLoad {
            object: object.clone(),
            property,
            loc,
        };
        LoweredMemberExpression { object, value }
    }
}

// =============================================================================
// lower_expression
// =============================================================================

fn lower_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> InstructionValue {
    use react_compiler_ast::expressions::Expression;

    match expr {
        Expression::Identifier(ident) => {
            let loc = convert_opt_loc(&ident.base.loc);
            let start = ident.base.start.unwrap_or(0);
            let place = lower_identifier(builder, &ident.name, start, loc.clone());
            // Determine LoadLocal vs LoadContext based on context identifier check
            if builder.is_context_identifier(&ident.name, start) {
                InstructionValue::LoadContext { place, loc }
            } else {
                InstructionValue::LoadLocal { place, loc }
            }
        }
        Expression::NullLiteral(lit) => {
            let loc = convert_opt_loc(&lit.base.loc);
            InstructionValue::Primitive {
                value: PrimitiveValue::Null,
                loc,
            }
        }
        Expression::BooleanLiteral(lit) => {
            let loc = convert_opt_loc(&lit.base.loc);
            InstructionValue::Primitive {
                value: PrimitiveValue::Boolean(lit.value),
                loc,
            }
        }
        Expression::NumericLiteral(lit) => {
            let loc = convert_opt_loc(&lit.base.loc);
            InstructionValue::Primitive {
                value: PrimitiveValue::Number(FloatValue::new(lit.value)),
                loc,
            }
        }
        Expression::StringLiteral(lit) => {
            let loc = convert_opt_loc(&lit.base.loc);
            InstructionValue::Primitive {
                value: PrimitiveValue::String(lit.value.clone()),
                loc,
            }
        }
        Expression::BinaryExpression(bin) => {
            let loc = convert_opt_loc(&bin.base.loc);
            let left = lower_expression_to_temporary(builder, &bin.left);
            let right = lower_expression_to_temporary(builder, &bin.right);
            let operator = convert_binary_operator(&bin.operator);
            InstructionValue::BinaryExpression {
                operator,
                left,
                right,
                loc,
            }
        }
        Expression::UnaryExpression(unary) => {
            let loc = convert_opt_loc(&unary.base.loc);
            match &unary.operator {
                react_compiler_ast::operators::UnaryOperator::Delete => {
                    todo!("lower delete expression")
                }
                react_compiler_ast::operators::UnaryOperator::Throw => {
                    todo!("lower throw expression (unary)")
                }
                op => {
                    let value = lower_expression_to_temporary(builder, &unary.argument);
                    let operator = convert_unary_operator(op);
                    InstructionValue::UnaryExpression {
                        operator,
                        value,
                        loc,
                    }
                }
            }
        }
        Expression::CallExpression(call) => {
            let loc = convert_opt_loc(&call.base.loc);
            // Check if callee is a MemberExpression => MethodCall
            if let Expression::MemberExpression(member) = call.callee.as_ref() {
                let lowered = lower_member_expression(builder, member);
                let property = lower_value_to_temporary(builder, lowered.value);
                let args = lower_arguments(builder, &call.arguments);
                InstructionValue::MethodCall {
                    receiver: lowered.object,
                    property,
                    args,
                    loc,
                }
            } else {
                let callee = lower_expression_to_temporary(builder, &call.callee);
                let args = lower_arguments(builder, &call.arguments);
                InstructionValue::CallExpression { callee, args, loc }
            }
        }
        Expression::MemberExpression(member) => {
            let lowered = lower_member_expression(builder, member);
            lowered.value
        }
        Expression::OptionalCallExpression(_) => todo!("lower OptionalCallExpression"),
        Expression::OptionalMemberExpression(_) => todo!("lower OptionalMemberExpression"),
        Expression::LogicalExpression(expr) => {
            let loc = convert_opt_loc(&expr.base.loc);
            let continuation_block = builder.reserve(builder.current_block_kind());
            let continuation_id = continuation_block.id;
            let test_block = builder.reserve(BlockKind::Value);
            let test_block_id = test_block.id;
            let place = build_temporary_place(builder, loc.clone());
            let left_place = build_temporary_place(builder, loc.clone());

            // Block for short-circuit case: store left value as result, goto continuation
            let consequent_block = builder.enter(BlockKind::Value, |builder, _block_id| {
                lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                    lvalue: LValue {
                        kind: InstructionKind::Const,
                        place: place.clone(),
                    },
                    value: left_place.clone(),
                    type_annotation: None,
                    loc: left_place.loc.clone(),
                });
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: left_place.loc.clone(),
                }
            });

            // Block for evaluating right side
            let alternate_block = builder.enter(BlockKind::Value, |builder, _block_id| {
                let right = lower_expression_to_temporary(builder, &expr.right);
                let right_loc = right.loc.clone();
                lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                    lvalue: LValue {
                        kind: InstructionKind::Const,
                        place: place.clone(),
                    },
                    value: right,
                    type_annotation: None,
                    loc: right_loc.clone(),
                });
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: right_loc,
                }
            });

            let hir_op = match expr.operator {
                react_compiler_ast::operators::LogicalOperator::And => LogicalOperator::And,
                react_compiler_ast::operators::LogicalOperator::Or => LogicalOperator::Or,
                react_compiler_ast::operators::LogicalOperator::NullishCoalescing => LogicalOperator::NullishCoalescing,
            };

            builder.terminate_with_continuation(
                Terminal::Logical {
                    operator: hir_op,
                    test: test_block_id,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                test_block,
            );

            // Now in test block: lower left expression, copy to left_place
            let left_value = lower_expression_to_temporary(builder, &expr.left);
            builder.push(Instruction {
                id: EvaluationOrder(0),
                lvalue: left_place.clone(),
                value: InstructionValue::LoadLocal {
                    place: left_value,
                    loc: loc.clone(),
                },
                effects: None,
                loc: loc.clone(),
            });

            builder.terminate_with_continuation(
                Terminal::Branch {
                    test: left_place,
                    consequent: consequent_block,
                    alternate: alternate_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                continuation_block,
            );

            InstructionValue::LoadLocal { place: place.clone(), loc: place.loc.clone() }
        }
        Expression::UpdateExpression(update) => {
            let loc = convert_opt_loc(&update.base.loc);
            match update.argument.as_ref() {
                Expression::MemberExpression(_member) => {
                    // Member expression targets for update expressions are complex
                    // (need lowerMemberExpression + PropertyStore/ComputedStore)
                    builder.record_error(CompilerErrorDetail {
                        category: ErrorCategory::Todo,
                        reason: "UpdateExpression with member expression argument is not yet supported".to_string(),
                        description: None,
                        loc: loc.clone(),
                        suggestions: None,
                    });
                    InstructionValue::UnsupportedNode { loc }
                }
                Expression::Identifier(ident) => {
                    let start = ident.base.start.unwrap_or(0);
                    if builder.is_context_identifier(&ident.name, start) {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Todo,
                            reason: "UpdateExpression to variables captured within lambdas is not yet supported".to_string(),
                            description: None,
                            loc: loc.clone(),
                            suggestions: None,
                        });
                        return InstructionValue::UnsupportedNode { loc };
                    }

                    let binding = builder.resolve_identifier(&ident.name, start);
                    match &binding {
                        VariableBinding::Global { .. } => {
                            builder.record_error(CompilerErrorDetail {
                                category: ErrorCategory::Todo,
                                reason: "UpdateExpression where argument is a global is not yet supported".to_string(),
                                description: None,
                                loc: loc.clone(),
                                suggestions: None,
                            });
                            return InstructionValue::UnsupportedNode { loc };
                        }
                        _ => {}
                    }
                    let identifier = match binding {
                        VariableBinding::Identifier { identifier, .. } => identifier,
                        _ => {
                            builder.record_error(CompilerErrorDetail {
                                category: ErrorCategory::Todo,
                                reason: "UpdateExpression with non-local identifier".to_string(),
                                description: None,
                                loc: loc.clone(),
                                suggestions: None,
                            });
                            return InstructionValue::UnsupportedNode { loc };
                        }
                    };
                    let lvalue_place = Place {
                        identifier,
                        effect: Effect::Unknown,
                        reactive: false,
                        loc: loc.clone(),
                    };

                    // Load the current value
                    let value = lower_identifier(builder, &ident.name, start, loc.clone());

                    let operation = convert_update_operator(&update.operator);

                    if update.prefix {
                        InstructionValue::PrefixUpdate {
                            lvalue: lvalue_place,
                            operation,
                            value,
                            loc,
                        }
                    } else {
                        InstructionValue::PostfixUpdate {
                            lvalue: lvalue_place,
                            operation,
                            value,
                            loc,
                        }
                    }

                }
                _ => {
                    builder.record_error(CompilerErrorDetail {
                        category: ErrorCategory::Todo,
                        reason: format!(
                            "UpdateExpression with unsupported argument type"
                        ),
                        description: None,
                        loc: loc.clone(),
                        suggestions: None,
                    });
                    InstructionValue::UnsupportedNode { loc }
                }
            }
        }
        Expression::ConditionalExpression(expr) => {
            let loc = convert_opt_loc(&expr.base.loc);
            let continuation_block = builder.reserve(builder.current_block_kind());
            let continuation_id = continuation_block.id;
            let test_block = builder.reserve(BlockKind::Value);
            let test_block_id = test_block.id;
            let place = build_temporary_place(builder, loc.clone());

            // Block for the consequent (test is truthy)
            let consequent_block = builder.enter(BlockKind::Value, |builder, _block_id| {
                let consequent = lower_expression_to_temporary(builder, &expr.consequent);
                let consequent_loc = consequent.loc.clone();
                lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                    lvalue: LValue {
                        kind: InstructionKind::Const,
                        place: place.clone(),
                    },
                    value: consequent,
                    type_annotation: None,
                    loc: loc.clone(),
                });
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: consequent_loc,
                }
            });

            // Block for the alternate (test is falsy)
            let alternate_block = builder.enter(BlockKind::Value, |builder, _block_id| {
                let alternate = lower_expression_to_temporary(builder, &expr.alternate);
                let alternate_loc = alternate.loc.clone();
                lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                    lvalue: LValue {
                        kind: InstructionKind::Const,
                        place: place.clone(),
                    },
                    value: alternate,
                    type_annotation: None,
                    loc: loc.clone(),
                });
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: alternate_loc,
                }
            });

            builder.terminate_with_continuation(
                Terminal::Ternary {
                    test: test_block_id,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                test_block,
            );

            // Now in test block: lower test expression
            let test_place = lower_expression_to_temporary(builder, &expr.test);
            builder.terminate_with_continuation(
                Terminal::Branch {
                    test: test_place,
                    consequent: consequent_block,
                    alternate: alternate_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                continuation_block,
            );

            InstructionValue::LoadLocal { place: place.clone(), loc: place.loc.clone() }
        }
        Expression::AssignmentExpression(expr) => {
            use react_compiler_ast::operators::AssignmentOperator;
            let loc = convert_opt_loc(&expr.base.loc);

            if matches!(expr.operator, AssignmentOperator::Assign) {
                // Simple `=` assignment
                match &*expr.left {
                    react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                        // Handle simple identifier assignment directly
                        let start = ident.base.start.unwrap_or(0);
                        let right = lower_expression_to_temporary(builder, &expr.right);
                        let binding = builder.resolve_identifier(&ident.name, start);
                        match binding {
                            VariableBinding::Identifier { identifier, .. } => {
                                let ident_loc = convert_opt_loc(&ident.base.loc);
                                let place = Place {
                                    identifier,
                                    reactive: false,
                                    effect: Effect::Unknown,
                                    loc: ident_loc,
                                };
                                if builder.is_context_identifier(&ident.name, start) {
                                    lower_value_to_temporary(builder, InstructionValue::StoreContext {
                                        lvalue: LValue {
                                            kind: InstructionKind::Reassign,
                                            place: place.clone(),
                                        },
                                        value: right,
                                        loc: loc.clone(),
                                    });
                                    InstructionValue::LoadContext { place, loc }
                                } else {
                                    lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                                        lvalue: LValue {
                                            kind: InstructionKind::Reassign,
                                            place: place.clone(),
                                        },
                                        value: right,
                                        type_annotation: None,
                                        loc: loc.clone(),
                                    });
                                    InstructionValue::LoadLocal { place, loc }
                                }
                            }
                            _ => {
                                // Global or import assignment
                                let name = ident.name.clone();
                                let temp = lower_value_to_temporary(builder, InstructionValue::StoreGlobal {
                                    name,
                                    value: right,
                                    loc: loc.clone(),
                                });
                                InstructionValue::LoadLocal { place: temp.clone(), loc: temp.loc.clone() }
                            }
                        }
                    }
                    _ => {
                        // Destructuring or member expression assignment - delegate to lower_assignment
                        let right = lower_expression_to_temporary(builder, &expr.right);
                        let is_destructure = matches!(
                            &*expr.left,
                            react_compiler_ast::patterns::PatternLike::ObjectPattern(_)
                                | react_compiler_ast::patterns::PatternLike::ArrayPattern(_)
                        );
                        let style = if is_destructure {
                            AssignmentStyle::Destructure
                        } else {
                            AssignmentStyle::Assignment
                        };
                        lower_assignment(
                            builder,
                            loc.clone(),
                            InstructionKind::Reassign,
                            &expr.left,
                            right.clone(),
                            style,
                        );
                        InstructionValue::LoadLocal { place: right, loc }
                    }
                }
            } else {
                // Compound assignment operators
                let binary_op = match expr.operator {
                    AssignmentOperator::AddAssign => Some(BinaryOperator::Add),
                    AssignmentOperator::SubAssign => Some(BinaryOperator::Subtract),
                    AssignmentOperator::MulAssign => Some(BinaryOperator::Multiply),
                    AssignmentOperator::DivAssign => Some(BinaryOperator::Divide),
                    AssignmentOperator::RemAssign => Some(BinaryOperator::Modulo),
                    AssignmentOperator::ExpAssign => Some(BinaryOperator::Exponent),
                    AssignmentOperator::ShlAssign => Some(BinaryOperator::ShiftLeft),
                    AssignmentOperator::ShrAssign => Some(BinaryOperator::ShiftRight),
                    AssignmentOperator::UShrAssign => Some(BinaryOperator::UnsignedShiftRight),
                    AssignmentOperator::BitOrAssign => Some(BinaryOperator::BitwiseOr),
                    AssignmentOperator::BitXorAssign => Some(BinaryOperator::BitwiseXor),
                    AssignmentOperator::BitAndAssign => Some(BinaryOperator::BitwiseAnd),
                    AssignmentOperator::OrAssign | AssignmentOperator::AndAssign | AssignmentOperator::NullishAssign => {
                        // Logical assignment operators (||=, &&=, ??=)
                        todo!("logical assignment operators (||=, &&=, ??=)")
                    }
                    AssignmentOperator::Assign => unreachable!(),
                };
                let binary_op = match binary_op {
                    Some(op) => op,
                    None => {
                        return InstructionValue::UnsupportedNode { loc };
                    }
                };

                match &*expr.left {
                    react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                        let start = ident.base.start.unwrap_or(0);
                        let left_place = lower_expression_to_temporary(
                            builder,
                            &react_compiler_ast::expressions::Expression::Identifier(ident.clone()),
                        );
                        let right = lower_expression_to_temporary(builder, &expr.right);
                        let binary_place = lower_value_to_temporary(builder, InstructionValue::BinaryExpression {
                            operator: binary_op,
                            left: left_place,
                            right,
                            loc: loc.clone(),
                        });
                        let binding = builder.resolve_identifier(&ident.name, start);
                        match binding {
                            VariableBinding::Identifier { identifier, .. } => {
                                let ident_loc = convert_opt_loc(&ident.base.loc);
                                let place = Place {
                                    identifier,
                                    reactive: false,
                                    effect: Effect::Unknown,
                                    loc: ident_loc,
                                };
                                if builder.is_context_identifier(&ident.name, start) {
                                    lower_value_to_temporary(builder, InstructionValue::StoreContext {
                                        lvalue: LValue {
                                            kind: InstructionKind::Reassign,
                                            place: place.clone(),
                                        },
                                        value: binary_place,
                                        loc: loc.clone(),
                                    });
                                    InstructionValue::LoadContext { place, loc }
                                } else {
                                    lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                                        lvalue: LValue {
                                            kind: InstructionKind::Reassign,
                                            place: place.clone(),
                                        },
                                        value: binary_place,
                                        type_annotation: None,
                                        loc: loc.clone(),
                                    });
                                    InstructionValue::LoadLocal { place, loc }
                                }
                            }
                            _ => {
                                // Global assignment
                                let name = ident.name.clone();
                                let temp = lower_value_to_temporary(builder, InstructionValue::StoreGlobal {
                                    name,
                                    value: binary_place,
                                    loc: loc.clone(),
                                });
                                InstructionValue::LoadLocal { place: temp.clone(), loc: temp.loc.clone() }
                            }
                        }
                    }
                    react_compiler_ast::patterns::PatternLike::MemberExpression(_member) => {
                        // a.b += right: PropertyLoad, compute, PropertyStore
                        todo!("compound assignment to member expression")
                    }
                    _ => {
                        todo!("compound assignment to complex pattern")
                    }
                }
            }
        }
        Expression::SequenceExpression(seq) => {
            let loc = convert_opt_loc(&seq.base.loc);

            if seq.expressions.is_empty() {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Syntax,
                    reason: "Expected sequence expression to have at least one expression"
                        .to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return InstructionValue::UnsupportedNode { loc };
            }

            let continuation_block = builder.reserve(builder.current_block_kind());
            let continuation_id = continuation_block.id;
            let place = build_temporary_place(builder, loc.clone());

            let sequence_block = builder.enter(BlockKind::Sequence, |builder, _block_id| {
                let mut last: Option<Place> = None;
                for item in &seq.expressions {
                    last = Some(lower_expression_to_temporary(builder, item));
                }
                if let Some(last) = last {
                    lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                        lvalue: LValue {
                            kind: InstructionKind::Const,
                            place: place.clone(),
                        },
                        value: last,
                        type_annotation: None,
                        loc: loc.clone(),
                    });
                }
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                }
            });

            builder.terminate_with_continuation(
                Terminal::Sequence {
                    block: sequence_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                continuation_block,
            );
            InstructionValue::LoadLocal {
                place,
                loc,
            }
        }
        Expression::ArrowFunctionExpression(_) => {
            lower_function_to_value(builder, expr, FunctionExpressionType::ArrowFunctionExpression)
        }
        Expression::FunctionExpression(_) => {
            lower_function_to_value(builder, expr, FunctionExpressionType::FunctionExpression)
        }
        Expression::ObjectExpression(obj) => {
            let loc = convert_opt_loc(&obj.base.loc);
            let mut properties: Vec<ObjectPropertyOrSpread> = Vec::new();
            for prop in &obj.properties {
                match prop {
                    react_compiler_ast::expressions::ObjectExpressionProperty::ObjectProperty(p) => {
                        let key = lower_object_property_key(builder, &p.key, p.computed);
                        let key = match key {
                            Some(k) => k,
                            None => continue,
                        };
                        let value = lower_expression_to_temporary(builder, &p.value);
                        properties.push(ObjectPropertyOrSpread::Property(ObjectProperty {
                            key,
                            property_type: ObjectPropertyType::Property,
                            place: value,
                        }));
                    }
                    react_compiler_ast::expressions::ObjectExpressionProperty::SpreadElement(spread) => {
                        let place = lower_expression_to_temporary(builder, &spread.argument);
                        properties.push(ObjectPropertyOrSpread::Spread(SpreadPattern { place }));
                    }
                    react_compiler_ast::expressions::ObjectExpressionProperty::ObjectMethod(method) => {
                        let prop = lower_object_method(builder, method);
                        properties.push(ObjectPropertyOrSpread::Property(prop));
                    }
                }
            }
            InstructionValue::ObjectExpression { properties, loc }
        }
        Expression::ArrayExpression(arr) => {
            let loc = convert_opt_loc(&arr.base.loc);
            let mut elements: Vec<ArrayElement> = Vec::new();
            for element in &arr.elements {
                match element {
                    None => {
                        elements.push(ArrayElement::Hole);
                    }
                    Some(Expression::SpreadElement(spread)) => {
                        let place = lower_expression_to_temporary(builder, &spread.argument);
                        elements.push(ArrayElement::Spread(SpreadPattern { place }));
                    }
                    Some(expr) => {
                        let place = lower_expression_to_temporary(builder, expr);
                        elements.push(ArrayElement::Place(place));
                    }
                }
            }
            InstructionValue::ArrayExpression { elements, loc }
        }
        Expression::NewExpression(new_expr) => {
            let loc = convert_opt_loc(&new_expr.base.loc);
            let callee = lower_expression_to_temporary(builder, &new_expr.callee);
            let args = lower_arguments(builder, &new_expr.arguments);
            InstructionValue::NewExpression { callee, args, loc }
        }
        Expression::TemplateLiteral(tmpl) => {
            let loc = convert_opt_loc(&tmpl.base.loc);
            let subexprs: Vec<Place> = tmpl.expressions.iter()
                .map(|e| lower_expression_to_temporary(builder, e))
                .collect();
            let quasis: Vec<TemplateQuasi> = tmpl.quasis.iter()
                .map(|q| TemplateQuasi {
                    raw: q.value.raw.clone(),
                    cooked: q.value.cooked.clone(),
                })
                .collect();
            InstructionValue::TemplateLiteral { subexprs, quasis, loc }
        }
        Expression::TaggedTemplateExpression(tagged) => {
            let loc = convert_opt_loc(&tagged.base.loc);
            if !tagged.quasi.expressions.is_empty() {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "Handle tagged template with interpolations".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return InstructionValue::UnsupportedNode { loc };
            }
            assert!(
                tagged.quasi.quasis.len() == 1,
                "there should be only one quasi as we don't support interpolations yet"
            );
            let quasi = &tagged.quasi.quasis[0];
            let value = TemplateQuasi {
                raw: quasi.value.raw.clone(),
                cooked: quasi.value.cooked.clone(),
            };
            let tag = lower_expression_to_temporary(builder, &tagged.tag);
            InstructionValue::TaggedTemplateExpression { tag, value, loc }
        }
        Expression::AwaitExpression(await_expr) => {
            let loc = convert_opt_loc(&await_expr.base.loc);
            let value = lower_expression_to_temporary(builder, &await_expr.argument);
            InstructionValue::Await { value, loc }
        }
        Expression::YieldExpression(yld) => {
            let loc = convert_opt_loc(&yld.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "yield is not yet supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { loc }
        }
        Expression::SpreadElement(spread) => {
            // SpreadElement should be handled by the parent context (array/object/call)
            // If we reach here, just lower the argument expression
            lower_expression(builder, &spread.argument)
        }
        Expression::MetaProperty(meta) => {
            let loc = convert_opt_loc(&meta.base.loc);
            if meta.meta.name == "import" && meta.property.name == "meta" {
                InstructionValue::MetaProperty {
                    meta: meta.meta.name.clone(),
                    property: meta.property.name.clone(),
                    loc,
                }
            } else {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "MetaProperty expressions other than import.meta are not yet supported".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                InstructionValue::UnsupportedNode { loc }
            }
        }
        Expression::ClassExpression(cls) => {
            let loc = convert_opt_loc(&cls.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "class expressions are not yet supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { loc }
        }
        Expression::PrivateName(pn) => {
            let loc = convert_opt_loc(&pn.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "private names are not yet supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { loc }
        }
        Expression::Super(sup) => {
            let loc = convert_opt_loc(&sup.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "super is not supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { loc }
        }
        Expression::Import(imp) => {
            let loc = convert_opt_loc(&imp.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "dynamic import() is not yet supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { loc }
        }
        Expression::ThisExpression(this) => {
            let loc = convert_opt_loc(&this.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "this is not supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { loc }
        }
        Expression::ParenthesizedExpression(paren) => {
            lower_expression(builder, &paren.expression)
        }
        Expression::JSXElement(jsx_element) => {
            let loc = convert_opt_loc(&jsx_element.base.loc);
            let opening_loc = convert_opt_loc(&jsx_element.opening_element.base.loc);
            let closing_loc = jsx_element.closing_element.as_ref().and_then(|c| convert_opt_loc(&c.base.loc));

            // Lower the tag name
            let tag = lower_jsx_element_name(builder, &jsx_element.opening_element.name);

            // Lower attributes (props)
            let mut props: Vec<JsxAttribute> = Vec::new();
            for attr_item in &jsx_element.opening_element.attributes {
                use react_compiler_ast::jsx::{JSXAttributeItem, JSXAttributeName, JSXAttributeValue};
                match attr_item {
                    JSXAttributeItem::JSXSpreadAttribute(spread) => {
                        let argument = lower_expression_to_temporary(builder, &spread.argument);
                        props.push(JsxAttribute::SpreadAttribute { argument });
                    }
                    JSXAttributeItem::JSXAttribute(attr) => {
                        // Get the attribute name
                        let prop_name = match &attr.name {
                            JSXAttributeName::JSXIdentifier(id) => id.name.clone(),
                            JSXAttributeName::JSXNamespacedName(ns) => {
                                format!("{}:{}", ns.namespace.name, ns.name.name)
                            }
                        };

                        // Get the attribute value
                        let value = match &attr.value {
                            Some(JSXAttributeValue::StringLiteral(s)) => {
                                let str_loc = convert_opt_loc(&s.base.loc);
                                lower_value_to_temporary(builder, InstructionValue::Primitive {
                                    value: PrimitiveValue::String(s.value.clone()),
                                    loc: str_loc,
                                })
                            }
                            Some(JSXAttributeValue::JSXExpressionContainer(container)) => {
                                use react_compiler_ast::jsx::JSXExpressionContainerExpr;
                                match &container.expression {
                                    JSXExpressionContainerExpr::JSXEmptyExpression(_) => {
                                        // Empty expression container - skip this attribute
                                        continue;
                                    }
                                    JSXExpressionContainerExpr::Expression(expr) => {
                                        lower_expression_to_temporary(builder, expr)
                                    }
                                }
                            }
                            Some(JSXAttributeValue::JSXElement(el)) => {
                                let val = lower_expression(builder, &react_compiler_ast::expressions::Expression::JSXElement(el.clone()));
                                lower_value_to_temporary(builder, val)
                            }
                            Some(JSXAttributeValue::JSXFragment(frag)) => {
                                let val = lower_expression(builder, &react_compiler_ast::expressions::Expression::JSXFragment(frag.clone()));
                                lower_value_to_temporary(builder, val)
                            }
                            None => {
                                // No value means boolean true (e.g., <div disabled />)
                                let attr_loc = convert_opt_loc(&attr.base.loc);
                                lower_value_to_temporary(builder, InstructionValue::Primitive {
                                    value: PrimitiveValue::Boolean(true),
                                    loc: attr_loc,
                                })
                            }
                        };

                        props.push(JsxAttribute::Attribute { name: prop_name, place: value });
                    }
                }
            }

            // Lower children
            let children: Vec<Place> = jsx_element.children.iter()
                .filter_map(|child| lower_jsx_element(builder, child))
                .collect();

            InstructionValue::JsxExpression {
                tag,
                props,
                children: if children.is_empty() { None } else { Some(children) },
                loc,
                opening_loc,
                closing_loc,
            }
        }
        Expression::JSXFragment(jsx_fragment) => {
            let loc = convert_opt_loc(&jsx_fragment.base.loc);

            // Lower children
            let children: Vec<Place> = jsx_fragment.children.iter()
                .filter_map(|child| lower_jsx_element(builder, child))
                .collect();

            InstructionValue::JsxFragment {
                children,
                loc,
            }
        }
        Expression::AssignmentPattern(_) => todo!("lower AssignmentPattern"),
        Expression::TSAsExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TSSatisfiesExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TSNonNullExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TSTypeAssertion(ts) => lower_expression(builder, &ts.expression),
        Expression::TSInstantiationExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TypeCastExpression(tc) => lower_expression(builder, &tc.expression),
        Expression::BigIntLiteral(big) => {
            let loc = convert_opt_loc(&big.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "BigInt literals are not yet supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { loc }
        }
        Expression::RegExpLiteral(re) => {
            let loc = convert_opt_loc(&re.base.loc);
            InstructionValue::RegExpLiteral {
                pattern: re.pattern.clone(),
                flags: re.flags.clone(),
                loc,
            }
        }
    }
}

// =============================================================================
// lower_statement
// =============================================================================

fn lower_statement(
    builder: &mut HirBuilder,
    stmt: &react_compiler_ast::statements::Statement,
    label: Option<&str>,
) {
    use react_compiler_ast::statements::Statement;

    match stmt {
        Statement::EmptyStatement(_) => {
            // no-op
        }
        Statement::DebuggerStatement(dbg) => {
            let loc = convert_opt_loc(&dbg.base.loc);
            let value = InstructionValue::Debugger { loc };
            lower_value_to_temporary(builder, value);
        }
        Statement::ExpressionStatement(expr_stmt) => {
            lower_expression_to_temporary(builder, &expr_stmt.expression);
        }
        Statement::ReturnStatement(ret) => {
            let loc = convert_opt_loc(&ret.base.loc);
            let value = if let Some(arg) = &ret.argument {
                lower_expression_to_temporary(builder, arg)
            } else {
                let undefined_value = InstructionValue::Primitive {
                    value: PrimitiveValue::Undefined,
                    loc: loc.clone(),
                };
                lower_value_to_temporary(builder, undefined_value)
            };
            let fallthrough = builder.reserve(BlockKind::Block);
            builder.terminate_with_continuation(
                Terminal::Return {
                    value,
                    return_variant: ReturnVariant::Explicit,
                    id: EvaluationOrder(0),
                    loc,
                    effects: None,
                },
                fallthrough,
            );
        }
        Statement::ThrowStatement(throw) => {
            let loc = convert_opt_loc(&throw.base.loc);
            let value = lower_expression_to_temporary(builder, &throw.argument);

            // Check for throw handler (try/catch)
            if let Some(_handler) = builder.resolve_throw_handler() {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "Support throw statements inside try/catch".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
            }

            let fallthrough = builder.reserve(BlockKind::Block);
            builder.terminate_with_continuation(
                Terminal::Throw {
                    value,
                    id: EvaluationOrder(0),
                    loc,
                },
                fallthrough,
            );
        }
        Statement::BlockStatement(block) => {
            for body_stmt in &block.body {
                lower_statement(builder, body_stmt, None);
            }
        }
        Statement::VariableDeclaration(var_decl) => {
            for declarator in &var_decl.declarations {
                match &declarator.id {
                    react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                        let loc = convert_opt_loc(&ident.base.loc);
                        let start = ident.base.start.unwrap_or(0);
                        let binding = builder.resolve_identifier(&ident.name, start);
                        let (identifier, binding_kind) = match binding {
                            VariableBinding::Identifier {
                                identifier,
                                binding_kind,
                            } => (identifier, binding_kind),
                            _ => {
                                builder.record_error(CompilerErrorDetail {
                                    category: ErrorCategory::Invariant,
                                    reason: format!(
                                        "Expected local binding for variable `{}`",
                                        ident.name
                                    ),
                                    description: None,
                                    loc: loc.clone(),
                                    suggestions: None,
                                });
                                continue;
                            }
                        };

                        let init_place = if let Some(init) = &declarator.init {
                            lower_expression_to_temporary(builder, init)
                        } else {
                            let undefined_value = InstructionValue::Primitive {
                                value: PrimitiveValue::Undefined,
                                loc: loc.clone(),
                            };
                            lower_value_to_temporary(builder, undefined_value)
                        };

                        let kind = match binding_kind {
                            BindingKind::Const => InstructionKind::Const,
                            BindingKind::Let | BindingKind::Var => InstructionKind::Let,
                            _ => InstructionKind::Let,
                        };

                        let lvalue = LValue {
                            place: Place {
                                identifier,
                                effect: Effect::Unknown,
                                reactive: false,
                                loc: loc.clone(),
                            },
                            kind,
                        };

                        if builder.is_context_identifier(&ident.name, start) {
                            let store_value = InstructionValue::StoreContext {
                                lvalue,
                                value: init_place,
                                loc: loc.clone(),
                            };
                            lower_value_to_temporary(builder, store_value);
                        } else {
                            let store_value = InstructionValue::StoreLocal {
                                lvalue,
                                value: init_place,
                                type_annotation: None,
                                loc: loc.clone(),
                            };
                            lower_value_to_temporary(builder, store_value);
                        }
                    }
                    _ => {
                        todo!("destructuring in variable declaration")
                    }
                }
            }
        }
        Statement::BreakStatement(brk) => {
            let loc = convert_opt_loc(&brk.base.loc);
            let label_name = brk.label.as_ref().map(|l| l.name.as_str());
            let target = builder.lookup_break(label_name);
            let fallthrough = builder.reserve(BlockKind::Block);
            builder.terminate_with_continuation(
                Terminal::Goto {
                    block: target,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc,
                },
                fallthrough,
            );
        }
        Statement::ContinueStatement(cont) => {
            let loc = convert_opt_loc(&cont.base.loc);
            let label_name = cont.label.as_ref().map(|l| l.name.as_str());
            let target = builder.lookup_continue(label_name);
            let fallthrough = builder.reserve(BlockKind::Block);
            builder.terminate_with_continuation(
                Terminal::Goto {
                    block: target,
                    variant: GotoVariant::Continue,
                    id: EvaluationOrder(0),
                    loc,
                },
                fallthrough,
            );
        }
        Statement::IfStatement(if_stmt) => {
            let loc = convert_opt_loc(&if_stmt.base.loc);
            // Block for code following the if
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;

            // Block for the consequent (if the test is truthy)
            let consequent_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                lower_statement(builder, &if_stmt.consequent, None);
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                }
            });

            // Block for the alternate (if the test is not truthy)
            let alternate_block = if let Some(alternate) = &if_stmt.alternate {
                builder.enter(BlockKind::Block, |builder, _block_id| {
                    lower_statement(builder, alternate, None);
                    Terminal::Goto {
                        block: continuation_id,
                        variant: GotoVariant::Break,
                        id: EvaluationOrder(0),
                        loc: loc.clone(),
                    }
                })
            } else {
                // If there is no else clause, use the continuation directly
                continuation_id
            };

            let test = lower_expression_to_temporary(builder, &if_stmt.test);
            builder.terminate_with_continuation(
                Terminal::If {
                    test,
                    consequent: consequent_block,
                    alternate: alternate_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc,
                },
                continuation_block,
            );
        }
        Statement::ForStatement(for_stmt) => {
            let loc = convert_opt_loc(&for_stmt.base.loc);

            let test_block = builder.reserve(BlockKind::Loop);
            let test_block_id = test_block.id;
            // Block for code following the loop
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;

            // Init block: lower init expression/declaration, then goto test
            let init_block = builder.enter(BlockKind::Loop, |builder, _block_id| {
                match &for_stmt.init {
                    None => {
                        // No init expression (e.g., `for (; ...)`), add a placeholder
                        let placeholder = InstructionValue::Primitive {
                            value: PrimitiveValue::Undefined,
                            loc: loc.clone(),
                        };
                        lower_value_to_temporary(builder, placeholder);
                    }
                    Some(init) => {
                        match init.as_ref() {
                            react_compiler_ast::statements::ForInit::VariableDeclaration(var_decl) => {
                                lower_statement(builder, &Statement::VariableDeclaration(var_decl.clone()), None);
                            }
                            react_compiler_ast::statements::ForInit::Expression(expr) => {
                                builder.record_error(CompilerErrorDetail {
                                    category: ErrorCategory::Todo,
                                    reason: "(BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement".to_string(),
                                    description: None,
                                    loc: loc.clone(),
                                    suggestions: None,
                                });
                                lower_expression_to_temporary(builder, expr);
                            }
                        }
                    }
                }
                Terminal::Goto {
                    block: test_block_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                }
            });

            // Update block (optional)
            let update_block_id = if let Some(update) = &for_stmt.update {
                Some(builder.enter(BlockKind::Loop, |builder, _block_id| {
                    lower_expression_to_temporary(builder, update);
                    Terminal::Goto {
                        block: test_block_id,
                        variant: GotoVariant::Break,
                        id: EvaluationOrder(0),
                        loc: loc.clone(),
                    }
                }))
            } else {
                None
            };

            // Loop body block
            let continue_target = update_block_id.unwrap_or(test_block_id);
            let body_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                builder.loop_scope(
                    label.map(|s| s.to_string()),
                    continue_target,
                    continuation_id,
                    |builder| {
                        lower_statement(builder, &for_stmt.body, None);
                        Terminal::Goto {
                            block: continue_target,
                            variant: GotoVariant::Continue,
                            id: EvaluationOrder(0),
                            loc: loc.clone(),
                        }
                    },
                )
            });

            // Emit For terminal, then fill in the test block
            builder.terminate_with_continuation(
                Terminal::For {
                    init: init_block,
                    test: test_block_id,
                    update: update_block_id,
                    loop_block: body_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                test_block,
            );

            // Fill in the test block
            if let Some(test_expr) = &for_stmt.test {
                let test = lower_expression_to_temporary(builder, test_expr);
                builder.terminate_with_continuation(
                    Terminal::Branch {
                        test,
                        consequent: body_block,
                        alternate: continuation_id,
                        fallthrough: continuation_id,
                        id: EvaluationOrder(0),
                        loc: loc.clone(),
                    },
                    continuation_block,
                );
            } else {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "(BuildHIR::lowerStatement) Handle empty test in ForStatement".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                // Treat `for(;;)` as `while(true)` to keep the builder state consistent
                let true_val = InstructionValue::Primitive {
                    value: PrimitiveValue::Boolean(true),
                    loc: loc.clone(),
                };
                let test = lower_value_to_temporary(builder, true_val);
                builder.terminate_with_continuation(
                    Terminal::Branch {
                        test,
                        consequent: body_block,
                        alternate: continuation_id,
                        fallthrough: continuation_id,
                        id: EvaluationOrder(0),
                        loc,
                    },
                    continuation_block,
                );
            }
        }
        Statement::WhileStatement(while_stmt) => {
            let loc = convert_opt_loc(&while_stmt.base.loc);
            // Block used to evaluate whether to (re)enter or exit the loop
            let conditional_block = builder.reserve(BlockKind::Loop);
            let conditional_id = conditional_block.id;
            // Block for code following the loop
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;

            // Loop body
            let loop_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                builder.loop_scope(
                    label.map(|s| s.to_string()),
                    conditional_id,
                    continuation_id,
                    |builder| {
                        lower_statement(builder, &while_stmt.body, None);
                        Terminal::Goto {
                            block: conditional_id,
                            variant: GotoVariant::Continue,
                            id: EvaluationOrder(0),
                            loc: loc.clone(),
                        }
                    },
                )
            });

            // Emit While terminal, jumping to the conditional block
            builder.terminate_with_continuation(
                Terminal::While {
                    test: conditional_id,
                    loop_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                conditional_block,
            );

            // Fill in the conditional block: lower test, branch
            let test = lower_expression_to_temporary(builder, &while_stmt.test);
            builder.terminate_with_continuation(
                Terminal::Branch {
                    test,
                    consequent: loop_block,
                    alternate: continuation_id,
                    fallthrough: conditional_id,
                    id: EvaluationOrder(0),
                    loc,
                },
                continuation_block,
            );
        }
        Statement::DoWhileStatement(do_while_stmt) => {
            let loc = convert_opt_loc(&do_while_stmt.base.loc);
            // Block used to evaluate whether to (re)enter or exit the loop
            let conditional_block = builder.reserve(BlockKind::Loop);
            let conditional_id = conditional_block.id;
            // Block for code following the loop
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;

            // Loop body, executed at least once unconditionally prior to exit
            let loop_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                builder.loop_scope(
                    label.map(|s| s.to_string()),
                    conditional_id,
                    continuation_id,
                    |builder| {
                        lower_statement(builder, &do_while_stmt.body, None);
                        Terminal::Goto {
                            block: conditional_id,
                            variant: GotoVariant::Continue,
                            id: EvaluationOrder(0),
                            loc: loc.clone(),
                        }
                    },
                )
            });

            // Jump to the conditional block
            builder.terminate_with_continuation(
                Terminal::DoWhile {
                    loop_block,
                    test: conditional_id,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                conditional_block,
            );

            // Fill in the conditional block: lower test, branch
            let test = lower_expression_to_temporary(builder, &do_while_stmt.test);
            builder.terminate_with_continuation(
                Terminal::Branch {
                    test,
                    consequent: loop_block,
                    alternate: continuation_id,
                    fallthrough: conditional_id,
                    id: EvaluationOrder(0),
                    loc,
                },
                continuation_block,
            );
        }
        Statement::ForInStatement(_) => todo!("lower ForInStatement"),
        Statement::ForOfStatement(_) => todo!("lower ForOfStatement"),
        Statement::SwitchStatement(_) => todo!("lower SwitchStatement"),
        Statement::TryStatement(_) => todo!("lower TryStatement"),
        Statement::LabeledStatement(labeled_stmt) => {
            let label_name = &labeled_stmt.label.name;
            let loc = convert_opt_loc(&labeled_stmt.base.loc);

            // Check if the body is a loop statement - if so, delegate with label
            match labeled_stmt.body.as_ref() {
                Statement::ForStatement(_)
                | Statement::WhileStatement(_)
                | Statement::DoWhileStatement(_)
                | Statement::ForInStatement(_)
                | Statement::ForOfStatement(_) => {
                    // Labeled loops are special because of continue, push the label down
                    lower_statement(builder, &labeled_stmt.body, Some(label_name));
                }
                _ => {
                    // All other statements create a continuation block to allow `break`
                    let continuation_block = builder.reserve(BlockKind::Block);
                    let continuation_id = continuation_block.id;

                    let block = builder.enter(BlockKind::Block, |builder, _block_id| {
                        builder.label_scope(
                            label_name.clone(),
                            continuation_id,
                            |builder| {
                                lower_statement(builder, &labeled_stmt.body, None);
                            },
                        );
                        Terminal::Goto {
                            block: continuation_id,
                            variant: GotoVariant::Break,
                            id: EvaluationOrder(0),
                            loc: loc.clone(),
                        }
                    });

                    builder.terminate_with_continuation(
                        Terminal::Label {
                            block,
                            fallthrough: continuation_id,
                            id: EvaluationOrder(0),
                            loc,
                        },
                        continuation_block,
                    );
                }
            }
        }
        Statement::WithStatement(_) => todo!("lower WithStatement"),
        Statement::FunctionDeclaration(func_decl) => {
            lower_function_declaration(builder, func_decl);
        }
        Statement::ClassDeclaration(_) => todo!("lower ClassDeclaration"),
        // Import/export declarations are skipped during lowering
        Statement::ImportDeclaration(_) => {}
        Statement::ExportNamedDeclaration(_) => todo!("lower ExportNamedDeclaration"),
        Statement::ExportDefaultDeclaration(_) => todo!("lower ExportDefaultDeclaration"),
        Statement::ExportAllDeclaration(_) => {}
        // TypeScript/Flow declarations are type-only, skip them
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
        | Statement::EnumDeclaration(_) => {}
    }
}

// =============================================================================
// Function extraction helpers
// =============================================================================

/// Information about a function extracted from the AST for lowering.
struct ExtractedFunction<'a> {
    id: Option<&'a str>,
    params: &'a [react_compiler_ast::patterns::PatternLike],
    body: FunctionBody<'a>,
    generator: bool,
    is_async: bool,
    loc: Option<SourceLocation>,
    /// The scope of this function (from node_to_scope).
    scope_id: react_compiler_ast::scope::ScopeId,
}

enum FunctionBody<'a> {
    Block(&'a react_compiler_ast::statements::BlockStatement),
    Expression(&'a react_compiler_ast::expressions::Expression),
}

/// Extract the nth top-level function from the AST file.
/// Returns None if function_index is out of bounds.
fn extract_function<'a>(
    ast: &'a File,
    scope_info: &ScopeInfo,
    function_index: usize,
) -> Option<ExtractedFunction<'a>> {
    use react_compiler_ast::declarations::{Declaration, ExportDefaultDecl};
    use react_compiler_ast::expressions::Expression;
    use react_compiler_ast::statements::Statement;

    let mut index = 0usize;

    for stmt in &ast.program.body {
        match stmt {
            Statement::FunctionDeclaration(func_decl) => {
                if index == function_index {
                    let start = func_decl.base.start.unwrap_or(0);
                    let scope_id = scope_info
                        .node_to_scope
                        .get(&start)
                        .copied()
                        .unwrap_or(scope_info.program_scope);
                    return Some(ExtractedFunction {
                        id: func_decl.id.as_ref().map(|id| id.name.as_str()),
                        params: &func_decl.params,
                        body: FunctionBody::Block(&func_decl.body),
                        generator: func_decl.generator,
                        is_async: func_decl.is_async,
                        loc: convert_opt_loc(&func_decl.base.loc),
                        scope_id,
                    });
                }
                index += 1;
            }
            Statement::VariableDeclaration(var_decl) => {
                for declarator in &var_decl.declarations {
                    if let Some(init) = &declarator.init {
                        match init.as_ref() {
                            Expression::FunctionExpression(func) => {
                                if index == function_index {
                                    let start = func.base.start.unwrap_or(0);
                                    let scope_id = scope_info
                                        .node_to_scope
                                        .get(&start)
                                        .copied()
                                        .unwrap_or(scope_info.program_scope);
                                    // Use the variable name as the id
                                    let name = match &declarator.id {
                                        react_compiler_ast::patterns::PatternLike::Identifier(
                                            ident,
                                        ) => Some(ident.name.as_str()),
                                        _ => func.id.as_ref().map(|id| id.name.as_str()),
                                    };
                                    return Some(ExtractedFunction {
                                        id: name,
                                        params: &func.params,
                                        body: FunctionBody::Block(&func.body),
                                        generator: func.generator,
                                        is_async: func.is_async,
                                        loc: convert_opt_loc(&func.base.loc),
                                        scope_id,
                                    });
                                }
                                index += 1;
                            }
                            Expression::ArrowFunctionExpression(arrow) => {
                                if index == function_index {
                                    let start = arrow.base.start.unwrap_or(0);
                                    let scope_id = scope_info
                                        .node_to_scope
                                        .get(&start)
                                        .copied()
                                        .unwrap_or(scope_info.program_scope);
                                    let name = match &declarator.id {
                                        react_compiler_ast::patterns::PatternLike::Identifier(
                                            ident,
                                        ) => Some(ident.name.as_str()),
                                        _ => None,
                                    };
                                    let body = match arrow.body.as_ref() {
                                        react_compiler_ast::expressions::ArrowFunctionBody::BlockStatement(block) => {
                                            FunctionBody::Block(block)
                                        }
                                        react_compiler_ast::expressions::ArrowFunctionBody::Expression(expr) => {
                                            FunctionBody::Expression(expr)
                                        }
                                    };
                                    return Some(ExtractedFunction {
                                        id: name,
                                        params: &arrow.params,
                                        body,
                                        generator: arrow.generator,
                                        is_async: arrow.is_async,
                                        loc: convert_opt_loc(&arrow.base.loc),
                                        scope_id,
                                    });
                                }
                                index += 1;
                            }
                            _ => {}
                        }
                    }
                }
            }
            Statement::ExportNamedDeclaration(export) => {
                if let Some(decl) = &export.declaration {
                    match decl.as_ref() {
                        Declaration::FunctionDeclaration(func_decl) => {
                            if index == function_index {
                                let start = func_decl.base.start.unwrap_or(0);
                                let scope_id = scope_info
                                    .node_to_scope
                                    .get(&start)
                                    .copied()
                                    .unwrap_or(scope_info.program_scope);
                                return Some(ExtractedFunction {
                                    id: func_decl.id.as_ref().map(|id| id.name.as_str()),
                                    params: &func_decl.params,
                                    body: FunctionBody::Block(&func_decl.body),
                                    generator: func_decl.generator,
                                    is_async: func_decl.is_async,
                                    loc: convert_opt_loc(&func_decl.base.loc),
                                    scope_id,
                                });
                            }
                            index += 1;
                        }
                        Declaration::VariableDeclaration(var_decl) => {
                            for declarator in &var_decl.declarations {
                                if let Some(init) = &declarator.init {
                                    match init.as_ref() {
                                        Expression::FunctionExpression(func) => {
                                            if index == function_index {
                                                let start = func.base.start.unwrap_or(0);
                                                let scope_id = scope_info
                                                    .node_to_scope
                                                    .get(&start)
                                                    .copied()
                                                    .unwrap_or(scope_info.program_scope);
                                                let name = match &declarator.id {
                                                    react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                                                        Some(ident.name.as_str())
                                                    }
                                                    _ => func.id.as_ref().map(|id| id.name.as_str()),
                                                };
                                                return Some(ExtractedFunction {
                                                    id: name,
                                                    params: &func.params,
                                                    body: FunctionBody::Block(&func.body),
                                                    generator: func.generator,
                                                    is_async: func.is_async,
                                                    loc: convert_opt_loc(&func.base.loc),
                                                    scope_id,
                                                });
                                            }
                                            index += 1;
                                        }
                                        Expression::ArrowFunctionExpression(arrow) => {
                                            if index == function_index {
                                                let start = arrow.base.start.unwrap_or(0);
                                                let scope_id = scope_info
                                                    .node_to_scope
                                                    .get(&start)
                                                    .copied()
                                                    .unwrap_or(scope_info.program_scope);
                                                let name = match &declarator.id {
                                                    react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                                                        Some(ident.name.as_str())
                                                    }
                                                    _ => None,
                                                };
                                                let body = match arrow.body.as_ref() {
                                                    react_compiler_ast::expressions::ArrowFunctionBody::BlockStatement(block) => {
                                                        FunctionBody::Block(block)
                                                    }
                                                    react_compiler_ast::expressions::ArrowFunctionBody::Expression(expr) => {
                                                        FunctionBody::Expression(expr)
                                                    }
                                                };
                                                return Some(ExtractedFunction {
                                                    id: name,
                                                    params: &arrow.params,
                                                    body,
                                                    generator: arrow.generator,
                                                    is_async: arrow.is_async,
                                                    loc: convert_opt_loc(&arrow.base.loc),
                                                    scope_id,
                                                });
                                            }
                                            index += 1;
                                        }
                                        _ => {}
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
            Statement::ExportDefaultDeclaration(export) => {
                match export.declaration.as_ref() {
                    ExportDefaultDecl::FunctionDeclaration(func_decl) => {
                        if index == function_index {
                            let start = func_decl.base.start.unwrap_or(0);
                            let scope_id = scope_info
                                .node_to_scope
                                .get(&start)
                                .copied()
                                .unwrap_or(scope_info.program_scope);
                            return Some(ExtractedFunction {
                                id: func_decl.id.as_ref().map(|id| id.name.as_str()),
                                params: &func_decl.params,
                                body: FunctionBody::Block(&func_decl.body),
                                generator: func_decl.generator,
                                is_async: func_decl.is_async,
                                loc: convert_opt_loc(&func_decl.base.loc),
                                scope_id,
                            });
                        }
                        index += 1;
                    }
                    ExportDefaultDecl::Expression(expr) => match expr.as_ref() {
                        Expression::FunctionExpression(func) => {
                            if index == function_index {
                                let start = func.base.start.unwrap_or(0);
                                let scope_id = scope_info
                                    .node_to_scope
                                    .get(&start)
                                    .copied()
                                    .unwrap_or(scope_info.program_scope);
                                return Some(ExtractedFunction {
                                    id: func.id.as_ref().map(|id| id.name.as_str()),
                                    params: &func.params,
                                    body: FunctionBody::Block(&func.body),
                                    generator: func.generator,
                                    is_async: func.is_async,
                                    loc: convert_opt_loc(&func.base.loc),
                                    scope_id,
                                });
                            }
                            index += 1;
                        }
                        Expression::ArrowFunctionExpression(arrow) => {
                            if index == function_index {
                                let start = arrow.base.start.unwrap_or(0);
                                let scope_id = scope_info
                                    .node_to_scope
                                    .get(&start)
                                    .copied()
                                    .unwrap_or(scope_info.program_scope);
                                let body = match arrow.body.as_ref() {
                                    react_compiler_ast::expressions::ArrowFunctionBody::BlockStatement(block) => {
                                        FunctionBody::Block(block)
                                    }
                                    react_compiler_ast::expressions::ArrowFunctionBody::Expression(expr) => {
                                        FunctionBody::Expression(expr)
                                    }
                                };
                                return Some(ExtractedFunction {
                                    id: None,
                                    params: &arrow.params,
                                    body,
                                    generator: arrow.generator,
                                    is_async: arrow.is_async,
                                    loc: convert_opt_loc(&arrow.base.loc),
                                    scope_id,
                                });
                            }
                            index += 1;
                        }
                        _ => {}
                    },
                    _ => {}
                }
            }
            Statement::ExpressionStatement(expr_stmt) => {
                match expr_stmt.expression.as_ref() {
                    Expression::FunctionExpression(func) => {
                        if index == function_index {
                            let start = func.base.start.unwrap_or(0);
                            let scope_id = scope_info
                                .node_to_scope
                                .get(&start)
                                .copied()
                                .unwrap_or(scope_info.program_scope);
                            return Some(ExtractedFunction {
                                id: func.id.as_ref().map(|id| id.name.as_str()),
                                params: &func.params,
                                body: FunctionBody::Block(&func.body),
                                generator: func.generator,
                                is_async: func.is_async,
                                loc: convert_opt_loc(&func.base.loc),
                                scope_id,
                            });
                        }
                        index += 1;
                    }
                    Expression::ArrowFunctionExpression(arrow) => {
                        if index == function_index {
                            let start = arrow.base.start.unwrap_or(0);
                            let scope_id = scope_info
                                .node_to_scope
                                .get(&start)
                                .copied()
                                .unwrap_or(scope_info.program_scope);
                            let body = match arrow.body.as_ref() {
                                react_compiler_ast::expressions::ArrowFunctionBody::BlockStatement(block) => {
                                    FunctionBody::Block(block)
                                }
                                react_compiler_ast::expressions::ArrowFunctionBody::Expression(expr) => {
                                    FunctionBody::Expression(expr)
                                }
                            };
                            return Some(ExtractedFunction {
                                id: None,
                                params: &arrow.params,
                                body,
                                generator: arrow.generator,
                                is_async: arrow.is_async,
                                loc: convert_opt_loc(&arrow.base.loc),
                                scope_id,
                            });
                        }
                        index += 1;
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }
    None
}

// =============================================================================
// lower() entry point
// =============================================================================

/// Main entry point: lower an AST function into HIR.
///
/// `function_index` selects which top-level function in the file to lower
/// (0-based, in source order).
pub fn lower(
    ast: &File,
    scope_info: &ScopeInfo,
    env: &mut Environment,
    function_index: usize,
) -> Result<HirFunction, CompilerError> {
    let extracted = extract_function(ast, scope_info, function_index)
        .expect("function_index out of bounds");

    // For top-level functions, context is empty (no captured refs)
    let context_map: IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> =
        IndexMap::new();

    let hir_func = lower_inner(
        extracted.params,
        extracted.body,
        extracted.id,
        extracted.generator,
        extracted.is_async,
        extracted.loc,
        scope_info,
        env,
        None,          // no pre-existing bindings for top-level
        context_map,
        extracted.scope_id,
        extracted.scope_id, // component_scope = function_scope for top-level
    );

    Ok(hir_func)
}

// =============================================================================
// Stubs for future milestones
// =============================================================================

fn lower_assignment(
    builder: &mut HirBuilder,
    loc: Option<SourceLocation>,
    kind: InstructionKind,
    target: &react_compiler_ast::patterns::PatternLike,
    value: Place,
    assignment_style: AssignmentStyle,
) {
    todo!("lower_assignment not yet implemented - M11")
}

fn lower_optional_member_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalMemberExpression,
) -> InstructionValue {
    todo!("lower_optional_member_expression not yet implemented - M12")
}

fn lower_optional_call_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalCallExpression,
) -> InstructionValue {
    todo!("lower_optional_call_expression not yet implemented - M12")
}

fn lower_function_to_value(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
    expr_type: FunctionExpressionType,
) -> InstructionValue {
    use react_compiler_ast::expressions::Expression;
    let loc = match expr {
        Expression::ArrowFunctionExpression(arrow) => convert_opt_loc(&arrow.base.loc),
        Expression::FunctionExpression(func) => convert_opt_loc(&func.base.loc),
        _ => None,
    };
    let name = match expr {
        Expression::FunctionExpression(func) => func.id.as_ref().map(|id| id.name.clone()),
        _ => None,
    };
    let lowered_func = lower_function(builder, expr);
    InstructionValue::FunctionExpression {
        name,
        name_hint: None,
        lowered_func,
        expr_type,
        loc,
    }
}

fn lower_function(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> LoweredFunction {
    use react_compiler_ast::expressions::Expression;

    // Extract function parts from the AST node
    let (params, body, id, generator, is_async, func_start, func_end, func_loc) = match expr {
        Expression::ArrowFunctionExpression(arrow) => {
            let body = match arrow.body.as_ref() {
                react_compiler_ast::expressions::ArrowFunctionBody::BlockStatement(block) => {
                    FunctionBody::Block(block)
                }
                react_compiler_ast::expressions::ArrowFunctionBody::Expression(expr) => {
                    FunctionBody::Expression(expr)
                }
            };
            (
                &arrow.params[..],
                body,
                None::<&str>,
                arrow.generator,
                arrow.is_async,
                arrow.base.start.unwrap_or(0),
                arrow.base.end.unwrap_or(0),
                convert_opt_loc(&arrow.base.loc),
            )
        }
        Expression::FunctionExpression(func) => (
            &func.params[..],
            FunctionBody::Block(&func.body),
            func.id.as_ref().map(|id| id.name.as_str()),
            func.generator,
            func.is_async,
            func.base.start.unwrap_or(0),
            func.base.end.unwrap_or(0),
            convert_opt_loc(&func.base.loc),
        ),
        _ => {
            panic!("lower_function called with non-function expression");
        }
    };

    // Find the function's scope
    let function_scope = builder
        .scope_info()
        .node_to_scope
        .get(&func_start)
        .copied()
        .unwrap_or(builder.scope_info().program_scope);

    let component_scope = builder.component_scope();
    let scope_info = builder.scope_info();

    // Gather captured context
    let captured_context = gather_captured_context(
        scope_info,
        function_scope,
        component_scope,
        func_start,
        func_end,
    );

    // Merge parent context with captured context
    let merged_context: IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> = {
        let parent_context = builder.context().clone();
        let mut merged = parent_context;
        for (k, v) in captured_context {
            merged.entry(k).or_insert(v);
        }
        merged
    };

    // Clone parent bindings to pass to the inner lower
    let parent_bindings = builder.bindings().clone();

    // Use scope_info_and_env_mut to avoid conflicting borrows
    let (scope_info, env) = builder.scope_info_and_env_mut();
    let hir_func = lower_inner(
        params,
        body,
        id,
        generator,
        is_async,
        func_loc,
        scope_info,
        env,
        Some(parent_bindings),
        merged_context,
        function_scope,
        component_scope,
    );

    let func_id = builder.environment_mut().add_function(hir_func);
    LoweredFunction { func: func_id }
}

/// Lower a function declaration statement to a FunctionExpression + StoreLocal.
fn lower_function_declaration(
    builder: &mut HirBuilder,
    func_decl: &react_compiler_ast::statements::FunctionDeclaration,
) {
    let loc = convert_opt_loc(&func_decl.base.loc);
    let func_start = func_decl.base.start.unwrap_or(0);
    let func_end = func_decl.base.end.unwrap_or(0);

    let func_name = func_decl.id.as_ref().map(|id| id.name.clone());

    // Find the function's scope
    let function_scope = builder
        .scope_info()
        .node_to_scope
        .get(&func_start)
        .copied()
        .unwrap_or(builder.scope_info().program_scope);

    let component_scope = builder.component_scope();
    let scope_info = builder.scope_info();

    // Gather captured context
    let captured_context = gather_captured_context(
        scope_info,
        function_scope,
        component_scope,
        func_start,
        func_end,
    );

    // Merge parent context with captured context
    let merged_context: IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> = {
        let parent_context = builder.context().clone();
        let mut merged = parent_context;
        for (k, v) in captured_context {
            merged.entry(k).or_insert(v);
        }
        merged
    };

    let parent_bindings = builder.bindings().clone();

    let (scope_info, env) = builder.scope_info_and_env_mut();
    let hir_func = lower_inner(
        &func_decl.params,
        FunctionBody::Block(&func_decl.body),
        func_decl.id.as_ref().map(|id| id.name.as_str()),
        func_decl.generator,
        func_decl.is_async,
        loc.clone(),
        scope_info,
        env,
        Some(parent_bindings),
        merged_context,
        function_scope,
        component_scope,
    );

    let func_id = builder.environment_mut().add_function(hir_func);
    let lowered_func = LoweredFunction { func: func_id };

    // Emit FunctionExpression instruction
    let fn_value = InstructionValue::FunctionExpression {
        name: func_name.clone(),
        name_hint: None,
        lowered_func,
        expr_type: FunctionExpressionType::FunctionDeclaration,
        loc: loc.clone(),
    };
    let fn_place = lower_value_to_temporary(builder, fn_value);

    // Resolve the binding for the function name and store
    if let Some(ref name) = func_name {
        if let Some(id_node) = &func_decl.id {
            let start = id_node.base.start.unwrap_or(0);
            let binding = builder.resolve_identifier(name, start);
            match binding {
                VariableBinding::Identifier { identifier, .. } => {
                    let ident_loc = convert_opt_loc(&id_node.base.loc);
                    let place = Place {
                        identifier,
                        reactive: false,
                        effect: Effect::Unknown,
                        loc: ident_loc,
                    };
                    if builder.is_context_identifier(name, start) {
                        lower_value_to_temporary(builder, InstructionValue::StoreContext {
                            lvalue: LValue {
                                kind: InstructionKind::Function,
                                place,
                            },
                            value: fn_place,
                            loc,
                        });
                    } else {
                        lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                            lvalue: LValue {
                                kind: InstructionKind::Function,
                                place,
                            },
                            value: fn_place,
                            type_annotation: None,
                            loc,
                        });
                    }
                }
                _ => {
                    builder.record_error(CompilerErrorDetail {
                        category: ErrorCategory::Invariant,
                        reason: format!("Could not find binding for function declaration `{}`", name),
                        description: None,
                        loc,
                        suggestions: None,
                    });
                }
            }
        }
    }
}

/// Lower a function expression used as an object method.
fn lower_function_for_object_method(
    builder: &mut HirBuilder,
    method: &react_compiler_ast::expressions::ObjectMethod,
) -> LoweredFunction {
    let func_start = method.base.start.unwrap_or(0);
    let func_end = method.base.end.unwrap_or(0);
    let func_loc = convert_opt_loc(&method.base.loc);

    let function_scope = builder
        .scope_info()
        .node_to_scope
        .get(&func_start)
        .copied()
        .unwrap_or(builder.scope_info().program_scope);

    let component_scope = builder.component_scope();
    let scope_info = builder.scope_info();

    let captured_context = gather_captured_context(
        scope_info,
        function_scope,
        component_scope,
        func_start,
        func_end,
    );

    let merged_context: IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> = {
        let parent_context = builder.context().clone();
        let mut merged = parent_context;
        for (k, v) in captured_context {
            merged.entry(k).or_insert(v);
        }
        merged
    };

    let parent_bindings = builder.bindings().clone();

    let (scope_info, env) = builder.scope_info_and_env_mut();
    let hir_func = lower_inner(
        &method.params,
        FunctionBody::Block(&method.body),
        None,
        method.generator,
        method.is_async,
        func_loc,
        scope_info,
        env,
        Some(parent_bindings),
        merged_context,
        function_scope,
        component_scope,
    );

    let func_id = builder.environment_mut().add_function(hir_func);
    LoweredFunction { func: func_id }
}

/// Internal helper: lower a function given its extracted parts.
/// Used by both the top-level `lower()` and nested `lower_function()`.
fn lower_inner(
    params: &[react_compiler_ast::patterns::PatternLike],
    body: FunctionBody<'_>,
    id: Option<&str>,
    generator: bool,
    is_async: bool,
    loc: Option<SourceLocation>,
    scope_info: &ScopeInfo,
    env: &mut Environment,
    parent_bindings: Option<IndexMap<react_compiler_ast::scope::BindingId, IdentifierId>>,
    context_map: IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>>,
    function_scope: react_compiler_ast::scope::ScopeId,
    component_scope: react_compiler_ast::scope::ScopeId,
) -> HirFunction {
    let mut builder = HirBuilder::new(
        env,
        scope_info,
        function_scope,
        component_scope,
        parent_bindings,
        Some(context_map.clone()),
        None,
    );

    // Build context places from the captured refs
    let mut context: Vec<Place> = Vec::new();
    for (&binding_id, ctx_loc) in &context_map {
        let binding = &scope_info.bindings[binding_id.0 as usize];
        let identifier = builder.resolve_binding(&binding.name, binding_id);
        context.push(Place {
            identifier,
            effect: Effect::Unknown,
            reactive: false,
            loc: ctx_loc.clone(),
        });
    }

    // Process parameters
    let mut hir_params: Vec<ParamPattern> = Vec::new();
    for param in params {
        match param {
            react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                let start = ident.base.start.unwrap_or(0);
                let binding = builder.resolve_identifier(&ident.name, start);
                match binding {
                    VariableBinding::Identifier { identifier, .. } => {
                        let param_loc = convert_opt_loc(&ident.base.loc);
                        let place = Place {
                            identifier,
                            effect: Effect::Unknown,
                            reactive: false,
                            loc: param_loc,
                        };
                        hir_params.push(ParamPattern::Place(place));
                    }
                    _ => {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Invariant,
                            reason: format!(
                                "Could not find binding for param `{}`",
                                ident.name
                            ),
                            description: None,
                            loc: convert_opt_loc(&ident.base.loc),
                            suggestions: None,
                        });
                    }
                }
            }
            react_compiler_ast::patterns::PatternLike::RestElement(rest) => {
                match &*rest.argument {
                    react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                        let start = ident.base.start.unwrap_or(0);
                        let binding = builder.resolve_identifier(&ident.name, start);
                        match binding {
                            VariableBinding::Identifier { identifier, .. } => {
                                let param_loc = convert_opt_loc(&ident.base.loc);
                                let place = Place {
                                    identifier,
                                    effect: Effect::Unknown,
                                    reactive: false,
                                    loc: param_loc,
                                };
                                hir_params.push(ParamPattern::Spread(SpreadPattern { place }));
                            }
                            _ => {
                                builder.record_error(CompilerErrorDetail {
                                    category: ErrorCategory::Invariant,
                                    reason: format!(
                                        "Could not find binding for rest param `{}`",
                                        ident.name
                                    ),
                                    description: None,
                                    loc: convert_opt_loc(&ident.base.loc),
                                    suggestions: None,
                                });
                            }
                        }
                    }
                    _ => {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Todo,
                            reason: "Destructuring in rest parameters is not yet supported".to_string(),
                            description: None,
                            loc: None,
                            suggestions: None,
                        });
                    }
                }
            }
            _ => {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "Complex parameter patterns are not yet supported in nested functions".to_string(),
                    description: None,
                    loc: None,
                    suggestions: None,
                });
            }
        }
    }

    // Lower the body
    let mut directives: Vec<String> = Vec::new();
    match body {
        FunctionBody::Expression(expr) => {
            let fallthrough = builder.reserve(BlockKind::Block);
            let value = lower_expression_to_temporary(&mut builder, expr);
            builder.terminate_with_continuation(
                Terminal::Return {
                    value,
                    return_variant: ReturnVariant::Implicit,
                    id: EvaluationOrder(0),
                    loc: None,
                    effects: None,
                },
                fallthrough,
            );
        }
        FunctionBody::Block(block) => {
            directives = block
                .directives
                .iter()
                .map(|d| d.value.value.clone())
                .collect();
            for body_stmt in &block.body {
                lower_statement(&mut builder, body_stmt, None);
            }
        }
    }

    // Emit final Return(Void, undefined)
    let undefined_value = InstructionValue::Primitive {
        value: PrimitiveValue::Undefined,
        loc: None,
    };
    let return_value = lower_value_to_temporary(&mut builder, undefined_value);
    builder.terminate(
        Terminal::Return {
            value: return_value,
            return_variant: ReturnVariant::Void,
            id: EvaluationOrder(0),
            loc: None,
            effects: None,
        },
        None,
    );

    // Build the HIR
    let (hir_body, instructions) = builder.build();

    // Create the returns place
    let returns = crate::hir_builder::create_temporary_place(env, loc.clone());

    HirFunction {
        loc,
        id: id.map(|s| s.to_string()),
        name_hint: None,
        fn_type: ReactFunctionType::Other,
        params: hir_params,
        return_type_annotation: None,
        returns,
        context,
        body: hir_body,
        instructions,
        generator,
        is_async,
        directives,
        aliasing_effects: None,
    }
}

fn lower_jsx_element_name(
    builder: &mut HirBuilder,
    name: &react_compiler_ast::jsx::JSXElementName,
) -> JsxTag {
    use react_compiler_ast::jsx::JSXElementName;
    match name {
        JSXElementName::JSXIdentifier(id) => {
            let tag = &id.name;
            let loc = convert_opt_loc(&id.base.loc);
            let start = id.base.start.unwrap_or(0);
            if tag.starts_with(|c: char| c.is_ascii_uppercase()) {
                // Component tag: resolve as identifier and load
                let place = lower_identifier(builder, tag, start, loc.clone());
                let load_value = if builder.is_context_identifier(tag, start) {
                    InstructionValue::LoadContext { place, loc }
                } else {
                    InstructionValue::LoadLocal { place, loc }
                };
                let temp = lower_value_to_temporary(builder, load_value);
                JsxTag::Place(temp)
            } else {
                // Builtin HTML tag
                JsxTag::Builtin(BuiltinTag {
                    name: tag.clone(),
                    loc,
                })
            }
        }
        JSXElementName::JSXMemberExpression(member) => {
            let place = lower_jsx_member_expression(builder, member);
            JsxTag::Place(place)
        }
        JSXElementName::JSXNamespacedName(ns) => {
            let tag = format!("{}:{}", ns.namespace.name, ns.name.name);
            let loc = convert_opt_loc(&ns.base.loc);
            JsxTag::Builtin(BuiltinTag { name: tag, loc })
        }
    }
}

fn lower_jsx_member_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::jsx::JSXMemberExpression,
) -> Place {
    use react_compiler_ast::jsx::JSXMemberExprObject;
    let object = match &*expr.object {
        JSXMemberExprObject::JSXIdentifier(id) => {
            let loc = convert_opt_loc(&id.base.loc);
            let start = id.base.start.unwrap_or(0);
            let place = lower_identifier(builder, &id.name, start, loc.clone());
            let load_value = if builder.is_context_identifier(&id.name, start) {
                InstructionValue::LoadContext { place, loc }
            } else {
                InstructionValue::LoadLocal { place, loc }
            };
            lower_value_to_temporary(builder, load_value)
        }
        JSXMemberExprObject::JSXMemberExpression(inner) => {
            lower_jsx_member_expression(builder, inner)
        }
    };
    let prop_name = &expr.property.name;
    let loc = convert_opt_loc(&expr.property.base.loc);
    let value = InstructionValue::PropertyLoad {
        object,
        property: PropertyLiteral::String(prop_name.clone()),
        loc,
    };
    lower_value_to_temporary(builder, value)
}

fn lower_jsx_element(
    builder: &mut HirBuilder,
    child: &react_compiler_ast::jsx::JSXChild,
) -> Option<Place> {
    use react_compiler_ast::jsx::JSXChild;
    use react_compiler_ast::jsx::JSXExpressionContainerExpr;
    match child {
        JSXChild::JSXText(text) => {
            let trimmed = trim_jsx_text(&text.value);
            match trimmed {
                None => None,
                Some(value) => {
                    let loc = convert_opt_loc(&text.base.loc);
                    let place = lower_value_to_temporary(builder, InstructionValue::JSXText {
                        value,
                        loc,
                    });
                    Some(place)
                }
            }
        }
        JSXChild::JSXElement(element) => {
            let value = lower_expression(builder, &react_compiler_ast::expressions::Expression::JSXElement(element.clone()));
            Some(lower_value_to_temporary(builder, value))
        }
        JSXChild::JSXFragment(fragment) => {
            let value = lower_expression(builder, &react_compiler_ast::expressions::Expression::JSXFragment(fragment.clone()));
            Some(lower_value_to_temporary(builder, value))
        }
        JSXChild::JSXExpressionContainer(container) => {
            match &container.expression {
                JSXExpressionContainerExpr::JSXEmptyExpression(_) => None,
                JSXExpressionContainerExpr::Expression(expr) => {
                    Some(lower_expression_to_temporary(builder, expr))
                }
            }
        }
        JSXChild::JSXSpreadChild(spread) => {
            Some(lower_expression_to_temporary(builder, &spread.expression))
        }
    }
}

/// Trims whitespace according to the JSX spec.
/// Implementation ported from Babel's cleanJSXElementLiteralChild.
fn trim_jsx_text(original: &str) -> Option<String> {
    let lines: Vec<&str> = original.split('\n').collect();

    let mut last_non_empty_line = 0;
    for (i, line) in lines.iter().enumerate() {
        if line.contains(|c: char| c != ' ' && c != '\t') {
            last_non_empty_line = i;
        }
    }

    let mut str = String::new();

    for (i, line) in lines.iter().enumerate() {
        let is_first_line = i == 0;
        let is_last_line = i == lines.len() - 1;
        let is_last_non_empty_line = i == last_non_empty_line;

        // Replace rendered whitespace tabs with spaces
        let mut trimmed_line = line.replace('\t', " ");

        // Trim whitespace touching a newline (leading whitespace on non-first lines)
        if !is_first_line {
            trimmed_line = trimmed_line.trim_start_matches(' ').to_string();
        }

        // Trim whitespace touching an endline (trailing whitespace on non-last lines)
        if !is_last_line {
            trimmed_line = trimmed_line.trim_end_matches(' ').to_string();
        }

        if !trimmed_line.is_empty() {
            if !is_last_non_empty_line {
                trimmed_line.push(' ');
            }
            str.push_str(&trimmed_line);
        }
    }

    if str.is_empty() {
        None
    } else {
        Some(str)
    }
}

fn lower_object_method(
    builder: &mut HirBuilder,
    method: &react_compiler_ast::expressions::ObjectMethod,
) -> ObjectProperty {
    let key = lower_object_property_key(builder, &method.key, method.computed)
        .unwrap_or(ObjectPropertyKey::String { name: String::new() });

    let lowered_func = lower_function_for_object_method(builder, method);

    let loc = convert_opt_loc(&method.base.loc);
    let method_value = InstructionValue::ObjectMethod {
        loc: loc.clone(),
        lowered_func,
    };
    let method_place = lower_value_to_temporary(builder, method_value);

    ObjectProperty {
        key,
        property_type: ObjectPropertyType::Method,
        place: method_place,
    }
}

fn lower_object_property_key(
    builder: &mut HirBuilder,
    key: &react_compiler_ast::expressions::Expression,
    computed: bool,
) -> Option<ObjectPropertyKey> {
    use react_compiler_ast::expressions::Expression;
    match key {
        Expression::StringLiteral(lit) => {
            Some(ObjectPropertyKey::String { name: lit.value.clone() })
        }
        Expression::Identifier(ident) if !computed => {
            Some(ObjectPropertyKey::Identifier { name: ident.name.clone() })
        }
        Expression::NumericLiteral(lit) if !computed => {
            Some(ObjectPropertyKey::Identifier { name: lit.value.to_string() })
        }
        _ if computed => {
            let place = lower_expression_to_temporary(builder, key);
            Some(ObjectPropertyKey::Computed { name: place })
        }
        _ => {
            let loc = match key {
                Expression::Identifier(i) => convert_opt_loc(&i.base.loc),
                _ => None,
            };
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "Unsupported key type in ObjectExpression".to_string(),
                description: None,
                loc,
                suggestions: None,
            });
            None
        }
    }
}

fn lower_reorderable_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> Place {
    todo!("lower_reorderable_expression not yet implemented - M12")
}

fn is_reorderable_expression(
    builder: &HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> bool {
    todo!("is_reorderable_expression not yet implemented - M12")
}

fn lower_type(node: &react_compiler_ast::expressions::Expression) -> Type {
    todo!("lower_type not yet implemented - M8")
}

/// Gather captured context variables for a nested function.
///
/// Walks through all identifier references (via `reference_to_binding`) and checks
/// which ones resolve to bindings declared in scopes between the function's parent scope
/// and the component scope. These are "free variables" that become the function's `context`.
fn gather_captured_context(
    scope_info: &ScopeInfo,
    function_scope: react_compiler_ast::scope::ScopeId,
    component_scope: react_compiler_ast::scope::ScopeId,
    func_start: u32,
    func_end: u32,
) -> IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> {
    let parent_scope = scope_info.scopes[function_scope.0 as usize].parent;
    let pure_scopes = match parent_scope {
        Some(parent) => capture_scopes(scope_info, parent, component_scope),
        None => IndexSet::new(),
    };

    let mut captured = IndexMap::<react_compiler_ast::scope::BindingId, Option<SourceLocation>>::new();

    for (&ref_start, &binding_id) in &scope_info.reference_to_binding {
        if ref_start < func_start || ref_start >= func_end {
            continue;
        }
        let binding = &scope_info.bindings[binding_id.0 as usize];
        if pure_scopes.contains(&binding.scope) && !captured.contains_key(&binding.id) {
            captured.insert(binding.id, None);
        }
    }

    captured
}

fn capture_scopes(
    scope_info: &ScopeInfo,
    from: react_compiler_ast::scope::ScopeId,
    to: react_compiler_ast::scope::ScopeId,
) -> IndexSet<react_compiler_ast::scope::ScopeId> {
    let mut result = IndexSet::new();
    let mut current = Some(from);
    while let Some(scope_id) = current {
        result.insert(scope_id);
        if scope_id == to {
            break;
        }
        current = scope_info.scopes[scope_id.0 as usize].parent;
    }
    result
}

/// The style of assignment (used internally by lower_assignment).
pub enum AssignmentStyle {
    /// Assignment via `=`
    Assignment,
    /// Compound assignment like `+=`, `-=`, etc.
    Compound,
    /// Destructuring assignment
    Destructure,
}
