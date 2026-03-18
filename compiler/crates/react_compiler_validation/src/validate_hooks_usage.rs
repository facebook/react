// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Validates hooks usage rules.
//!
//! Port of ValidateHooksUsage.ts.
//! Ensures hooks are called unconditionally, not passed as values,
//! and not called dynamically. Also validates that hooks are not
//! called inside function expressions.

use std::collections::HashMap;

use indexmap::IndexMap;
use react_compiler_diagnostics::{
    CompilerErrorDetail, ErrorCategory, SourceLocation,
};
use react_compiler_hir::{
    ArrayPatternElement, FunctionId, HirFunction, Identifier, IdentifierId,
    InstructionValue, ObjectPropertyOrSpread, ParamPattern, Pattern, Place, PropertyLiteral,
    Terminal, Type,
};
use react_compiler_hir::dominator::compute_unconditional_blocks;
use react_compiler_hir::environment::{is_hook_name, Environment};
use react_compiler_hir::object_shape::HookKind;

/// Value classification for hook validation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Kind {
    Error,
    KnownHook,
    PotentialHook,
    Global,
    Local,
}

fn join_kinds(a: Kind, b: Kind) -> Kind {
    if a == Kind::Error || b == Kind::Error {
        Kind::Error
    } else if a == Kind::KnownHook || b == Kind::KnownHook {
        Kind::KnownHook
    } else if a == Kind::PotentialHook || b == Kind::PotentialHook {
        Kind::PotentialHook
    } else if a == Kind::Global || b == Kind::Global {
        Kind::Global
    } else {
        Kind::Local
    }
}

fn get_kind_for_place(
    place: &Place,
    value_kinds: &HashMap<IdentifierId, Kind>,
    identifiers: &[Identifier],
) -> Kind {
    let known_kind = value_kinds.get(&place.identifier).copied();
    let ident = &identifiers[place.identifier.0 as usize];
    if let Some(ref name) = ident.name {
        if is_hook_name(name.value()) {
            return join_kinds(known_kind.unwrap_or(Kind::Local), Kind::PotentialHook);
        }
    }
    known_kind.unwrap_or(Kind::Local)
}

fn ident_is_hook_name(identifier_id: IdentifierId, identifiers: &[Identifier]) -> bool {
    let ident = &identifiers[identifier_id.0 as usize];
    if let Some(ref name) = ident.name {
        is_hook_name(name.value())
    } else {
        false
    }
}

fn get_hook_kind_for_id<'a>(
    identifier_id: IdentifierId,
    identifiers: &[Identifier],
    types: &[Type],
    env: &'a Environment,
) -> Option<&'a HookKind> {
    let identifier = &identifiers[identifier_id.0 as usize];
    let ty = &types[identifier.type_.0 as usize];
    env.get_hook_kind_for_type(ty)
}

fn visit_place(
    place: &Place,
    value_kinds: &HashMap<IdentifierId, Kind>,
    errors_by_loc: &mut IndexMap<SourceLocation, CompilerErrorDetail>,
    env: &mut Environment,
) {
    let kind = value_kinds.get(&place.identifier).copied();
    if kind == Some(Kind::KnownHook) {
        record_invalid_hook_usage_error(place, errors_by_loc, env);
    }
}

fn record_conditional_hook_error(
    place: &Place,
    value_kinds: &mut HashMap<IdentifierId, Kind>,
    errors_by_loc: &mut IndexMap<SourceLocation, CompilerErrorDetail>,
    env: &mut Environment,
) {
    value_kinds.insert(place.identifier, Kind::Error);
    let reason = "Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)".to_string();
    if let Some(loc) = place.loc {
        let previous = errors_by_loc.get(&loc);
        if previous.is_none() || previous.unwrap().reason != reason {
            errors_by_loc.insert(
                loc,
                CompilerErrorDetail {
                    category: ErrorCategory::Hooks,
                    reason,
                    description: None,
                    loc: Some(loc),
                    suggestions: None,
                },
            );
        }
    } else {
        env.record_error(CompilerErrorDetail {
            category: ErrorCategory::Hooks,
            reason,
            description: None,
            loc: None,
            suggestions: None,
        });
    }
}

fn record_invalid_hook_usage_error(
    place: &Place,
    errors_by_loc: &mut IndexMap<SourceLocation, CompilerErrorDetail>,
    env: &mut Environment,
) {
    let reason = "Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values".to_string();
    if let Some(loc) = place.loc {
        if !errors_by_loc.contains_key(&loc) {
            errors_by_loc.insert(
                loc,
                CompilerErrorDetail {
                    category: ErrorCategory::Hooks,
                    reason,
                    description: None,
                    loc: Some(loc),
                    suggestions: None,
                },
            );
        }
    } else {
        env.record_error(CompilerErrorDetail {
            category: ErrorCategory::Hooks,
            reason,
            description: None,
            loc: None,
            suggestions: None,
        });
    }
}

fn record_dynamic_hook_usage_error(
    place: &Place,
    errors_by_loc: &mut IndexMap<SourceLocation, CompilerErrorDetail>,
    env: &mut Environment,
) {
    let reason = "Hooks must be the same function on every render, but this value may change over time to a different function. See https://react.dev/reference/rules/react-calls-components-and-hooks#dont-dynamically-use-hooks".to_string();
    if let Some(loc) = place.loc {
        if !errors_by_loc.contains_key(&loc) {
            errors_by_loc.insert(
                loc,
                CompilerErrorDetail {
                    category: ErrorCategory::Hooks,
                    reason,
                    description: None,
                    loc: Some(loc),
                    suggestions: None,
                },
            );
        }
    } else {
        env.record_error(CompilerErrorDetail {
            category: ErrorCategory::Hooks,
            reason,
            description: None,
            loc: None,
            suggestions: None,
        });
    }
}

/// Validates hooks usage rules for a function.
pub fn validate_hooks_usage(func: &HirFunction, env: &mut Environment) {
    let unconditional_blocks = compute_unconditional_blocks(func, env.next_block_id_counter);
    let mut errors_by_loc: IndexMap<SourceLocation, CompilerErrorDetail> = IndexMap::new();
    let mut value_kinds: HashMap<IdentifierId, Kind> = HashMap::new();

    // Process params
    for param in &func.params {
        let place = match param {
            ParamPattern::Place(p) => p,
            ParamPattern::Spread(s) => &s.place,
        };
        let kind = get_kind_for_place(place, &value_kinds, &env.identifiers);
        value_kinds.insert(place.identifier, kind);
    }

    // Process blocks
    for (_block_id, block) in &func.body.blocks {
        // Process phis
        for phi in &block.phis {
            let mut kind = if ident_is_hook_name(phi.place.identifier, &env.identifiers) {
                Kind::PotentialHook
            } else {
                Kind::Local
            };
            for (_, operand) in &phi.operands {
                if let Some(&operand_kind) = value_kinds.get(&operand.identifier) {
                    kind = join_kinds(kind, operand_kind);
                }
            }
            value_kinds.insert(phi.place.identifier, kind);
        }

        // Process instructions
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            let lvalue_id = instr.lvalue.identifier;

            match &instr.value {
                InstructionValue::LoadGlobal { .. } => {
                    if get_hook_kind_for_id(lvalue_id, &env.identifiers, &env.types, env).is_some()
                    {
                        value_kinds.insert(lvalue_id, Kind::KnownHook);
                    } else {
                        value_kinds.insert(lvalue_id, Kind::Global);
                    }
                }
                InstructionValue::LoadContext { place, .. }
                | InstructionValue::LoadLocal { place, .. } => {
                    visit_place(place, &value_kinds, &mut errors_by_loc, env);
                    let kind = get_kind_for_place(place, &value_kinds, &env.identifiers);
                    value_kinds.insert(lvalue_id, kind);
                }
                InstructionValue::StoreLocal { lvalue, value, .. }
                | InstructionValue::StoreContext { lvalue, value, .. } => {
                    visit_place(value, &value_kinds, &mut errors_by_loc, env);
                    let kind = join_kinds(
                        get_kind_for_place(value, &value_kinds, &env.identifiers),
                        get_kind_for_place(&lvalue.place, &value_kinds, &env.identifiers),
                    );
                    value_kinds.insert(lvalue.place.identifier, kind);
                    value_kinds.insert(lvalue_id, kind);
                }
                InstructionValue::ComputedLoad { object, .. } => {
                    visit_place(object, &value_kinds, &mut errors_by_loc, env);
                    let kind = get_kind_for_place(object, &value_kinds, &env.identifiers);
                    let lvalue_kind =
                        get_kind_for_place(&instr.lvalue, &value_kinds, &env.identifiers);
                    value_kinds.insert(lvalue_id, join_kinds(lvalue_kind, kind));
                }
                InstructionValue::PropertyLoad {
                    object, property, ..
                } => {
                    let object_kind =
                        get_kind_for_place(object, &value_kinds, &env.identifiers);
                    let is_hook_property = match property {
                        PropertyLiteral::String(s) => is_hook_name(s),
                        PropertyLiteral::Number(_) => false,
                    };
                    let kind = match object_kind {
                        Kind::Error => Kind::Error,
                        Kind::KnownHook => {
                            if is_hook_property {
                                Kind::KnownHook
                            } else {
                                Kind::Local
                            }
                        }
                        Kind::PotentialHook => Kind::PotentialHook,
                        Kind::Global => {
                            if is_hook_property {
                                Kind::KnownHook
                            } else {
                                Kind::Global
                            }
                        }
                        Kind::Local => {
                            if is_hook_property {
                                Kind::PotentialHook
                            } else {
                                Kind::Local
                            }
                        }
                    };
                    value_kinds.insert(lvalue_id, kind);
                }
                InstructionValue::CallExpression { callee, args, .. } => {
                    let callee_kind =
                        get_kind_for_place(callee, &value_kinds, &env.identifiers);
                    let is_hook_callee =
                        callee_kind == Kind::KnownHook || callee_kind == Kind::PotentialHook;
                    if is_hook_callee && !unconditional_blocks.contains(&block.id) {
                        record_conditional_hook_error(
                            callee,
                            &mut value_kinds,
                            &mut errors_by_loc,
                            env,
                        );
                    } else if callee_kind == Kind::PotentialHook {
                        record_dynamic_hook_usage_error(callee, &mut errors_by_loc, env);
                    }
                    // Visit all operands except callee
                    for arg in args {
                        let place = match arg {
                            react_compiler_hir::PlaceOrSpread::Place(p) => p,
                            react_compiler_hir::PlaceOrSpread::Spread(s) => &s.place,
                        };
                        visit_place(place, &value_kinds, &mut errors_by_loc, env);
                    }
                }
                InstructionValue::MethodCall {
                    receiver,
                    property,
                    args,
                    ..
                } => {
                    let callee_kind =
                        get_kind_for_place(property, &value_kinds, &env.identifiers);
                    let is_hook_callee =
                        callee_kind == Kind::KnownHook || callee_kind == Kind::PotentialHook;
                    if is_hook_callee && !unconditional_blocks.contains(&block.id) {
                        record_conditional_hook_error(
                            property,
                            &mut value_kinds,
                            &mut errors_by_loc,
                            env,
                        );
                    } else if callee_kind == Kind::PotentialHook {
                        record_dynamic_hook_usage_error(
                            property,
                            &mut errors_by_loc,
                            env,
                        );
                    }
                    // Visit receiver and args (not property)
                    visit_place(receiver, &value_kinds, &mut errors_by_loc, env);
                    for arg in args {
                        let place = match arg {
                            react_compiler_hir::PlaceOrSpread::Place(p) => p,
                            react_compiler_hir::PlaceOrSpread::Spread(s) => &s.place,
                        };
                        visit_place(place, &value_kinds, &mut errors_by_loc, env);
                    }
                }
                InstructionValue::Destructure { lvalue, value, .. } => {
                    visit_place(value, &value_kinds, &mut errors_by_loc, env);
                    let object_kind =
                        get_kind_for_place(value, &value_kinds, &env.identifiers);
                    for place in each_pattern_places(&lvalue.pattern) {
                        let is_hook_property =
                            ident_is_hook_name(place.identifier, &env.identifiers);
                        let kind = match object_kind {
                            Kind::Error => Kind::Error,
                            Kind::KnownHook => Kind::KnownHook,
                            Kind::PotentialHook => Kind::PotentialHook,
                            Kind::Global => {
                                if is_hook_property {
                                    Kind::KnownHook
                                } else {
                                    Kind::Global
                                }
                            }
                            Kind::Local => {
                                if is_hook_property {
                                    Kind::PotentialHook
                                } else {
                                    Kind::Local
                                }
                            }
                        };
                        value_kinds.insert(place.identifier, kind);
                    }
                }
                InstructionValue::ObjectMethod { lowered_func, .. }
                | InstructionValue::FunctionExpression { lowered_func, .. } => {
                    visit_function_expression(env, lowered_func.func);
                }
                _ => {
                    // For all other instructions: visit operands, set lvalue kind
                    visit_all_operands(
                        &instr.value,
                        &value_kinds,
                        &mut errors_by_loc,
                        env,
                    );
                    let kind =
                        get_kind_for_place(&instr.lvalue, &value_kinds, &env.identifiers);
                    value_kinds.insert(lvalue_id, kind);
                }
            }
        }

        // Visit terminal operands
        for place in each_terminal_operand_places(&block.terminal) {
            visit_place(place, &value_kinds, &mut errors_by_loc, env);
        }
    }

    // Record all accumulated errors (in insertion order, matching TS Map iteration)
    for (_, error_detail) in errors_by_loc {
        env.record_error(error_detail);
    }
}

/// Visit a function expression to check for hook calls inside it.
fn visit_function_expression(env: &mut Environment, func_id: FunctionId) {
    // Collect data we need from the inner function to avoid borrow issues.
    let func = &env.functions[func_id.0 as usize];
    let mut calls: Vec<(IdentifierId, Option<SourceLocation>)> = Vec::new();
    let mut nested_funcs: Vec<FunctionId> = Vec::new();

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::ObjectMethod { lowered_func, .. }
                | InstructionValue::FunctionExpression { lowered_func, .. } => {
                    nested_funcs.push(lowered_func.func);
                }
                InstructionValue::CallExpression { callee, .. } => {
                    calls.push((callee.identifier, callee.loc));
                }
                InstructionValue::MethodCall { property, .. } => {
                    calls.push((property.identifier, property.loc));
                }
                _ => {}
            }
        }
    }

    // Now process calls and nested funcs
    for (identifier_id, loc) in calls {
        let identifier = &env.identifiers[identifier_id.0 as usize];
        let ty = &env.types[identifier.type_.0 as usize];
        let hook_kind = env.get_hook_kind_for_type(ty).cloned();
        if let Some(hook_kind) = hook_kind {
            let description = format!(
                "Cannot call {} within a function expression",
                if hook_kind == HookKind::Custom {
                    "hook"
                } else {
                    hook_kind_display(&hook_kind)
                }
            );
            env.record_error(CompilerErrorDetail {
                category: ErrorCategory::Hooks,
                reason: "Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)".to_string(),
                description: Some(description),
                loc,
                suggestions: None,
            });
        }
    }

    for nested_func_id in nested_funcs {
        visit_function_expression(env, nested_func_id);
    }
}

fn hook_kind_display(kind: &HookKind) -> &'static str {
    match kind {
        HookKind::UseContext => "useContext",
        HookKind::UseState => "useState",
        HookKind::UseActionState => "useActionState",
        HookKind::UseReducer => "useReducer",
        HookKind::UseRef => "useRef",
        HookKind::UseEffect => "useEffect",
        HookKind::UseLayoutEffect => "useLayoutEffect",
        HookKind::UseInsertionEffect => "useInsertionEffect",
        HookKind::UseMemo => "useMemo",
        HookKind::UseCallback => "useCallback",
        HookKind::UseTransition => "useTransition",
        HookKind::UseImperativeHandle => "useImperativeHandle",
        HookKind::UseEffectEvent => "useEffectEvent",
        HookKind::UseOptimistic => "useOptimistic",
        HookKind::Custom => "hook",
    }
}

/// Collect all Place references from a destructure pattern.
fn each_pattern_places(pattern: &Pattern) -> Vec<&Place> {
    let mut places = Vec::new();
    collect_pattern_places(pattern, &mut places);
    places
}

fn collect_pattern_places<'a>(pattern: &'a Pattern, places: &mut Vec<&'a Place>) {
    match pattern {
        Pattern::Array(array) => {
            for item in &array.items {
                match item {
                    ArrayPatternElement::Place(p) => places.push(p),
                    ArrayPatternElement::Spread(s) => places.push(&s.place),
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(object) => {
            for prop in &object.properties {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => places.push(&p.place),
                    ObjectPropertyOrSpread::Spread(s) => places.push(&s.place),
                }
            }
        }
    }
}

/// Visit all operands of an instruction value (generic fallback).
fn visit_all_operands(
    value: &InstructionValue,
    value_kinds: &HashMap<IdentifierId, Kind>,
    errors_by_loc: &mut IndexMap<SourceLocation, CompilerErrorDetail>,
    env: &mut Environment,
) {
    let mut visit = |place: &Place| {
        visit_place(place, value_kinds, errors_by_loc, env);
    };

    match value {
        InstructionValue::BinaryExpression { left, right, .. } => {
            visit(left);
            visit(right);
        }
        InstructionValue::UnaryExpression { value: val, .. } => {
            visit(val);
        }
        InstructionValue::NewExpression { callee, args, .. } => {
            visit(callee);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(p) => visit(p),
                    react_compiler_hir::PlaceOrSpread::Spread(s) => visit(&s.place),
                }
            }
        }
        InstructionValue::TypeCastExpression { value: val, .. } => {
            visit(val);
        }
        InstructionValue::JsxExpression {
            tag,
            props,
            children,
            ..
        } => {
            if let react_compiler_hir::JsxTag::Place(p) = tag {
                visit(p);
            }
            for attr in props {
                match attr {
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                        visit(argument)
                    }
                    react_compiler_hir::JsxAttribute::Attribute { place, .. } => visit(place),
                }
            }
            if let Some(children) = children {
                for child in children {
                    visit(child);
                }
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => {
                        visit(&p.place);
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } = &p.key {
                            visit(name);
                        }
                    }
                    ObjectPropertyOrSpread::Spread(s) => visit(&s.place),
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for elem in elements {
                match elem {
                    react_compiler_hir::ArrayElement::Place(p) => visit(p),
                    react_compiler_hir::ArrayElement::Spread(s) => visit(&s.place),
                    react_compiler_hir::ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for child in children {
                visit(child);
            }
        }
        InstructionValue::PropertyStore {
            object,
            value: val,
            ..
        } => {
            visit(object);
            visit(val);
        }
        InstructionValue::PropertyDelete { object, .. } => {
            visit(object);
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value: val,
            ..
        } => {
            visit(object);
            visit(property);
            visit(val);
        }
        InstructionValue::ComputedDelete {
            object, property, ..
        } => {
            visit(object);
            visit(property);
        }
        InstructionValue::StoreGlobal { value: val, .. } => {
            visit(val);
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            visit(tag);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for place in subexprs {
                visit(place);
            }
        }
        InstructionValue::Await { value: val, .. } => {
            visit(val);
        }
        InstructionValue::GetIterator { collection, .. } => {
            visit(collection);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            visit(iterator);
            visit(collection);
        }
        InstructionValue::NextPropertyOf { value: val, .. } => {
            visit(val);
        }
        InstructionValue::PrefixUpdate { value: val, .. }
        | InstructionValue::PostfixUpdate { value: val, .. } => {
            visit(val);
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            visit(decl);
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps {
                    if let react_compiler_hir::ManualMemoDependencyRoot::NamedLocal {
                        value, ..
                    } = &dep.root
                    {
                        visit(value);
                    }
                }
            }
        }
        // These have no operands or are handled elsewhere
        InstructionValue::DeclareLocal { .. }
        | InstructionValue::DeclareContext { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::JSXText { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::UnsupportedNode { .. } => {}
        // These are handled in the main match
        InstructionValue::LoadLocal { .. }
        | InstructionValue::LoadContext { .. }
        | InstructionValue::StoreLocal { .. }
        | InstructionValue::StoreContext { .. }
        | InstructionValue::ComputedLoad { .. }
        | InstructionValue::PropertyLoad { .. }
        | InstructionValue::CallExpression { .. }
        | InstructionValue::MethodCall { .. }
        | InstructionValue::Destructure { .. }
        | InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. } => {}
    }
}

/// Collect terminal operand places for visiting.
fn each_terminal_operand_places(terminal: &Terminal) -> Vec<&Place> {
    match terminal {
        Terminal::Throw { value, .. } => vec![value],
        Terminal::Return { value, .. } => vec![value],
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => vec![test],
        Terminal::Switch { test, cases, .. } => {
            let mut places = vec![test];
            for case in cases {
                if let Some(ref test_place) = case.test {
                    places.push(test_place);
                }
            }
            places
        }
        Terminal::Try {
            handler_binding, ..
        } => {
            let mut places = Vec::new();
            if let Some(binding) = handler_binding {
                places.push(binding);
            }
            places
        }
        _ => vec![],
    }
}
