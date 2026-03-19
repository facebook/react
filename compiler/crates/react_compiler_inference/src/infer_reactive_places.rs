// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Infers which `Place`s are reactive.
//!
//! Ported from TypeScript `src/Inference/InferReactivePlaces.ts`.
//!
//! A place is reactive if it derives from any source of reactivity:
//! 1. Props (component parameters may change between renders)
//! 2. Hooks (can access state or context)
//! 3. `use` operator (can access context)
//! 4. Mutation with reactive operands
//! 5. Conditional assignment based on reactive control flow

use std::collections::{HashMap, HashSet, VecDeque};

use react_compiler_hir::environment::Environment;
use react_compiler_hir::object_shape::HookKind;
use react_compiler_hir::{
    BlockId, Effect, FunctionId, HirFunction, IdentifierId,
    InstructionValue, JsxAttribute, JsxTag, ParamPattern,
    Place, PlaceOrSpread, Terminal, Type,
};

use crate::infer_reactive_scope_variables::{
    find_disjoint_mutable_values, is_mutable, DisjointSet,
};

// =============================================================================
// Public API
// =============================================================================

/// Infer which places in a function are reactive.
///
/// Corresponds to TS `inferReactivePlaces(fn: HIRFunction): void`.
pub fn infer_reactive_places(func: &mut HirFunction, env: &mut Environment) {
    let mut aliased_identifiers = find_disjoint_mutable_values(func, env);
    let mut reactive_map = ReactivityMap::new(&mut aliased_identifiers);
    let mut stable_sidemap = StableSidemap::new();

    // Mark all function parameters as reactive
    for param in &func.params {
        let place = match param {
            ParamPattern::Place(p) => p,
            ParamPattern::Spread(s) => &s.place,
        };
        reactive_map.mark_reactive(place.identifier);
    }

    // Compute control dominators
    let post_dominators =
        react_compiler_hir::dominator::compute_post_dominator_tree(
            func,
            env.next_block_id_counter,
            false,
        );

    // Fixpoint iteration
    loop {
        for (_block_id, block) in &func.body.blocks {
            let has_reactive_control = is_reactive_controlled_block(
                block.id,
                func,
                &post_dominators,
                &mut reactive_map,
            );

            // Process phi nodes
            for phi in &block.phis {
                if reactive_map.is_reactive(phi.place.identifier) {
                    continue;
                }
                let mut is_phi_reactive = false;
                for (_pred, operand) in &phi.operands {
                    if reactive_map.is_reactive(operand.identifier) {
                        is_phi_reactive = true;
                        break;
                    }
                }
                if is_phi_reactive {
                    reactive_map.mark_reactive(phi.place.identifier);
                } else {
                    for (pred, _operand) in &phi.operands {
                        if is_reactive_controlled_block(
                            *pred,
                            func,
                            &post_dominators,
                            &mut reactive_map,
                        ) {
                            reactive_map.mark_reactive(phi.place.identifier);
                            break;
                        }
                    }
                }
            }

            // Process instructions
            for instr_id in &block.instructions {
                let instr = &func.instructions[instr_id.0 as usize];

                // Handle stable identifier sources
                stable_sidemap.handle_instruction(instr, env);

                let value = &instr.value;

                // Check if any operand is reactive
                let mut has_reactive_input = false;
                let operands = each_instruction_value_operand_ids(value, env);
                for &op_id in &operands {
                    let reactive = reactive_map.is_reactive(op_id);
                    has_reactive_input = has_reactive_input || reactive;
                }

                // Hooks and `use` operator are sources of reactivity
                match value {
                    InstructionValue::CallExpression { callee, .. } => {
                        let callee_ty = &env.types
                            [env.identifiers[callee.identifier.0 as usize].type_.0 as usize];
                        if get_hook_kind_for_type(env, callee_ty).is_some()
                            || is_use_operator_type(callee_ty)
                        {
                            has_reactive_input = true;
                        }
                    }
                    InstructionValue::MethodCall { property, .. } => {
                        let property_ty = &env.types
                            [env.identifiers[property.identifier.0 as usize].type_.0 as usize];
                        if get_hook_kind_for_type(env, property_ty).is_some()
                            || is_use_operator_type(property_ty)
                        {
                            has_reactive_input = true;
                        }
                    }
                    _ => {}
                }

                if has_reactive_input {
                    // Mark lvalues reactive (unless stable)
                    let lvalue_ids = each_instruction_lvalue_ids(instr, env);
                    for lvalue_id in lvalue_ids {
                        if stable_sidemap.is_stable(lvalue_id) {
                            continue;
                        }
                        reactive_map.mark_reactive(lvalue_id);
                    }
                }

                if has_reactive_input || has_reactive_control {
                    // Mark mutable operands reactive
                    let operand_places =
                        each_instruction_value_operand_places(value, env);
                    for op_place in &operand_places {
                        match op_place.effect {
                            Effect::Capture
                            | Effect::Store
                            | Effect::ConditionallyMutate
                            | Effect::ConditionallyMutateIterator
                            | Effect::Mutate => {
                                let op_range = &env.identifiers
                                    [op_place.identifier.0 as usize]
                                    .mutable_range;
                                if is_mutable(instr.id, op_range) {
                                    reactive_map.mark_reactive(op_place.identifier);
                                }
                            }
                            Effect::Freeze | Effect::Read => {
                                // no-op
                            }
                            Effect::Unknown => {
                                panic!(
                                    "Unexpected unknown effect at {:?}",
                                    op_place.loc
                                );
                            }
                        }
                    }
                }
            }

            // Process terminal operands (just to mark them reactive for output)
            let terminal_op_ids = each_terminal_operand_ids(&block.terminal);
            for op_id in terminal_op_ids {
                reactive_map.is_reactive(op_id);
            }
        }

        if !reactive_map.snapshot() {
            break;
        }
    }

    // Propagate reactivity to inner functions (read-only phase, just queries reactive_map)
    propagate_reactivity_to_inner_functions_outer(func, env, &mut reactive_map);

    // Now apply reactive flags by replaying the traversal pattern.
    // In TS, place.reactive is set as a side effect of isReactive() and markReactive().
    // We need to set reactive=true on exactly the same place occurrences.
    apply_reactive_flags_replay(func, env, &mut reactive_map, &mut stable_sidemap);
}

// =============================================================================
// ReactivityMap
// =============================================================================

struct ReactivityMap<'a> {
    has_changes: bool,
    reactive: HashSet<IdentifierId>,
    aliased_identifiers: &'a mut DisjointSet,
}

impl<'a> ReactivityMap<'a> {
    fn new(aliased_identifiers: &'a mut DisjointSet) -> Self {
        ReactivityMap {
            has_changes: false,
            reactive: HashSet::new(),
            aliased_identifiers,
        }
    }

    fn is_reactive(&mut self, id: IdentifierId) -> bool {
        let canonical = self.aliased_identifiers.find(id);
        self.reactive.contains(&canonical)
    }

    fn mark_reactive(&mut self, id: IdentifierId) {
        let canonical = self.aliased_identifiers.find(id);
        if self.reactive.insert(canonical) {
            self.has_changes = true;
        }
    }

    /// Reset change tracking, returns true if there were changes.
    fn snapshot(&mut self) -> bool {
        let had_changes = self.has_changes;
        self.has_changes = false;
        had_changes
    }
}

// =============================================================================
// StableSidemap
// =============================================================================

struct StableSidemap {
    map: HashMap<IdentifierId, bool>, // true = stable, false = container (not yet stable)
}

impl StableSidemap {
    fn new() -> Self {
        StableSidemap {
            map: HashMap::new(),
        }
    }

    fn handle_instruction(
        &mut self,
        instr: &react_compiler_hir::Instruction,
        env: &Environment,
    ) {
        let lvalue_id = instr.lvalue.identifier;
        let value = &instr.value;

        match value {
            InstructionValue::CallExpression { callee, .. } => {
                let callee_ty =
                    &env.types[env.identifiers[callee.identifier.0 as usize].type_.0 as usize];
                if evaluates_to_stable_type_or_container(env, callee_ty) {
                    let lvalue_ty =
                        &env.types[env.identifiers[lvalue_id.0 as usize].type_.0 as usize];
                    if is_stable_type(lvalue_ty) {
                        self.map.insert(lvalue_id, true);
                    } else {
                        self.map.insert(lvalue_id, false);
                    }
                }
            }
            InstructionValue::MethodCall { property, .. } => {
                let property_ty = &env.types
                    [env.identifiers[property.identifier.0 as usize].type_.0 as usize];
                if evaluates_to_stable_type_or_container(env, property_ty) {
                    let lvalue_ty =
                        &env.types[env.identifiers[lvalue_id.0 as usize].type_.0 as usize];
                    if is_stable_type(lvalue_ty) {
                        self.map.insert(lvalue_id, true);
                    } else {
                        self.map.insert(lvalue_id, false);
                    }
                }
            }
            InstructionValue::PropertyLoad { object, .. } => {
                let source_id = object.identifier;
                if self.map.contains_key(&source_id) {
                    let lvalue_ty =
                        &env.types[env.identifiers[lvalue_id.0 as usize].type_.0 as usize];
                    if is_stable_type_container(lvalue_ty) {
                        self.map.insert(lvalue_id, false);
                    } else if is_stable_type(lvalue_ty) {
                        self.map.insert(lvalue_id, true);
                    }
                }
            }
            InstructionValue::Destructure { value: val, .. } => {
                let source_id = val.identifier;
                if self.map.contains_key(&source_id) {
                    // For destructure, check all lvalues (pattern places)
                    let lvalue_ids = each_instruction_lvalue_ids(instr, env);
                    for lid in lvalue_ids {
                        let lid_ty =
                            &env.types[env.identifiers[lid.0 as usize].type_.0 as usize];
                        if is_stable_type_container(lid_ty) {
                            self.map.insert(lid, false);
                        } else if is_stable_type(lid_ty) {
                            self.map.insert(lid, true);
                        }
                    }
                }
            }
            InstructionValue::StoreLocal { lvalue, value: val, .. } => {
                if let Some(&entry) = self.map.get(&val.identifier) {
                    self.map.insert(lvalue_id, entry);
                    self.map.insert(lvalue.place.identifier, entry);
                }
            }
            InstructionValue::LoadLocal { place, .. } => {
                if let Some(&entry) = self.map.get(&place.identifier) {
                    self.map.insert(lvalue_id, entry);
                }
            }
            _ => {}
        }
    }

    fn is_stable(&self, id: IdentifierId) -> bool {
        self.map.get(&id).copied().unwrap_or(false)
    }
}

// =============================================================================
// Control dominators (ported from ControlDominators.ts)
// =============================================================================

fn is_reactive_controlled_block(
    block_id: BlockId,
    func: &HirFunction,
    post_dominators: &react_compiler_hir::dominator::PostDominator,
    reactive_map: &mut ReactivityMap,
) -> bool {
    let frontier = post_dominator_frontier(func, post_dominators, block_id);
    for frontier_block_id in &frontier {
        let control_block = func.body.blocks.get(frontier_block_id).unwrap();
        match &control_block.terminal {
            Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
                if reactive_map.is_reactive(test.identifier) {
                    return true;
                }
            }
            Terminal::Switch { test, cases, .. } => {
                if reactive_map.is_reactive(test.identifier) {
                    return true;
                }
                for case in cases {
                    if let Some(ref case_test) = case.test {
                        if reactive_map.is_reactive(case_test.identifier) {
                            return true;
                        }
                    }
                }
            }
            _ => {}
        }
    }
    false
}

/// Compute the post-dominator frontier of a target block.
fn post_dominator_frontier(
    func: &HirFunction,
    post_dominators: &react_compiler_hir::dominator::PostDominator,
    target_id: BlockId,
) -> HashSet<BlockId> {
    let target_post_dominators = post_dominators_of(func, post_dominators, target_id);
    let mut visited = HashSet::new();
    let mut frontier = HashSet::new();

    let mut to_visit: Vec<BlockId> = target_post_dominators.iter().copied().collect();
    to_visit.push(target_id);

    for block_id in to_visit {
        if !visited.insert(block_id) {
            continue;
        }
        if let Some(block) = func.body.blocks.get(&block_id) {
            for pred in &block.preds {
                if !target_post_dominators.contains(pred) {
                    frontier.insert(*pred);
                }
            }
        }
    }
    frontier
}

/// Compute all blocks that post-dominate the target block.
fn post_dominators_of(
    func: &HirFunction,
    post_dominators: &react_compiler_hir::dominator::PostDominator,
    target_id: BlockId,
) -> HashSet<BlockId> {
    let mut result = HashSet::new();
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();
    queue.push_back(target_id);

    while let Some(current_id) = queue.pop_front() {
        if !visited.insert(current_id) {
            continue;
        }
        if let Some(block) = func.body.blocks.get(&current_id) {
            for &pred in &block.preds {
                let pred_post_dominator = post_dominators
                    .get(pred)
                    .unwrap_or(pred);
                if pred_post_dominator == target_id || result.contains(&pred_post_dominator) {
                    result.insert(pred);
                }
                queue.push_back(pred);
            }
        }
    }
    result
}

// =============================================================================
// Type helpers (ported from HIR.ts)
// =============================================================================

fn get_hook_kind_for_type<'a>(env: &'a Environment, ty: &Type) -> Option<&'a HookKind> {
    env.get_hook_kind_for_type(ty)
}

fn is_use_operator_type(ty: &Type) -> bool {
    matches!(
        ty,
        Type::Function { shape_id: Some(id), .. } if id == react_compiler_hir::object_shape::BUILT_IN_USE_OPERATOR_ID
    )
}

fn is_stable_type(ty: &Type) -> bool {
    match ty {
        Type::Function { shape_id: Some(id), .. } => {
            matches!(
                id.as_str(),
                "BuiltInSetState"
                    | "BuiltInSetActionState"
                    | "BuiltInDispatch"
                    | "BuiltInUseRefId"
                    | "BuiltInStartTransition"
                    | "BuiltInSetOptimistic"
            )
        }
        _ => false,
    }
}

fn is_stable_type_container(ty: &Type) -> bool {
    match ty {
        Type::Object { shape_id: Some(id) } => {
            matches!(
                id.as_str(),
                "BuiltInUseState"
                    | "BuiltInUseActionState"
                    | "BuiltInUseReducer"
                    | "BuiltInUseOptimistic"
                    | "BuiltInUseTransition"
            )
        }
        _ => false,
    }
}

fn evaluates_to_stable_type_or_container(env: &Environment, callee_ty: &Type) -> bool {
    if let Some(hook_kind) = get_hook_kind_for_type(env, callee_ty) {
        matches!(
            hook_kind,
            HookKind::UseState
                | HookKind::UseReducer
                | HookKind::UseActionState
                | HookKind::UseRef
                | HookKind::UseTransition
                | HookKind::UseOptimistic
        )
    } else {
        false
    }
}

// =============================================================================
// Propagate reactivity to inner functions
// =============================================================================

fn propagate_reactivity_to_inner_functions_outer(
    func: &HirFunction,
    env: &Environment,
    reactive_map: &mut ReactivityMap,
) {
    // For the outermost function, we only recurse into inner FunctionExpression/ObjectMethod
    for (_block_id, block) in &func.body.blocks {
        for instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    propagate_reactivity_to_inner_functions_inner(
                        lowered_func.func,
                        env,
                        reactive_map,
                    );
                }
                _ => {}
            }
        }
    }
}

fn propagate_reactivity_to_inner_functions_inner(
    func_id: FunctionId,
    env: &Environment,
    reactive_map: &mut ReactivityMap,
) {
    let inner_func = &env.functions[func_id.0 as usize];

    for (_block_id, block) in &inner_func.body.blocks {
        for instr_id in &block.instructions {
            let instr = &inner_func.instructions[instr_id.0 as usize];

            // Mark all operands (for inner functions, not outermost)
            let operand_ids = each_instruction_operand_ids(instr, env);
            for op_id in operand_ids {
                reactive_map.is_reactive(op_id);
            }

            // Recurse into nested functions
            match &instr.value {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    propagate_reactivity_to_inner_functions_inner(
                        lowered_func.func,
                        env,
                        reactive_map,
                    );
                }
                _ => {}
            }
        }

        // Terminal operands (for inner functions)
        let terminal_op_ids = each_terminal_operand_ids(&block.terminal);
        for op_id in terminal_op_ids {
            reactive_map.is_reactive(op_id);
        }
    }
}

// =============================================================================
// Apply reactive flags to the HIR (replay pass)
// =============================================================================

/// Replay the traversal from the fixpoint loop, setting `place.reactive = true`
/// on exactly the place occurrences that TS's side-effectful `isReactive()` and
/// `markReactive()` would have set.
///
/// The reactive set is frozen after the fixpoint. We build a lookup set of all
/// reactive identifiers (including non-canonical aliases) and then walk the HIR
/// exactly as TS does, setting the flag on visited places whose canonical ID is reactive.
fn apply_reactive_flags_replay(
    func: &mut HirFunction,
    env: &mut Environment,
    reactive_map: &mut ReactivityMap,
    stable_sidemap: &mut StableSidemap,
) {
    let reactive_ids = build_reactive_id_set(reactive_map);

    // 1. Mark params
    for param in &mut func.params {
        let place = match param {
            ParamPattern::Place(p) => p,
            ParamPattern::Spread(s) => &mut s.place,
        };
        // markReactive is always called on params, so always set the flag
        place.reactive = true;
    }

    // 2. Walk blocks — replay the fixpoint traversal pattern
    // We need block IDs in iteration order, plus instruction IDs
    let block_ids: Vec<BlockId> = func.body.blocks.keys().copied().collect();

    for block_id in &block_ids {
        let block = func.body.blocks.get(block_id).unwrap();

        // 2a. Phi nodes
        let phi_count = block.phis.len();
        for phi_idx in 0..phi_count {
            let block = func.body.blocks.get_mut(block_id).unwrap();
            let phi = &mut block.phis[phi_idx];

            // isReactive is called on phi.place
            if reactive_ids.contains(&phi.place.identifier) {
                phi.place.reactive = true;
            }

            // isReactive is called on each operand
            for (_pred, operand) in &mut phi.operands {
                if reactive_ids.contains(&operand.identifier) {
                    operand.reactive = true;
                }
            }
        }

        // 2b. Instructions
        let block = func.body.blocks.get(block_id).unwrap();
        let instr_ids: Vec<react_compiler_hir::InstructionId> = block.instructions.clone();

        for instr_id in &instr_ids {
            let instr = &func.instructions[instr_id.0 as usize];

            // Compute hasReactiveInput by checking value operands
            let value_operand_ids = each_instruction_value_operand_ids(&instr.value, env);
            let mut has_reactive_input = false;
            for &op_id in &value_operand_ids {
                if reactive_ids.contains(&op_id) {
                    has_reactive_input = true;
                    // Don't break — TS checks all operands, setting reactive on each
                }
            }

            // Check hooks/use
            match &instr.value {
                InstructionValue::CallExpression { callee, .. } => {
                    let callee_ty = &env.types
                        [env.identifiers[callee.identifier.0 as usize].type_.0 as usize];
                    if get_hook_kind_for_type(env, callee_ty).is_some()
                        || is_use_operator_type(callee_ty)
                    {
                        has_reactive_input = true;
                    }
                }
                InstructionValue::MethodCall { property, .. } => {
                    let property_ty = &env.types
                        [env.identifiers[property.identifier.0 as usize].type_.0 as usize];
                    if get_hook_kind_for_type(env, property_ty).is_some()
                        || is_use_operator_type(property_ty)
                    {
                        has_reactive_input = true;
                    }
                }
                _ => {}
            }

            // Now set flags on places

            // Value operands: isReactive is called, so set flag if reactive
            let instr = &mut func.instructions[instr_id.0 as usize];
            set_reactive_on_value_operands(&mut instr.value, &reactive_ids);

            // Lvalues: markReactive is called only when hasReactiveInput
            if has_reactive_input {
                let lvalue_id = instr.lvalue.identifier;
                if !stable_sidemap.is_stable(lvalue_id) && reactive_ids.contains(&lvalue_id) {
                    instr.lvalue.reactive = true;
                }
                set_reactive_on_value_lvalues(&mut instr.value, &reactive_ids, stable_sidemap);
            }

            // Mutable operands: markReactive called when hasReactiveInput || hasReactiveControl
            // (we're not recomputing hasReactiveControl here, but the flag would have been set
            // in the isReactive call on value operands above if those operands are reactive)
        }

        // 2c. Terminal operands: isReactive called
        let block = func.body.blocks.get_mut(block_id).unwrap();
        set_reactive_on_terminal(&mut block.terminal, &reactive_ids);
    }

    // 3. Apply to inner functions
    apply_reactive_flags_to_inner_functions(func, env, &reactive_ids);
}

fn build_reactive_id_set(reactive_map: &ReactivityMap) -> HashSet<IdentifierId> {
    let mut result = HashSet::new();
    // All canonical reactive IDs
    for &id in &reactive_map.reactive {
        result.insert(id);
    }
    // All IDs whose canonical form is reactive
    for (&id, &_parent) in &reactive_map.aliased_identifiers.entries {
        // Walk up to find root (without path compression since we have immutable ref)
        let mut current = id;
        loop {
            match reactive_map.aliased_identifiers.entries.get(&current) {
                Some(&parent) if parent != current => current = parent,
                _ => break,
            }
        }
        if reactive_map.reactive.contains(&current) {
            result.insert(id);
        }
    }
    result
}

fn is_id_reactive(id: IdentifierId, reactive_ids: &HashSet<IdentifierId>) -> bool {
    reactive_ids.contains(&id)
}

fn set_reactive_on_place(place: &mut Place, reactive_ids: &HashSet<IdentifierId>) {
    if is_id_reactive(place.identifier, reactive_ids) {
        place.reactive = true;
    }
}

/// Set reactive flags on value lvalues (from `eachInstructionValueLValue`).
/// Only called when `hasReactiveInput` is true, matching TS behavior.
fn set_reactive_on_value_lvalues(
    value: &mut InstructionValue,
    reactive_ids: &HashSet<IdentifierId>,
    stable_sidemap: &StableSidemap,
) {
    match value {
        InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::DeclareContext { lvalue, .. }
        | InstructionValue::StoreLocal { lvalue, .. }
        | InstructionValue::StoreContext { lvalue, .. } => {
            let id = lvalue.place.identifier;
            if !stable_sidemap.is_stable(id) && reactive_ids.contains(&id) {
                lvalue.place.reactive = true;
            }
        }
        InstructionValue::Destructure { lvalue, .. } => {
            set_reactive_on_pattern_with_stable(&mut lvalue.pattern, reactive_ids, stable_sidemap);
        }
        InstructionValue::PrefixUpdate { lvalue, .. }
        | InstructionValue::PostfixUpdate { lvalue, .. } => {
            let id = lvalue.identifier;
            if !stable_sidemap.is_stable(id) && reactive_ids.contains(&id) {
                lvalue.reactive = true;
            }
        }
        _ => {}
    }
}

fn set_reactive_on_pattern_with_stable(
    pattern: &mut react_compiler_hir::Pattern,
    reactive_ids: &HashSet<IdentifierId>,
    stable_sidemap: &StableSidemap,
) {
    match pattern {
        react_compiler_hir::Pattern::Array(array) => {
            for item in &mut array.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(p) => {
                        if !stable_sidemap.is_stable(p.identifier) && reactive_ids.contains(&p.identifier) {
                            p.reactive = true;
                        }
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(s) => {
                        if !stable_sidemap.is_stable(s.place.identifier) && reactive_ids.contains(&s.place.identifier) {
                            s.place.reactive = true;
                        }
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &mut obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        if !stable_sidemap.is_stable(p.place.identifier) && reactive_ids.contains(&p.place.identifier) {
                            p.place.reactive = true;
                        }
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        if !stable_sidemap.is_stable(s.place.identifier) && reactive_ids.contains(&s.place.identifier) {
                            s.place.reactive = true;
                        }
                    }
                }
            }
        }
    }
}

fn set_reactive_on_terminal(terminal: &mut Terminal, reactive_ids: &HashSet<IdentifierId>) {
    match terminal {
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
            set_reactive_on_place(test, reactive_ids);
        }
        Terminal::Switch { test, cases, .. } => {
            set_reactive_on_place(test, reactive_ids);
            for case in cases {
                if let Some(ref mut case_test) = case.test {
                    set_reactive_on_place(case_test, reactive_ids);
                }
            }
        }
        Terminal::Return { value, .. } | Terminal::Throw { value, .. } => {
            set_reactive_on_place(value, reactive_ids);
        }
        _ => {}
    }
}

fn set_reactive_on_value_operands(
    value: &mut InstructionValue,
    reactive_ids: &HashSet<IdentifierId>,
) {
    match value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            set_reactive_on_place(place, reactive_ids);
        }
        InstructionValue::StoreLocal { lvalue, value: val, .. }
        | InstructionValue::StoreContext { lvalue, value: val, .. } => {
            set_reactive_on_place(&mut lvalue.place, reactive_ids);
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::DeclareContext { lvalue, .. } => {
            set_reactive_on_place(&mut lvalue.place, reactive_ids);
        }
        InstructionValue::Destructure { lvalue, value: val, .. } => {
            set_reactive_on_pattern(&mut lvalue.pattern, reactive_ids);
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            set_reactive_on_place(left, reactive_ids);
            set_reactive_on_place(right, reactive_ids);
        }
        InstructionValue::NewExpression { callee, args, .. }
        | InstructionValue::CallExpression { callee, args, .. } => {
            set_reactive_on_place(callee, reactive_ids);
            for arg in args {
                match arg {
                    PlaceOrSpread::Place(p) => set_reactive_on_place(p, reactive_ids),
                    PlaceOrSpread::Spread(s) => {
                        set_reactive_on_place(&mut s.place, reactive_ids)
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
            set_reactive_on_place(receiver, reactive_ids);
            set_reactive_on_place(property, reactive_ids);
            for arg in args {
                match arg {
                    PlaceOrSpread::Place(p) => set_reactive_on_place(p, reactive_ids),
                    PlaceOrSpread::Spread(s) => {
                        set_reactive_on_place(&mut s.place, reactive_ids)
                    }
                }
            }
        }
        InstructionValue::UnaryExpression { value: val, .. } => {
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::TypeCastExpression { value: val, .. } => {
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::JsxExpression {
            tag,
            props,
            children,
            ..
        } => {
            if let JsxTag::Place(p) = tag {
                set_reactive_on_place(p, reactive_ids);
            }
            for prop in props {
                match prop {
                    JsxAttribute::Attribute { place, .. } => {
                        set_reactive_on_place(place, reactive_ids)
                    }
                    JsxAttribute::SpreadAttribute { argument } => {
                        set_reactive_on_place(argument, reactive_ids)
                    }
                }
            }
            if let Some(ch) = children {
                for c in ch {
                    set_reactive_on_place(c, reactive_ids);
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for c in children {
                set_reactive_on_place(c, reactive_ids);
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        set_reactive_on_place(&mut p.place, reactive_ids);
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } =
                            &mut p.key
                        {
                            set_reactive_on_place(name, reactive_ids);
                        }
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        set_reactive_on_place(&mut s.place, reactive_ids);
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for el in elements {
                match el {
                    react_compiler_hir::ArrayElement::Place(p) => {
                        set_reactive_on_place(p, reactive_ids)
                    }
                    react_compiler_hir::ArrayElement::Spread(s) => {
                        set_reactive_on_place(&mut s.place, reactive_ids)
                    }
                    react_compiler_hir::ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::PropertyStore { object, value: val, .. }
        | InstructionValue::ComputedStore { object, value: val, .. } => {
            set_reactive_on_place(object, reactive_ids);
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::ComputedLoad { object, .. } => {
            set_reactive_on_place(object, reactive_ids);
        }
        InstructionValue::PropertyDelete { object, .. }
        | InstructionValue::ComputedDelete { object, .. } => {
            set_reactive_on_place(object, reactive_ids);
        }
        InstructionValue::Await { value: val, .. } => {
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::GetIterator { collection, .. } => {
            set_reactive_on_place(collection, reactive_ids);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            set_reactive_on_place(iterator, reactive_ids);
            set_reactive_on_place(collection, reactive_ids);
        }
        InstructionValue::NextPropertyOf { value: val, .. } => {
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::PrefixUpdate { value: val, lvalue, .. } => {
            set_reactive_on_place(val, reactive_ids);
            set_reactive_on_place(lvalue, reactive_ids);
        }
        InstructionValue::PostfixUpdate { value: val, lvalue, .. } => {
            set_reactive_on_place(val, reactive_ids);
            set_reactive_on_place(lvalue, reactive_ids);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for s in subexprs {
                set_reactive_on_place(s, reactive_ids);
            }
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            set_reactive_on_place(tag, reactive_ids);
        }
        InstructionValue::StoreGlobal { value: val, .. } => {
            set_reactive_on_place(val, reactive_ids);
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps {
                    if let react_compiler_hir::ManualMemoDependencyRoot::NamedLocal {
                        value: val,
                        ..
                    } = &mut dep.root
                    {
                        set_reactive_on_place(val, reactive_ids);
                    }
                }
            }
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            set_reactive_on_place(decl, reactive_ids);
        }
        InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::JSXText { .. }
        | InstructionValue::UnsupportedNode { .. } => {}
    }
}

fn set_reactive_on_pattern(
    pattern: &mut react_compiler_hir::Pattern,
    reactive_ids: &HashSet<IdentifierId>,
) {
    match pattern {
        react_compiler_hir::Pattern::Array(array) => {
            for item in &mut array.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(p) => {
                        set_reactive_on_place(p, reactive_ids);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(s) => {
                        set_reactive_on_place(&mut s.place, reactive_ids);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &mut obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        set_reactive_on_place(&mut p.place, reactive_ids);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        set_reactive_on_place(&mut s.place, reactive_ids);
                    }
                }
            }
        }
    }
}

fn apply_reactive_flags_to_inner_functions(
    func: &HirFunction,
    env: &mut Environment,
    reactive_ids: &HashSet<IdentifierId>,
) {
    for (_block_id, block) in &func.body.blocks {
        for instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    apply_reactive_flags_to_inner_func(lowered_func.func, env, reactive_ids);
                }
                _ => {}
            }
        }
    }
}

/// Apply reactive flags to an inner function.
/// For inner functions, TS calls `eachInstructionOperand` (value operands only)
/// and `eachTerminalOperand`, setting reactive on each.
fn apply_reactive_flags_to_inner_func(
    func_id: FunctionId,
    env: &mut Environment,
    reactive_ids: &HashSet<IdentifierId>,
) {
    // Collect nested function IDs first to avoid borrow issues
    let nested_func_ids: Vec<FunctionId> = {
        let func = &env.functions[func_id.0 as usize];
        let mut ids = Vec::new();
        for (_block_id, block) in &func.body.blocks {
            for instr_id in &block.instructions {
                let instr = &func.instructions[instr_id.0 as usize];
                match &instr.value {
                    InstructionValue::FunctionExpression { lowered_func, .. }
                    | InstructionValue::ObjectMethod { lowered_func, .. } => {
                        ids.push(lowered_func.func);
                    }
                    _ => {}
                }
            }
        }
        ids
    };

    // Apply reactive flags: set reactive on value operands and terminal operands
    let inner_func = &mut env.functions[func_id.0 as usize];
    for (_block_id, block) in &mut inner_func.body.blocks {
        for instr_id in &block.instructions {
            let instr = &mut inner_func.instructions[instr_id.0 as usize];
            set_reactive_on_value_operands(&mut instr.value, reactive_ids);
        }
        set_reactive_on_terminal(&mut block.terminal, reactive_ids);
    }

    // Recurse into nested functions
    for nested_id in nested_func_ids {
        apply_reactive_flags_to_inner_func(nested_id, env, reactive_ids);
    }
}

// =============================================================================
// Operand iterators
// =============================================================================

/// Collect all value-operand IdentifierIds from an instruction value.
fn each_instruction_value_operand_ids(
    value: &InstructionValue,
    env: &Environment,
) -> Vec<IdentifierId> {
    each_instruction_value_operand_places(value, env)
        .iter()
        .map(|p| p.identifier)
        .collect()
}

/// Collect all value-operand Places from an instruction value.
fn each_instruction_value_operand_places(
    value: &InstructionValue,
    _env: &Environment,
) -> Vec<Place> {
    let mut result = Vec::new();
    match value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            result.push(place.clone());
        }
        InstructionValue::StoreLocal { value: val, .. }
        | InstructionValue::StoreContext { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::Destructure { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            result.push(left.clone());
            result.push(right.clone());
        }
        InstructionValue::NewExpression { callee, args, .. }
        | InstructionValue::CallExpression { callee, args, .. } => {
            result.push(callee.clone());
            for arg in args {
                match arg {
                    PlaceOrSpread::Place(p) => result.push(p.clone()),
                    PlaceOrSpread::Spread(s) => result.push(s.place.clone()),
                }
            }
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            result.push(receiver.clone());
            result.push(property.clone());
            for arg in args {
                match arg {
                    PlaceOrSpread::Place(p) => result.push(p.clone()),
                    PlaceOrSpread::Spread(s) => result.push(s.place.clone()),
                }
            }
        }
        InstructionValue::UnaryExpression { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::TypeCastExpression { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::JsxExpression {
            tag, props, children, ..
        } => {
            if let JsxTag::Place(p) = tag {
                result.push(p.clone());
            }
            for prop in props {
                match prop {
                    JsxAttribute::Attribute { place, .. } => result.push(place.clone()),
                    JsxAttribute::SpreadAttribute { argument } => result.push(argument.clone()),
                }
            }
            if let Some(ch) = children {
                for c in ch {
                    result.push(c.clone());
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for c in children {
                result.push(c.clone());
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        result.push(p.place.clone());
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } = &p.key {
                            result.push(name.clone());
                        }
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        result.push(s.place.clone())
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for el in elements {
                match el {
                    react_compiler_hir::ArrayElement::Place(p) => result.push(p.clone()),
                    react_compiler_hir::ArrayElement::Spread(s) => {
                        result.push(s.place.clone())
                    }
                    react_compiler_hir::ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::PropertyStore { object, value: val, .. }
        | InstructionValue::ComputedStore { object, value: val, .. } => {
            result.push(object.clone());
            result.push(val.clone());
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::ComputedLoad { object, .. } => {
            result.push(object.clone());
        }
        InstructionValue::PropertyDelete { object, .. }
        | InstructionValue::ComputedDelete { object, .. } => {
            result.push(object.clone());
        }
        InstructionValue::Await { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::GetIterator { collection, .. } => {
            result.push(collection.clone());
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            result.push(iterator.clone());
            result.push(collection.clone());
        }
        InstructionValue::NextPropertyOf { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::PrefixUpdate { value: val, .. }
        | InstructionValue::PostfixUpdate { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for s in subexprs {
                result.push(s.clone());
            }
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            result.push(tag.clone());
        }
        InstructionValue::StoreGlobal { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps {
                    if let react_compiler_hir::ManualMemoDependencyRoot::NamedLocal {
                        value: val,
                        ..
                    } = &dep.root
                    {
                        result.push(val.clone());
                    }
                }
            }
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            result.push(decl.clone());
        }
        InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. } => {
            // Context variables are handled separately
        }
        _ => {}
    }
    result
}

/// Collect lvalue IdentifierIds from an instruction (lvalue + value lvalues).
fn each_instruction_lvalue_ids(
    instr: &react_compiler_hir::Instruction,
    _env: &Environment,
) -> Vec<IdentifierId> {
    let mut result = vec![instr.lvalue.identifier];
    match &instr.value {
        InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::DeclareContext { lvalue, .. } => {
            result.push(lvalue.place.identifier);
        }
        InstructionValue::StoreLocal { lvalue, .. }
        | InstructionValue::StoreContext { lvalue, .. } => {
            result.push(lvalue.place.identifier);
        }
        InstructionValue::Destructure { lvalue, .. } => {
            collect_pattern_ids(&lvalue.pattern, &mut result);
        }
        InstructionValue::PrefixUpdate { lvalue, .. }
        | InstructionValue::PostfixUpdate { lvalue, .. } => {
            result.push(lvalue.identifier);
        }
        _ => {}
    }
    result
}

fn collect_pattern_ids(pattern: &react_compiler_hir::Pattern, result: &mut Vec<IdentifierId>) {
    match pattern {
        react_compiler_hir::Pattern::Array(array) => {
            for item in &array.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(p) => {
                        result.push(p.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(s) => {
                        result.push(s.place.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        result.push(p.place.identifier);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        result.push(s.place.identifier);
                    }
                }
            }
        }
    }
}

/// Collect all operand IdentifierIds from an instruction (value operands only).
/// Corresponds to TS `eachInstructionOperand(instr)` which yields
/// `eachInstructionValueOperand(instr.value)` — does NOT include lvalue.
fn each_instruction_operand_ids(
    instr: &react_compiler_hir::Instruction,
    env: &Environment,
) -> Vec<IdentifierId> {
    each_instruction_value_operand_ids(&instr.value, env)
}

/// Collect operand IdentifierIds from a terminal.
fn each_terminal_operand_ids(terminal: &Terminal) -> Vec<IdentifierId> {
    match terminal {
        Terminal::Throw { value, .. } => vec![value.identifier],
        Terminal::Return { value, .. } => vec![value.identifier],
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
            vec![test.identifier]
        }
        Terminal::Switch { test, cases, .. } => {
            let mut ids = vec![test.identifier];
            for case in cases {
                if let Some(ref case_test) = case.test {
                    ids.push(case_test.identifier);
                }
            }
            ids
        }
        _ => vec![],
    }
}
