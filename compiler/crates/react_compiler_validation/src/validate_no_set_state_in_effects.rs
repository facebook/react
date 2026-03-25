// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Validates against calling setState in the body of an effect (useEffect and friends),
//! while allowing calling setState in callbacks scheduled by the effect.
//!
//! Calling setState during execution of a useEffect triggers a re-render, which is
//! often bad for performance and frequently has more efficient and straightforward
//! alternatives. See https://react.dev/learn/you-might-not-need-an-effect for examples.
//!
//! Port of ValidateNoSetStateInEffects.ts.

use std::collections::{HashMap, HashSet};

use react_compiler_diagnostics::{
    CompilerDiagnostic, CompilerDiagnosticDetail, CompilerError, ErrorCategory,
};
use react_compiler_hir::dominator::{compute_post_dominator_tree, PostDominator};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    is_ref_value_type, is_set_state_type, is_use_effect_event_type, is_use_effect_hook_type,
    is_use_insertion_effect_hook_type, is_use_layout_effect_hook_type, is_use_ref_type,
    BlockId, HirFunction, Identifier, IdentifierId, InstructionValue, PlaceOrSpread,
    PropertyLiteral, SourceLocation, Terminal, Type,
};

pub fn validate_no_set_state_in_effects(
    func: &HirFunction,
    env: &Environment,
) -> Result<CompilerError, CompilerDiagnostic> {
    let identifiers = &env.identifiers;
    let types = &env.types;
    let functions = &env.functions;
    let enable_verbose = env.config.enable_verbose_no_set_state_in_effect;
    let enable_allow_set_state_from_refs = env.config.enable_allow_set_state_from_refs_in_effects;

    // Map from IdentifierId to the Place where the setState originated
    let mut set_state_functions: HashMap<IdentifierId, SetStateInfo> = HashMap::new();
    let mut errors = CompilerError::new();

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::LoadLocal { place, .. } => {
                    if set_state_functions.contains_key(&place.identifier) {
                        let info = set_state_functions[&place.identifier].clone();
                        set_state_functions.insert(instr.lvalue.identifier, info);
                    }
                }
                InstructionValue::StoreLocal { lvalue, value, .. } => {
                    if set_state_functions.contains_key(&value.identifier) {
                        let info = set_state_functions[&value.identifier].clone();
                        set_state_functions.insert(lvalue.place.identifier, info.clone());
                        set_state_functions.insert(instr.lvalue.identifier, info);
                    }
                }
                InstructionValue::FunctionExpression { lowered_func, .. } => {
                    // Check if any context capture references a setState
                    let inner_func = &functions[lowered_func.func.0 as usize];
                    let has_set_state_operand = inner_func.context.iter().any(|ctx_place| {
                        is_set_state_type_by_id(ctx_place.identifier, identifiers, types)
                            || set_state_functions.contains_key(&ctx_place.identifier)
                    });

                    if has_set_state_operand {
                        let callee = get_set_state_call(
                            inner_func,
                            &mut set_state_functions,
                            identifiers,
                            types,
                            functions,
                            enable_allow_set_state_from_refs,
                            env.next_block_id_counter,
                        )?;
                        if let Some(info) = callee {
                            set_state_functions.insert(instr.lvalue.identifier, info);
                        }
                    }
                }
                InstructionValue::MethodCall {
                    property, args, ..
                } => {
                    let prop_type = &types[identifiers[property.identifier.0 as usize].type_.0 as usize];
                    if is_use_effect_event_type(prop_type) {
                        if let Some(first_arg) = args.first() {
                            if let PlaceOrSpread::Place(arg_place) = first_arg {
                                if let Some(info) = set_state_functions.get(&arg_place.identifier) {
                                    set_state_functions
                                        .insert(instr.lvalue.identifier, info.clone());
                                }
                            }
                        }
                    } else if is_use_effect_hook_type(prop_type)
                        || is_use_layout_effect_hook_type(prop_type)
                        || is_use_insertion_effect_hook_type(prop_type)
                    {
                        if let Some(first_arg) = args.first() {
                            if let PlaceOrSpread::Place(arg_place) = first_arg {
                                if let Some(info) =
                                    set_state_functions.get(&arg_place.identifier)
                                {
                                    push_error(&mut errors, info, enable_verbose);
                                }
                            }
                        }
                    }
                }
                InstructionValue::CallExpression { callee, args, .. } => {
                    let callee_type = &types[identifiers[callee.identifier.0 as usize].type_.0 as usize];
                    if is_use_effect_event_type(callee_type) {
                        if let Some(first_arg) = args.first() {
                            if let PlaceOrSpread::Place(arg_place) = first_arg {
                                if let Some(info) = set_state_functions.get(&arg_place.identifier) {
                                    set_state_functions
                                        .insert(instr.lvalue.identifier, info.clone());
                                }
                            }
                        }
                    } else if is_use_effect_hook_type(callee_type)
                        || is_use_layout_effect_hook_type(callee_type)
                        || is_use_insertion_effect_hook_type(callee_type)
                    {
                        if let Some(first_arg) = args.first() {
                            if let PlaceOrSpread::Place(arg_place) = first_arg {
                                if let Some(info) =
                                    set_state_functions.get(&arg_place.identifier)
                                {
                                    push_error(&mut errors, info, enable_verbose);
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }

    Ok(errors)
}

#[derive(Debug, Clone)]
struct SetStateInfo {
    loc: Option<SourceLocation>,
}

fn is_set_state_type_by_id(
    identifier_id: IdentifierId,
    identifiers: &[Identifier],
    types: &[Type],
) -> bool {
    let ident = &identifiers[identifier_id.0 as usize];
    let ty = &types[ident.type_.0 as usize];
    is_set_state_type(ty)
}

fn push_error(errors: &mut CompilerError, info: &SetStateInfo, enable_verbose: bool) {
    if enable_verbose {
        errors.push_diagnostic(
            CompilerDiagnostic::new(
                ErrorCategory::EffectSetState,
                "Calling setState synchronously within an effect can trigger cascading renders",
                Some(
                    "Effects are intended to synchronize state between React and external systems. \
                     Calling setState synchronously causes cascading renders that hurt performance.\n\n\
                     This pattern may indicate one of several issues:\n\n\
                     **1. Non-local derived data**: If the value being set could be computed from props/state \
                     but requires data from a parent component, consider restructuring state ownership so the \
                     derivation can happen during render in the component that owns the relevant state.\n\n\
                     **2. Derived event pattern**: If you're detecting when a prop changes (e.g., `isPlaying` \
                     transitioning from false to true), this often indicates the parent should provide an event \
                     callback (like `onPlay`) instead of just the current state. Request access to the original event.\n\n\
                     **3. Force update / external sync**: If you're forcing a re-render to sync with an external \
                     data source (mutable values outside React), use `useSyncExternalStore` to properly subscribe \
                     to external state changes.\n\n\
                     See: https://react.dev/learn/you-might-not-need-an-effect".to_string(),
                ),
            )
            .with_detail(CompilerDiagnosticDetail::Error {
                loc: info.loc,
                message: Some(
                    "Avoid calling setState() directly within an effect".to_string(),
                ),
            }),
        );
    } else {
        errors.push_diagnostic(
            CompilerDiagnostic::new(
                ErrorCategory::EffectSetState,
                "Calling setState synchronously within an effect can trigger cascading renders",
                Some(
                    "Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. \
                     In general, the body of an effect should do one or both of the following:\n\
                     * Update external systems with the latest state from React.\n\
                     * Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\n\
                     Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. \
                     (https://react.dev/learn/you-might-not-need-an-effect)".to_string(),
                ),
            )
            .with_detail(CompilerDiagnosticDetail::Error {
                loc: info.loc,
                message: Some(
                    "Avoid calling setState() directly within an effect".to_string(),
                ),
            }),
        );
    }
}

/// Recursively collect all Place identifiers from a destructure pattern.
fn collect_destructure_places(
    pattern: &react_compiler_hir::Pattern,
    ref_derived_values: &mut HashSet<IdentifierId>,
) {
    match pattern {
        react_compiler_hir::Pattern::Array(arr) => {
            for item in &arr.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(p) => {
                        ref_derived_values.insert(p.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(s) => {
                        ref_derived_values.insert(s.place.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        ref_derived_values.insert(p.place.identifier);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        ref_derived_values.insert(s.place.identifier);
                    }
                }
            }
        }
    }
}

fn is_derived_from_ref(
    id: IdentifierId,
    ref_derived_values: &HashSet<IdentifierId>,
    identifiers: &[Identifier],
    types: &[Type],
) -> bool {
    if ref_derived_values.contains(&id) {
        return true;
    }
    let ident = &identifiers[id.0 as usize];
    let ty = &types[ident.type_.0 as usize];
    is_use_ref_type(ty) || is_ref_value_type(ty)
}

/// Collects all operand IdentifierIds from an instruction value (simplified version
/// of eachInstructionValueOperand from TS).
fn collect_operands(value: &InstructionValue, func: &HirFunction) -> Vec<IdentifierId> {
    let mut operands = Vec::new();
    match value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            operands.push(place.identifier);
        }
        InstructionValue::StoreLocal { value: v, .. }
        | InstructionValue::StoreContext { value: v, .. } => {
            operands.push(v.identifier);
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::PropertyStore { object, .. }
        | InstructionValue::ComputedLoad { object, .. }
        | InstructionValue::ComputedStore { object, .. } => {
            operands.push(object.identifier);
        }
        InstructionValue::CallExpression { callee, args, .. } => {
            operands.push(callee.identifier);
            for arg in args {
                if let PlaceOrSpread::Place(p) = arg {
                    operands.push(p.identifier);
                }
            }
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            operands.push(receiver.identifier);
            operands.push(property.identifier);
            for arg in args {
                if let PlaceOrSpread::Place(p) = arg {
                    operands.push(p.identifier);
                }
            }
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            operands.push(left.identifier);
            operands.push(right.identifier);
        }
        InstructionValue::UnaryExpression { value: v, .. } => {
            operands.push(v.identifier);
        }
        InstructionValue::Destructure { value: v, .. } => {
            operands.push(v.identifier);
        }
        InstructionValue::FunctionExpression { lowered_func, .. }
        | InstructionValue::ObjectMethod { lowered_func, .. } => {
            let inner_func = &func.instructions; // just need context
            let _ = inner_func;
            // Context captures are operands
            let _inner = &lowered_func.func;
            // We can't easily get context here without the functions array,
            // but the lvalue is what matters for propagation
        }
        _ => {}
    }
    operands
}

// =============================================================================
// Control dominator analysis (port of ControlDominators.ts)
// =============================================================================

/// Computes the post-dominator frontier of `target_id`. These are immediate
/// predecessors of nodes that post-dominate `target_id` from which execution may
/// not reach `target_id`. Intuitively, these are the earliest blocks from which
/// execution branches such that it may or may not reach the target block.
fn post_dominator_frontier(
    func: &HirFunction,
    post_dominators: &PostDominator,
    target_id: BlockId,
) -> HashSet<BlockId> {
    let target_post_dominators = post_dominators_of(func, post_dominators, target_id);
    let mut visited = HashSet::new();
    let mut frontier = HashSet::new();

    // Iterate over the target's post-dominators plus itself
    let mut check_blocks: Vec<BlockId> = target_post_dominators.iter().copied().collect();
    check_blocks.push(target_id);

    for block_id in check_blocks {
        if !visited.insert(block_id) {
            continue;
        }
        let block = &func.body.blocks[&block_id];
        for &pred in &block.preds {
            if !target_post_dominators.contains(&pred) {
                frontier.insert(pred);
            }
        }
    }
    frontier
}

/// Walks up the post-dominator tree to collect all blocks that post-dominate `target_id`.
fn post_dominators_of(
    func: &HirFunction,
    post_dominators: &PostDominator,
    target_id: BlockId,
) -> HashSet<BlockId> {
    let mut result = HashSet::new();
    let mut visited = HashSet::new();
    let mut queue = vec![target_id];

    while let Some(current_id) = queue.pop() {
        if !visited.insert(current_id) {
            continue;
        }
        let block = &func.body.blocks[&current_id];
        for &pred in &block.preds {
            let pred_post_dom = post_dominators.get(pred).unwrap_or(pred);
            if pred_post_dom == target_id || result.contains(&pred_post_dom) {
                result.insert(pred);
            }
            queue.push(pred);
        }
    }
    result
}

/// Creates a function that checks whether a block is "control-dominated" by
/// a ref-derived condition. A block is ref-controlled if its post-dominator
/// frontier contains a block whose terminal tests a ref-derived value.
fn create_ref_controlled_block_checker(
    func: &HirFunction,
    next_block_id_counter: u32,
    ref_derived_values: &HashSet<IdentifierId>,
    identifiers: &[Identifier],
    types: &[Type],
) -> Result<HashMap<BlockId, bool>, CompilerDiagnostic> {
    let post_dominators = compute_post_dominator_tree(func, next_block_id_counter, false)?;
    let mut cache: HashMap<BlockId, bool> = HashMap::new();

    for (block_id, _block) in &func.body.blocks {
        let frontier = post_dominator_frontier(func, &post_dominators, *block_id);
        let mut is_controlled = false;

        for frontier_block_id in &frontier {
            let control_block = &func.body.blocks[frontier_block_id];
            match &control_block.terminal {
                Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
                    if is_derived_from_ref(
                        test.identifier,
                        ref_derived_values,
                        identifiers,
                        types,
                    ) {
                        is_controlled = true;
                        break;
                    }
                }
                Terminal::Switch { test, cases, .. } => {
                    if is_derived_from_ref(
                        test.identifier,
                        ref_derived_values,
                        identifiers,
                        types,
                    ) {
                        is_controlled = true;
                        break;
                    }
                    for case in cases {
                        if let Some(case_test) = &case.test {
                            if is_derived_from_ref(
                                case_test.identifier,
                                ref_derived_values,
                                identifiers,
                                types,
                            ) {
                                is_controlled = true;
                                break;
                            }
                        }
                    }
                    if is_controlled {
                        break;
                    }
                }
                _ => {}
            }
        }

        cache.insert(*block_id, is_controlled);
    }

    Ok(cache)
}

/// Checks inner function body for direct setState calls. Returns the callee Place info
/// if a setState call is found in the function body.
/// Tracks ref-derived values to allow setState when the value being set comes from a ref.
fn get_set_state_call(
    func: &HirFunction,
    set_state_functions: &mut HashMap<IdentifierId, SetStateInfo>,
    identifiers: &[Identifier],
    types: &[Type],
    _functions: &[HirFunction],
    enable_allow_set_state_from_refs: bool,
    next_block_id_counter: u32,
) -> Result<Option<SetStateInfo>, CompilerDiagnostic> {
    let mut ref_derived_values: HashSet<IdentifierId> = HashSet::new();

    // First pass: collect ref-derived values (needed before building control dominator checker)
    // We do a pre-pass to seed ref_derived_values so the control dominator checker has them.
    if enable_allow_set_state_from_refs {
        for (_block_id, block) in &func.body.blocks {
            for phi in &block.phis {
                let is_phi_derived = phi.operands.values().any(|operand| {
                    is_derived_from_ref(
                        operand.identifier,
                        &ref_derived_values,
                        identifiers,
                        types,
                    )
                });
                if is_phi_derived {
                    ref_derived_values.insert(phi.place.identifier);
                }
            }

            for &instr_id in &block.instructions {
                let instr = &func.instructions[instr_id.0 as usize];

                let operands = collect_operands(&instr.value, func);
                let has_ref_operand = operands.iter().any(|op_id| {
                    is_derived_from_ref(*op_id, &ref_derived_values, identifiers, types)
                });

                if has_ref_operand {
                    ref_derived_values.insert(instr.lvalue.identifier);
                    if let InstructionValue::Destructure { lvalue, .. } = &instr.value {
                        collect_destructure_places(&lvalue.pattern, &mut ref_derived_values);
                    }
                    if let InstructionValue::StoreLocal { lvalue, .. } = &instr.value {
                        ref_derived_values.insert(lvalue.place.identifier);
                    }
                }

                if let InstructionValue::PropertyLoad {
                    object, property, ..
                } = &instr.value
                {
                    if *property == PropertyLiteral::String("current".to_string()) {
                        let obj_ident = &identifiers[object.identifier.0 as usize];
                        let obj_ty = &types[obj_ident.type_.0 as usize];
                        if is_use_ref_type(obj_ty) || is_ref_value_type(obj_ty) {
                            ref_derived_values.insert(instr.lvalue.identifier);
                        }
                    }
                }
            }
        }
    }

    // Build control dominator checker after collecting ref-derived values
    let ref_controlled_blocks = if enable_allow_set_state_from_refs {
        create_ref_controlled_block_checker(
            func,
            next_block_id_counter,
            &ref_derived_values,
            identifiers,
            types,
        )?
    } else {
        HashMap::new()
    };

    let is_ref_controlled_block = |block_id: BlockId| -> bool {
        ref_controlled_blocks.get(&block_id).copied().unwrap_or(false)
    };

    // Reset and redo: second pass with control dominator info available
    ref_derived_values.clear();

    for (_block_id, block) in &func.body.blocks {
        // Track ref-derived values through phis
        if enable_allow_set_state_from_refs {
            for phi in &block.phis {
                if is_derived_from_ref(
                    phi.place.identifier,
                    &ref_derived_values,
                    identifiers,
                    types,
                ) {
                    continue;
                }
                let is_phi_derived = phi.operands.values().any(|operand| {
                    is_derived_from_ref(
                        operand.identifier,
                        &ref_derived_values,
                        identifiers,
                        types,
                    )
                });
                if is_phi_derived {
                    ref_derived_values.insert(phi.place.identifier);
                } else {
                    // Fallback: check if any predecessor block is ref-controlled
                    let mut found = false;
                    for pred in phi.operands.keys() {
                        if is_ref_controlled_block(*pred) {
                            ref_derived_values.insert(phi.place.identifier);
                            found = true;
                            break;
                        }
                    }
                    if found {
                        continue;
                    }
                }
            }
        }

        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];

            // Track ref-derived values through instructions
            if enable_allow_set_state_from_refs {
                let operands = collect_operands(&instr.value, func);
                let has_ref_operand = operands.iter().any(|op_id| {
                    is_derived_from_ref(*op_id, &ref_derived_values, identifiers, types)
                });

                if has_ref_operand {
                    ref_derived_values.insert(instr.lvalue.identifier);
                    // For Destructure, also mark all pattern places as ref-derived
                    if let InstructionValue::Destructure { lvalue, .. } = &instr.value {
                        collect_destructure_places(&lvalue.pattern, &mut ref_derived_values);
                    }
                    // For StoreLocal, propagate to the local variable
                    if let InstructionValue::StoreLocal { lvalue, .. } = &instr.value {
                        ref_derived_values.insert(lvalue.place.identifier);
                    }
                }

                // Special case: PropertyLoad of .current on ref/refValue
                if let InstructionValue::PropertyLoad {
                    object, property, ..
                } = &instr.value
                {
                    if *property == PropertyLiteral::String("current".to_string()) {
                        let obj_ident = &identifiers[object.identifier.0 as usize];
                        let obj_ty = &types[obj_ident.type_.0 as usize];
                        if is_use_ref_type(obj_ty) || is_ref_value_type(obj_ty) {
                            ref_derived_values.insert(instr.lvalue.identifier);
                        }
                    }
                }
            }

            match &instr.value {
                InstructionValue::LoadLocal { place, .. } => {
                    if set_state_functions.contains_key(&place.identifier) {
                        let info = set_state_functions[&place.identifier].clone();
                        set_state_functions.insert(instr.lvalue.identifier, info);
                    }
                }
                InstructionValue::StoreLocal { lvalue, value, .. } => {
                    if set_state_functions.contains_key(&value.identifier) {
                        let info = set_state_functions[&value.identifier].clone();
                        set_state_functions.insert(lvalue.place.identifier, info.clone());
                        set_state_functions.insert(instr.lvalue.identifier, info);
                    }
                }
                InstructionValue::CallExpression { callee, args, .. } => {
                    if is_set_state_type_by_id(callee.identifier, identifiers, types)
                        || set_state_functions.contains_key(&callee.identifier)
                    {
                        if enable_allow_set_state_from_refs {
                            // Check if the first argument is ref-derived
                            if let Some(first_arg) = args.first() {
                                if let PlaceOrSpread::Place(arg_place) = first_arg {
                                    if is_derived_from_ref(
                                        arg_place.identifier,
                                        &ref_derived_values,
                                        identifiers,
                                        types,
                                    ) {
                                        // Allow setState when value is derived from ref
                                        return Ok(None);
                                    }
                                }
                            }
                            // Check if the current block is controlled by a ref-derived condition
                            if is_ref_controlled_block(block.id) {
                                continue;
                            }
                        }
                        return Ok(Some(SetStateInfo { loc: callee.loc }));
                    }
                }
                _ => {}
            }
        }
    }
    Ok(None)
}
