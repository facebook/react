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
        Expression::LogicalExpression(_) => todo!("lower LogicalExpression"),
        Expression::UpdateExpression(_) => todo!("lower UpdateExpression"),
        Expression::ConditionalExpression(_) => todo!("lower ConditionalExpression"),
        Expression::AssignmentExpression(_) => todo!("lower AssignmentExpression"),
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
        Expression::ArrowFunctionExpression(_) => todo!("lower ArrowFunctionExpression"),
        Expression::FunctionExpression(_) => todo!("lower FunctionExpression"),
        Expression::ObjectExpression(_) => todo!("lower ObjectExpression"),
        Expression::ArrayExpression(_) => todo!("lower ArrayExpression"),
        Expression::NewExpression(new_expr) => {
            let loc = convert_opt_loc(&new_expr.base.loc);
            let callee = lower_expression_to_temporary(builder, &new_expr.callee);
            let args = lower_arguments(builder, &new_expr.arguments);
            InstructionValue::NewExpression { callee, args, loc }
        }
        Expression::TemplateLiteral(_) => todo!("lower TemplateLiteral"),
        Expression::TaggedTemplateExpression(_) => todo!("lower TaggedTemplateExpression"),
        Expression::AwaitExpression(_) => todo!("lower AwaitExpression"),
        Expression::YieldExpression(_) => todo!("lower YieldExpression"),
        Expression::SpreadElement(_) => todo!("lower SpreadElement"),
        Expression::MetaProperty(_) => todo!("lower MetaProperty"),
        Expression::ClassExpression(_) => todo!("lower ClassExpression"),
        Expression::PrivateName(_) => todo!("lower PrivateName"),
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
        Expression::Import(_) => todo!("lower Import"),
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
        Expression::JSXElement(_) => todo!("lower JSXElement"),
        Expression::JSXFragment(_) => todo!("lower JSXFragment"),
        Expression::AssignmentPattern(_) => todo!("lower AssignmentPattern"),
        Expression::TSAsExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TSSatisfiesExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TSNonNullExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TSTypeAssertion(ts) => lower_expression(builder, &ts.expression),
        Expression::TSInstantiationExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TypeCastExpression(tc) => lower_expression(builder, &tc.expression),
        Expression::BigIntLiteral(_) => todo!("lower BigIntLiteral"),
        Expression::RegExpLiteral(_) => todo!("lower RegExpLiteral"),
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
        Statement::FunctionDeclaration(_) => todo!("lower FunctionDeclaration"),
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

    let mut builder = HirBuilder::new(
        env,
        scope_info,
        extracted.scope_id,
        extracted.scope_id, // component_scope = function_scope for top-level
        None,               // no pre-existing bindings
        Some(context_map),
        None,               // default entry block kind
    );

    // Build context places (empty for top-level)
    let context: Vec<Place> = Vec::new();

    // Process parameters
    let mut params: Vec<ParamPattern> = Vec::new();
    for param in extracted.params {
        match param {
            react_compiler_ast::patterns::PatternLike::Identifier(ident) => {
                let start = ident.base.start.unwrap_or(0);
                let binding = builder.resolve_identifier(&ident.name, start);
                match binding {
                    VariableBinding::Identifier { identifier, .. } => {
                        let loc = convert_opt_loc(&ident.base.loc);
                        let place = Place {
                            identifier,
                            effect: Effect::Unknown,
                            reactive: false,
                            loc,
                        };
                        params.push(ParamPattern::Place(place));
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
            react_compiler_ast::patterns::PatternLike::ObjectPattern(_)
            | react_compiler_ast::patterns::PatternLike::ArrayPattern(_)
            | react_compiler_ast::patterns::PatternLike::AssignmentPattern(_) => {
                todo!("destructuring parameters")
            }
            react_compiler_ast::patterns::PatternLike::RestElement(_) => {
                todo!("rest element parameters")
            }
            react_compiler_ast::patterns::PatternLike::MemberExpression(_) => {
                todo!("member expression parameters")
            }
        }
    }

    // Lower the body
    let mut directives: Vec<String> = Vec::new();
    match extracted.body {
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
    let (body, instructions) = builder.build();

    // Create the returns place
    let returns = crate::hir_builder::create_temporary_place(env, extracted.loc.clone());

    Ok(HirFunction {
        loc: extracted.loc,
        id: extracted.id.map(|s| s.to_string()),
        name_hint: None,
        fn_type: ReactFunctionType::Other, // TODO: determine from env
        params,
        return_type_annotation: None,
        returns,
        context,
        body,
        instructions,
        generator: extracted.generator,
        is_async: extracted.is_async,
        directives,
        aliasing_effects: None,
    })
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
) -> InstructionValue {
    todo!("lower_function_to_value not yet implemented - M9")
}

fn lower_function(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
) -> LoweredFunction {
    todo!("lower_function not yet implemented - M9")
}

fn lower_jsx_element_name(
    builder: &mut HirBuilder,
    name: &react_compiler_ast::jsx::JSXElementName,
) -> JsxTag {
    todo!("lower_jsx_element_name not yet implemented - M10")
}

fn lower_jsx_element(
    builder: &mut HirBuilder,
    child: &react_compiler_ast::jsx::JSXChild,
) -> Option<Place> {
    todo!("lower_jsx_element not yet implemented - M10")
}

fn lower_object_method(
    builder: &mut HirBuilder,
    method: &react_compiler_ast::expressions::ObjectMethod,
) -> ObjectProperty {
    todo!("lower_object_method not yet implemented - M8")
}

fn lower_object_property_key(
    builder: &mut HirBuilder,
    key: &react_compiler_ast::expressions::Expression,
) -> ObjectPropertyKey {
    todo!("lower_object_property_key not yet implemented - M8")
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

fn gather_captured_context(
    _func: &react_compiler_ast::expressions::Expression,
    _scope_info: &ScopeInfo,
    _parent_scope: react_compiler_ast::scope::ScopeId,
) -> IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> {
    todo!("gather_captured_context not yet implemented - M9")
}

fn capture_scopes(
    scope_info: &ScopeInfo,
    from: react_compiler_ast::scope::ScopeId,
    to: react_compiler_ast::scope::ScopeId,
) -> IndexSet<react_compiler_ast::scope::ScopeId> {
    todo!("capture_scopes not yet implemented - M9")
}

/// The style of assignment (used internally by lower_assignment).
pub enum AssignmentStyle {
    /// Assignment via `=`
    Assignment,
    /// Compound assignment like `+=`, `-=`, etc.
    Compound,
}
