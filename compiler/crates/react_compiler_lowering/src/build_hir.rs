use std::collections::HashSet;
use indexmap::{IndexMap, IndexSet};
use react_compiler_ast::scope::{BindingId, ScopeInfo, ScopeKind};
use react_compiler_diagnostics::{CompilerError, CompilerErrorDetail, ErrorCategory};
use react_compiler_hir::*;
use react_compiler_hir::environment::Environment;

use crate::FunctionNode;
use crate::find_context_identifiers::find_context_identifiers;
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

fn pattern_like_loc(pattern: &react_compiler_ast::patterns::PatternLike) -> Option<react_compiler_ast::common::SourceLocation> {
    use react_compiler_ast::patterns::PatternLike;
    match pattern {
        PatternLike::Identifier(id) => id.base.loc.clone(),
        PatternLike::ObjectPattern(p) => p.base.loc.clone(),
        PatternLike::ArrayPattern(p) => p.base.loc.clone(),
        PatternLike::AssignmentPattern(p) => p.base.loc.clone(),
        PatternLike::RestElement(p) => p.base.loc.clone(),
        PatternLike::MemberExpression(p) => p.base.loc.clone(),
    }
}

/// Extract the HIR SourceLocation from an Expression AST node.
fn expression_loc(expr: &react_compiler_ast::expressions::Expression) -> Option<SourceLocation> {
    use react_compiler_ast::expressions::Expression;
    let loc = match expr {
        Expression::Identifier(e) => e.base.loc.clone(),
        Expression::StringLiteral(e) => e.base.loc.clone(),
        Expression::NumericLiteral(e) => e.base.loc.clone(),
        Expression::BooleanLiteral(e) => e.base.loc.clone(),
        Expression::NullLiteral(e) => e.base.loc.clone(),
        Expression::BigIntLiteral(e) => e.base.loc.clone(),
        Expression::RegExpLiteral(e) => e.base.loc.clone(),
        Expression::CallExpression(e) => e.base.loc.clone(),
        Expression::MemberExpression(e) => e.base.loc.clone(),
        Expression::OptionalCallExpression(e) => e.base.loc.clone(),
        Expression::OptionalMemberExpression(e) => e.base.loc.clone(),
        Expression::BinaryExpression(e) => e.base.loc.clone(),
        Expression::LogicalExpression(e) => e.base.loc.clone(),
        Expression::UnaryExpression(e) => e.base.loc.clone(),
        Expression::UpdateExpression(e) => e.base.loc.clone(),
        Expression::ConditionalExpression(e) => e.base.loc.clone(),
        Expression::AssignmentExpression(e) => e.base.loc.clone(),
        Expression::SequenceExpression(e) => e.base.loc.clone(),
        Expression::ArrowFunctionExpression(e) => e.base.loc.clone(),
        Expression::FunctionExpression(e) => e.base.loc.clone(),
        Expression::ObjectExpression(e) => e.base.loc.clone(),
        Expression::ArrayExpression(e) => e.base.loc.clone(),
        Expression::NewExpression(e) => e.base.loc.clone(),
        Expression::TemplateLiteral(e) => e.base.loc.clone(),
        Expression::TaggedTemplateExpression(e) => e.base.loc.clone(),
        Expression::AwaitExpression(e) => e.base.loc.clone(),
        Expression::YieldExpression(e) => e.base.loc.clone(),
        Expression::SpreadElement(e) => e.base.loc.clone(),
        Expression::MetaProperty(e) => e.base.loc.clone(),
        Expression::ClassExpression(e) => e.base.loc.clone(),
        Expression::PrivateName(e) => e.base.loc.clone(),
        Expression::Super(e) => e.base.loc.clone(),
        Expression::Import(e) => e.base.loc.clone(),
        Expression::ThisExpression(e) => e.base.loc.clone(),
        Expression::ParenthesizedExpression(e) => e.base.loc.clone(),
        Expression::JSXElement(e) => e.base.loc.clone(),
        Expression::JSXFragment(e) => e.base.loc.clone(),
        Expression::AssignmentPattern(e) => e.base.loc.clone(),
        Expression::TSAsExpression(e) => e.base.loc.clone(),
        Expression::TSSatisfiesExpression(e) => e.base.loc.clone(),
        Expression::TSNonNullExpression(e) => e.base.loc.clone(),
        Expression::TSTypeAssertion(e) => e.base.loc.clone(),
        Expression::TSInstantiationExpression(e) => e.base.loc.clone(),
        Expression::TypeCastExpression(e) => e.base.loc.clone(),
    };
    convert_opt_loc(&loc)
}

/// Get the Babel-style type name of an Expression node (e.g. "Identifier", "NumericLiteral").
fn expression_type_name(expr: &react_compiler_ast::expressions::Expression) -> &'static str {
    use react_compiler_ast::expressions::Expression;
    match expr {
        Expression::Identifier(_) => "Identifier",
        Expression::StringLiteral(_) => "StringLiteral",
        Expression::NumericLiteral(_) => "NumericLiteral",
        Expression::BooleanLiteral(_) => "BooleanLiteral",
        Expression::NullLiteral(_) => "NullLiteral",
        Expression::BigIntLiteral(_) => "BigIntLiteral",
        Expression::RegExpLiteral(_) => "RegExpLiteral",
        Expression::CallExpression(_) => "CallExpression",
        Expression::MemberExpression(_) => "MemberExpression",
        Expression::OptionalCallExpression(_) => "OptionalCallExpression",
        Expression::OptionalMemberExpression(_) => "OptionalMemberExpression",
        Expression::BinaryExpression(_) => "BinaryExpression",
        Expression::LogicalExpression(_) => "LogicalExpression",
        Expression::UnaryExpression(_) => "UnaryExpression",
        Expression::UpdateExpression(_) => "UpdateExpression",
        Expression::ConditionalExpression(_) => "ConditionalExpression",
        Expression::AssignmentExpression(_) => "AssignmentExpression",
        Expression::SequenceExpression(_) => "SequenceExpression",
        Expression::ArrowFunctionExpression(_) => "ArrowFunctionExpression",
        Expression::FunctionExpression(_) => "FunctionExpression",
        Expression::ObjectExpression(_) => "ObjectExpression",
        Expression::ArrayExpression(_) => "ArrayExpression",
        Expression::NewExpression(_) => "NewExpression",
        Expression::TemplateLiteral(_) => "TemplateLiteral",
        Expression::TaggedTemplateExpression(_) => "TaggedTemplateExpression",
        Expression::AwaitExpression(_) => "AwaitExpression",
        Expression::YieldExpression(_) => "YieldExpression",
        Expression::SpreadElement(_) => "SpreadElement",
        Expression::MetaProperty(_) => "MetaProperty",
        Expression::ClassExpression(_) => "ClassExpression",
        Expression::PrivateName(_) => "PrivateName",
        Expression::Super(_) => "Super",
        Expression::Import(_) => "Import",
        Expression::ThisExpression(_) => "ThisExpression",
        Expression::ParenthesizedExpression(_) => "ParenthesizedExpression",
        Expression::JSXElement(_) => "JSXElement",
        Expression::JSXFragment(_) => "JSXFragment",
        Expression::AssignmentPattern(_) => "AssignmentPattern",
        Expression::TSAsExpression(_) => "TSAsExpression",
        Expression::TSSatisfiesExpression(_) => "TSSatisfiesExpression",
        Expression::TSNonNullExpression(_) => "TSNonNullExpression",
        Expression::TSTypeAssertion(_) => "TSTypeAssertion",
        Expression::TSInstantiationExpression(_) => "TSInstantiationExpression",
        Expression::TypeCastExpression(_) => "TypeCastExpression",
    }
}

/// Extract the type annotation name from an identifier's typeAnnotation field.
/// The Babel AST stores type annotations as:
/// { "type": "TSTypeAnnotation", "typeAnnotation": { "type": "TSTypeReference", ... } }
/// or { "type": "TypeAnnotation", "typeAnnotation": { "type": "GenericTypeAnnotation", ... } }
/// We extract the inner typeAnnotation's `type` field name.
fn extract_type_annotation_name(type_annotation: &Option<Box<serde_json::Value>>) -> Option<String> {
    let val = type_annotation.as_ref()?;
    // Navigate: typeAnnotation.typeAnnotation.type
    let inner = val.get("typeAnnotation")?;
    let type_name = inner.get("type")?.as_str()?;
    Some(type_name.to_string())
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

/// Promote a temporary identifier to a named identifier (for destructuring).
/// Corresponds to TS `promoteTemporary(identifier)`.
fn promote_temporary(builder: &mut HirBuilder, identifier_id: IdentifierId) {
    let env = builder.environment_mut();
    let decl_id = env.identifiers[identifier_id.0 as usize].declaration_id;
    env.identifiers[identifier_id.0 as usize].name =
        Some(IdentifierName::Promoted(format!("#t{}", decl_id.0)));
}

fn lower_value_to_temporary(builder: &mut HirBuilder, value: InstructionValue) -> Place {
    // Optimization: if loading an unnamed temporary, skip creating a new instruction
    if let InstructionValue::LoadLocal { ref place, .. } = value {
        let ident = &builder.environment().identifiers[place.identifier.0 as usize];
        if ident.name.is_none() {
            return place.clone();
        }
    }
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
        AstOp::Pipeline => unreachable!("Pipeline operator is checked before calling convert_binary_operator"),
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
    let binding = builder.resolve_identifier(name, start, loc.clone());
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

enum MemberProperty {
    Literal(PropertyLiteral),
    Computed(Place),
}

struct LoweredMemberExpression {
    object: Place,
    property: MemberProperty,
    value: InstructionValue,
}

fn lower_member_expression(
    builder: &mut HirBuilder,
    member: &react_compiler_ast::expressions::MemberExpression,
) -> LoweredMemberExpression {
    lower_member_expression_impl(builder, member, None)
}

fn lower_member_expression_with_object(
    builder: &mut HirBuilder,
    member: &react_compiler_ast::expressions::OptionalMemberExpression,
    lowered_object: Place,
) -> LoweredMemberExpression {
    // OptionalMemberExpression has the same shape as MemberExpression for property access
    use react_compiler_ast::expressions::Expression;
    let loc = convert_opt_loc(&member.base.loc);
    let object = lowered_object;

    if !member.computed {
        let prop_literal = match member.property.as_ref() {
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
                    property: MemberProperty::Literal(PropertyLiteral::String("".to_string())),
                    value: InstructionValue::UnsupportedNode { node_type: None, loc },
                };
            }
        };
        let value = InstructionValue::PropertyLoad {
            object: object.clone(),
            property: prop_literal.clone(),
            loc,
        };
        LoweredMemberExpression { object, property: MemberProperty::Literal(prop_literal), value }
    } else {
        if let Expression::NumericLiteral(lit) = member.property.as_ref() {
            let prop_literal = PropertyLiteral::Number(FloatValue::new(lit.value));
            let value = InstructionValue::PropertyLoad {
                object: object.clone(),
                property: prop_literal.clone(),
                loc,
            };
            return LoweredMemberExpression { object, property: MemberProperty::Literal(prop_literal), value };
        }
        let property = lower_expression_to_temporary(builder, &member.property);
        let value = InstructionValue::ComputedLoad {
            object: object.clone(),
            property: property.clone(),
            loc,
        };
        LoweredMemberExpression { object, property: MemberProperty::Computed(property), value }
    }
}

fn lower_member_expression_impl(
    builder: &mut HirBuilder,
    member: &react_compiler_ast::expressions::MemberExpression,
    lowered_object: Option<Place>,
) -> LoweredMemberExpression {
    use react_compiler_ast::expressions::Expression;
    let loc = convert_opt_loc(&member.base.loc);
    let object = lowered_object.unwrap_or_else(|| lower_expression_to_temporary(builder, &member.object));

    if !member.computed {
        // Non-computed: property must be an identifier or numeric literal
        let prop_literal = match member.property.as_ref() {
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
                    property: MemberProperty::Literal(PropertyLiteral::String("".to_string())),
                    value: InstructionValue::UnsupportedNode { node_type: None, loc },
                };
            }
        };
        let value = InstructionValue::PropertyLoad {
            object: object.clone(),
            property: prop_literal.clone(),
            loc,
        };
        LoweredMemberExpression { object, property: MemberProperty::Literal(prop_literal), value }
    } else {
        // Computed: check for numeric literal first (treated as PropertyLoad in TS)
        if let Expression::NumericLiteral(lit) = member.property.as_ref() {
            let prop_literal = PropertyLiteral::Number(FloatValue::new(lit.value));
            let value = InstructionValue::PropertyLoad {
                object: object.clone(),
                property: prop_literal.clone(),
                loc,
            };
            return LoweredMemberExpression { object, property: MemberProperty::Literal(prop_literal), value };
        }
        // Otherwise lower property to temporary for ComputedLoad
        let property = lower_expression_to_temporary(builder, &member.property);
        let value = InstructionValue::ComputedLoad {
            object: object.clone(),
            property: property.clone(),
            loc,
        };
        LoweredMemberExpression { object, property: MemberProperty::Computed(property), value }
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
            // Check for pipeline operator before lowering operands
            if matches!(bin.operator, react_compiler_ast::operators::BinaryOperator::Pipeline) {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "(BuildHIR::lowerExpression) Pipe operator not supported".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return InstructionValue::UnsupportedNode { node_type: None, loc };
            }
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
                    // Delete can be on member expressions or identifiers
                    let loc = convert_opt_loc(&unary.base.loc);
                    match &*unary.argument {
                        Expression::MemberExpression(member) => {
                            let object = lower_expression_to_temporary(builder, &member.object);
                            if !member.computed {
                                match &*member.property {
                                    Expression::Identifier(prop_id) => {
                                        InstructionValue::PropertyDelete {
                                            object,
                                            property: PropertyLiteral::String(prop_id.name.clone()),
                                            loc,
                                        }
                                    }
                                    _ => {
                                        builder.record_error(CompilerErrorDetail {
                                            reason: "Unsupported delete target".to_string(),
                                            category: ErrorCategory::Todo,
                                            loc: loc.clone(),
                                            description: None,
                                            suggestions: None,
                                        });
                                        InstructionValue::UnsupportedNode { node_type: None, loc }
                                    }
                                }
                            } else {
                                let property = lower_expression_to_temporary(builder, &member.property);
                                InstructionValue::ComputedDelete {
                                    object,
                                    property,
                                    loc,
                                }
                            }
                        }
                        _ => {
                            // delete on non-member expression (e.g., delete x) - not commonly supported
                            builder.record_error(CompilerErrorDetail {
                                reason: "Unsupported delete target".to_string(),
                                category: ErrorCategory::Todo,
                                loc: loc.clone(),
                                description: None,
                                suggestions: None,
                            });
                            InstructionValue::UnsupportedNode { node_type: None, loc }
                        }
                    }
                }
                react_compiler_ast::operators::UnaryOperator::Throw => {
                    // throw as unary operator (Babel-specific)
                    let loc = convert_opt_loc(&unary.base.loc);
                    builder.record_error(CompilerErrorDetail {
                        reason: "throw expressions are not supported".to_string(),
                        category: ErrorCategory::Todo,
                        loc: loc.clone(),
                        description: None,
                        suggestions: None,
                    });
                    InstructionValue::UnsupportedNode { node_type: None, loc }
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
        Expression::OptionalCallExpression(opt_call) => {
            lower_optional_call_expression(builder, opt_call)
        }
        Expression::OptionalMemberExpression(opt_member) => {
            lower_optional_member_expression(builder, opt_member)
        }
        Expression::LogicalExpression(expr) => {
            let loc = convert_opt_loc(&expr.base.loc);
            let continuation_block = builder.reserve(builder.current_block_kind());
            let continuation_id = continuation_block.id;
            let test_block = builder.reserve(BlockKind::Value);
            let test_block_id = test_block.id;
            let place = build_temporary_place(builder, loc.clone());
            let left_loc = expression_loc(&expr.left);
            let left_place = build_temporary_place(builder, left_loc);

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
                Expression::MemberExpression(member) => {
                    let binary_op = match &update.operator {
                        react_compiler_ast::operators::UpdateOperator::Increment => BinaryOperator::Add,
                        react_compiler_ast::operators::UpdateOperator::Decrement => BinaryOperator::Subtract,
                    };
                    // Use the member expression's loc (not the update expression's)
                    // to match TS behavior where the inner operations use leftExpr.node.loc
                    let member_loc = convert_opt_loc(&member.base.loc);
                    let lowered = lower_member_expression(builder, member);
                    let object = lowered.object;
                    let lowered_property = lowered.property;
                    let prev_value = lower_value_to_temporary(builder, lowered.value);

                    let one = lower_value_to_temporary(builder, InstructionValue::Primitive {
                        value: PrimitiveValue::Number(FloatValue::new(1.0)),
                        loc: None,
                    });
                    let updated = lower_value_to_temporary(builder, InstructionValue::BinaryExpression {
                        operator: binary_op,
                        left: prev_value.clone(),
                        right: one,
                        loc: member_loc.clone(),
                    });

                    // Store back using the property from the lowered member expression
                    match lowered_property {
                        MemberProperty::Literal(prop_literal) => {
                            lower_value_to_temporary(builder, InstructionValue::PropertyStore {
                                object,
                                property: prop_literal,
                                value: updated.clone(),
                                loc: member_loc,
                            });
                        }
                        MemberProperty::Computed(prop_place) => {
                            lower_value_to_temporary(builder, InstructionValue::ComputedStore {
                                object,
                                property: prop_place,
                                value: updated.clone(),
                                loc: member_loc,
                            });
                        }
                    }

                    // Return previous for postfix, updated for prefix
                    let result_place = if update.prefix { updated } else { prev_value };
                    InstructionValue::LoadLocal { place: result_place.clone(), loc: result_place.loc.clone() }
                }
                Expression::Identifier(ident) => {
                    let start = ident.base.start.unwrap_or(0);
                    if builder.is_context_identifier(&ident.name, start) {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Todo,
                            reason: "(BuildHIR::lowerExpression) Handle UpdateExpression to variables captured within lambdas.".to_string(),
                            description: None,
                            loc: loc.clone(),
                            suggestions: None,
                        });
                        return InstructionValue::UnsupportedNode { node_type: None, loc };
                    }

                    let ident_loc = convert_opt_loc(&ident.base.loc);
                    let binding = builder.resolve_identifier(&ident.name, start, ident_loc.clone());
                    match &binding {
                        VariableBinding::Global { .. } => {
                            builder.record_error(CompilerErrorDetail {
                                category: ErrorCategory::Todo,
                                reason: "UpdateExpression where argument is a global is not yet supported".to_string(),
                                description: None,
                                loc: loc.clone(),
                                suggestions: None,
                            });
                            return InstructionValue::UnsupportedNode { node_type: None, loc };
                        }
                        _ => {}
                    }
                    let identifier = match binding {
                        VariableBinding::Identifier { identifier, .. } => identifier,
                        _ => {
                            builder.record_error(CompilerErrorDetail {
                                category: ErrorCategory::Todo,
                                reason: "(BuildHIR::lowerExpression) Support UpdateExpression where argument is a global".to_string(),
                                description: None,
                                loc: loc.clone(),
                                suggestions: None,
                            });
                            return InstructionValue::UnsupportedNode { node_type: Some("UpdateExpression".to_string()), loc };
                        }
                    };
                    let lvalue_place = Place {
                        identifier,
                        effect: Effect::Unknown,
                        reactive: false,
                        loc: ident_loc.clone(),
                    };

                    // Load the current value
                    let value = lower_identifier(builder, &ident.name, start, ident_loc);

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
                    InstructionValue::UnsupportedNode { node_type: None, loc }
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
            let consequent_ast_loc = expression_loc(&expr.consequent);
            let consequent_block = builder.enter(BlockKind::Value, |builder, _block_id| {
                let consequent = lower_expression_to_temporary(builder, &expr.consequent);
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
                    loc: consequent_ast_loc,
                }
            });

            // Block for the alternate (test is falsy)
            let alternate_ast_loc = expression_loc(&expr.alternate);
            let alternate_block = builder.enter(BlockKind::Value, |builder, _block_id| {
                let alternate = lower_expression_to_temporary(builder, &expr.alternate);
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
                    loc: alternate_ast_loc,
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
                        let ident_loc = convert_opt_loc(&ident.base.loc);
                        let binding = builder.resolve_identifier(&ident.name, start, ident_loc.clone());
                        match binding {
                            VariableBinding::Identifier { identifier, binding_kind } => {
                                // Check for const reassignment
                                if binding_kind == BindingKind::Const {
                                    builder.record_error(CompilerErrorDetail {
                                        reason: "Cannot reassign a `const` variable".to_string(),
                                        category: ErrorCategory::Syntax,
                                        loc: ident_loc.clone(),
                                        description: Some(format!("`{}` is declared as const", &ident.name)),
                                        suggestions: None,
                                    });
                                    return InstructionValue::UnsupportedNode { node_type: Some("Identifier".to_string()), loc: ident_loc };
                                }
                                let place = Place {
                                    identifier,
                                    reactive: false,
                                    effect: Effect::Unknown,
                                    loc: ident_loc,
                                };
                                if builder.is_context_identifier(&ident.name, start) {
                                    let temp = lower_value_to_temporary(builder, InstructionValue::StoreContext {
                                        lvalue: LValue {
                                            kind: InstructionKind::Reassign,
                                            place: place.clone(),
                                        },
                                        value: right,
                                        loc: place.loc.clone(),
                                    });
                                    InstructionValue::LoadLocal { place: temp.clone(), loc: temp.loc.clone() }
                                } else {
                                    let temp = lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                                        lvalue: LValue {
                                            kind: InstructionKind::Reassign,
                                            place: place.clone(),
                                        },
                                        value: right,
                                        type_annotation: None,
                                        loc: place.loc.clone(),
                                    });
                                    InstructionValue::LoadLocal { place: temp.clone(), loc: temp.loc.clone() }
                                }
                            }
                            _ => {
                                // Global or import assignment
                                let name = ident.name.clone();
                                let temp = lower_value_to_temporary(builder, InstructionValue::StoreGlobal {
                                    name,
                                    value: right,
                                    loc: ident_loc,
                                });
                                InstructionValue::LoadLocal { place: temp.clone(), loc: temp.loc.clone() }
                            }
                        }
                    }
                    react_compiler_ast::patterns::PatternLike::MemberExpression(member) => {
                        // Member expression assignment: a.b = value or a[b] = value
                        let right = lower_expression_to_temporary(builder, &expr.right);
                        let left_loc = convert_opt_loc(&member.base.loc);
                        let object = lower_expression_to_temporary(builder, &member.object);
                        let temp = if !member.computed || matches!(&*member.property, react_compiler_ast::expressions::Expression::NumericLiteral(_)) {
                            match &*member.property {
                                react_compiler_ast::expressions::Expression::Identifier(prop_id) => {
                                    lower_value_to_temporary(builder, InstructionValue::PropertyStore {
                                        object,
                                        property: PropertyLiteral::String(prop_id.name.clone()),
                                        value: right,
                                        loc: left_loc,
                                    })
                                }
                                react_compiler_ast::expressions::Expression::NumericLiteral(num) => {
                                    lower_value_to_temporary(builder, InstructionValue::PropertyStore {
                                        object,
                                        property: PropertyLiteral::Number(FloatValue::new(num.value)),
                                        value: right,
                                        loc: left_loc,
                                    })
                                }
                                _ => {
                                    let prop = lower_expression_to_temporary(builder, &member.property);
                                    lower_value_to_temporary(builder, InstructionValue::ComputedStore {
                                        object,
                                        property: prop,
                                        value: right,
                                        loc: left_loc,
                                    })
                                }
                            }
                        } else {
                            let prop = lower_expression_to_temporary(builder, &member.property);
                            lower_value_to_temporary(builder, InstructionValue::ComputedStore {
                                object,
                                property: prop,
                                value: right,
                                loc: left_loc,
                            })
                        };
                        InstructionValue::LoadLocal { place: temp.clone(), loc: temp.loc.clone() }
                    }
                    _ => {
                        // Destructuring assignment
                        let right = lower_expression_to_temporary(builder, &expr.right);
                        let left_loc = pattern_like_hir_loc(&expr.left);
                        lower_assignment(
                            builder,
                            left_loc,
                            InstructionKind::Reassign,
                            &expr.left,
                            right.clone(),
                            AssignmentStyle::Destructure,
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
                        // Logical assignment operators (||=, &&=, ??=) - not yet supported
                        builder.record_error(CompilerErrorDetail {
                            reason: "Logical assignment operators (||=, &&=, ??=) are not yet supported".to_string(),
                            category: ErrorCategory::Todo,
                            loc: loc.clone(),
                            description: None,
                            suggestions: None,
                        });
                        return InstructionValue::UnsupportedNode { node_type: None, loc };
                    }
                    AssignmentOperator::Assign => unreachable!(),
                };
                let binary_op = match binary_op {
                    Some(op) => op,
                    None => {
                        return InstructionValue::UnsupportedNode { node_type: None, loc };
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
                        let ident_loc = convert_opt_loc(&ident.base.loc);
                        let binding = builder.resolve_identifier(&ident.name, start, ident_loc.clone());
                        match binding {
                            VariableBinding::Identifier { identifier, .. } => {
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
                    react_compiler_ast::patterns::PatternLike::MemberExpression(member) => {
                        // a.b += right: read, compute, store
                        // Match TS behavior: return the PropertyStore/ComputedStore value
                        // directly (let the caller lower it to a temporary)
                        let member_loc = convert_opt_loc(&member.base.loc);
                        let lowered = lower_member_expression(builder, member);
                        let object = lowered.object;
                        let lowered_property = lowered.property;
                        let current_value = lower_value_to_temporary(builder, lowered.value);
                        let right = lower_expression_to_temporary(builder, &expr.right);
                        let result = lower_value_to_temporary(builder, InstructionValue::BinaryExpression {
                            operator: binary_op,
                            left: current_value,
                            right,
                            loc: member_loc.clone(),
                        });
                        // Return the store instruction value directly (matching TS behavior)
                        match lowered_property {
                            MemberProperty::Literal(prop_literal) => {
                                InstructionValue::PropertyStore {
                                    object,
                                    property: prop_literal,
                                    value: result,
                                    loc: member_loc,
                                }
                            }
                            MemberProperty::Computed(prop_place) => {
                                InstructionValue::ComputedStore {
                                    object,
                                    property: prop_place,
                                    value: result,
                                    loc: member_loc,
                                }
                            }
                        }
                    }
                    _ => {
                        builder.record_error(CompilerErrorDetail {
                            reason: "Compound assignment to complex pattern is not yet supported".to_string(),
                            category: ErrorCategory::Todo,
                            loc: loc.clone(),
                            description: None,
                            suggestions: None,
                        });
                        InstructionValue::UnsupportedNode { node_type: None, loc }
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
                return InstructionValue::UnsupportedNode { node_type: None, loc };
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
                        if let Some(prop) = lower_object_method(builder, method) {
                            properties.push(ObjectPropertyOrSpread::Property(prop));
                        }
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
                    reason: "(BuildHIR::lowerExpression) Handle tagged template with interpolations".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return InstructionValue::UnsupportedNode { node_type: Some("TaggedTemplateExpression".to_string()), loc };
            }
            assert!(
                tagged.quasi.quasis.len() == 1,
                "there should be only one quasi as we don't support interpolations yet"
            );
            let quasi = &tagged.quasi.quasis[0];
            // Check if raw and cooked values differ (e.g., graphql tagged templates)
            if quasi.value.raw != quasi.value.cooked.clone().unwrap_or_default() {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "(BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return InstructionValue::UnsupportedNode { node_type: Some("TaggedTemplateExpression".to_string()), loc };
            }
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
                reason: "(BuildHIR::lowerExpression) Handle YieldExpression expressions".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { node_type: None, loc }
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
                    reason: "(BuildHIR::lowerExpression) Handle MetaProperty expressions other than import.meta".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                InstructionValue::UnsupportedNode { node_type: Some("MetaProperty".to_string()), loc }
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
            InstructionValue::UnsupportedNode { node_type: None, loc }
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
            InstructionValue::UnsupportedNode { node_type: None, loc }
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
            InstructionValue::UnsupportedNode { node_type: None, loc }
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
            InstructionValue::UnsupportedNode { node_type: None, loc }
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
            InstructionValue::UnsupportedNode { node_type: None, loc }
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
                            JSXAttributeName::JSXIdentifier(id) => {
                                let name = &id.name;
                                if name.contains(':') {
                                    builder.record_error(CompilerErrorDetail {
                                        category: ErrorCategory::Todo,
                                        reason: format!(
                                            "(BuildHIR::lowerExpression) Unexpected colon in attribute name `{}`",
                                            name
                                        ),
                                        description: None,
                                        loc: convert_opt_loc(&id.base.loc),
                                        suggestions: None,
                                    });
                                }
                                name.clone()
                            }
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

            // Check if this is an fbt/fbs tag, which requires special whitespace handling
            let is_fbt = matches!(&tag, JsxTag::Builtin(b) if b.name == "fbt" || b.name == "fbs");

            // Check for duplicate fbt:enum, fbt:plural, fbt:pronoun tags
            if is_fbt {
                let tag_name = match &tag {
                    JsxTag::Builtin(b) => b.name.as_str(),
                    _ => "fbt",
                };
                let mut enum_locs: Vec<Option<SourceLocation>> = Vec::new();
                let mut plural_locs: Vec<Option<SourceLocation>> = Vec::new();
                let mut pronoun_locs: Vec<Option<SourceLocation>> = Vec::new();
                collect_fbt_sub_tags(&jsx_element.children, tag_name, &mut enum_locs, &mut plural_locs, &mut pronoun_locs);

                for (name, locations) in [("enum", &enum_locs), ("plural", &plural_locs), ("pronoun", &pronoun_locs)] {
                    if locations.len() > 1 {
                        use react_compiler_diagnostics::CompilerDiagnosticDetail;
                        let details: Vec<CompilerDiagnosticDetail> = locations.iter().map(|loc| {
                            CompilerDiagnosticDetail::Error {
                                message: Some(format!("Multiple `<{}:{}>` tags found", tag_name, name)),
                                loc: loc.clone(),
                            }
                        }).collect();
                        let mut diag = react_compiler_diagnostics::CompilerDiagnostic::new(
                            ErrorCategory::Todo,
                            "Support duplicate fbt tags",
                            Some(format!("Support `<{}>` tags with multiple `<{}:{}>` values", tag_name, tag_name, name)),
                        );
                        diag.details = details;
                        builder.environment_mut().record_diagnostic(diag);
                    }
                }
            }

            // Increment fbt counter before traversing into children, as whitespace
            // in jsx text is handled differently for fbt subtrees.
            if is_fbt {
                builder.fbt_depth += 1;
            }

            // Lower children
            let children: Vec<Place> = jsx_element.children.iter()
                .filter_map(|child| lower_jsx_element(builder, child))
                .collect();

            if is_fbt {
                builder.fbt_depth -= 1;
            }

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
        Expression::AssignmentPattern(_) => {
            let loc = convert_opt_loc(&match expr {
                Expression::AssignmentPattern(p) => p.base.loc.clone(),
                _ => unreachable!(),
            });
            builder.record_error(CompilerErrorDetail {
                reason: "AssignmentPattern in expression position is not supported".to_string(),
                category: ErrorCategory::Todo,
                loc: loc.clone(),
                description: None,
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { node_type: None, loc }
        }
        Expression::TSAsExpression(ts) => {
            let loc = convert_opt_loc(&ts.base.loc);
            let value = lower_expression_to_temporary(builder, &ts.expression);
            let type_annotation = &*ts.type_annotation;
            let type_ = lower_type_annotation(type_annotation, builder);
            let type_annotation_name = get_type_annotation_name(type_annotation);
            InstructionValue::TypeCastExpression { value, type_, type_annotation_name, type_annotation_kind: Some("as".to_string()), loc }
        }
        Expression::TSSatisfiesExpression(ts) => {
            let loc = convert_opt_loc(&ts.base.loc);
            let value = lower_expression_to_temporary(builder, &ts.expression);
            let type_annotation = &*ts.type_annotation;
            let type_ = lower_type_annotation(type_annotation, builder);
            let type_annotation_name = get_type_annotation_name(type_annotation);
            InstructionValue::TypeCastExpression { value, type_, type_annotation_name, type_annotation_kind: Some("satisfies".to_string()), loc }
        }
        Expression::TSNonNullExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TSTypeAssertion(ts) => {
            let loc = convert_opt_loc(&ts.base.loc);
            let value = lower_expression_to_temporary(builder, &ts.expression);
            let type_annotation = &*ts.type_annotation;
            let type_ = lower_type_annotation(type_annotation, builder);
            let type_annotation_name = get_type_annotation_name(type_annotation);
            InstructionValue::TypeCastExpression { value, type_, type_annotation_name, type_annotation_kind: Some("as".to_string()), loc }
        }
        Expression::TSInstantiationExpression(ts) => lower_expression(builder, &ts.expression),
        Expression::TypeCastExpression(tc) => {
            let loc = convert_opt_loc(&tc.base.loc);
            let value = lower_expression_to_temporary(builder, &tc.expression);
            // Flow TypeCastExpression: typeAnnotation is a TypeAnnotation node wrapping the actual type
            let inner_type = tc.type_annotation.get("typeAnnotation").unwrap_or(&*tc.type_annotation);
            let type_ = lower_type_annotation(inner_type, builder);
            let type_annotation_name = get_type_annotation_name(inner_type);
            InstructionValue::TypeCastExpression { value, type_, type_annotation_name, type_annotation_kind: Some("cast".to_string()), loc }
        }
        Expression::BigIntLiteral(big) => {
            let loc = convert_opt_loc(&big.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Todo,
                reason: "BigInt literals are not yet supported".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            InstructionValue::UnsupportedNode { node_type: None, loc }
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
// Statement position helpers
// =============================================================================

fn statement_start(stmt: &react_compiler_ast::statements::Statement) -> Option<u32> {
    use react_compiler_ast::statements::Statement;
    match stmt {
        Statement::BlockStatement(s) => s.base.start,
        Statement::ReturnStatement(s) => s.base.start,
        Statement::IfStatement(s) => s.base.start,
        Statement::ForStatement(s) => s.base.start,
        Statement::WhileStatement(s) => s.base.start,
        Statement::DoWhileStatement(s) => s.base.start,
        Statement::ForInStatement(s) => s.base.start,
        Statement::ForOfStatement(s) => s.base.start,
        Statement::SwitchStatement(s) => s.base.start,
        Statement::ThrowStatement(s) => s.base.start,
        Statement::TryStatement(s) => s.base.start,
        Statement::BreakStatement(s) => s.base.start,
        Statement::ContinueStatement(s) => s.base.start,
        Statement::LabeledStatement(s) => s.base.start,
        Statement::ExpressionStatement(s) => s.base.start,
        Statement::EmptyStatement(s) => s.base.start,
        Statement::DebuggerStatement(s) => s.base.start,
        Statement::WithStatement(s) => s.base.start,
        Statement::VariableDeclaration(s) => s.base.start,
        Statement::FunctionDeclaration(s) => s.base.start,
        Statement::ClassDeclaration(s) => s.base.start,
        Statement::ImportDeclaration(s) => s.base.start,
        Statement::ExportNamedDeclaration(s) => s.base.start,
        Statement::ExportDefaultDeclaration(s) => s.base.start,
        Statement::ExportAllDeclaration(s) => s.base.start,
        Statement::TSTypeAliasDeclaration(s) => s.base.start,
        Statement::TSInterfaceDeclaration(s) => s.base.start,
        Statement::TSEnumDeclaration(s) => s.base.start,
        Statement::TSModuleDeclaration(s) => s.base.start,
        Statement::TSDeclareFunction(s) => s.base.start,
        Statement::TypeAlias(s) => s.base.start,
        Statement::OpaqueType(s) => s.base.start,
        Statement::InterfaceDeclaration(s) => s.base.start,
        Statement::DeclareVariable(s) => s.base.start,
        Statement::DeclareFunction(s) => s.base.start,
        Statement::DeclareClass(s) => s.base.start,
        Statement::DeclareModule(s) => s.base.start,
        Statement::DeclareModuleExports(s) => s.base.start,
        Statement::DeclareExportDeclaration(s) => s.base.start,
        Statement::DeclareExportAllDeclaration(s) => s.base.start,
        Statement::DeclareInterface(s) => s.base.start,
        Statement::DeclareTypeAlias(s) => s.base.start,
        Statement::DeclareOpaqueType(s) => s.base.start,
        Statement::EnumDeclaration(s) => s.base.start,
    }
}

fn statement_end(stmt: &react_compiler_ast::statements::Statement) -> Option<u32> {
    use react_compiler_ast::statements::Statement;
    match stmt {
        Statement::BlockStatement(s) => s.base.end,
        Statement::ReturnStatement(s) => s.base.end,
        Statement::IfStatement(s) => s.base.end,
        Statement::ForStatement(s) => s.base.end,
        Statement::WhileStatement(s) => s.base.end,
        Statement::DoWhileStatement(s) => s.base.end,
        Statement::ForInStatement(s) => s.base.end,
        Statement::ForOfStatement(s) => s.base.end,
        Statement::SwitchStatement(s) => s.base.end,
        Statement::ThrowStatement(s) => s.base.end,
        Statement::TryStatement(s) => s.base.end,
        Statement::BreakStatement(s) => s.base.end,
        Statement::ContinueStatement(s) => s.base.end,
        Statement::LabeledStatement(s) => s.base.end,
        Statement::ExpressionStatement(s) => s.base.end,
        Statement::EmptyStatement(s) => s.base.end,
        Statement::DebuggerStatement(s) => s.base.end,
        Statement::WithStatement(s) => s.base.end,
        Statement::VariableDeclaration(s) => s.base.end,
        Statement::FunctionDeclaration(s) => s.base.end,
        Statement::ClassDeclaration(s) => s.base.end,
        Statement::ImportDeclaration(s) => s.base.end,
        Statement::ExportNamedDeclaration(s) => s.base.end,
        Statement::ExportDefaultDeclaration(s) => s.base.end,
        Statement::ExportAllDeclaration(s) => s.base.end,
        Statement::TSTypeAliasDeclaration(s) => s.base.end,
        Statement::TSInterfaceDeclaration(s) => s.base.end,
        Statement::TSEnumDeclaration(s) => s.base.end,
        Statement::TSModuleDeclaration(s) => s.base.end,
        Statement::TSDeclareFunction(s) => s.base.end,
        Statement::TypeAlias(s) => s.base.end,
        Statement::OpaqueType(s) => s.base.end,
        Statement::InterfaceDeclaration(s) => s.base.end,
        Statement::DeclareVariable(s) => s.base.end,
        Statement::DeclareFunction(s) => s.base.end,
        Statement::DeclareClass(s) => s.base.end,
        Statement::DeclareModule(s) => s.base.end,
        Statement::DeclareModuleExports(s) => s.base.end,
        Statement::DeclareExportDeclaration(s) => s.base.end,
        Statement::DeclareExportAllDeclaration(s) => s.base.end,
        Statement::DeclareInterface(s) => s.base.end,
        Statement::DeclareTypeAlias(s) => s.base.end,
        Statement::DeclareOpaqueType(s) => s.base.end,
        Statement::EnumDeclaration(s) => s.base.end,
    }
}

/// Extract the HIR SourceLocation from a Statement AST node.
fn statement_loc(stmt: &react_compiler_ast::statements::Statement) -> Option<SourceLocation> {
    use react_compiler_ast::statements::Statement;
    let loc = match stmt {
        Statement::BlockStatement(s) => s.base.loc.clone(),
        Statement::ReturnStatement(s) => s.base.loc.clone(),
        Statement::IfStatement(s) => s.base.loc.clone(),
        Statement::ForStatement(s) => s.base.loc.clone(),
        Statement::WhileStatement(s) => s.base.loc.clone(),
        Statement::DoWhileStatement(s) => s.base.loc.clone(),
        Statement::ForInStatement(s) => s.base.loc.clone(),
        Statement::ForOfStatement(s) => s.base.loc.clone(),
        Statement::SwitchStatement(s) => s.base.loc.clone(),
        Statement::ThrowStatement(s) => s.base.loc.clone(),
        Statement::TryStatement(s) => s.base.loc.clone(),
        Statement::BreakStatement(s) => s.base.loc.clone(),
        Statement::ContinueStatement(s) => s.base.loc.clone(),
        Statement::LabeledStatement(s) => s.base.loc.clone(),
        Statement::ExpressionStatement(s) => s.base.loc.clone(),
        Statement::EmptyStatement(s) => s.base.loc.clone(),
        Statement::DebuggerStatement(s) => s.base.loc.clone(),
        Statement::WithStatement(s) => s.base.loc.clone(),
        Statement::VariableDeclaration(s) => s.base.loc.clone(),
        Statement::FunctionDeclaration(s) => s.base.loc.clone(),
        Statement::ClassDeclaration(s) => s.base.loc.clone(),
        Statement::ImportDeclaration(s) => s.base.loc.clone(),
        Statement::ExportNamedDeclaration(s) => s.base.loc.clone(),
        Statement::ExportDefaultDeclaration(s) => s.base.loc.clone(),
        Statement::ExportAllDeclaration(s) => s.base.loc.clone(),
        Statement::TSTypeAliasDeclaration(s) => s.base.loc.clone(),
        Statement::TSInterfaceDeclaration(s) => s.base.loc.clone(),
        Statement::TSEnumDeclaration(s) => s.base.loc.clone(),
        Statement::TSModuleDeclaration(s) => s.base.loc.clone(),
        Statement::TSDeclareFunction(s) => s.base.loc.clone(),
        Statement::TypeAlias(s) => s.base.loc.clone(),
        Statement::OpaqueType(s) => s.base.loc.clone(),
        Statement::InterfaceDeclaration(s) => s.base.loc.clone(),
        Statement::DeclareVariable(s) => s.base.loc.clone(),
        Statement::DeclareFunction(s) => s.base.loc.clone(),
        Statement::DeclareClass(s) => s.base.loc.clone(),
        Statement::DeclareModule(s) => s.base.loc.clone(),
        Statement::DeclareModuleExports(s) => s.base.loc.clone(),
        Statement::DeclareExportDeclaration(s) => s.base.loc.clone(),
        Statement::DeclareExportAllDeclaration(s) => s.base.loc.clone(),
        Statement::DeclareInterface(s) => s.base.loc.clone(),
        Statement::DeclareTypeAlias(s) => s.base.loc.clone(),
        Statement::DeclareOpaqueType(s) => s.base.loc.clone(),
        Statement::EnumDeclaration(s) => s.base.loc.clone(),
    };
    convert_opt_loc(&loc)
}

/// Collect binding names from a pattern that are declared in the given scope.
fn collect_binding_names_from_pattern(
    pattern: &react_compiler_ast::patterns::PatternLike,
    scope_id: react_compiler_ast::scope::ScopeId,
    scope_info: &ScopeInfo,
    out: &mut HashSet<BindingId>,
) {
    use react_compiler_ast::patterns::PatternLike;
    match pattern {
        PatternLike::Identifier(id) => {
            if let Some(&binding_id) = scope_info.scopes[scope_id.0 as usize].bindings.get(&id.name) {
                out.insert(binding_id);
            }
        }
        PatternLike::ObjectPattern(obj) => {
            for prop in &obj.properties {
                match prop {
                    react_compiler_ast::patterns::ObjectPatternProperty::ObjectProperty(p) => {
                        collect_binding_names_from_pattern(&p.value, scope_id, scope_info, out);
                    }
                    react_compiler_ast::patterns::ObjectPatternProperty::RestElement(r) => {
                        collect_binding_names_from_pattern(&r.argument, scope_id, scope_info, out);
                    }
                }
            }
        }
        PatternLike::ArrayPattern(arr) => {
            for elem in &arr.elements {
                if let Some(e) = elem {
                    collect_binding_names_from_pattern(e, scope_id, scope_info, out);
                }
            }
        }
        PatternLike::AssignmentPattern(assign) => {
            collect_binding_names_from_pattern(&assign.left, scope_id, scope_info, out);
        }
        PatternLike::RestElement(rest) => {
            collect_binding_names_from_pattern(&rest.argument, scope_id, scope_info, out);
        }
        PatternLike::MemberExpression(_) => {}
    }
}

// =============================================================================
// lower_block_statement (with hoisting)
// =============================================================================

/// Lower a BlockStatement with hoisting support.
///
/// Implements the TS BlockStatement hoisting pass: identifies forward references to
/// block-scoped bindings and emits DeclareContext instructions to hoist them.
fn lower_block_statement(
    builder: &mut HirBuilder,
    block: &react_compiler_ast::statements::BlockStatement,
) {
    lower_block_statement_inner(builder, block, None);
}

fn lower_block_statement_with_scope(
    builder: &mut HirBuilder,
    block: &react_compiler_ast::statements::BlockStatement,
    scope_override: react_compiler_ast::scope::ScopeId,
) {
    lower_block_statement_inner(builder, block, Some(scope_override));
}

fn lower_block_statement_inner(
    builder: &mut HirBuilder,
    block: &react_compiler_ast::statements::BlockStatement,
    scope_override: Option<react_compiler_ast::scope::ScopeId>,
) {
    use react_compiler_ast::scope::BindingKind as AstBindingKind;
    use react_compiler_ast::statements::Statement;

    // Look up the block's scope to identify hoistable bindings.
    // Use the scope override if provided (for function body blocks that share the function's scope).
    let block_scope_id = scope_override.or_else(|| {
        block.base.start.and_then(|start| builder.scope_info().node_to_scope.get(&start).copied())
    });

    let scope_id = match block_scope_id {
        Some(id) => id,
        None => {
            // No scope found for this block, just lower statements normally
            for body_stmt in &block.body {
                lower_statement(builder, body_stmt, None);
            }
            return;
        }
    };

    // Collect hoistable bindings from this scope (non-param bindings).
    // Exclude bindings whose declaration_type is "FunctionExpression" since named function
    // expression names are local to the expression and should never be hoisted.
    let hoistable: Vec<(BindingId, String, AstBindingKind, String, Option<u32>)> = builder.scope_info()
        .scope_bindings(scope_id)
        .filter(|b| {
            !matches!(b.kind, AstBindingKind::Param)
            && b.declaration_type != "FunctionExpression"
            // Skip type-only declarations (TypeAlias, OpaqueType, InterfaceDeclaration, etc.)
            && !matches!(b.declaration_type.as_str(),
                "TypeAlias" | "OpaqueType" | "InterfaceDeclaration"
                | "DeclareVariable" | "DeclareFunction" | "DeclareClass"
                | "DeclareModule" | "DeclareInterface" | "DeclareOpaqueType"
                | "TSTypeAliasDeclaration" | "TSInterfaceDeclaration"
                | "TSEnumDeclaration" | "TSModuleDeclaration"
            )
        })
        .map(|b| (b.id, b.name.clone(), b.kind.clone(), b.declaration_type.clone(), b.declaration_start))
        .collect();

    if hoistable.is_empty() {
        // No hoistable bindings, just lower statements normally
        for body_stmt in &block.body {
            lower_statement(builder, body_stmt, None);
        }
        return;
    }

    // Track which bindings have been "declared" (their declaration statement has been seen)
    let mut declared: HashSet<BindingId> = HashSet::new();

    for body_stmt in &block.body {
        let stmt_start = statement_start(body_stmt).unwrap_or(0);
        let stmt_end = statement_end(body_stmt).unwrap_or(u32::MAX);
        let is_function_decl = matches!(body_stmt, Statement::FunctionDeclaration(_));

        // Check if statement contains nested function scopes
        let has_nested_functions = is_function_decl || {
            let scope_info = builder.scope_info();
            scope_info.node_to_scope.iter().any(|(&pos, &sid)| {
                pos > stmt_start && pos < stmt_end
                    && matches!(scope_info.scopes[sid.0 as usize].kind, ScopeKind::Function)
            })
        };

        // Find references to not-yet-declared hoistable bindings within this statement
        struct HoistInfo {
            binding_id: BindingId,
            name: String,
            kind: AstBindingKind,
            declaration_type: String,
            first_ref_pos: u32,
        }
        let mut will_hoist: Vec<HoistInfo> = Vec::new();

        for (binding_id, name, kind, decl_type, decl_start) in &hoistable {
            if declared.contains(binding_id) {
                continue;
            }

            // Find the first reference (not declaration) to this binding in the statement's range.
            let first_ref = builder.scope_info().reference_to_binding.iter()
                .filter(|(ref_start, ref_binding_id)| {
                    **ref_start >= stmt_start && **ref_start < stmt_end
                        && **ref_binding_id == *binding_id
                        && Some(**ref_start) != *decl_start
                })
                .map(|(ref_start, _)| *ref_start)
                .min();

            if let Some(first_ref_pos) = first_ref {
                // Hoist if: (1) binding is "hoisted" kind (function declaration), or
                // (2) reference is inside a nested function
                let should_hoist = matches!(kind, AstBindingKind::Hoisted) || has_nested_functions;
                if should_hoist {
                    will_hoist.push(HoistInfo {
                        binding_id: *binding_id,
                        name: name.clone(),
                        kind: kind.clone(),
                        declaration_type: decl_type.clone(),
                        first_ref_pos,
                    });
                }
            }
        }

        // Sort by first reference position to match TS traversal order
        will_hoist.sort_by_key(|h| h.first_ref_pos);


        // Emit DeclareContext for hoisted bindings
        for info in &will_hoist {
            if builder.environment().is_hoisted_identifier(info.binding_id.0) {
                continue;
            }

            let hoist_kind = match info.kind {
                AstBindingKind::Const | AstBindingKind::Var => InstructionKind::HoistedConst,
                AstBindingKind::Let => InstructionKind::HoistedLet,
                AstBindingKind::Hoisted => InstructionKind::HoistedFunction,
                _ => {
                    if info.declaration_type == "FunctionDeclaration" {
                        InstructionKind::HoistedFunction
                    } else if info.declaration_type == "VariableDeclarator" {
                        // Unsupported hoisting for this declaration kind
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Todo,
                            reason: "Handle non-const declarations for hoisting".to_string(),
                            description: Some(format!(
                                "variable \"{}\" declared with {:?}",
                                info.name, info.kind
                            )),
                            loc: None,
                            suggestions: None,
                        });
                        continue;
                    } else {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Todo,
                            reason: "Unsupported declaration type for hoisting".to_string(),
                            description: Some(format!(
                                "variable \"{}\" declared with {}",
                                info.name, info.declaration_type
                            )),
                            loc: None,
                            suggestions: None,
                        });
                        continue;
                    }
                }
            };

            // Look up the reference location for the DeclareContext instruction
            let ref_loc = builder.scope_info().reference_locs.get(&info.first_ref_pos).map(|loc| {
                SourceLocation {
                    start: Position { line: loc[0], column: loc[1] },
                    end: Position { line: loc[2], column: loc[3] },
                }
            });
            let identifier = builder.resolve_binding(&info.name, info.binding_id);
            let place = Place {
                effect: Effect::Unknown,
                identifier,
                reactive: false,
                loc: ref_loc.clone(),
            };
            lower_value_to_temporary(builder, InstructionValue::DeclareContext {
                lvalue: LValue { kind: hoist_kind, place },
                loc: ref_loc,
            });
            builder.environment_mut().add_hoisted_identifier(info.binding_id.0);
            // Hoisted identifiers also become context identifiers (matching TS addHoistedIdentifier)
            builder.add_context_identifier(info.binding_id);
        }

        // After processing the statement, mark any bindings it declares as "seen".
        // This must cover all statement types that can introduce bindings.
        match body_stmt {
            Statement::FunctionDeclaration(func) => {
                if let Some(id) = &func.id {
                    if let Some(&binding_id) = builder.scope_info().scopes[scope_id.0 as usize].bindings.get(&id.name) {
                        declared.insert(binding_id);
                    }
                }
            }
            Statement::VariableDeclaration(var_decl) => {
                for decl in &var_decl.declarations {
                    collect_binding_names_from_pattern(&decl.id, scope_id, builder.scope_info(), &mut declared);
                }
            }
            Statement::ClassDeclaration(cls) => {
                if let Some(id) = &cls.id {
                    if let Some(&binding_id) = builder.scope_info().scopes[scope_id.0 as usize].bindings.get(&id.name) {
                        declared.insert(binding_id);
                    }
                }
            }
            _ => {
                // For other statement types (e.g. ForStatement with VariableDeclaration in init),
                // we rely on the reference_to_binding check for forward references.
                // Any bindings declared by child scopes won't be in this block's scope anyway.
            }
        }

        lower_statement(builder, body_stmt, None);
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
                    loc: None,
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
                    reason: "(BuildHIR::lowerStatement) Support ThrowStatement inside of try/catch".to_string(),
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
            lower_block_statement(builder, block);
        }
        Statement::VariableDeclaration(var_decl) => {
            use react_compiler_ast::statements::VariableDeclarationKind;
            use react_compiler_ast::patterns::PatternLike;
            if matches!(var_decl.kind, VariableDeclarationKind::Var) {
                builder.record_error(CompilerErrorDetail {
                    reason: "(BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration".to_string(),
                    category: ErrorCategory::Todo,
                    loc: convert_opt_loc(&var_decl.base.loc),
                    description: None,
                    suggestions: None,
                });
                // Treat `var` as `let` so references to the variable don't break
            }
            let kind = match var_decl.kind {
                VariableDeclarationKind::Let | VariableDeclarationKind::Var => InstructionKind::Let,
                VariableDeclarationKind::Const | VariableDeclarationKind::Using => InstructionKind::Const,
            };
            for declarator in &var_decl.declarations {
                let stmt_loc = convert_opt_loc(&var_decl.base.loc);
                if let Some(init) = &declarator.init {
                    let value = lower_expression_to_temporary(builder, init);
                    let assign_style = match &declarator.id {
                        PatternLike::ObjectPattern(_) | PatternLike::ArrayPattern(_) => AssignmentStyle::Destructure,
                        _ => AssignmentStyle::Assignment,
                    };
                    lower_assignment(builder, stmt_loc, kind, &declarator.id, value, assign_style);
                } else if let PatternLike::Identifier(id) = &declarator.id {
                    // No init: emit DeclareLocal or DeclareContext
                    let id_loc = convert_opt_loc(&id.base.loc);
                    let binding = builder.resolve_identifier(&id.name, id.base.start.unwrap_or(0), id_loc.clone());
                    match binding {
                        VariableBinding::Identifier { identifier, .. } => {
                            // Update the identifier's loc to the declaration site
                            // (it may have been first created at a reference site during hoisting)
                            builder.set_identifier_declaration_loc(identifier, &id_loc);
                            let place = Place {
                                identifier,
                                effect: Effect::Unknown,
                                reactive: false,
                                loc: id_loc.clone(),
                            };
                            if builder.is_context_identifier(&id.name, id.base.start.unwrap_or(0)) {
                                if kind == InstructionKind::Const {
                                    builder.record_error(CompilerErrorDetail {
                                        reason: "Expect `const` declaration not to be reassigned".to_string(),
                                        category: ErrorCategory::Syntax,
                                        loc: id_loc.clone(),
                                        description: None,
                                        suggestions: None,
                                    });
                                }
                                lower_value_to_temporary(builder, InstructionValue::DeclareContext {
                                    lvalue: LValue { kind: InstructionKind::Let, place },
                                    loc: id_loc,
                                });
                            } else {
                                let type_annotation = extract_type_annotation_name(&id.type_annotation);
                                lower_value_to_temporary(builder, InstructionValue::DeclareLocal {
                                    lvalue: LValue { kind, place },
                                    type_annotation,
                                    loc: id_loc,
                                });
                            }
                        }
                        _ => {
                            builder.record_error(CompilerErrorDetail {
                                reason: "Could not find binding for declaration".to_string(),
                                category: ErrorCategory::Invariant,
                                loc: id_loc,
                                description: None,
                                suggestions: None,
                            });
                        }
                    }
                } else {
                    builder.record_error(CompilerErrorDetail {
                        reason: "Expected variable declaration to be an identifier if no initializer was provided".to_string(),
                        category: ErrorCategory::Syntax,
                        loc: convert_opt_loc(&declarator.base.loc),
                        description: None,
                        suggestions: None,
                    });
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
            let consequent_loc = statement_loc(&if_stmt.consequent);
            let consequent_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                lower_statement(builder, &if_stmt.consequent, None);
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: consequent_loc,
                }
            });

            // Block for the alternate (if the test is not truthy)
            let alternate_block = if let Some(alternate) = &if_stmt.alternate {
                let alternate_loc = statement_loc(alternate);
                builder.enter(BlockKind::Block, |builder, _block_id| {
                    lower_statement(builder, alternate, None);
                    Terminal::Goto {
                        block: continuation_id,
                        variant: GotoVariant::Break,
                        id: EvaluationOrder(0),
                        loc: alternate_loc,
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
                let init_loc = match &for_stmt.init {
                    None => {
                        // No init expression (e.g., `for (; ...)`), add a placeholder
                        let placeholder = InstructionValue::Primitive {
                            value: PrimitiveValue::Undefined,
                            loc: loc.clone(),
                        };
                        lower_value_to_temporary(builder, placeholder);
                        loc.clone()
                    }
                    Some(init) => {
                        match init.as_ref() {
                            react_compiler_ast::statements::ForInit::VariableDeclaration(var_decl) => {
                                let init_loc = convert_opt_loc(&var_decl.base.loc);
                                lower_statement(builder, &Statement::VariableDeclaration(var_decl.clone()), None);
                                init_loc
                            }
                            react_compiler_ast::statements::ForInit::Expression(expr) => {
                                let init_loc = expression_loc(expr);
                                builder.record_error(CompilerErrorDetail {
                                    category: ErrorCategory::Todo,
                                    reason: "(BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement".to_string(),
                                    description: None,
                                    loc: loc.clone(),
                                    suggestions: None,
                                });
                                lower_expression_to_temporary(builder, expr);
                                init_loc
                            }
                        }
                    }
                };
                Terminal::Goto {
                    block: test_block_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: init_loc,
                }
            });

            // Update block (optional)
            let update_block_id = if let Some(update) = &for_stmt.update {
                let update_loc = expression_loc(update);
                Some(builder.enter(BlockKind::Loop, |builder, _block_id| {
                    lower_expression_to_temporary(builder, update);
                    Terminal::Goto {
                        block: test_block_id,
                        variant: GotoVariant::Break,
                        id: EvaluationOrder(0),
                        loc: update_loc,
                    }
                }))
            } else {
                None
            };

            // Loop body block
            let continue_target = update_block_id.unwrap_or(test_block_id);
            let body_loc = statement_loc(&for_stmt.body);
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
                            loc: body_loc,
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
            let body_loc = statement_loc(&while_stmt.body);
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
                            loc: body_loc,
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
            let body_loc = statement_loc(&do_while_stmt.body);
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
                            loc: body_loc,
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
        Statement::ForInStatement(for_in) => {
            let loc = convert_opt_loc(&for_in.base.loc);
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;
            let init_block = builder.reserve(BlockKind::Loop);
            let init_block_id = init_block.id;

            let body_loc = statement_loc(&for_in.body);
            let loop_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                builder.loop_scope(
                    label.map(|s| s.to_string()),
                    init_block_id,
                    continuation_id,
                    |builder| {
                        lower_statement(builder, &for_in.body, None);
                        Terminal::Goto {
                            block: init_block_id,
                            variant: GotoVariant::Continue,
                            id: EvaluationOrder(0),
                            loc: body_loc,
                        }
                    },
                )
            });

            let value = lower_expression_to_temporary(builder, &for_in.right);
            builder.terminate_with_continuation(
                Terminal::ForIn {
                    init: init_block_id,
                    loop_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                init_block,
            );

            // Lower the init: NextPropertyOf + assignment
            let left_loc = match for_in.left.as_ref() {
                react_compiler_ast::statements::ForInOfLeft::VariableDeclaration(var_decl) => {
                    convert_opt_loc(&var_decl.base.loc).or(loc.clone())
                }
                react_compiler_ast::statements::ForInOfLeft::Pattern(pat) => {
                    pattern_like_hir_loc(pat).or(loc.clone())
                }
            };
            let next_property = lower_value_to_temporary(builder, InstructionValue::NextPropertyOf {
                value,
                loc: left_loc.clone(),
            });

            let assign_result = match for_in.left.as_ref() {
                react_compiler_ast::statements::ForInOfLeft::VariableDeclaration(var_decl) => {
                    if var_decl.declarations.len() != 1 {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Invariant,
                            reason: format!(
                                "Expected only one declaration in ForInStatement init, got {}",
                                var_decl.declarations.len()
                            ),
                            description: None,
                            loc: left_loc.clone(),
                            suggestions: None,
                        });
                    }
                    if let Some(declarator) = var_decl.declarations.first() {
                        lower_assignment(
                            builder,
                            left_loc.clone(),
                            InstructionKind::Let,
                            &declarator.id,
                            next_property.clone(),
                            AssignmentStyle::Assignment,
                        )
                    } else {
                        None
                    }
                }
                react_compiler_ast::statements::ForInOfLeft::Pattern(pattern) => {
                    lower_assignment(
                        builder,
                        left_loc.clone(),
                        InstructionKind::Reassign,
                        pattern,
                        next_property.clone(),
                        AssignmentStyle::Assignment,
                    )
                }
            };
            // Use the assign result (StoreLocal temp) as the test, matching TS behavior
            let test_value = assign_result.unwrap_or(next_property);
            let test = lower_value_to_temporary(builder, InstructionValue::LoadLocal {
                place: test_value,
                loc: left_loc.clone(),
            });
            builder.terminate_with_continuation(
                Terminal::Branch {
                    test,
                    consequent: loop_block,
                    alternate: continuation_id,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                continuation_block,
            );
        }
        Statement::ForOfStatement(for_of) => {
            let loc = convert_opt_loc(&for_of.base.loc);
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;
            let init_block = builder.reserve(BlockKind::Loop);
            let init_block_id = init_block.id;
            let test_block = builder.reserve(BlockKind::Loop);
            let test_block_id = test_block.id;

            if for_of.is_await {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "(BuildHIR::lowerStatement) Handle for-await loops".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return;
            }

            let body_loc = statement_loc(&for_of.body);
            let loop_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                builder.loop_scope(
                    label.map(|s| s.to_string()),
                    init_block_id,
                    continuation_id,
                    |builder| {
                        lower_statement(builder, &for_of.body, None);
                        Terminal::Goto {
                            block: init_block_id,
                            variant: GotoVariant::Continue,
                            id: EvaluationOrder(0),
                            loc: body_loc,
                        }
                    },
                )
            });

            let value = lower_expression_to_temporary(builder, &for_of.right);
            builder.terminate_with_continuation(
                Terminal::ForOf {
                    init: init_block_id,
                    test: test_block_id,
                    loop_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                init_block,
            );

            // Init block: GetIterator, goto test
            let iterator = lower_value_to_temporary(builder, InstructionValue::GetIterator {
                collection: value.clone(),
                loc: value.loc.clone(),
            });
            builder.terminate_with_continuation(
                Terminal::Goto {
                    block: test_block_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                test_block,
            );

            // Test block: IteratorNext, assign, branch
            let left_loc = match for_of.left.as_ref() {
                react_compiler_ast::statements::ForInOfLeft::VariableDeclaration(var_decl) => {
                    convert_opt_loc(&var_decl.base.loc).or(loc.clone())
                }
                react_compiler_ast::statements::ForInOfLeft::Pattern(pat) => {
                    pattern_like_hir_loc(pat).or(loc.clone())
                }
            };
            let advance_iterator = lower_value_to_temporary(builder, InstructionValue::IteratorNext {
                iterator: iterator.clone(),
                collection: value.clone(),
                loc: left_loc.clone(),
            });

            let assign_result = match for_of.left.as_ref() {
                react_compiler_ast::statements::ForInOfLeft::VariableDeclaration(var_decl) => {
                    if var_decl.declarations.len() != 1 {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Invariant,
                            reason: format!(
                                "Expected only one declaration in ForOfStatement init, got {}",
                                var_decl.declarations.len()
                            ),
                            description: None,
                            loc: left_loc.clone(),
                            suggestions: None,
                        });
                    }
                    if let Some(declarator) = var_decl.declarations.first() {
                        lower_assignment(
                            builder,
                            left_loc.clone(),
                            InstructionKind::Let,
                            &declarator.id,
                            advance_iterator.clone(),
                            AssignmentStyle::Assignment,
                        )
                    } else {
                        None
                    }
                }
                react_compiler_ast::statements::ForInOfLeft::Pattern(pattern) => {
                    lower_assignment(
                        builder,
                        left_loc.clone(),
                        InstructionKind::Reassign,
                        pattern,
                        advance_iterator.clone(),
                        AssignmentStyle::Assignment,
                    )
                }
            };
            // Use the assign result (StoreLocal temp) as the test, matching TS behavior
            let test_value = assign_result.unwrap_or(advance_iterator);
            let test = lower_value_to_temporary(builder, InstructionValue::LoadLocal {
                place: test_value,
                loc: left_loc.clone(),
            });
            builder.terminate_with_continuation(
                Terminal::Branch {
                    test,
                    consequent: loop_block,
                    alternate: continuation_id,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc: loc.clone(),
                },
                continuation_block,
            );
        }
        Statement::SwitchStatement(switch_stmt) => {
            let loc = convert_opt_loc(&switch_stmt.base.loc);
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;

            // Iterate through cases in reverse order so that previous blocks can
            // fallthrough to successors
            let mut fallthrough = continuation_id;
            let mut cases: Vec<Case> = Vec::new();
            let mut has_default = false;

            for ii in (0..switch_stmt.cases.len()).rev() {
                let case = &switch_stmt.cases[ii];
                let case_loc = convert_opt_loc(&case.base.loc);

                if case.test.is_none() {
                    if has_default {
                        builder.record_error(CompilerErrorDetail {
                            category: ErrorCategory::Syntax,
                            reason: "Expected at most one `default` branch in a switch statement".to_string(),
                            description: None,
                            loc: case_loc.clone(),
                            suggestions: None,
                        });
                        break;
                    }
                    has_default = true;
                }

                let fallthrough_target = fallthrough;
                let block = builder.enter(BlockKind::Block, |builder, _block_id| {
                    builder.switch_scope(
                        label.map(|s| s.to_string()),
                        continuation_id,
                        |builder| {
                            for consequent in &case.consequent {
                                lower_statement(builder, consequent, None);
                            }
                            Terminal::Goto {
                                block: fallthrough_target,
                                variant: GotoVariant::Break,
                                id: EvaluationOrder(0),
                                loc: case_loc.clone(),
                            }
                        },
                    )
                });

                let test = if let Some(test_expr) = &case.test {
                    Some(lower_reorderable_expression(builder, test_expr))
                } else {
                    None
                };

                cases.push(Case { test, block });
                fallthrough = block;
            }

            // Reverse back to original order
            cases.reverse();

            // If no default case, add one that jumps to continuation
            if !has_default {
                cases.push(Case { test: None, block: continuation_id });
            }

            let test = lower_expression_to_temporary(builder, &switch_stmt.discriminant);
            builder.terminate_with_continuation(
                Terminal::Switch {
                    test,
                    cases,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc,
                },
                continuation_block,
            );
        }
        Statement::TryStatement(try_stmt) => {
            let loc = convert_opt_loc(&try_stmt.base.loc);
            let continuation_block = builder.reserve(BlockKind::Block);
            let continuation_id = continuation_block.id;

            let handler_clause = match &try_stmt.handler {
                Some(h) => h,
                None => {
                    builder.record_error(CompilerErrorDetail {
                        category: ErrorCategory::Todo,
                        reason: "(BuildHIR::lowerStatement) Handle TryStatement without a catch clause".to_string(),
                        description: None,
                        loc: loc.clone(),
                        suggestions: None,
                    });
                    return;
                }
            };

            if try_stmt.finalizer.is_some() {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "(BuildHIR::lowerStatement) Handle TryStatement with a finalizer ('finally') clause".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
            }

            // Set up handler binding if catch has a param
            let handler_binding_info: Option<(Place, react_compiler_ast::patterns::PatternLike)> =
                if let Some(param) = &handler_clause.param {
                    let param_loc = convert_opt_loc(&pattern_like_loc(param));
                    let id = builder.make_temporary(param_loc.clone());
                    promote_temporary(builder, id);
                    let place = Place {
                        identifier: id,
                        effect: Effect::Unknown,
                        reactive: false,
                        loc: param_loc.clone(),
                    };
                    // Emit DeclareLocal for the catch binding
                    lower_value_to_temporary(builder, InstructionValue::DeclareLocal {
                        lvalue: LValue {
                            kind: InstructionKind::Catch,
                            place: place.clone(),
                        },
                        type_annotation: None,
                        loc: param_loc,
                    });
                    Some((place, param.clone()))
                } else {
                    None
                };

            // Create the handler (catch) block
            let handler_binding_for_block = handler_binding_info.clone();
            let handler_loc = convert_opt_loc(&handler_clause.base.loc);
            // Use the catch param's loc for the assignment, matching TS: handlerBinding.path.node.loc
            let handler_param_loc = handler_clause.param.as_ref()
                .and_then(|p| convert_opt_loc(&pattern_like_loc(p)));
            let handler_block = builder.enter(BlockKind::Catch, |builder, _block_id| {
                if let Some((ref place, ref pattern)) = handler_binding_for_block {
                    lower_assignment(
                        builder,
                        handler_param_loc.clone().or_else(|| handler_loc.clone()),
                        InstructionKind::Catch,
                        pattern,
                        place.clone(),
                        AssignmentStyle::Assignment,
                    );
                }
                // Lower the catch body
                for stmt in &handler_clause.body.body {
                    lower_statement(builder, stmt, None);
                }
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: handler_loc.clone(),
                }
            });

            // Create the try block
            let try_body_loc = convert_opt_loc(&try_stmt.block.base.loc);
            let try_block = builder.enter(BlockKind::Block, |builder, _block_id| {
                builder.enter_try_catch(handler_block, |builder| {
                    for stmt in &try_stmt.block.body {
                        lower_statement(builder, stmt, None);
                    }
                });
                Terminal::Goto {
                    block: continuation_id,
                    variant: GotoVariant::Try,
                    id: EvaluationOrder(0),
                    loc: try_body_loc.clone(),
                }
            });

            builder.terminate_with_continuation(
                Terminal::Try {
                    block: try_block,
                    handler_binding: handler_binding_info.map(|(place, _)| place),
                    handler: handler_block,
                    fallthrough: continuation_id,
                    id: EvaluationOrder(0),
                    loc,
                },
                continuation_block,
            );
        }
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
                    let body_loc = statement_loc(&labeled_stmt.body);

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
                            loc: body_loc,
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
        Statement::WithStatement(with_stmt) => {
            let loc = convert_opt_loc(&with_stmt.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::UnsupportedSyntax,
                reason: "JavaScript 'with' syntax is not supported".to_string(),
                description: Some("'with' syntax is considered deprecated and removed from JavaScript standards, consider alternatives".to_string()),
                loc: loc.clone(),
                suggestions: None,
            });
            lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: None, loc });
        }
        Statement::FunctionDeclaration(func_decl) => {
            lower_function_declaration(builder, func_decl);
        }
        Statement::ClassDeclaration(cls) => {
            let loc = convert_opt_loc(&cls.base.loc);
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::UnsupportedSyntax,
                reason: "Inline `class` declarations are not supported".to_string(),
                description: Some("Move class declarations outside of components/hooks".to_string()),
                loc: loc.clone(),
                suggestions: None,
            });
            lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: Some("ClassDeclaration".to_string()), loc });
        }
        Statement::ImportDeclaration(_)
        | Statement::ExportNamedDeclaration(_)
        | Statement::ExportDefaultDeclaration(_)
        | Statement::ExportAllDeclaration(_) => {
            let loc = match stmt {
                Statement::ImportDeclaration(s) => convert_opt_loc(&s.base.loc),
                Statement::ExportNamedDeclaration(s) => convert_opt_loc(&s.base.loc),
                Statement::ExportDefaultDeclaration(s) => convert_opt_loc(&s.base.loc),
                Statement::ExportAllDeclaration(s) => convert_opt_loc(&s.base.loc),
                _ => unreachable!(),
            };
            builder.record_error(CompilerErrorDetail {
                category: ErrorCategory::Syntax,
                reason: "JavaScript `import` and `export` statements may only appear at the top level of a module".to_string(),
                description: None,
                loc: loc.clone(),
                suggestions: None,
            });
            lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: None, loc });
        }
        // TypeScript/Flow declarations are type-only, skip them
        Statement::TSEnumDeclaration(e) => {
            let loc = convert_opt_loc(&e.base.loc);
            lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: Some("TSEnumDeclaration".to_string()), loc });
        }
        Statement::EnumDeclaration(e) => {
            let loc = convert_opt_loc(&e.base.loc);
            lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: Some("EnumDeclaration".to_string()), loc });
        }
        // TypeScript/Flow type declarations are type-only, skip them
        Statement::TSTypeAliasDeclaration(_)
        | Statement::TSInterfaceDeclaration(_)
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
        | Statement::DeclareOpaqueType(_) => {}
    }
}

// =============================================================================
// lower() entry point
// =============================================================================

enum FunctionBody<'a> {
    Block(&'a react_compiler_ast::statements::BlockStatement),
    Expression(&'a react_compiler_ast::expressions::Expression),
}

/// Main entry point: lower a function AST node into HIR.
///
/// Receives a `FunctionNode` (discovered by the entrypoint) and lowers it to HIR.
/// The `id` parameter provides the function name (which may come from the variable
/// declarator rather than the function node itself, e.g. `const Foo = () => {}`).
pub fn lower(
    func: &FunctionNode<'_>,
    id: Option<&str>,
    scope_info: &ScopeInfo,
    env: &mut Environment,
) -> Result<HirFunction, CompilerError> {
    // Extract params, body, generator, is_async, loc, scope_id, and the AST function's own id
    // Note: `id` param may include inferred names (e.g., from `const Foo = () => {}`),
    // but the HIR function's `id` field should only include the function's own AST id
    // (FunctionDeclaration.id or FunctionExpression.id, NOT arrow functions).
    let (params, body, generator, is_async, loc, start, ast_id) = match func {
        FunctionNode::FunctionDeclaration(decl) => (
            &decl.params[..],
            FunctionBody::Block(&decl.body),
            decl.generator,
            decl.is_async,
            convert_opt_loc(&decl.base.loc),
            decl.base.start.unwrap_or(0),
            decl.id.as_ref().map(|id| id.name.as_str()),
        ),
        FunctionNode::FunctionExpression(expr) => (
            &expr.params[..],
            FunctionBody::Block(&expr.body),
            expr.generator,
            expr.is_async,
            convert_opt_loc(&expr.base.loc),
            expr.base.start.unwrap_or(0),
            expr.id.as_ref().map(|id| id.name.as_str()),
        ),
        FunctionNode::ArrowFunctionExpression(arrow) => {
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
                arrow.generator,
                arrow.is_async,
                convert_opt_loc(&arrow.base.loc),
                arrow.base.start.unwrap_or(0),
                None, // Arrow functions never have an AST id
            )
        }
    };

    let scope_id = scope_info
        .node_to_scope
        .get(&start)
        .copied()
        .unwrap_or(scope_info.program_scope);

    // Pre-compute context identifiers: variables captured across function boundaries
    let context_identifiers = find_context_identifiers(func, scope_info);

    // For top-level functions, context is empty (no captured refs)
    let context_map: IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>> =
        IndexMap::new();

    let (hir_func, _used_names) = lower_inner(
        params,
        body,
        ast_id,
        generator,
        is_async,
        loc,
        scope_info,
        env,
        None,          // no pre-existing bindings for top-level
        None,          // no pre-existing used_names for top-level
        context_map,
        scope_id,
        scope_id, // component_scope = function_scope for top-level
        &context_identifiers,
        true, // is_top_level
    );

    Ok(hir_func)
}

// =============================================================================
// Stubs for future milestones
// =============================================================================

/// Result of resolving an identifier for assignment.
enum IdentifierForAssignment {
    /// A local place (identifier binding)
    Place(Place),
    /// A global variable (non-local, non-import)
    Global { name: String },
}

/// Resolve an identifier for use as an assignment target.
/// Returns None if the binding could not be found (error recorded).
fn lower_identifier_for_assignment(
    builder: &mut HirBuilder,
    loc: Option<SourceLocation>,
    ident_loc: Option<SourceLocation>,
    kind: InstructionKind,
    name: &str,
    start: u32,
) -> Option<IdentifierForAssignment> {
    let binding = builder.resolve_identifier(name, start, ident_loc.clone());
    match binding {
        VariableBinding::Identifier { identifier, binding_kind, .. } => {
            // Set the identifier's loc from the declaration site (not for reassignments,
            // which should keep the original declaration loc)
            if kind != InstructionKind::Reassign {
                builder.set_identifier_declaration_loc(identifier, &ident_loc);
            }
            if binding_kind == BindingKind::Const && kind == InstructionKind::Reassign {
                builder.record_error(CompilerErrorDetail {
                    reason: "Cannot reassign a `const` variable".to_string(),
                    category: ErrorCategory::Syntax,
                    loc: loc.clone(),
                    description: Some(format!("`{}` is declared as const", name)),
                    suggestions: None,
                });
                return None;
            }
            Some(IdentifierForAssignment::Place(Place {
                identifier,
                effect: Effect::Unknown,
                reactive: false,
                loc,
            }))
        }
        VariableBinding::Global { name: gname } => {
            if kind == InstructionKind::Reassign {
                Some(IdentifierForAssignment::Global { name: gname })
            } else {
                builder.record_error(CompilerErrorDetail {
                    reason: "Could not find binding for declaration".to_string(),
                    category: ErrorCategory::Invariant,
                    loc,
                    description: None,
                    suggestions: None,
                });
                None
            }
        }
        _ => {
            // Import bindings can't be assigned to
            if kind == InstructionKind::Reassign {
                Some(IdentifierForAssignment::Global { name: name.to_string() })
            } else {
                builder.record_error(CompilerErrorDetail {
                    reason: "Could not find binding for declaration".to_string(),
                    category: ErrorCategory::Invariant,
                    loc,
                    description: None,
                    suggestions: None,
                });
                None
            }
        }
    }
}

fn lower_assignment(
    builder: &mut HirBuilder,
    loc: Option<SourceLocation>,
    kind: InstructionKind,
    target: &react_compiler_ast::patterns::PatternLike,
    value: Place,
    assignment_style: AssignmentStyle,
) -> Option<Place> {
    use react_compiler_ast::patterns::PatternLike;

    match target {
        PatternLike::Identifier(id) => {
            let id_loc = convert_opt_loc(&id.base.loc);
            let result = lower_identifier_for_assignment(
                builder,
                loc.clone(),
                id_loc,
                kind,
                &id.name,
                id.base.start.unwrap_or(0),
            );
            match result {
                None => {
                    // Error already recorded
                    return None;
                }
                Some(IdentifierForAssignment::Global { name }) => {
                    let temp = lower_value_to_temporary(builder, InstructionValue::StoreGlobal {
                        name,
                        value,
                        loc,
                    });
                    return Some(temp);
                }
                Some(IdentifierForAssignment::Place(place)) => {
                    let start = id.base.start.unwrap_or(0);
                    if builder.is_context_identifier(&id.name, start) {
                        // Check if the binding is hoisted before flagging const reassignment
                        let is_hoisted = builder.scope_info()
                            .resolve_reference(start)
                            .map(|b| builder.environment().is_hoisted_identifier(b.id.0))
                            .unwrap_or(false);
                        if kind == InstructionKind::Const && !is_hoisted {
                            builder.record_error(CompilerErrorDetail {
                                reason: "Expected `const` declaration not to be reassigned".to_string(),
                                category: ErrorCategory::Syntax,
                                loc: loc.clone(),
                                suggestions: None,
                                description: None,
                            });
                        }
                        if kind != InstructionKind::Const
                            && kind != InstructionKind::Reassign
                            && kind != InstructionKind::Let
                            && kind != InstructionKind::Function
                        {
                            builder.record_error(CompilerErrorDetail {
                                reason: "Unexpected context variable kind".to_string(),
                                category: ErrorCategory::Syntax,
                                loc: loc.clone(),
                                suggestions: None,
                                description: None,
                            });
                            let temp = lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: None, loc });
                            return Some(temp);
                        }
                        let temp = lower_value_to_temporary(builder, InstructionValue::StoreContext {
                            lvalue: LValue { place, kind },
                            value,
                            loc,
                        });
                        return Some(temp);
                    } else {
                        let type_annotation = extract_type_annotation_name(&id.type_annotation);
                        let temp = lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                            lvalue: LValue { place, kind },
                            value,
                            type_annotation,
                            loc,
                        });
                        return Some(temp);
                    }
                }
            }
        }

        PatternLike::MemberExpression(member) => {
            // MemberExpression may only appear in an assignment expression (Reassign)
            if kind != InstructionKind::Reassign {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Invariant,
                    reason: "MemberExpression may only appear in an assignment expression".to_string(),
                    description: None,
                    loc: loc.clone(),
                    suggestions: None,
                });
                return None;
            }
            let object = lower_expression_to_temporary(builder, &member.object);
            let temp = if !member.computed || matches!(&*member.property, react_compiler_ast::expressions::Expression::NumericLiteral(_)) {
                match &*member.property {
                    react_compiler_ast::expressions::Expression::Identifier(prop_id) => {
                        lower_value_to_temporary(builder, InstructionValue::PropertyStore {
                            object,
                            property: PropertyLiteral::String(prop_id.name.clone()),
                            value,
                            loc,
                        })
                    }
                    react_compiler_ast::expressions::Expression::NumericLiteral(num) => {
                        lower_value_to_temporary(builder, InstructionValue::PropertyStore {
                            object,
                            property: PropertyLiteral::Number(FloatValue::new(num.value)),
                            value,
                            loc,
                        })
                    }
                    _ => {
                        builder.record_error(CompilerErrorDetail {
                            reason: format!("(BuildHIR::lowerAssignment) Handle {} properties in MemberExpression", expression_type_name(&member.property)),
                            category: ErrorCategory::Todo,
                            loc: expression_loc(&member.property),
                            description: None,
                            suggestions: None,
                        });
                        lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: None, loc })
                    }
                }
            } else {
                if matches!(&*member.property, react_compiler_ast::expressions::Expression::PrivateName(_)) {
                    builder.record_error(CompilerErrorDetail {
                        reason: "(BuildHIR::lowerAssignment) Expected private name to appear as a non-computed property".to_string(),
                        category: ErrorCategory::Todo,
                        loc: expression_loc(&member.property),
                        description: None,
                        suggestions: None,
                    });
                    lower_value_to_temporary(builder, InstructionValue::UnsupportedNode { node_type: None, loc })
                } else {
                    let property_place = lower_expression_to_temporary(builder, &member.property);
                    lower_value_to_temporary(builder, InstructionValue::ComputedStore {
                        object,
                        property: property_place,
                        value,
                        loc,
                    })
                }
            };
            Some(temp)
        }

        PatternLike::ArrayPattern(pattern) => {
            let mut items: Vec<ArrayPatternElement> = Vec::new();
            let mut followups: Vec<(Place, &PatternLike)> = Vec::new();

            // Compute forceTemporaries: when kind is Reassign and any element is
            // non-identifier, a context variable, or a non-local binding
            let force_temporaries = kind == InstructionKind::Reassign && pattern.elements.iter().any(|elem| {
                match elem {
                    Some(PatternLike::Identifier(id)) => {
                        let start = id.base.start.unwrap_or(0);
                        if builder.is_context_identifier(&id.name, start) {
                            return true;
                        }
                        let ident_loc = convert_opt_loc(&id.base.loc);
                        match builder.resolve_identifier(&id.name, start, ident_loc) {
                            VariableBinding::Identifier { .. } => false,
                            _ => true,
                        }
                    }
                    _ => {
                        // Non-identifier element (including None/holes) or RestElement
                        // Only non-None non-identifier elements trigger forceTemporaries
                        elem.is_some() && !matches!(elem, Some(PatternLike::Identifier(_)))
                    }
                }
            });

            for element in &pattern.elements {
                match element {
                    None => {
                        items.push(ArrayPatternElement::Hole);
                    }
                    Some(PatternLike::RestElement(rest)) => {
                        match &*rest.argument {
                            PatternLike::Identifier(id) => {
                                let start = id.base.start.unwrap_or(0);
                                let is_context = builder.is_context_identifier(&id.name, start);
                                let can_use_direct = !force_temporaries
                                    && (matches!(assignment_style, AssignmentStyle::Assignment)
                                        || !is_context);
                                if can_use_direct {
                                    match lower_identifier_for_assignment(
                                        builder,
                                        convert_opt_loc(&rest.base.loc),
                                        convert_opt_loc(&id.base.loc),
                                        kind,
                                        &id.name,
                                        start,
                                    ) {
                                        Some(IdentifierForAssignment::Place(place)) => {
                                            items.push(ArrayPatternElement::Spread(SpreadPattern { place }));
                                        }
                                        Some(IdentifierForAssignment::Global { .. }) => {
                                            let temp = build_temporary_place(builder, convert_opt_loc(&rest.base.loc));
                                            promote_temporary(builder, temp.identifier);
                                            items.push(ArrayPatternElement::Spread(SpreadPattern { place: temp.clone() }));
                                            followups.push((temp, &rest.argument));
                                        }
                                        None => {
                                            // Error already recorded
                                        }
                                    }
                                } else {
                                    let temp = build_temporary_place(builder, convert_opt_loc(&rest.base.loc));
                                    promote_temporary(builder, temp.identifier);
                                    items.push(ArrayPatternElement::Spread(SpreadPattern { place: temp.clone() }));
                                    followups.push((temp, &rest.argument));
                                }
                            }
                            _ => {
                                let temp = build_temporary_place(builder, convert_opt_loc(&rest.base.loc));
                                promote_temporary(builder, temp.identifier);
                                items.push(ArrayPatternElement::Spread(SpreadPattern { place: temp.clone() }));
                                followups.push((temp, &rest.argument));
                            }
                        }
                    }
                    Some(PatternLike::Identifier(id)) => {
                        let start = id.base.start.unwrap_or(0);
                        let is_context = builder.is_context_identifier(&id.name, start);
                        let can_use_direct = !force_temporaries
                            && (matches!(assignment_style, AssignmentStyle::Assignment)
                                || !is_context);
                        if can_use_direct {
                            match lower_identifier_for_assignment(
                                builder,
                                convert_opt_loc(&id.base.loc),
                                convert_opt_loc(&id.base.loc),
                                kind,
                                &id.name,
                                start,
                            ) {
                                Some(IdentifierForAssignment::Place(place)) => {
                                    items.push(ArrayPatternElement::Place(place));
                                }
                                Some(IdentifierForAssignment::Global { .. }) => {
                                    let temp = build_temporary_place(builder, convert_opt_loc(&id.base.loc));
                                    promote_temporary(builder, temp.identifier);
                                    items.push(ArrayPatternElement::Place(temp.clone()));
                                    followups.push((temp, element.as_ref().unwrap()));
                                }
                                None => {
                                    items.push(ArrayPatternElement::Hole);
                                }
                            }
                        } else {
                            // Context variable or force_temporaries: use promoted temporary
                            let temp = build_temporary_place(builder, convert_opt_loc(&id.base.loc));
                            promote_temporary(builder, temp.identifier);
                            items.push(ArrayPatternElement::Place(temp.clone()));
                            followups.push((temp, element.as_ref().unwrap()));
                        }
                    }
                    Some(other) => {
                        // Nested pattern: use temporary + followup
                        let elem_loc = pattern_like_hir_loc(other);
                        let temp = build_temporary_place(builder, elem_loc);
                        promote_temporary(builder, temp.identifier);
                        items.push(ArrayPatternElement::Place(temp.clone()));
                        followups.push((temp, other));
                    }
                }
            }

            let temporary = lower_value_to_temporary(builder, InstructionValue::Destructure {
                lvalue: LValuePattern {
                    pattern: Pattern::Array(ArrayPattern {
                        items,
                        loc: convert_opt_loc(&pattern.base.loc),
                    }),
                    kind,
                },
                value: value.clone(),
                loc: loc.clone(),
            });

            for (place, path) in followups {
                let followup_loc = pattern_like_hir_loc(path).or(loc.clone());
                lower_assignment(builder, followup_loc, kind, path, place, assignment_style);
            }
            Some(temporary)
        }

        PatternLike::ObjectPattern(pattern) => {
            let mut properties: Vec<ObjectPropertyOrSpread> = Vec::new();
            let mut followups: Vec<(Place, &PatternLike)> = Vec::new();

            // Compute forceTemporaries for ObjectPattern
            let force_temporaries = kind == InstructionKind::Reassign && pattern.properties.iter().any(|prop| {
                use react_compiler_ast::patterns::ObjectPatternProperty;
                match prop {
                    ObjectPatternProperty::RestElement(_) => true,
                    ObjectPatternProperty::ObjectProperty(obj_prop) => {
                        match &*obj_prop.value {
                            PatternLike::Identifier(id) => {
                                let start = id.base.start.unwrap_or(0);
                                let ident_loc = convert_opt_loc(&id.base.loc);
                                match builder.resolve_identifier(&id.name, start, ident_loc) {
                                    VariableBinding::Identifier { .. } => false,
                                    _ => true,
                                }
                            }
                            _ => true,
                        }
                    }
                }
            });

            for prop in &pattern.properties {
                match prop {
                    react_compiler_ast::patterns::ObjectPatternProperty::RestElement(rest) => {
                        match &*rest.argument {
                            PatternLike::Identifier(id) => {
                                let start = id.base.start.unwrap_or(0);
                                let is_context = builder.is_context_identifier(&id.name, start);
                                let can_use_direct = !force_temporaries
                                    && (matches!(assignment_style, AssignmentStyle::Assignment)
                                        || !is_context);
                                if can_use_direct {
                                    match lower_identifier_for_assignment(
                                        builder,
                                        convert_opt_loc(&rest.base.loc),
                                        convert_opt_loc(&id.base.loc),
                                        kind,
                                        &id.name,
                                        start,
                                    ) {
                                        Some(IdentifierForAssignment::Place(place)) => {
                                            properties.push(ObjectPropertyOrSpread::Spread(SpreadPattern { place }));
                                        }
                                        Some(IdentifierForAssignment::Global { .. }) => {
                                            builder.record_error(CompilerErrorDetail {
                                                reason: "Expected reassignment of globals to enable forceTemporaries".to_string(),
                                                category: ErrorCategory::Todo,
                                                loc: convert_opt_loc(&rest.base.loc),
                                                description: None,
                                                suggestions: None,
                                            });
                                        }
                                        None => {}
                                    }
                                } else {
                                    let temp = build_temporary_place(builder, convert_opt_loc(&rest.base.loc));
                                    promote_temporary(builder, temp.identifier);
                                    properties.push(ObjectPropertyOrSpread::Spread(SpreadPattern { place: temp.clone() }));
                                    followups.push((temp, &rest.argument));
                                }
                            }
                            _ => {
                                builder.record_error(CompilerErrorDetail {
                                    reason: format!("(BuildHIR::lowerAssignment) Handle {} rest element in ObjectPattern",
                                        match &*rest.argument {
                                            PatternLike::ObjectPattern(_) => "ObjectPattern",
                                            PatternLike::ArrayPattern(_) => "ArrayPattern",
                                            PatternLike::AssignmentPattern(_) => "AssignmentPattern",
                                            PatternLike::MemberExpression(_) => "MemberExpression",
                                            _ => "unknown",
                                        }),
                                    category: ErrorCategory::Todo,
                                    loc: convert_opt_loc(&rest.base.loc),
                                    description: None,
                                    suggestions: None,
                                });
                            }
                        }
                    }
                    react_compiler_ast::patterns::ObjectPatternProperty::ObjectProperty(obj_prop) => {
                        if obj_prop.computed {
                            builder.record_error(CompilerErrorDetail {
                                reason: "(BuildHIR::lowerAssignment) Handle computed properties in ObjectPattern".to_string(),
                                category: ErrorCategory::Todo,
                                loc: convert_opt_loc(&obj_prop.base.loc),
                                description: None,
                                suggestions: None,
                            });
                            continue;
                        }

                        let key = match lower_object_property_key(builder, &obj_prop.key, false) {
                            Some(k) => k,
                            None => continue,
                        };

                        match &*obj_prop.value {
                            PatternLike::Identifier(id) => {
                                let start = id.base.start.unwrap_or(0);
                                let is_context = builder.is_context_identifier(&id.name, start);
                                let can_use_direct = !force_temporaries
                                    && (matches!(assignment_style, AssignmentStyle::Assignment)
                                        || !is_context);
                                if can_use_direct {
                                    match lower_identifier_for_assignment(
                                        builder,
                                        convert_opt_loc(&id.base.loc),
                                        convert_opt_loc(&id.base.loc),
                                        kind,
                                        &id.name,
                                        start,
                                    ) {
                                        Some(IdentifierForAssignment::Place(place)) => {
                                            properties.push(ObjectPropertyOrSpread::Property(ObjectProperty {
                                                key,
                                                property_type: ObjectPropertyType::Property,
                                                place,
                                            }));
                                        }
                                        Some(IdentifierForAssignment::Global { .. }) => {
                                            builder.record_error(CompilerErrorDetail {
                                                reason: "Expected reassignment of globals to enable forceTemporaries".to_string(),
                                                category: ErrorCategory::Todo,
                                                loc: convert_opt_loc(&id.base.loc),
                                                description: None,
                                                suggestions: None,
                                            });
                                        }
                                        None => {
                                            continue;
                                        }
                                    }
                                } else {
                                    // Context variable or force_temporaries: use promoted temporary
                                    let temp = build_temporary_place(builder, convert_opt_loc(&id.base.loc));
                                    promote_temporary(builder, temp.identifier);
                                    properties.push(ObjectPropertyOrSpread::Property(ObjectProperty {
                                        key,
                                        property_type: ObjectPropertyType::Property,
                                        place: temp.clone(),
                                    }));
                                    followups.push((temp, &*obj_prop.value));
                                }
                            }
                            other => {
                                // Nested pattern: use temporary + followup
                                let elem_loc = pattern_like_hir_loc(other);
                                let temp = build_temporary_place(builder, elem_loc);
                                promote_temporary(builder, temp.identifier);
                                properties.push(ObjectPropertyOrSpread::Property(ObjectProperty {
                                    key,
                                    property_type: ObjectPropertyType::Property,
                                    place: temp.clone(),
                                }));
                                followups.push((temp, other));
                            }
                        }
                    }
                }
            }

            let temporary = lower_value_to_temporary(builder, InstructionValue::Destructure {
                lvalue: LValuePattern {
                    pattern: Pattern::Object(ObjectPattern {
                        properties,
                        loc: convert_opt_loc(&pattern.base.loc),
                    }),
                    kind,
                },
                value: value.clone(),
                loc: loc.clone(),
            });

            for (place, path) in followups {
                let followup_loc = pattern_like_hir_loc(path).or(loc.clone());
                lower_assignment(builder, followup_loc, kind, path, place, assignment_style);
            }
            Some(temporary)
        }

        PatternLike::AssignmentPattern(pattern) => {
            // Default value: if value === undefined, use default, else use value
            let pat_loc = convert_opt_loc(&pattern.base.loc);

            let temp = build_temporary_place(builder, pat_loc.clone());

            let test_block = builder.reserve(BlockKind::Value);
            let continuation_block = builder.reserve(builder.current_block_kind());

            // Consequent: use default value
            let consequent = builder.enter(BlockKind::Value, |builder, _| {
                let default_value = lower_reorderable_expression(builder, &pattern.right);
                lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                    lvalue: LValue { place: temp.clone(), kind: InstructionKind::Const },
                    value: default_value,
                    type_annotation: None,
                    loc: pat_loc.clone(),
                });
                Terminal::Goto {
                    block: continuation_block.id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: pat_loc.clone(),
                }
            });

            // Alternate: use the original value
            let alternate = builder.enter(BlockKind::Value, |builder, _| {
                lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                    lvalue: LValue { place: temp.clone(), kind: InstructionKind::Const },
                    value: value.clone(),
                    type_annotation: None,
                    loc: pat_loc.clone(),
                });
                Terminal::Goto {
                    block: continuation_block.id,
                    variant: GotoVariant::Break,
                    id: EvaluationOrder(0),
                    loc: pat_loc.clone(),
                }
            });

            // Ternary terminal
            builder.terminate_with_continuation(
                Terminal::Ternary {
                    test: test_block.id,
                    fallthrough: continuation_block.id,
                    id: EvaluationOrder(0),
                    loc: pat_loc.clone(),
                },
                test_block,
            );

            // In test block: check if value === undefined
            let undef = lower_value_to_temporary(builder, InstructionValue::Primitive {
                value: PrimitiveValue::Undefined,
                loc: pat_loc.clone(),
            });
            let test = lower_value_to_temporary(builder, InstructionValue::BinaryExpression {
                left: value,
                operator: BinaryOperator::StrictEqual,
                right: undef,
                loc: pat_loc.clone(),
            });
            builder.terminate_with_continuation(
                Terminal::Branch {
                    test,
                    consequent,
                    alternate,
                    fallthrough: continuation_block.id,
                    id: EvaluationOrder(0),
                    loc: pat_loc.clone(),
                },
                continuation_block,
            );

            // Recursively assign the resolved value to the left pattern
            lower_assignment(builder, pat_loc, kind, &pattern.left, temp, assignment_style)
        }

        PatternLike::RestElement(rest) => {
            // Delegate to the argument pattern
            lower_assignment(builder, loc, kind, &rest.argument, value, assignment_style)
        }
    }
}

/// Helper to extract HIR loc from a PatternLike (converts AST loc)
fn pattern_like_hir_loc(pat: &react_compiler_ast::patterns::PatternLike) -> Option<SourceLocation> {
    convert_opt_loc(&pattern_like_loc(pat))
}

fn lower_optional_member_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalMemberExpression,
) -> InstructionValue {
    let place = lower_optional_member_expression_impl(builder, expr, None).1;
    InstructionValue::LoadLocal { loc: place.loc.clone(), place }
}

/// Returns (object, value_place) pair.
/// The `value_place` is stored into a temporary; we also return it as an InstructionValue
/// via LoadLocal for the top-level call.
fn lower_optional_member_expression_impl(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalMemberExpression,
    parent_alternate: Option<BlockId>,
) -> (Place, Place) {
    use react_compiler_ast::expressions::Expression;
    let optional = expr.optional;
    let loc = convert_opt_loc(&expr.base.loc);
    let place = build_temporary_place(builder, loc.clone());
    let continuation_block = builder.reserve(builder.current_block_kind());
    let continuation_id = continuation_block.id;
    let consequent = builder.reserve(BlockKind::Value);

    // Block to evaluate if the callee is null/undefined — sets result to undefined.
    // Only create an alternate when first entering an optional subtree.
    let alternate = if let Some(parent_alt) = parent_alternate {
        parent_alt
    } else {
        builder.enter(BlockKind::Value, |builder, _block_id| {
            let temp = lower_value_to_temporary(builder, InstructionValue::Primitive {
                value: PrimitiveValue::Undefined,
                loc: loc.clone(),
            });
            lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                lvalue: LValue {
                    kind: InstructionKind::Const,
                    place: place.clone(),
                },
                value: temp,
                type_annotation: None,
                loc: loc.clone(),
            });
            Terminal::Goto {
                block: continuation_id,
                variant: GotoVariant::Break,
                id: EvaluationOrder(0),
                loc: loc.clone(),
            }
        })
    };

    let mut object: Option<Place> = None;
    let test_block = builder.enter(BlockKind::Value, |builder, _block_id| {
        match expr.object.as_ref() {
            Expression::OptionalMemberExpression(opt_member) => {
                let (_obj, value) = lower_optional_member_expression_impl(
                    builder,
                    opt_member,
                    Some(alternate),
                );
                object = Some(value);
            }
            Expression::OptionalCallExpression(opt_call) => {
                let value = lower_optional_call_expression_impl(builder, opt_call, Some(alternate));
                let value_place = lower_value_to_temporary(builder, value);
                object = Some(value_place);
            }
            other => {
                object = Some(lower_expression_to_temporary(builder, other));
            }
        }
        let test_place = object.as_ref().unwrap().clone();
        Terminal::Branch {
            test: test_place,
            consequent: consequent.id,
            alternate,
            fallthrough: continuation_id,
            id: EvaluationOrder(0),
            loc: loc.clone(),
        }
    });

    let obj = object.unwrap();

    // Block to evaluate if the callee is non-null/undefined
    builder.enter_reserved(consequent, |builder| {
        let lowered = lower_member_expression_with_object(builder, expr, obj.clone());
        let temp = lower_value_to_temporary(builder, lowered.value);
        lower_value_to_temporary(builder, InstructionValue::StoreLocal {
            lvalue: LValue {
                kind: InstructionKind::Const,
                place: place.clone(),
            },
            value: temp,
            type_annotation: None,
            loc: loc.clone(),
        });
        Terminal::Goto {
            block: continuation_id,
            variant: GotoVariant::Break,
            id: EvaluationOrder(0),
            loc: loc.clone(),
        }
    });

    builder.terminate_with_continuation(
        Terminal::Optional {
            optional,
            test: test_block,
            fallthrough: continuation_id,
            id: EvaluationOrder(0),
            loc: loc.clone(),
        },
        continuation_block,
    );

    (obj, place)
}

fn lower_optional_call_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalCallExpression,
) -> InstructionValue {
    lower_optional_call_expression_impl(builder, expr, None)
}

fn lower_optional_call_expression_impl(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::expressions::OptionalCallExpression,
    parent_alternate: Option<BlockId>,
) -> InstructionValue {
    use react_compiler_ast::expressions::Expression;
    let optional = expr.optional;
    let loc = convert_opt_loc(&expr.base.loc);
    let place = build_temporary_place(builder, loc.clone());
    let continuation_block = builder.reserve(builder.current_block_kind());
    let continuation_id = continuation_block.id;
    let consequent = builder.reserve(BlockKind::Value);

    // Block to evaluate if the callee is null/undefined
    let alternate = if let Some(parent_alt) = parent_alternate {
        parent_alt
    } else {
        builder.enter(BlockKind::Value, |builder, _block_id| {
            let temp = lower_value_to_temporary(builder, InstructionValue::Primitive {
                value: PrimitiveValue::Undefined,
                loc: loc.clone(),
            });
            lower_value_to_temporary(builder, InstructionValue::StoreLocal {
                lvalue: LValue {
                    kind: InstructionKind::Const,
                    place: place.clone(),
                },
                value: temp,
                type_annotation: None,
                loc: loc.clone(),
            });
            Terminal::Goto {
                block: continuation_id,
                variant: GotoVariant::Break,
                id: EvaluationOrder(0),
                loc: loc.clone(),
            }
        })
    };

    // Track callee info for building the call in the consequent block
    enum CalleeInfo {
        CallExpression { callee: Place },
        MethodCall { receiver: Place, property: Place },
    }

    let mut callee_info: Option<CalleeInfo> = None;

    let test_block = builder.enter(BlockKind::Value, |builder, _block_id| {
        match expr.callee.as_ref() {
            Expression::OptionalCallExpression(opt_call) => {
                let value = lower_optional_call_expression_impl(builder, opt_call, Some(alternate));
                let value_place = lower_value_to_temporary(builder, value);
                callee_info = Some(CalleeInfo::CallExpression { callee: value_place });
            }
            Expression::OptionalMemberExpression(opt_member) => {
                let (obj, value) = lower_optional_member_expression_impl(
                    builder,
                    opt_member,
                    Some(alternate),
                );
                callee_info = Some(CalleeInfo::MethodCall {
                    receiver: obj,
                    property: value,
                });
            }
            Expression::MemberExpression(member) => {
                let lowered = lower_member_expression(builder, member);
                let property_place = lower_value_to_temporary(builder, lowered.value);
                callee_info = Some(CalleeInfo::MethodCall {
                    receiver: lowered.object,
                    property: property_place,
                });
            }
            other => {
                let callee_place = lower_expression_to_temporary(builder, other);
                callee_info = Some(CalleeInfo::CallExpression { callee: callee_place });
            }
        }

        let test_place = match callee_info.as_ref().unwrap() {
            CalleeInfo::CallExpression { callee } => callee.clone(),
            CalleeInfo::MethodCall { property, .. } => property.clone(),
        };

        Terminal::Branch {
            test: test_place,
            consequent: consequent.id,
            alternate,
            fallthrough: continuation_id,
            id: EvaluationOrder(0),
            loc: loc.clone(),
        }
    });

    // Block to evaluate if the callee is non-null/undefined
    builder.enter_reserved(consequent, |builder| {
        let args = lower_arguments(builder, &expr.arguments);
        let temp = build_temporary_place(builder, loc.clone());

        match callee_info.as_ref().unwrap() {
            CalleeInfo::CallExpression { callee } => {
                builder.push(Instruction {
                    id: EvaluationOrder(0),
                    lvalue: temp.clone(),
                    value: InstructionValue::CallExpression {
                        callee: callee.clone(),
                        args,
                        loc: loc.clone(),
                    },
                    loc: loc.clone(),
                    effects: None,
                });
            }
            CalleeInfo::MethodCall { receiver, property } => {
                builder.push(Instruction {
                    id: EvaluationOrder(0),
                    lvalue: temp.clone(),
                    value: InstructionValue::MethodCall {
                        receiver: receiver.clone(),
                        property: property.clone(),
                        args,
                        loc: loc.clone(),
                    },
                    loc: loc.clone(),
                    effects: None,
                });
            }
        }

        lower_value_to_temporary(builder, InstructionValue::StoreLocal {
            lvalue: LValue {
                kind: InstructionKind::Const,
                place: place.clone(),
            },
            value: temp,
            type_annotation: None,
            loc: loc.clone(),
        });
        Terminal::Goto {
            block: continuation_id,
            variant: GotoVariant::Break,
            id: EvaluationOrder(0),
            loc: loc.clone(),
        }
    });

    builder.terminate_with_continuation(
        Terminal::Optional {
            optional,
            test: test_block,
            fallthrough: continuation_id,
            id: EvaluationOrder(0),
            loc: loc.clone(),
        },
        continuation_block,
    );

    InstructionValue::LoadLocal { place: place.clone(), loc: place.loc }
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

    // Clone parent bindings and used_names to pass to the inner lower
    let parent_bindings = builder.bindings().clone();
    let parent_used_names = builder.used_names().clone();
    let context_ids = builder.context_identifiers().clone();

    // Use scope_info_and_env_mut to avoid conflicting borrows
    let (scope_info, env) = builder.scope_info_and_env_mut();
    let (hir_func, child_used_names) = lower_inner(
        params,
        body,
        id,
        generator,
        is_async,
        func_loc,
        scope_info,
        env,
        Some(parent_bindings),
        Some(parent_used_names),
        merged_context,
        function_scope,
        component_scope,
        &context_ids,
        false, // nested function
    );

    // Merge the child's used_names back into the parent builder
    // This ensures name deduplication works across function scopes,
    // matching the TS behavior where #bindings is shared by reference
    builder.merge_used_names(child_used_names);

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
    let parent_used_names = builder.used_names().clone();
    let context_ids = builder.context_identifiers().clone();

    let (scope_info, env) = builder.scope_info_and_env_mut();
    let (hir_func, child_used_names) = lower_inner(
        &func_decl.params,
        FunctionBody::Block(&func_decl.body),
        func_decl.id.as_ref().map(|id| id.name.as_str()),
        func_decl.generator,
        func_decl.is_async,
        loc.clone(),
        scope_info,
        env,
        Some(parent_bindings),
        Some(parent_used_names),
        merged_context,
        function_scope,
        component_scope,
        &context_ids,
        false, // nested function
    );

    builder.merge_used_names(child_used_names);

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
            let ident_loc = convert_opt_loc(&id_node.base.loc);
            let binding = builder.resolve_identifier(name, start, ident_loc.clone());
            match binding {
                VariableBinding::Identifier { identifier, .. } => {
                    // Set the identifier's declaration loc from the name
                    builder.set_identifier_declaration_loc(identifier, &ident_loc);
                    // Use the full function declaration loc for the Place,
                    // matching the TS behavior where lowerAssignment uses stmt.node.loc
                    let place = Place {
                        identifier,
                        reactive: false,
                        effect: Effect::Unknown,
                        loc: loc.clone(),
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
    let parent_used_names = builder.used_names().clone();
    let context_ids = builder.context_identifiers().clone();

    let (scope_info, env) = builder.scope_info_and_env_mut();
    let (hir_func, child_used_names) = lower_inner(
        &method.params,
        FunctionBody::Block(&method.body),
        None,
        method.generator,
        method.is_async,
        func_loc,
        scope_info,
        env,
        Some(parent_bindings),
        Some(parent_used_names),
        merged_context,
        function_scope,
        component_scope,
        &context_ids,
        false, // nested function
    );

    builder.merge_used_names(child_used_names);

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
    parent_used_names: Option<IndexMap<String, react_compiler_ast::scope::BindingId>>,
    context_map: IndexMap<react_compiler_ast::scope::BindingId, Option<SourceLocation>>,
    function_scope: react_compiler_ast::scope::ScopeId,
    component_scope: react_compiler_ast::scope::ScopeId,
    context_identifiers: &HashSet<react_compiler_ast::scope::BindingId>,
    is_top_level: bool,
) -> (HirFunction, IndexMap<String, react_compiler_ast::scope::BindingId>) {
    let mut builder = HirBuilder::new(
        env,
        scope_info,
        function_scope,
        component_scope,
        context_identifiers.clone(),
        parent_bindings,
        Some(context_map.clone()),
        None,
        parent_used_names,
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
                let param_loc = convert_opt_loc(&ident.base.loc);
                let binding = builder.resolve_identifier(&ident.name, start, param_loc.clone());
                match binding {
                    VariableBinding::Identifier { identifier, .. } => {
                        // Set the identifier's loc from the declaration (param) site
                        builder.set_identifier_declaration_loc(identifier, &param_loc);
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
                let rest_loc = convert_opt_loc(&rest.base.loc);
                // Create a temporary place for the spread param
                let place = build_temporary_place(&mut builder, rest_loc.clone());
                hir_params.push(ParamPattern::Spread(SpreadPattern { place: place.clone() }));
                // Delegate the assignment of the rest argument
                lower_assignment(
                    &mut builder,
                    rest_loc,
                    InstructionKind::Let,
                    &rest.argument,
                    place,
                    AssignmentStyle::Assignment,
                );
            }
            react_compiler_ast::patterns::PatternLike::ObjectPattern(_)
            | react_compiler_ast::patterns::PatternLike::ArrayPattern(_)
            | react_compiler_ast::patterns::PatternLike::AssignmentPattern(_) => {
                let param_loc = convert_opt_loc(&pattern_like_loc(param));
                let place = build_temporary_place(&mut builder, param_loc.clone());
                promote_temporary(&mut builder, place.identifier);
                hir_params.push(ParamPattern::Place(place.clone()));
                lower_assignment(
                    &mut builder,
                    param_loc,
                    InstructionKind::Let,
                    param,
                    place,
                    AssignmentStyle::Assignment,
                );
            }
            react_compiler_ast::patterns::PatternLike::MemberExpression(_) => {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Todo,
                    reason: "MemberExpression parameters are not supported".to_string(),
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
            // Use lower_block_statement_with_scope to get hoisting support for the function body.
            // Pass the function scope since in Babel, a function body BlockStatement shares
            // the function's scope (node_to_scope maps the function node, not the block).
            lower_block_statement_with_scope(&mut builder, block, function_scope);
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
    let (hir_body, instructions, used_names) = builder.build();

    // Create the returns place
    let returns = crate::hir_builder::create_temporary_place(env, loc.clone());

    (HirFunction {
        loc,
        id: id.map(|s| s.to_string()),
        name_hint: None,
        fn_type: if is_top_level { env.fn_type } else { ReactFunctionType::Other },
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
    }, used_names)
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
            let namespace = &ns.namespace.name;
            let name = &ns.name.name;
            let tag = format!("{}:{}", namespace, name);
            let loc = convert_opt_loc(&ns.base.loc);
            if namespace.contains(':') || name.contains(':') {
                builder.record_error(CompilerErrorDetail {
                    category: ErrorCategory::Syntax,
                    reason: "Expected JSXNamespacedName to have no colons in the namespace or name".to_string(),
                    description: Some(format!("Got `{}` : `{}`", namespace, name)),
                    loc: loc.clone(),
                    suggestions: None,
                });
            }
            let place = lower_value_to_temporary(builder, InstructionValue::Primitive {
                value: PrimitiveValue::String(tag),
                loc: loc.clone(),
            });
            JsxTag::Place(place)
        }
    }
}

fn lower_jsx_member_expression(
    builder: &mut HirBuilder,
    expr: &react_compiler_ast::jsx::JSXMemberExpression,
) -> Place {
    use react_compiler_ast::jsx::JSXMemberExprObject;
    // Use the full member expression's loc for instruction locs (matching TS: exprPath.node.loc)
    let expr_loc = convert_opt_loc(&expr.base.loc);
    let object = match &*expr.object {
        JSXMemberExprObject::JSXIdentifier(id) => {
            let id_loc = convert_opt_loc(&id.base.loc);
            let start = id.base.start.unwrap_or(0);
            // Use identifier's own loc for the place, but member expression's loc for the instruction
            let place = lower_identifier(builder, &id.name, start, id_loc);
            let load_value = if builder.is_context_identifier(&id.name, start) {
                InstructionValue::LoadContext { place, loc: expr_loc.clone() }
            } else {
                InstructionValue::LoadLocal { place, loc: expr_loc.clone() }
            };
            lower_value_to_temporary(builder, load_value)
        }
        JSXMemberExprObject::JSXMemberExpression(inner) => {
            lower_jsx_member_expression(builder, inner)
        }
    };
    let prop_name = &expr.property.name;
    let value = InstructionValue::PropertyLoad {
        object,
        property: PropertyLiteral::String(prop_name.clone()),
        loc: expr_loc,
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
            // FBT whitespace normalization differs from standard JSX.
            // Since the fbt transform runs after, preserve all whitespace
            // in FBT subtrees as is.
            let value = if builder.fbt_depth > 0 {
                Some(text.value.clone())
            } else {
                trim_jsx_text(&text.value)
            };
            match value {
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

/// Split a string on line endings, handling \r\n, \n, and \r.
fn split_line_endings(s: &str) -> Vec<&str> {
    let mut lines = Vec::new();
    let mut start = 0;
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'\r' {
            lines.push(&s[start..i]);
            if i + 1 < bytes.len() && bytes[i + 1] == b'\n' {
                i += 2;
            } else {
                i += 1;
            }
            start = i;
        } else if bytes[i] == b'\n' {
            lines.push(&s[start..i]);
            i += 1;
            start = i;
        } else {
            i += 1;
        }
    }
    lines.push(&s[start..]);
    lines
}

/// Trims whitespace according to the JSX spec.
/// Implementation ported from Babel's cleanJSXElementLiteralChild.
fn trim_jsx_text(original: &str) -> Option<String> {
    // Split on \r\n, \n, or \r to handle all line ending styles (matching TS split(/\r\n|\n|\r/))
    let lines: Vec<&str> = split_line_endings(original);

    // NOTE: when builder.fbt_depth > 0, the TS skips whitespace trimming entirely.
    // That check is handled by the caller (lower_jsx_element) before calling this function.

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
) -> Option<ObjectProperty> {
    use react_compiler_ast::expressions::ObjectMethodKind;
    if !matches!(method.kind, ObjectMethodKind::Method) {
        let kind_str = match method.kind {
            ObjectMethodKind::Get => "get",
            ObjectMethodKind::Set => "set",
            ObjectMethodKind::Method => "method",
        };
        builder.record_error(CompilerErrorDetail {
            reason: format!("(BuildHIR::lowerExpression) Handle {} functions in ObjectExpression", kind_str),
            category: ErrorCategory::Todo,
            loc: convert_opt_loc(&method.base.loc),
            description: None,
            suggestions: None,
        });
        return None;
    }
    let key = lower_object_property_key(builder, &method.key, method.computed)
        .unwrap_or(ObjectPropertyKey::String { name: String::new() });

    let lowered_func = lower_function_for_object_method(builder, method);

    let loc = convert_opt_loc(&method.base.loc);
    let method_value = InstructionValue::ObjectMethod {
        loc: loc.clone(),
        lowered_func,
    };
    let method_place = lower_value_to_temporary(builder, method_value);

    Some(ObjectProperty {
        key,
        property_type: ObjectPropertyType::Method,
        place: method_place,
    })
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
    if !is_reorderable_expression(builder, expr, true) {
        builder.record_error(CompilerErrorDetail {
            category: ErrorCategory::Todo,
            reason: format!(
                "(BuildHIR::node.lowerReorderableExpression) Expression type `{}` cannot be safely reordered",
                expression_type_name(expr)
            ),
            description: None,
            loc: expression_loc(expr),
            suggestions: None,
        });
    }
    lower_expression_to_temporary(builder, expr)
}

fn is_reorderable_expression(
    builder: &HirBuilder,
    expr: &react_compiler_ast::expressions::Expression,
    allow_local_identifiers: bool,
) -> bool {
    use react_compiler_ast::expressions::Expression;
    match expr {
        Expression::Identifier(ident) => {
            let start = ident.base.start.unwrap_or(0);
            let binding = builder.scope_info().resolve_reference(start);
            match binding {
                None => {
                    // global, safe to reorder
                    true
                }
                Some(b) => {
                    if b.scope == builder.scope_info().program_scope {
                        // Module-scope binding (ModuleLocal, imports), safe to reorder
                        true
                    } else {
                        allow_local_identifiers
                    }
                }
            }
        }
        Expression::RegExpLiteral(_)
        | Expression::StringLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::NullLiteral(_)
        | Expression::BooleanLiteral(_)
        | Expression::BigIntLiteral(_) => true,
        Expression::UnaryExpression(unary) => {
            use react_compiler_ast::operators::UnaryOperator;
            matches!(unary.operator, UnaryOperator::Not | UnaryOperator::Plus | UnaryOperator::Neg)
                && is_reorderable_expression(builder, &unary.argument, allow_local_identifiers)
        }
        Expression::LogicalExpression(logical) => {
            is_reorderable_expression(builder, &logical.left, allow_local_identifiers)
                && is_reorderable_expression(builder, &logical.right, allow_local_identifiers)
        }
        Expression::ConditionalExpression(cond) => {
            is_reorderable_expression(builder, &cond.test, allow_local_identifiers)
                && is_reorderable_expression(builder, &cond.consequent, allow_local_identifiers)
                && is_reorderable_expression(builder, &cond.alternate, allow_local_identifiers)
        }
        Expression::ArrayExpression(arr) => {
            arr.elements.iter().all(|element| {
                match element {
                    Some(e) => is_reorderable_expression(builder, e, allow_local_identifiers),
                    None => false, // holes are not reorderable
                }
            })
        }
        Expression::ObjectExpression(obj) => {
            obj.properties.iter().all(|prop| {
                match prop {
                    react_compiler_ast::expressions::ObjectExpressionProperty::ObjectProperty(p) => {
                        !p.computed
                            && is_reorderable_expression(builder, &p.value, allow_local_identifiers)
                    }
                    _ => false,
                }
            })
        }
        Expression::MemberExpression(member) => {
            // Allow member expressions where the innermost object is a global or module-local
            let mut inner = member.object.as_ref();
            while let Expression::MemberExpression(m) = inner {
                inner = m.object.as_ref();
            }
            if let Expression::Identifier(ident) = inner {
                let start = ident.base.start.unwrap_or(0);
                match builder.scope_info().resolve_reference(start) {
                    None => true, // global
                    Some(binding) => {
                        // Module-scope bindings (ModuleLocal, imports) are safe to reorder
                        binding.scope == builder.scope_info().program_scope
                    }
                }
            } else {
                false
            }
        }
        Expression::ArrowFunctionExpression(arrow) => {
            use react_compiler_ast::expressions::ArrowFunctionBody;
            match arrow.body.as_ref() {
                ArrowFunctionBody::BlockStatement(block) => block.body.is_empty(),
                ArrowFunctionBody::Expression(body_expr) => {
                    is_reorderable_expression(builder, body_expr, false)
                }
            }
        }
        Expression::CallExpression(call) => {
            is_reorderable_expression(builder, &call.callee, allow_local_identifiers)
                && call.arguments.iter().all(|arg| {
                    is_reorderable_expression(builder, arg, allow_local_identifiers)
                })
        }
        // TypeScript/Flow type wrappers: recurse into the inner expression
        Expression::TSAsExpression(ts) => is_reorderable_expression(builder, &ts.expression, allow_local_identifiers),
        Expression::TSSatisfiesExpression(ts) => is_reorderable_expression(builder, &ts.expression, allow_local_identifiers),
        Expression::TSNonNullExpression(ts) => is_reorderable_expression(builder, &ts.expression, allow_local_identifiers),
        Expression::TSInstantiationExpression(ts) => is_reorderable_expression(builder, &ts.expression, allow_local_identifiers),
        Expression::TypeCastExpression(tc) => is_reorderable_expression(builder, &tc.expression, allow_local_identifiers),
        Expression::TSTypeAssertion(ts) => is_reorderable_expression(builder, &ts.expression, allow_local_identifiers),
        Expression::ParenthesizedExpression(p) => is_reorderable_expression(builder, &p.expression, allow_local_identifiers),
        _ => false,
    }
}

/// Extract the type name from a type annotation serde_json::Value.
/// Returns the "type" field value, e.g. "TSTypeReference", "GenericTypeAnnotation".
fn get_type_annotation_name(val: &serde_json::Value) -> Option<String> {
    val.get("type").and_then(|v| v.as_str()).map(|s| s.to_string())
}

/// Lower a type annotation JSON value to an HIR Type.
/// Mirrors the TS `lowerType` function.
fn lower_type_annotation(val: &serde_json::Value, builder: &mut HirBuilder) -> Type {
    let type_name = match val.get("type").and_then(|v| v.as_str()) {
        Some(name) => name,
        None => return builder.make_type(),
    };
    match type_name {
        "GenericTypeAnnotation" => {
            // Check if it's Array
            if let Some(id) = val.get("id") {
                if id.get("type").and_then(|v| v.as_str()) == Some("Identifier") {
                    if id.get("name").and_then(|v| v.as_str()) == Some("Array") {
                        return Type::Object { shape_id: Some("BuiltInArray".to_string()) };
                    }
                }
            }
            builder.make_type()
        }
        "TSTypeReference" => {
            if let Some(type_name_val) = val.get("typeName") {
                if type_name_val.get("type").and_then(|v| v.as_str()) == Some("Identifier") {
                    if type_name_val.get("name").and_then(|v| v.as_str()) == Some("Array") {
                        return Type::Object { shape_id: Some("BuiltInArray".to_string()) };
                    }
                }
            }
            builder.make_type()
        }
        "ArrayTypeAnnotation" | "TSArrayType" => {
            Type::Object { shape_id: Some("BuiltInArray".to_string()) }
        }
        "BooleanLiteralTypeAnnotation" | "BooleanTypeAnnotation"
        | "NullLiteralTypeAnnotation" | "NumberLiteralTypeAnnotation"
        | "NumberTypeAnnotation" | "StringLiteralTypeAnnotation"
        | "StringTypeAnnotation" | "TSBooleanKeyword" | "TSNullKeyword"
        | "TSNumberKeyword" | "TSStringKeyword" | "TSSymbolKeyword"
        | "TSUndefinedKeyword" | "TSVoidKeyword" | "VoidTypeAnnotation" => {
            Type::Primitive
        }
        _ => builder.make_type(),
    }
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
        // Skip references that are actually the binding's own declaration site
        // (e.g., the function name in `function x() {}` is mapped in referenceToBinding
        // but is not a true captured reference)
        if binding.declaration_start == Some(ref_start) {
            continue;
        }
        // Skip type-only bindings (e.g., Flow/TypeScript type aliases)
        // These are not runtime values and should not be captured as context
        if binding.declaration_type == "TypeAlias"
            || binding.declaration_type == "OpaqueType"
            || binding.declaration_type == "InterfaceDeclaration"
            || binding.declaration_type == "TSTypeAliasDeclaration"
            || binding.declaration_type == "TSInterfaceDeclaration"
            || binding.declaration_type == "TSEnumDeclaration"
        {
            continue;
        }
        if pure_scopes.contains(&binding.scope) && !captured.contains_key(&binding.id) {
            // Use the binding's identifier location as the source location for
            // the context variable, falling back to a generated location from the reference.
            let loc = Some(SourceLocation {
                start: Position { line: 0, column: ref_start },
                end: Position { line: 0, column: ref_start },
            });
            captured.insert(binding.id, loc);
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
#[derive(Clone, Copy)]
pub enum AssignmentStyle {
    /// Assignment via `=`
    Assignment,
    /// Destructuring assignment
    Destructure,
}

/// Collect locations of fbt:enum, fbt:plural, fbt:pronoun sub-tags
/// within the children of an fbt/fbs JSX element.
fn collect_fbt_sub_tags(
    children: &[react_compiler_ast::jsx::JSXChild],
    tag_name: &str,
    enum_locs: &mut Vec<Option<SourceLocation>>,
    plural_locs: &mut Vec<Option<SourceLocation>>,
    pronoun_locs: &mut Vec<Option<SourceLocation>>,
) {
    use react_compiler_ast::jsx::{JSXChild, JSXElementName};
    for child in children {
        match child {
            JSXChild::JSXElement(el) => {
                // Check if the opening element name is a namespaced name matching the fbt tag
                if let JSXElementName::JSXNamespacedName(ns) = &el.opening_element.name {
                    if ns.namespace.name == tag_name {
                        let loc = convert_opt_loc(&ns.base.loc);
                        match ns.name.name.as_str() {
                            "enum" => enum_locs.push(loc),
                            "plural" => plural_locs.push(loc),
                            "pronoun" => pronoun_locs.push(loc),
                            _ => {}
                        }
                    }
                }
                // Also recurse into children
                collect_fbt_sub_tags(&el.children, tag_name, enum_locs, plural_locs, pronoun_locs);
            }
            JSXChild::JSXFragment(frag) => {
                collect_fbt_sub_tags(&frag.children, tag_name, enum_locs, plural_locs, pronoun_locs);
            }
            _ => {}
        }
    }
}
