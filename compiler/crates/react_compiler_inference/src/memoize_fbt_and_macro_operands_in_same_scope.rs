// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Port of MemoizeFbtAndMacroOperandsInSameScope from TypeScript.
//!
//! Ensures that FBT (Facebook Translation) expressions and their operands
//! are memoized within the same reactive scope. Also supports user-configured
//! custom macro-like APIs via `customMacros` configuration.
//!
//! The pass has two phases:
//! 1. Forward data-flow: identify all macro tags (including property loads like `fbt.param`)
//! 2. Reverse data-flow: merge arguments of macro invocations into the same scope

use std::collections::{HashMap, HashSet};

use react_compiler_hir::{
    HirFunction, IdentifierId, InstructionValue, JsxTag, Place,
    PlaceOrSpread, PrimitiveValue, PropertyLiteral, ScopeId,
};
use react_compiler_hir::environment::Environment;

/// Whether a macro requires its arguments to be transitively inlined (e.g., fbt)
/// or just avoids having the top-level values be converted to variables (e.g., fbt.param).
#[derive(Debug, Clone)]
enum InlineLevel {
    Transitive,
    Shallow,
}

/// Defines how a macro and its properties should be handled.
#[derive(Debug, Clone)]
struct MacroDefinition {
    level: InlineLevel,
    /// Maps property names to their own MacroDefinition. `"*"` is a wildcard.
    properties: Option<HashMap<String, MacroDefinition>>,
}

fn shallow_macro() -> MacroDefinition {
    MacroDefinition {
        level: InlineLevel::Shallow,
        properties: None,
    }
}

fn transitive_macro() -> MacroDefinition {
    MacroDefinition {
        level: InlineLevel::Transitive,
        properties: None,
    }
}

fn fbt_macro() -> MacroDefinition {
    let mut props = HashMap::new();
    props.insert("*".to_string(), shallow_macro());
    // fbt.enum gets FBT_MACRO (recursive/transitive)
    // We'll fill this in after construction since it's self-referential.
    // Instead, we use a special marker and handle it in property lookup.
    let mut fbt = MacroDefinition {
        level: InlineLevel::Transitive,
        properties: Some(props),
    };
    // Add "enum" as a recursive reference (same as FBT_MACRO)
    // Since we can't do self-referential structs, we clone the structure.
    let enum_macro = MacroDefinition {
        level: InlineLevel::Transitive,
        properties: Some({
            let mut p = HashMap::new();
            p.insert("*".to_string(), shallow_macro());
            // enum's enum is also recursive, but in practice the depth is bounded
            p.insert("enum".to_string(), transitive_macro());
            p
        }),
    };
    fbt.properties.as_mut().unwrap().insert("enum".to_string(), enum_macro);
    fbt
}

/// Built-in FBT tags and their macro definitions.
fn fbt_tags() -> HashMap<String, MacroDefinition> {
    let mut tags = HashMap::new();
    tags.insert("fbt".to_string(), fbt_macro());
    tags.insert("fbt:param".to_string(), shallow_macro());
    tags.insert("fbt:enum".to_string(), fbt_macro());
    tags.insert("fbt:plural".to_string(), shallow_macro());
    tags.insert("fbs".to_string(), fbt_macro());
    tags.insert("fbs:param".to_string(), shallow_macro());
    tags.insert("fbs:enum".to_string(), fbt_macro());
    tags.insert("fbs:plural".to_string(), shallow_macro());
    tags
}

/// Main entry point. Returns the set of identifier IDs that are fbt/macro operands.
pub fn memoize_fbt_and_macro_operands_in_same_scope(
    func: &HirFunction,
    env: &mut Environment,
) -> HashSet<IdentifierId> {
    // Phase 1: Build macro kinds map from built-in FBT tags + custom macros
    let mut macro_kinds: HashMap<String, MacroDefinition> = fbt_tags();
    if let Some(ref custom_macros) = env.config.custom_macros {
        for name in custom_macros {
            macro_kinds.insert(name.clone(), transitive_macro());
        }
    }

    // Phase 2: Forward data-flow to identify all macro tags
    let mut macro_tags = populate_macro_tags(func, &macro_kinds);

    // Phase 3: Reverse data-flow to merge arguments of macro invocations
    let macro_values = merge_macro_arguments(func, env, &mut macro_tags, &macro_kinds);

    macro_values
}

/// Forward data-flow analysis to identify all macro tags, including
/// things like `fbt.foo.bar(...)`.
fn populate_macro_tags(
    func: &HirFunction,
    macro_kinds: &HashMap<String, MacroDefinition>,
) -> HashMap<IdentifierId, MacroDefinition> {
    let mut macro_tags: HashMap<IdentifierId, MacroDefinition> = HashMap::new();

    for block in func.body.blocks.values() {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            let lvalue_id = instr.lvalue.identifier;

            match &instr.value {
                InstructionValue::Primitive {
                    value: PrimitiveValue::String(s),
                    ..
                } => {
                    if let Some(macro_def) = macro_kinds.get(s.as_str()) {
                        // We don't distinguish between tag names and strings, so record
                        // all `fbt` string literals in case they are used as a jsx tag.
                        macro_tags.insert(lvalue_id, macro_def.clone());
                    }
                }
                InstructionValue::LoadGlobal { binding, .. } => {
                    let name = binding.name();
                    if let Some(macro_def) = macro_kinds.get(name) {
                        macro_tags.insert(lvalue_id, macro_def.clone());
                    }
                }
                InstructionValue::PropertyLoad {
                    object, property, ..
                } => {
                    if let PropertyLiteral::String(prop_name) = property {
                        if let Some(macro_def) = macro_tags.get(&object.identifier).cloned() {
                            let property_macro = if let Some(ref props) = macro_def.properties {
                                let prop_def = props
                                    .get(prop_name.as_str())
                                    .or_else(|| props.get("*"));
                                match prop_def {
                                    Some(def) => def.clone(),
                                    None => macro_def.clone(),
                                }
                            } else {
                                macro_def.clone()
                            };
                            macro_tags.insert(lvalue_id, property_macro);
                        }
                    }
                }
                _ => {}
            }
        }
    }

    macro_tags
}

/// Reverse data-flow analysis to merge arguments to macro *invocations*
/// based on the kind of the macro.
fn merge_macro_arguments(
    func: &HirFunction,
    env: &mut Environment,
    macro_tags: &mut HashMap<IdentifierId, MacroDefinition>,
    macro_kinds: &HashMap<String, MacroDefinition>,
) -> HashSet<IdentifierId> {
    let mut macro_values: HashSet<IdentifierId> = macro_tags.keys().copied().collect();

    // Iterate blocks in reverse order
    let block_ids: Vec<_> = func.body.blocks.keys().copied().collect();
    for &block_id in block_ids.iter().rev() {
        let block = &func.body.blocks[&block_id];

        // Iterate instructions in reverse order
        for &instr_id in block.instructions.iter().rev() {
            let instr = &func.instructions[instr_id.0 as usize];
            let lvalue_id = instr.lvalue.identifier;

            match &instr.value {
                // Instructions that never need to be merged
                InstructionValue::DeclareContext { .. }
                | InstructionValue::DeclareLocal { .. }
                | InstructionValue::Destructure { .. }
                | InstructionValue::LoadContext { .. }
                | InstructionValue::LoadLocal { .. }
                | InstructionValue::PostfixUpdate { .. }
                | InstructionValue::PrefixUpdate { .. }
                | InstructionValue::StoreContext { .. }
                | InstructionValue::StoreLocal { .. } => {
                    // Skip these
                }

                InstructionValue::CallExpression { callee, args, .. } => {
                    let scope_id = match env.identifiers[lvalue_id.0 as usize].scope {
                        Some(s) => s,
                        None => continue,
                    };

                    // For CallExpression, callee is the function being called
                    let macro_def = macro_tags
                        .get(&callee.identifier)
                        .or_else(|| macro_tags.get(&lvalue_id))
                        .cloned();

                    if let Some(macro_def) = macro_def {
                        visit_operands_call(
                            &macro_def,
                            scope_id,
                            lvalue_id,
                            callee,
                            args,
                            env,
                            &mut macro_values,
                            macro_tags,
                        );
                    }
                }

                InstructionValue::MethodCall {
                    receiver,
                    property,
                    args,
                    ..
                } => {
                    let scope_id = match env.identifiers[lvalue_id.0 as usize].scope {
                        Some(s) => s,
                        None => continue,
                    };

                    // For MethodCall, property is the callee
                    let macro_def = macro_tags
                        .get(&property.identifier)
                        .or_else(|| macro_tags.get(&lvalue_id))
                        .cloned();

                    if let Some(macro_def) = macro_def {
                        visit_operands_method(
                            &macro_def,
                            scope_id,
                            lvalue_id,
                            receiver,
                            property,
                            args,
                            env,
                            &mut macro_values,
                            macro_tags,
                        );
                    }
                }

                InstructionValue::JsxExpression { tag, .. } => {
                    let scope_id = match env.identifiers[lvalue_id.0 as usize].scope {
                        Some(s) => s,
                        None => continue,
                    };

                    let macro_def = match tag {
                        JsxTag::Place(place) => {
                            macro_tags.get(&place.identifier).cloned()
                        }
                        JsxTag::Builtin(builtin) => {
                            macro_kinds.get(builtin.name.as_str()).cloned()
                        }
                    };

                    let macro_def = macro_def
                        .or_else(|| macro_tags.get(&lvalue_id).cloned());

                    if let Some(macro_def) = macro_def {
                        visit_operands_value(
                            &macro_def,
                            scope_id,
                            lvalue_id,
                            &instr.value,
                            env,
                            &mut macro_values,
                            macro_tags,
                        );
                    }
                }

                // Default case: check if lvalue is a macro tag
                _ => {
                    let scope_id = match env.identifiers[lvalue_id.0 as usize].scope {
                        Some(s) => s,
                        None => continue,
                    };

                    let macro_def = macro_tags.get(&lvalue_id).cloned();
                    if let Some(macro_def) = macro_def {
                        visit_operands_value(
                            &macro_def,
                            scope_id,
                            lvalue_id,
                            &instr.value,
                            env,
                            &mut macro_values,
                            macro_tags,
                        );
                    }
                }
            }
        }

        // Handle phis
        let block = &func.body.blocks[&block_id];
        for phi in &block.phis {
            let scope_id = match env.identifiers[phi.place.identifier.0 as usize].scope {
                Some(s) => s,
                None => continue,
            };

            let macro_def = match macro_tags.get(&phi.place.identifier).cloned() {
                Some(def) => def,
                None => continue,
            };

            if matches!(macro_def.level, InlineLevel::Shallow) {
                continue;
            }

            macro_values.insert(phi.place.identifier);

            // Collect operand updates to avoid borrow issues
            let operand_updates: Vec<(IdentifierId, MacroDefinition)> = phi
                .operands
                .values()
                .map(|operand| (operand.identifier, macro_def.clone()))
                .collect();

            for (operand_id, def) in operand_updates {
                env.identifiers[operand_id.0 as usize].scope = Some(scope_id);
                expand_fbt_scope_range_on_env(env, scope_id, operand_id);
                macro_tags.insert(operand_id, def);
                macro_values.insert(operand_id);
            }
        }
    }

    macro_values
}

/// Expand the scope range on the environment, reading from identifier's mutable_range.
/// Equivalent to TS `expandFbtScopeRange`.
fn expand_fbt_scope_range_on_env(env: &mut Environment, scope_id: ScopeId, operand_id: IdentifierId) {
    let extend_start = env.identifiers[operand_id.0 as usize].mutable_range.start;
    if extend_start.0 != 0 {
        let scope = &mut env.scopes[scope_id.0 as usize];
        scope.range.start.0 = scope.range.start.0.min(extend_start.0);
    }
}

/// Visit operands for a CallExpression.
fn visit_operands_call(
    macro_def: &MacroDefinition,
    scope_id: ScopeId,
    lvalue_id: IdentifierId,
    callee: &Place,
    args: &[PlaceOrSpread],
    env: &mut Environment,
    macro_values: &mut HashSet<IdentifierId>,
    macro_tags: &mut HashMap<IdentifierId, MacroDefinition>,
) {
    macro_values.insert(lvalue_id);

    // Process callee
    process_operand(macro_def, scope_id, callee.identifier, env, macro_values, macro_tags);

    // Process args
    for arg in args {
        let operand_id = match arg {
            PlaceOrSpread::Place(p) => p.identifier,
            PlaceOrSpread::Spread(s) => s.place.identifier,
        };
        process_operand(macro_def, scope_id, operand_id, env, macro_values, macro_tags);
    }
}

/// Visit operands for a MethodCall.
fn visit_operands_method(
    macro_def: &MacroDefinition,
    scope_id: ScopeId,
    lvalue_id: IdentifierId,
    receiver: &Place,
    property: &Place,
    args: &[PlaceOrSpread],
    env: &mut Environment,
    macro_values: &mut HashSet<IdentifierId>,
    macro_tags: &mut HashMap<IdentifierId, MacroDefinition>,
) {
    macro_values.insert(lvalue_id);

    // Process receiver, property, and args
    process_operand(macro_def, scope_id, receiver.identifier, env, macro_values, macro_tags);
    process_operand(macro_def, scope_id, property.identifier, env, macro_values, macro_tags);

    for arg in args {
        let operand_id = match arg {
            PlaceOrSpread::Place(p) => p.identifier,
            PlaceOrSpread::Spread(s) => s.place.identifier,
        };
        process_operand(macro_def, scope_id, operand_id, env, macro_values, macro_tags);
    }
}

/// Visit operands for a generic InstructionValue using each_instruction_value_operand logic.
fn visit_operands_value(
    macro_def: &MacroDefinition,
    scope_id: ScopeId,
    lvalue_id: IdentifierId,
    value: &InstructionValue,
    env: &mut Environment,
    macro_values: &mut HashSet<IdentifierId>,
    macro_tags: &mut HashMap<IdentifierId, MacroDefinition>,
) {
    macro_values.insert(lvalue_id);

    let operand_ids = collect_instruction_value_operand_ids(value, env);
    for operand_id in operand_ids {
        process_operand(macro_def, scope_id, operand_id, env, macro_values, macro_tags);
    }
}

/// Process a single operand: if transitive, merge its scope; always add to macro_values.
fn process_operand(
    macro_def: &MacroDefinition,
    scope_id: ScopeId,
    operand_id: IdentifierId,
    env: &mut Environment,
    macro_values: &mut HashSet<IdentifierId>,
    macro_tags: &mut HashMap<IdentifierId, MacroDefinition>,
) {
    if matches!(macro_def.level, InlineLevel::Transitive) {
        env.identifiers[operand_id.0 as usize].scope = Some(scope_id);
        expand_fbt_scope_range_on_env(env, scope_id, operand_id);
        macro_tags.insert(operand_id, macro_def.clone());
    }
    macro_values.insert(operand_id);
}

/// Collect all operand IdentifierIds from an InstructionValue.
/// This mirrors the TS `eachInstructionValueOperand` function.
fn collect_instruction_value_operand_ids(
    value: &InstructionValue,
    env: &Environment,
) -> Vec<IdentifierId> {
    let mut result = Vec::new();
    match value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            result.push(place.identifier);
        }
        InstructionValue::StoreLocal { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::StoreContext { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::Destructure { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            result.push(left.identifier);
            result.push(right.identifier);
        }
        InstructionValue::NewExpression { callee, args, .. }
        | InstructionValue::CallExpression { callee, args, .. } => {
            result.push(callee.identifier);
            for arg in args {
                match arg {
                    PlaceOrSpread::Place(p) => result.push(p.identifier),
                    PlaceOrSpread::Spread(s) => result.push(s.place.identifier),
                }
            }
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            result.push(receiver.identifier);
            result.push(property.identifier);
            for arg in args {
                match arg {
                    PlaceOrSpread::Place(p) => result.push(p.identifier),
                    PlaceOrSpread::Spread(s) => result.push(s.place.identifier),
                }
            }
        }
        InstructionValue::UnaryExpression { value, .. }
        | InstructionValue::TypeCastExpression { value, .. }
        | InstructionValue::Await { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::JsxExpression {
            tag,
            props,
            children,
            ..
        } => {
            if let JsxTag::Place(p) = tag {
                result.push(p.identifier);
            }
            for prop in props {
                match prop {
                    react_compiler_hir::JsxAttribute::Attribute { place, .. } => {
                        result.push(place.identifier);
                    }
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                        result.push(argument.identifier);
                    }
                }
            }
            if let Some(ch) = children {
                for c in ch {
                    result.push(c.identifier);
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for c in children {
                result.push(c.identifier);
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        result.push(p.place.identifier);
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } = &p.key {
                            result.push(name.identifier);
                        }
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        result.push(s.place.identifier);
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for el in elements {
                match el {
                    react_compiler_hir::ArrayElement::Place(p) => result.push(p.identifier),
                    react_compiler_hir::ArrayElement::Spread(s) => result.push(s.place.identifier),
                    react_compiler_hir::ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::PropertyLoad { object, .. } => {
            result.push(object.identifier);
        }
        InstructionValue::PropertyStore { object, value, .. } => {
            result.push(object.identifier);
            result.push(value.identifier);
        }
        InstructionValue::PropertyDelete { object, .. } => {
            result.push(object.identifier);
        }
        InstructionValue::ComputedLoad {
            object, property, ..
        } => {
            result.push(object.identifier);
            result.push(property.identifier);
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value,
            ..
        } => {
            result.push(object.identifier);
            result.push(property.identifier);
            result.push(value.identifier);
        }
        InstructionValue::ComputedDelete {
            object, property, ..
        } => {
            result.push(object.identifier);
            result.push(property.identifier);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for s in subexprs {
                result.push(s.identifier);
            }
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            result.push(tag.identifier);
        }
        InstructionValue::FunctionExpression { lowered_func, .. }
        | InstructionValue::ObjectMethod { lowered_func, .. } => {
            // Inner function captures — iterate context of the lowered function
            let inner_func = &env.functions[lowered_func.func.0 as usize];
            for ctx in &inner_func.context {
                result.push(ctx.identifier);
            }
        }
        InstructionValue::GetIterator { collection, .. } => {
            result.push(collection.identifier);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            result.push(iterator.identifier);
            result.push(collection.identifier);
        }
        InstructionValue::NextPropertyOf { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::StoreGlobal { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::PrefixUpdate { lvalue, value, .. }
        | InstructionValue::PostfixUpdate { lvalue, value, .. } => {
            result.push(lvalue.identifier);
            result.push(value.identifier);
        }
        // These have no operands
        InstructionValue::DeclareLocal { .. }
        | InstructionValue::DeclareContext { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::JSXText { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::UnsupportedNode { .. }
        | InstructionValue::StartMemoize { .. }
        | InstructionValue::FinishMemoize { .. } => {}
    }
    result
}
