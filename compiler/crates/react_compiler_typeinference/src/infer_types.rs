// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Type inference pass.
//!
//! Generates type equations from the HIR, unifies them, and applies the
//! resolved types back to identifiers. Analogous to TS `InferTypes.ts`.

use std::collections::HashMap;

use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    ArrayPatternElement, BinaryOperator, FunctionId, HirFunction, Identifier, IdentifierId,
    IdentifierName, InstructionKind, InstructionValue, JsxAttribute, LoweredFunction,
    ObjectPropertyKey, ObjectPropertyOrSpread, ParamPattern, Pattern, PropertyLiteral,
    PropertyNameKind, ReactFunctionType, Terminal, Type, TypeId,
};
use react_compiler_ssa::enter_ssa::placeholder_function;

// BuiltIn shape ID constants (matching TS ObjectShape.ts)
const BUILT_IN_PROPS_ID: &str = "BuiltInProps";
const BUILT_IN_ARRAY_ID: &str = "BuiltInArray";
const BUILT_IN_FUNCTION_ID: &str = "BuiltInFunction";
const BUILT_IN_JSX_ID: &str = "BuiltInJsx";
const BUILT_IN_OBJECT_ID: &str = "BuiltInObject";
const BUILT_IN_USE_REF_ID: &str = "BuiltInUseRefId";
// const BUILT_IN_REF_VALUE_ID: &str = "BuiltInRefValue";
// const BUILT_IN_SET_STATE_ID: &str = "BuiltInSetState";
const BUILT_IN_MIXED_READONLY_ID: &str = "BuiltInMixedReadonly";

// =============================================================================
// Public API
// =============================================================================

pub fn infer_types(func: &mut HirFunction, env: &mut Environment) {
    let mut unifier = Unifier::new();
    generate(func, env, &mut unifier);
    apply_function(
        func,
        &env.functions,
        &mut env.identifiers,
        &mut env.types,
        &unifier,
    );
}

// =============================================================================
// Helpers
// =============================================================================

/// Get the type for an identifier as a TypeVar referencing its type slot.
fn get_type(id: IdentifierId, identifiers: &[Identifier]) -> Type {
    let type_id = identifiers[id.0 as usize].type_;
    Type::TypeVar { id: type_id }
}

/// Allocate a new TypeVar in the types arena (standalone, no &mut Environment needed).
fn make_type(types: &mut Vec<Type>) -> Type {
    let id = TypeId(types.len() as u32);
    types.push(Type::TypeVar { id });
    Type::TypeVar { id }
}

fn is_primitive_binary_op(op: &BinaryOperator) -> bool {
    matches!(
        op,
        BinaryOperator::Add
            | BinaryOperator::Subtract
            | BinaryOperator::Divide
            | BinaryOperator::Modulo
            | BinaryOperator::Multiply
            | BinaryOperator::Exponent
            | BinaryOperator::BitwiseAnd
            | BinaryOperator::BitwiseOr
            | BinaryOperator::ShiftRight
            | BinaryOperator::ShiftLeft
            | BinaryOperator::BitwiseXor
            | BinaryOperator::GreaterThan
            | BinaryOperator::LessThan
            | BinaryOperator::GreaterEqual
            | BinaryOperator::LessEqual
    )
}

/// Type equality matching TS `typeEquals`.
///
/// Note: Function equality only compares return types (matching TS `funcTypeEquals`
/// which ignores `shapeId` and `isConstructor`). Phi equality always returns false
/// because the TS `phiTypeEquals` has a bug where `return false` is outside the
/// `if` block, so it unconditionally returns false.
fn type_equals(a: &Type, b: &Type) -> bool {
    match (a, b) {
        (Type::TypeVar { id: id_a }, Type::TypeVar { id: id_b }) => id_a == id_b,
        (Type::Primitive, Type::Primitive) => true,
        (Type::Poly, Type::Poly) => true,
        (Type::ObjectMethod, Type::ObjectMethod) => true,
        (
            Type::Object { shape_id: sa },
            Type::Object { shape_id: sb },
        ) => sa == sb,
        (
            Type::Function {
                return_type: ra, ..
            },
            Type::Function {
                return_type: rb, ..
            },
        ) => type_equals(ra, rb),
        _ => false,
    }
}

fn set_name(
    names: &mut HashMap<IdentifierId, String>,
    id: IdentifierId,
    source: &Identifier,
) {
    if let Some(IdentifierName::Named(ref name)) = source.name {
        names.insert(id, name.clone());
    }
}

fn get_name(names: &HashMap<IdentifierId, String>, id: IdentifierId) -> String {
    names.get(&id).cloned().unwrap_or_default()
}

// =============================================================================
// Generate equations
// =============================================================================

/// Generate type equations from a top-level function.
///
/// Takes `&mut Environment` for convenience. Inner functions use
/// `generate_for_function_id` with split borrows instead, because the
/// take/replace pattern on `env.functions` requires separate `&mut` access
/// to different fields.
fn generate(func: &HirFunction, env: &mut Environment, unifier: &mut Unifier) {
    // Component params
    if func.fn_type == ReactFunctionType::Component {
        if let Some(first) = func.params.first() {
            if let ParamPattern::Place(place) = first {
                let ty = get_type(place.identifier, &env.identifiers);
                unifier.unify(
                    ty,
                    Type::Object {
                        shape_id: Some(BUILT_IN_PROPS_ID.to_string()),
                    },
                );
            }
        }
        if let Some(second) = func.params.get(1) {
            if let ParamPattern::Place(place) = second {
                let ty = get_type(place.identifier, &env.identifiers);
                unifier.unify(
                    ty,
                    Type::Object {
                        shape_id: Some(BUILT_IN_USE_REF_ID.to_string()),
                    },
                );
            }
        }
    }

    let mut names: HashMap<IdentifierId, String> = HashMap::new();
    let mut return_types: Vec<Type> = Vec::new();

    for (_block_id, block) in &func.body.blocks {
        // Phis
        for phi in &block.phis {
            let left = get_type(phi.place.identifier, &env.identifiers);
            let operands: Vec<Type> = phi
                .operands
                .values()
                .map(|p| get_type(p.identifier, &env.identifiers))
                .collect();
            unifier.unify(left, Type::Phi { operands });
        }

        // Instructions
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            generate_instruction_types(
                instr,
                &env.identifiers,
                &mut env.types,
                &mut env.functions,
                &mut names,
                unifier,
            );
        }

        // Return terminals
        if let Terminal::Return { ref value, .. } = block.terminal {
            return_types.push(get_type(value.identifier, &env.identifiers));
        }
    }

    // Unify return types
    let returns_type = get_type(func.returns.identifier, &env.identifiers);
    if return_types.len() > 1 {
        unifier.unify(returns_type, Type::Phi { operands: return_types });
    } else if return_types.len() == 1 {
        unifier.unify(returns_type, return_types.into_iter().next().unwrap());
    }
}

/// Recursively generate equations for an inner function (accessed via FunctionId).
fn generate_for_function_id(
    func_id: FunctionId,
    identifiers: &[Identifier],
    types: &mut Vec<Type>,
    functions: &mut Vec<HirFunction>,
    names: &mut HashMap<IdentifierId, String>,
    unifier: &mut Unifier,
) {
    // Take the function out temporarily to avoid borrow conflicts
    let inner = std::mem::replace(
        &mut functions[func_id.0 as usize],
        placeholder_function(),
    );

    // Process params for component inner functions
    if inner.fn_type == ReactFunctionType::Component {
        if let Some(first) = inner.params.first() {
            if let ParamPattern::Place(place) = first {
                let ty = get_type(place.identifier, identifiers);
                unifier.unify(
                    ty,
                    Type::Object {
                        shape_id: Some(BUILT_IN_PROPS_ID.to_string()),
                    },
                );
            }
        }
        if let Some(second) = inner.params.get(1) {
            if let ParamPattern::Place(place) = second {
                let ty = get_type(place.identifier, identifiers);
                unifier.unify(
                    ty,
                    Type::Object {
                        shape_id: Some(BUILT_IN_USE_REF_ID.to_string()),
                    },
                );
            }
        }
    }

    let mut inner_return_types: Vec<Type> = Vec::new();

    for (_block_id, block) in &inner.body.blocks {
        for phi in &block.phis {
            let left = get_type(phi.place.identifier, identifiers);
            let operands: Vec<Type> = phi
                .operands
                .values()
                .map(|p| get_type(p.identifier, identifiers))
                .collect();
            unifier.unify(left, Type::Phi { operands });
        }

        for &instr_id in &block.instructions {
            let instr = &inner.instructions[instr_id.0 as usize];
            generate_instruction_types(instr, identifiers, types, functions, names, unifier);
        }

        if let Terminal::Return { ref value, .. } = block.terminal {
            inner_return_types.push(get_type(value.identifier, identifiers));
        }
    }

    let returns_type = get_type(inner.returns.identifier, identifiers);
    if inner_return_types.len() > 1 {
        unifier.unify(
            returns_type,
            Type::Phi {
                operands: inner_return_types,
            },
        );
    } else if inner_return_types.len() == 1 {
        unifier.unify(
            returns_type,
            inner_return_types.into_iter().next().unwrap(),
        );
    }

    // Put the function back
    functions[func_id.0 as usize] = inner;
}

fn generate_instruction_types(
    instr: &react_compiler_hir::Instruction,
    identifiers: &[Identifier],
    types: &mut Vec<Type>,
    functions: &mut Vec<HirFunction>,
    names: &mut HashMap<IdentifierId, String>,
    unifier: &mut Unifier,
) {
    let left = get_type(instr.lvalue.identifier, identifiers);

    match &instr.value {
        InstructionValue::TemplateLiteral { .. }
        | InstructionValue::JSXText { .. }
        | InstructionValue::Primitive { .. } => {
            unifier.unify(left, Type::Primitive);
        }

        InstructionValue::UnaryExpression { .. } => {
            unifier.unify(left, Type::Primitive);
        }

        InstructionValue::LoadLocal { place, .. } => {
            set_name(names, instr.lvalue.identifier, &identifiers[place.identifier.0 as usize]);
            let place_type = get_type(place.identifier, identifiers);
            unifier.unify(left, place_type);
        }

        InstructionValue::DeclareContext { .. } | InstructionValue::LoadContext { .. } => {
            // Intentionally skip type inference for most context variables
        }

        InstructionValue::StoreContext { lvalue, value, .. } => {
            if lvalue.kind == InstructionKind::Const {
                let lvalue_type = get_type(lvalue.place.identifier, identifiers);
                let value_type = get_type(value.identifier, identifiers);
                unifier.unify(lvalue_type, value_type);
            }
        }

        InstructionValue::StoreLocal { lvalue, value, .. } => {
            let value_type = get_type(value.identifier, identifiers);
            unifier.unify(left, value_type.clone());
            let lvalue_type = get_type(lvalue.place.identifier, identifiers);
            unifier.unify(lvalue_type, value_type);
        }

        InstructionValue::StoreGlobal { value, .. } => {
            let value_type = get_type(value.identifier, identifiers);
            unifier.unify(left, value_type);
        }

        InstructionValue::BinaryExpression {
            operator,
            left: bin_left,
            right: bin_right,
            ..
        } => {
            if is_primitive_binary_op(operator) {
                let left_operand_type = get_type(bin_left.identifier, identifiers);
                unifier.unify(left_operand_type, Type::Primitive);
                let right_operand_type = get_type(bin_right.identifier, identifiers);
                unifier.unify(right_operand_type, Type::Primitive);
            }
            unifier.unify(left, Type::Primitive);
        }

        InstructionValue::PostfixUpdate { value, lvalue, .. }
        | InstructionValue::PrefixUpdate { value, lvalue, .. } => {
            let value_type = get_type(value.identifier, identifiers);
            unifier.unify(value_type, Type::Primitive);
            let lvalue_type = get_type(lvalue.identifier, identifiers);
            unifier.unify(lvalue_type, Type::Primitive);
            unifier.unify(left, Type::Primitive);
        }

        InstructionValue::LoadGlobal { .. } => {
            // TODO: env.getGlobalDeclaration() not ported yet.
            // This prevents type inference for built-in hooks (useState, useRef, etc.)
            // and other globals. Depends on porting the shapes/globals system.
        }

        InstructionValue::CallExpression { callee, .. } => {
            let return_type = make_type(types);
            // enableTreatSetIdentifiersAsStateSetters is skipped (treated as false)
            let callee_type = get_type(callee.identifier, identifiers);
            unifier.unify(
                callee_type,
                Type::Function {
                    shape_id: None,
                    return_type: Box::new(return_type.clone()),
                    is_constructor: false,
                },
            );
            unifier.unify(left, return_type);
        }

        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            let return_type = make_type(types);
            let tag_type = get_type(tag.identifier, identifiers);
            unifier.unify(
                tag_type,
                Type::Function {
                    shape_id: None,
                    return_type: Box::new(return_type.clone()),
                    is_constructor: false,
                },
            );
            unifier.unify(left, return_type);
        }

        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                if let ObjectPropertyOrSpread::Property(obj_prop) = prop {
                    if let ObjectPropertyKey::Computed { name } = &obj_prop.key {
                        let name_type = get_type(name.identifier, identifiers);
                        unifier.unify(name_type, Type::Primitive);
                    }
                }
            }
            unifier.unify(
                left,
                Type::Object {
                    shape_id: Some(BUILT_IN_OBJECT_ID.to_string()),
                },
            );
        }

        InstructionValue::ArrayExpression { .. } => {
            unifier.unify(
                left,
                Type::Object {
                    shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
                },
            );
        }

        InstructionValue::PropertyLoad { object, property, .. } => {
            let object_type = get_type(object.identifier, identifiers);
            let object_name = get_name(names, object.identifier);
            unifier.unify(
                left,
                Type::Property {
                    object_type: Box::new(object_type),
                    object_name,
                    property_name: PropertyNameKind::Literal {
                        value: property.clone(),
                    },
                },
            );
        }

        InstructionValue::ComputedLoad { object, property, .. } => {
            let object_type = get_type(object.identifier, identifiers);
            let object_name = get_name(names, object.identifier);
            let prop_type = get_type(property.identifier, identifiers);
            unifier.unify(
                left,
                Type::Property {
                    object_type: Box::new(object_type),
                    object_name,
                    property_name: PropertyNameKind::Computed {
                        value: Box::new(prop_type),
                    },
                },
            );
        }

        InstructionValue::MethodCall { property, .. } => {
            let return_type = make_type(types);
            let prop_type = get_type(property.identifier, identifiers);
            unifier.unify(
                prop_type,
                Type::Function {
                    return_type: Box::new(return_type.clone()),
                    shape_id: None,
                    is_constructor: false,
                },
            );
            unifier.unify(left, return_type);
        }

        InstructionValue::Destructure { lvalue, value, .. } => {
            match &lvalue.pattern {
                Pattern::Array(array_pattern) => {
                    for (i, item) in array_pattern.items.iter().enumerate() {
                        match item {
                            ArrayPatternElement::Place(place) => {
                                let item_type = get_type(place.identifier, identifiers);
                                let value_type = get_type(value.identifier, identifiers);
                                let object_name = get_name(names, value.identifier);
                                unifier.unify(
                                    item_type,
                                    Type::Property {
                                        object_type: Box::new(value_type),
                                        object_name,
                                        property_name: PropertyNameKind::Literal {
                                            value: PropertyLiteral::String(i.to_string()),
                                        },
                                    },
                                );
                            }
                            ArrayPatternElement::Spread(spread) => {
                                let spread_type = get_type(spread.place.identifier, identifiers);
                                unifier.unify(
                                    spread_type,
                                    Type::Object {
                                        shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
                                    },
                                );
                            }
                            ArrayPatternElement::Hole => {
                                continue;
                            }
                        }
                    }
                }
                Pattern::Object(object_pattern) => {
                    for prop in &object_pattern.properties {
                        if let ObjectPropertyOrSpread::Property(obj_prop) = prop {
                            match &obj_prop.key {
                                ObjectPropertyKey::Identifier { name }
                                | ObjectPropertyKey::String { name } => {
                                    let prop_place_type =
                                        get_type(obj_prop.place.identifier, identifiers);
                                    let value_type = get_type(value.identifier, identifiers);
                                    let object_name = get_name(names, value.identifier);
                                    unifier.unify(
                                        prop_place_type,
                                        Type::Property {
                                            object_type: Box::new(value_type),
                                            object_name,
                                            property_name: PropertyNameKind::Literal {
                                                value: PropertyLiteral::String(name.clone()),
                                            },
                                        },
                                    );
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }

        InstructionValue::TypeCastExpression { value, .. } => {
            let value_type = get_type(value.identifier, identifiers);
            unifier.unify(left, value_type);
        }

        InstructionValue::PropertyDelete { .. } | InstructionValue::ComputedDelete { .. } => {
            unifier.unify(left, Type::Primitive);
        }

        InstructionValue::FunctionExpression {
            lowered_func: LoweredFunction { func: func_id },
            ..
        } => {
            // Recurse into inner function first
            generate_for_function_id(*func_id, identifiers, types, functions, names, unifier);
            // Get the inner function's return type
            let inner_func = &functions[func_id.0 as usize];
            let inner_return_type = get_type(inner_func.returns.identifier, identifiers);
            unifier.unify(
                left,
                Type::Function {
                    shape_id: Some(BUILT_IN_FUNCTION_ID.to_string()),
                    return_type: Box::new(inner_return_type),
                    is_constructor: false,
                },
            );
        }

        InstructionValue::NextPropertyOf { .. } => {
            unifier.unify(left, Type::Primitive);
        }

        InstructionValue::ObjectMethod {
            lowered_func: LoweredFunction { func: func_id },
            ..
        } => {
            generate_for_function_id(*func_id, identifiers, types, functions, names, unifier);
            unifier.unify(left, Type::ObjectMethod);
        }

        InstructionValue::JsxExpression { .. } | InstructionValue::JsxFragment { .. } => {
            // TODO: enableTreatRefLikeIdentifiersAsRefs not ported (treated as false).
            // When ported, JsxExpression `ref` props should be unified with BuiltInUseRefId.
            unifier.unify(
                left,
                Type::Object {
                    shape_id: Some(BUILT_IN_JSX_ID.to_string()),
                },
            );
        }

        InstructionValue::NewExpression { callee, .. } => {
            let return_type = make_type(types);
            let callee_type = get_type(callee.identifier, identifiers);
            unifier.unify(
                callee_type,
                Type::Function {
                    return_type: Box::new(return_type.clone()),
                    shape_id: None,
                    is_constructor: true,
                },
            );
            unifier.unify(left, return_type);
        }

        InstructionValue::PropertyStore {
            object, property, ..
        } => {
            let dummy = make_type(types);
            let object_type = get_type(object.identifier, identifiers);
            let object_name = get_name(names, object.identifier);
            unifier.unify(
                dummy,
                Type::Property {
                    object_type: Box::new(object_type),
                    object_name,
                    property_name: PropertyNameKind::Literal {
                        value: property.clone(),
                    },
                },
            );
        }

        InstructionValue::DeclareLocal { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::ComputedStore { .. }
        | InstructionValue::Await { .. }
        | InstructionValue::GetIterator { .. }
        | InstructionValue::IteratorNext { .. }
        | InstructionValue::UnsupportedNode { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::FinishMemoize { .. }
        | InstructionValue::StartMemoize { .. } => {
            // No type equations for these
        }
    }
}

// =============================================================================
// Apply resolved types
// =============================================================================

fn apply_function(
    func: &HirFunction,
    functions: &[HirFunction],
    identifiers: &mut [Identifier],
    types: &mut Vec<Type>,
    unifier: &Unifier,
) {
    for (_block_id, block) in &func.body.blocks {
        // Phi places
        for phi in &block.phis {
            resolve_identifier(phi.place.identifier, identifiers, types, unifier);
        }

        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];

            // Instruction lvalue
            resolve_identifier(instr.lvalue.identifier, identifiers, types, unifier);

            // LValues from instruction values (StoreLocal, StoreContext, DeclareLocal, DeclareContext, Destructure)
            apply_instruction_lvalues(&instr.value, identifiers, types, unifier);

            // Operands
            apply_instruction_operands(&instr.value, identifiers, types, unifier);

            // Recurse into inner functions
            match &instr.value {
                InstructionValue::FunctionExpression {
                    lowered_func: LoweredFunction { func: func_id },
                    ..
                }
                | InstructionValue::ObjectMethod {
                    lowered_func: LoweredFunction { func: func_id },
                    ..
                } => {
                    let inner_func = &functions[func_id.0 as usize];
                    apply_function(inner_func, functions, identifiers, types, unifier);
                }
                _ => {}
            }
        }
    }

    // Resolve return type
    resolve_identifier(func.returns.identifier, identifiers, types, unifier);
}

fn resolve_identifier(
    id: IdentifierId,
    identifiers: &mut [Identifier],
    types: &mut Vec<Type>,
    unifier: &Unifier,
) {
    let type_id = identifiers[id.0 as usize].type_;
    let current_type = types[type_id.0 as usize].clone();
    let resolved = unifier.get(&current_type);
    types[type_id.0 as usize] = resolved;
}

/// Resolve types for instruction lvalues (mirrors TS eachInstructionLValue).
fn apply_instruction_lvalues(
    value: &InstructionValue,
    identifiers: &mut [Identifier],
    types: &mut Vec<Type>,
    unifier: &Unifier,
) {
    match value {
        InstructionValue::StoreLocal { lvalue, .. } | InstructionValue::StoreContext { lvalue, .. } => {
            resolve_identifier(lvalue.place.identifier, identifiers, types, unifier);
        }
        InstructionValue::DeclareLocal { lvalue, .. } | InstructionValue::DeclareContext { lvalue, .. } => {
            resolve_identifier(lvalue.place.identifier, identifiers, types, unifier);
        }
        InstructionValue::Destructure { lvalue, .. } => {
            match &lvalue.pattern {
                Pattern::Array(array_pattern) => {
                    for item in &array_pattern.items {
                        match item {
                            ArrayPatternElement::Place(place) => {
                                resolve_identifier(place.identifier, identifiers, types, unifier);
                            }
                            ArrayPatternElement::Spread(spread) => {
                                resolve_identifier(
                                    spread.place.identifier,
                                    identifiers,
                                    types,
                                    unifier,
                                );
                            }
                            ArrayPatternElement::Hole => {}
                        }
                    }
                }
                Pattern::Object(object_pattern) => {
                    for prop in &object_pattern.properties {
                        match prop {
                            ObjectPropertyOrSpread::Property(obj_prop) => {
                                resolve_identifier(
                                    obj_prop.place.identifier,
                                    identifiers,
                                    types,
                                    unifier,
                                );
                            }
                            ObjectPropertyOrSpread::Spread(spread) => {
                                resolve_identifier(
                                    spread.place.identifier,
                                    identifiers,
                                    types,
                                    unifier,
                                );
                            }
                        }
                    }
                }
            }
        }
        _ => {}
    }
}

/// Resolve types for instruction operands (mirrors TS eachInstructionOperand).
fn apply_instruction_operands(
    value: &InstructionValue,
    identifiers: &mut [Identifier],
    types: &mut Vec<Type>,
    unifier: &Unifier,
) {
    match value {
        InstructionValue::LoadLocal { place, .. } | InstructionValue::LoadContext { place, .. } => {
            resolve_identifier(place.identifier, identifiers, types, unifier);
        }
        InstructionValue::StoreLocal { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::StoreContext { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::StoreGlobal { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::Destructure { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            resolve_identifier(left.identifier, identifiers, types, unifier);
            resolve_identifier(right.identifier, identifiers, types, unifier);
        }
        InstructionValue::UnaryExpression { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::TypeCastExpression { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::CallExpression { callee, args, .. } => {
            resolve_identifier(callee.identifier, identifiers, types, unifier);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(p) => {
                        resolve_identifier(p.identifier, identifiers, types, unifier);
                    }
                    react_compiler_hir::PlaceOrSpread::Spread(s) => {
                        resolve_identifier(s.place.identifier, identifiers, types, unifier);
                    }
                }
            }
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            resolve_identifier(receiver.identifier, identifiers, types, unifier);
            resolve_identifier(property.identifier, identifiers, types, unifier);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(p) => {
                        resolve_identifier(p.identifier, identifiers, types, unifier);
                    }
                    react_compiler_hir::PlaceOrSpread::Spread(s) => {
                        resolve_identifier(s.place.identifier, identifiers, types, unifier);
                    }
                }
            }
        }
        InstructionValue::NewExpression { callee, args, .. } => {
            resolve_identifier(callee.identifier, identifiers, types, unifier);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(p) => {
                        resolve_identifier(p.identifier, identifiers, types, unifier);
                    }
                    react_compiler_hir::PlaceOrSpread::Spread(s) => {
                        resolve_identifier(s.place.identifier, identifiers, types, unifier);
                    }
                }
            }
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            resolve_identifier(tag.identifier, identifiers, types, unifier);
            // The template quasi's subexpressions are not separate operands in this HIR
        }
        InstructionValue::PropertyLoad { object, .. } => {
            resolve_identifier(object.identifier, identifiers, types, unifier);
        }
        InstructionValue::PropertyStore { object, value: val, .. } => {
            resolve_identifier(object.identifier, identifiers, types, unifier);
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::PropertyDelete { object, .. } => {
            resolve_identifier(object.identifier, identifiers, types, unifier);
        }
        InstructionValue::ComputedLoad { object, property, .. } => {
            resolve_identifier(object.identifier, identifiers, types, unifier);
            resolve_identifier(property.identifier, identifiers, types, unifier);
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value: val,
            ..
        } => {
            resolve_identifier(object.identifier, identifiers, types, unifier);
            resolve_identifier(property.identifier, identifiers, types, unifier);
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::ComputedDelete { object, property, .. } => {
            resolve_identifier(object.identifier, identifiers, types, unifier);
            resolve_identifier(property.identifier, identifiers, types, unifier);
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    ObjectPropertyOrSpread::Property(obj_prop) => {
                        resolve_identifier(obj_prop.place.identifier, identifiers, types, unifier);
                        if let ObjectPropertyKey::Computed { name } = &obj_prop.key {
                            resolve_identifier(name.identifier, identifiers, types, unifier);
                        }
                    }
                    ObjectPropertyOrSpread::Spread(spread) => {
                        resolve_identifier(spread.place.identifier, identifiers, types, unifier);
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for elem in elements {
                match elem {
                    react_compiler_hir::ArrayElement::Place(p) => {
                        resolve_identifier(p.identifier, identifiers, types, unifier);
                    }
                    react_compiler_hir::ArrayElement::Spread(s) => {
                        resolve_identifier(s.place.identifier, identifiers, types, unifier);
                    }
                    react_compiler_hir::ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::JsxExpression {
            tag, props, children, ..
        } => {
            if let react_compiler_hir::JsxTag::Place(p) = tag {
                resolve_identifier(p.identifier, identifiers, types, unifier);
            }
            for attr in props {
                match attr {
                    JsxAttribute::Attribute { place, .. } => {
                        resolve_identifier(place.identifier, identifiers, types, unifier);
                    }
                    JsxAttribute::SpreadAttribute { argument } => {
                        resolve_identifier(argument.identifier, identifiers, types, unifier);
                    }
                }
            }
            if let Some(children) = children {
                for child in children {
                    resolve_identifier(child.identifier, identifiers, types, unifier);
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for child in children {
                resolve_identifier(child.identifier, identifiers, types, unifier);
            }
        }
        InstructionValue::FunctionExpression { .. } | InstructionValue::ObjectMethod { .. } => {
            // Inner functions are handled separately via recursion
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for sub in subexprs {
                resolve_identifier(sub.identifier, identifiers, types, unifier);
            }
        }
        InstructionValue::PrefixUpdate { value: val, lvalue, .. }
        | InstructionValue::PostfixUpdate { value: val, lvalue, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
            resolve_identifier(lvalue.identifier, identifiers, types, unifier);
        }
        InstructionValue::Await { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::GetIterator { collection, .. } => {
            resolve_identifier(collection.identifier, identifiers, types, unifier);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            resolve_identifier(iterator.identifier, identifiers, types, unifier);
            resolve_identifier(collection.identifier, identifiers, types, unifier);
        }
        InstructionValue::NextPropertyOf { value: val, .. } => {
            resolve_identifier(val.identifier, identifiers, types, unifier);
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            resolve_identifier(decl.identifier, identifiers, types, unifier);
        }
        InstructionValue::Primitive { .. }
        | InstructionValue::JSXText { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::DeclareLocal { .. }
        | InstructionValue::DeclareContext { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::StartMemoize { .. }
        | InstructionValue::UnsupportedNode { .. } => {
            // No operand places
        }
    }
}

// =============================================================================
// Unifier
// =============================================================================

struct Unifier {
    substitutions: HashMap<TypeId, Type>,
}

impl Unifier {
    fn new() -> Self {
        Unifier {
            substitutions: HashMap::new(),
        }
    }

    fn unify(&mut self, t_a: Type, t_b: Type) {
        // Handle Property in the RHS position
        if let Type::Property { .. } = &t_b {
            // TODO: enableTreatRefLikeIdentifiersAsRefs not ported (treated as false).
            // TODO: env.getPropertyType() / getFallthroughPropertyType() not ported.
            // When ported, this should resolve known property types (e.g. `.current`
            // on refs, array methods, hook return types) and recursively unify.
            // Currently all property-based type inference is lost. Depends on porting
            // the shapes/globals system.
            return;
        }

        if type_equals(&t_a, &t_b) {
            return;
        }

        if let Type::TypeVar { .. } = &t_a {
            self.bind_variable_to(t_a, t_b);
            return;
        }

        if let Type::TypeVar { .. } = &t_b {
            self.bind_variable_to(t_b, t_a);
            return;
        }

        if let (
            Type::Function {
                return_type: ret_a,
                is_constructor: con_a,
                ..
            },
            Type::Function {
                return_type: ret_b,
                is_constructor: con_b,
                ..
            },
        ) = (&t_a, &t_b)
        {
            if con_a == con_b {
                self.unify(*ret_a.clone(), *ret_b.clone());
            }
        }
    }

    fn bind_variable_to(&mut self, v: Type, ty: Type) {
        let v_id = match &v {
            Type::TypeVar { id } => *id,
            _ => return,
        };

        if let Type::Poly = &ty {
            // Ignore PolyType
            return;
        }

        if let Some(existing) = self.substitutions.get(&v_id).cloned() {
            self.unify(existing, ty);
            return;
        }

        if let Type::TypeVar { id: ty_id } = &ty {
            if let Some(existing) = self.substitutions.get(ty_id).cloned() {
                self.unify(v, existing);
                return;
            }
        }

        if let Type::Phi { ref operands } = ty {
            if operands.is_empty() {
                // DIVERGENCE: TS calls CompilerError.invariant() which panics.
                // We skip since this shouldn't happen in practice and the pass
                // doesn't currently return Result.
                return;
            }

            let mut candidate_type: Option<Type> = None;
            for operand in operands {
                let resolved = self.get(operand);
                match &candidate_type {
                    None => {
                        candidate_type = Some(resolved);
                    }
                    Some(candidate) => {
                        if !type_equals(&resolved, candidate) {
                            let union_type = try_union_types(&resolved, candidate);
                            if let Some(union) = union_type {
                                candidate_type = Some(union);
                            } else {
                                candidate_type = None;
                                break;
                            }
                        }
                        // else same type, continue
                    }
                }
            }

            if let Some(candidate) = candidate_type {
                self.unify(v, candidate);
                return;
            }
        }

        if self.occurs_check(&v, &ty) {
            let resolved_type = self.try_resolve_type(&v, &ty);
            if let Some(resolved) = resolved_type {
                self.substitutions.insert(v_id, resolved);
                return;
            }
            // DIVERGENCE: TS throws `new Error('cycle detected')`. We skip instead
            // since this pass doesn't currently return Result. This is safe because
            // the unresolved type variable will remain as-is (TypeVar).
            return;
        }

        self.substitutions.insert(v_id, ty);
    }

    fn try_resolve_type(&mut self, v: &Type, ty: &Type) -> Option<Type> {
        match ty {
            Type::Phi { operands } => {
                let mut new_operands = Vec::new();
                for operand in operands {
                    if let Type::TypeVar { id } = operand {
                        if let Type::TypeVar { id: v_id } = v {
                            if id == v_id {
                                continue; // skip self-reference
                            }
                        }
                    }
                    let resolved = self.try_resolve_type(v, operand)?;
                    new_operands.push(resolved);
                }
                Some(Type::Phi {
                    operands: new_operands,
                })
            }
            Type::TypeVar { id } => {
                let substitution = self.get(ty);
                if !type_equals(&substitution, ty) {
                    let resolved = self.try_resolve_type(v, &substitution)?;
                    self.substitutions.insert(*id, resolved.clone());
                    Some(resolved)
                } else {
                    Some(ty.clone())
                }
            }
            Type::Property {
                object_type,
                object_name,
                property_name,
            } => {
                let resolved_obj = self.get(object_type);
                let object_type = self.try_resolve_type(v, &resolved_obj)?;
                Some(Type::Property {
                    object_type: Box::new(object_type),
                    object_name: object_name.clone(),
                    property_name: property_name.clone(),
                })
            }
            Type::Function {
                shape_id,
                return_type,
                is_constructor,
            } => {
                let resolved_ret = self.get(return_type);
                let return_type = self.try_resolve_type(v, &resolved_ret)?;
                Some(Type::Function {
                    shape_id: shape_id.clone(),
                    return_type: Box::new(return_type),
                    is_constructor: *is_constructor,
                })
            }
            Type::ObjectMethod | Type::Object { .. } | Type::Primitive | Type::Poly => {
                Some(ty.clone())
            }
        }
    }

    fn occurs_check(&self, v: &Type, ty: &Type) -> bool {
        if type_equals(v, ty) {
            return true;
        }

        if let Type::TypeVar { id } = ty {
            if let Some(sub) = self.substitutions.get(id) {
                return self.occurs_check(v, sub);
            }
        }

        if let Type::Phi { operands } = ty {
            return operands.iter().any(|o| self.occurs_check(v, o));
        }

        if let Type::Function { return_type, .. } = ty {
            return self.occurs_check(v, return_type);
        }

        false
    }

    fn get(&self, ty: &Type) -> Type {
        if let Type::TypeVar { id } = ty {
            if let Some(sub) = self.substitutions.get(id) {
                return self.get(sub);
            }
        }

        if let Type::Phi { operands } = ty {
            return Type::Phi {
                operands: operands.iter().map(|o| self.get(o)).collect(),
            };
        }

        if let Type::Function {
            is_constructor,
            shape_id,
            return_type,
        } = ty
        {
            return Type::Function {
                is_constructor: *is_constructor,
                shape_id: shape_id.clone(),
                return_type: Box::new(self.get(return_type)),
            };
        }

        ty.clone()
    }
}

// =============================================================================
// Union types helper
// =============================================================================

fn try_union_types(ty1: &Type, ty2: &Type) -> Option<Type> {
    let (readonly_type, other_type) = if matches!(ty1, Type::Object { shape_id } if shape_id.as_deref() == Some(BUILT_IN_MIXED_READONLY_ID))
    {
        (ty1, ty2)
    } else if matches!(ty2, Type::Object { shape_id } if shape_id.as_deref() == Some(BUILT_IN_MIXED_READONLY_ID))
    {
        (ty2, ty1)
    } else {
        return None;
    };

    if matches!(other_type, Type::Primitive) {
        // Union(Primitive | MixedReadonly) = MixedReadonly
        return Some(readonly_type.clone());
    } else if matches!(other_type, Type::Object { shape_id } if shape_id.as_deref() == Some(BUILT_IN_ARRAY_ID))
    {
        // Union(Array | MixedReadonly) = Array
        return Some(other_type.clone());
    }

    None
}
