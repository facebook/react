// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Merges reactive scopes that have overlapping ranges.
//!
//! While previous passes ensure that reactive scopes span valid sets of program
//! blocks, pairs of reactive scopes may still be inconsistent with respect to
//! each other. Two scopes must either be entirely disjoint or one must be nested
//! within the other. This pass detects overlapping scopes and merges them.
//!
//! Additionally, if an instruction mutates an outer scope while a different
//! scope is active, those scopes are merged.
//!
//! Ported from TypeScript `src/HIR/MergeOverlappingReactiveScopesHIR.ts`.

use std::cmp;
use std::collections::HashMap;

use indexmap::IndexMap;
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    EvaluationOrder, HirFunction, IdentifierId, InstructionValue, Place, ScopeId, Type,
};

// =============================================================================
// DisjointSet<ScopeId>
// =============================================================================

/// A Union-Find data structure for grouping ScopeIds into disjoint sets.
struct ScopeDisjointSet {
    entries: IndexMap<ScopeId, ScopeId>,
}

impl ScopeDisjointSet {
    fn new() -> Self {
        ScopeDisjointSet {
            entries: IndexMap::new(),
        }
    }

    fn find(&mut self, item: ScopeId) -> ScopeId {
        let parent = match self.entries.get(&item) {
            Some(&p) => p,
            None => {
                self.entries.insert(item, item);
                return item;
            }
        };
        if parent == item {
            return item;
        }
        let root = self.find(parent);
        self.entries.insert(item, root);
        root
    }

    /// Union multiple scope IDs into one set (first element becomes root).
    fn union(&mut self, items: &[ScopeId]) {
        if items.len() < 2 {
            return;
        }
        let root = self.find(items[0]);
        for &item in &items[1..] {
            let item_root = self.find(item);
            if item_root != root {
                self.entries.insert(item_root, root);
            }
        }
    }

    fn for_each<F>(&mut self, mut f: F)
    where
        F: FnMut(ScopeId, ScopeId),
    {
        let keys: Vec<ScopeId> = self.entries.keys().copied().collect();
        for item in keys {
            let group = self.find(item);
            f(item, group);
        }
    }
}

// =============================================================================
// ScopeInfo
// =============================================================================

struct ScopeStartEntry {
    id: EvaluationOrder,
    scopes: Vec<ScopeId>,
}

struct ScopeEndEntry {
    id: EvaluationOrder,
    scopes: Vec<ScopeId>,
}

struct ScopeInfo {
    /// Sorted descending by id (so we can pop from the end for smallest)
    scope_starts: Vec<ScopeStartEntry>,
    /// Sorted descending by id (so we can pop from the end for smallest)
    scope_ends: Vec<ScopeEndEntry>,
    /// Maps IdentifierId -> ScopeId for all places that have a scope
    place_scopes: HashMap<IdentifierId, ScopeId>,
}

// =============================================================================
// TraversalState
// =============================================================================

struct TraversalState {
    joined: ScopeDisjointSet,
    active_scopes: Vec<ScopeId>,
}

// =============================================================================
// Helper functions
// =============================================================================

/// Check if a scope is active at the given instruction id.
/// Corresponds to TS `isScopeActive(scope, id)`.
fn is_scope_active(env: &Environment, scope_id: ScopeId, id: EvaluationOrder) -> bool {
    let range = &env.scopes[scope_id.0 as usize].range;
    id >= range.start && id < range.end
}

/// Get the scope for a place if it's active at the given instruction.
/// Corresponds to TS `getPlaceScope(id, place)`.
fn get_place_scope(
    env: &Environment,
    id: EvaluationOrder,
    identifier_id: IdentifierId,
) -> Option<ScopeId> {
    let scope_id = env.identifiers[identifier_id.0 as usize].scope?;
    if is_scope_active(env, scope_id, id) {
        Some(scope_id)
    } else {
        None
    }
}

/// Check if a place is mutable at the given instruction.
/// Corresponds to TS `isMutable({id}, place)`.
fn is_mutable(env: &Environment, id: EvaluationOrder, identifier_id: IdentifierId) -> bool {
    let range = &env.identifiers[identifier_id.0 as usize].mutable_range;
    id >= range.start && id < range.end
}

// =============================================================================
// collectScopeInfo
// =============================================================================

fn collect_scope_info(func: &HirFunction, env: &Environment) -> ScopeInfo {
    let mut scope_starts_map: HashMap<EvaluationOrder, Vec<ScopeId>> = HashMap::new();
    let mut scope_ends_map: HashMap<EvaluationOrder, Vec<ScopeId>> = HashMap::new();
    let mut place_scopes: HashMap<IdentifierId, ScopeId> = HashMap::new();

    let mut collect_place_scope =
        |identifier_id: IdentifierId, env: &Environment| {
            let scope_id = match env.identifiers[identifier_id.0 as usize].scope {
                Some(s) => s,
                None => return,
            };
            place_scopes.insert(identifier_id, scope_id);
            let range = &env.scopes[scope_id.0 as usize].range;
            if range.start != range.end {
                scope_starts_map
                    .entry(range.start)
                    .or_default()
                    .push(scope_id);
                scope_ends_map
                    .entry(range.end)
                    .or_default()
                    .push(scope_id);
            }
        };

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            // lvalues
            let lvalue_ids = each_instruction_lvalue_ids(instr);
            for id in lvalue_ids {
                collect_place_scope(id, env);
            }
            // operands
            let operand_ids = each_instruction_operand_ids(instr, env);
            for id in operand_ids {
                collect_place_scope(id, env);
            }
        }
        // terminal operands
        let terminal_op_ids = each_terminal_operand_ids(&block.terminal);
        for id in terminal_op_ids {
            collect_place_scope(id, env);
        }
    }

    // Deduplicate scope IDs in each entry
    for scopes in scope_starts_map.values_mut() {
        scopes.sort();
        scopes.dedup();
    }
    for scopes in scope_ends_map.values_mut() {
        scopes.sort();
        scopes.dedup();
    }

    // Convert to sorted vecs (descending by id for pop-from-end)
    let mut scope_starts: Vec<ScopeStartEntry> = scope_starts_map
        .into_iter()
        .map(|(id, scopes)| ScopeStartEntry { id, scopes })
        .collect();
    scope_starts.sort_by(|a, b| b.id.cmp(&a.id));

    let mut scope_ends: Vec<ScopeEndEntry> = scope_ends_map
        .into_iter()
        .map(|(id, scopes)| ScopeEndEntry { id, scopes })
        .collect();
    scope_ends.sort_by(|a, b| b.id.cmp(&a.id));

    ScopeInfo {
        scope_starts,
        scope_ends,
        place_scopes,
    }
}

// =============================================================================
// visitInstructionId
// =============================================================================

fn visit_instruction_id(
    id: EvaluationOrder,
    scope_info: &mut ScopeInfo,
    state: &mut TraversalState,
    env: &Environment,
) {
    // Handle all scopes that end at this instruction
    if let Some(top) = scope_info.scope_ends.last() {
        if top.id <= id {
            let scope_end_entry = scope_info.scope_ends.pop().unwrap();

            // Sort scopes by start descending (matching active_scopes order)
            let mut scopes_sorted = scope_end_entry.scopes;
            scopes_sorted.sort_by(|a, b| {
                let a_start = env.scopes[a.0 as usize].range.start;
                let b_start = env.scopes[b.0 as usize].range.start;
                b_start.cmp(&a_start)
            });

            for scope in &scopes_sorted {
                let idx = state.active_scopes.iter().position(|s| s == scope);
                if let Some(idx) = idx {
                    // Detect and merge all overlapping scopes
                    if idx != state.active_scopes.len() - 1 {
                        let mut to_union: Vec<ScopeId> = vec![*scope];
                        to_union.extend_from_slice(&state.active_scopes[idx + 1..]);
                        state.joined.union(&to_union);
                    }
                    state.active_scopes.remove(idx);
                }
            }
        }
    }

    // Handle all scopes that begin at this instruction
    if let Some(top) = scope_info.scope_starts.last() {
        if top.id <= id {
            let scope_start_entry = scope_info.scope_starts.pop().unwrap();

            // Sort by end descending
            let mut scopes_sorted = scope_start_entry.scopes;
            scopes_sorted.sort_by(|a, b| {
                let a_end = env.scopes[a.0 as usize].range.end;
                let b_end = env.scopes[b.0 as usize].range.end;
                b_end.cmp(&a_end)
            });

            state.active_scopes.extend_from_slice(&scopes_sorted);

            // Merge all identical scopes (same start and end)
            for i in 1..scopes_sorted.len() {
                let prev = scopes_sorted[i - 1];
                let curr = scopes_sorted[i];
                if env.scopes[prev.0 as usize].range.end == env.scopes[curr.0 as usize].range.end {
                    state.joined.union(&[prev, curr]);
                }
            }
        }
    }
}

// =============================================================================
// visitPlace
// =============================================================================

fn visit_place(
    id: EvaluationOrder,
    identifier_id: IdentifierId,
    state: &mut TraversalState,
    env: &Environment,
) {
    // If an instruction mutates an outer scope, flatten all scopes from top
    // of the stack to the mutated outer scope
    let place_scope = get_place_scope(env, id, identifier_id);
    if let Some(scope_id) = place_scope {
        if is_mutable(env, id, identifier_id) {
            let place_scope_idx = state.active_scopes.iter().position(|s| *s == scope_id);
            if let Some(idx) = place_scope_idx {
                if idx != state.active_scopes.len() - 1 {
                    let mut to_union: Vec<ScopeId> = vec![scope_id];
                    to_union.extend_from_slice(&state.active_scopes[idx + 1..]);
                    state.joined.union(&to_union);
                }
            }
        }
    }
}

// =============================================================================
// getOverlappingReactiveScopes
// =============================================================================

fn get_overlapping_reactive_scopes(
    func: &HirFunction,
    env: &Environment,
    mut scope_info: ScopeInfo,
) -> ScopeDisjointSet {
    let mut state = TraversalState {
        joined: ScopeDisjointSet::new(),
        active_scopes: Vec::new(),
    };

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            visit_instruction_id(instr.id, &mut scope_info, &mut state, env);

            // Visit operands
            let is_func_or_method = matches!(
                &instr.value,
                InstructionValue::FunctionExpression { .. }
                    | InstructionValue::ObjectMethod { .. }
            );
            let operand_ids = each_instruction_operand_ids_with_types(instr, env);
            for (op_id, type_) in &operand_ids {
                if is_func_or_method && matches!(type_, Type::Primitive) {
                    continue;
                }
                visit_place(instr.id, *op_id, &mut state, env);
            }

            // Visit lvalues
            let lvalue_ids = each_instruction_lvalue_ids(instr);
            for lvalue_id in lvalue_ids {
                visit_place(instr.id, lvalue_id, &mut state, env);
            }
        }

        let terminal_id = block.terminal.evaluation_order();
        visit_instruction_id(terminal_id, &mut scope_info, &mut state, env);

        let terminal_op_ids = each_terminal_operand_ids(&block.terminal);
        for op_id in terminal_op_ids {
            visit_place(terminal_id, op_id, &mut state, env);
        }
    }

    state.joined
}

// =============================================================================
// Public API
// =============================================================================

/// Merges reactive scopes that have overlapping ranges.
///
/// Corresponds to TS `mergeOverlappingReactiveScopesHIR(fn: HIRFunction): void`.
pub fn merge_overlapping_reactive_scopes_hir(func: &mut HirFunction, env: &mut Environment) {
    // Collect scope info
    let scope_info = collect_scope_info(func, env);

    // Save place_scopes before moving scope_info
    let place_scopes = scope_info.place_scopes.clone();

    // Find overlapping scopes
    let mut joined_scopes = get_overlapping_reactive_scopes(func, env, scope_info);

    // Merge scope ranges: collect all (scope, root) pairs, then update root ranges
    // by accumulating min start / max end from all members of each group.
    // This matches TS behavior where groupScope.range is updated in-place during iteration.
    let mut scope_groups: Vec<(ScopeId, ScopeId)> = Vec::new();
    joined_scopes.for_each(|scope_id, root_id| {
        if scope_id != root_id {
            scope_groups.push((scope_id, root_id));
        }
    });
    // Collect root scopes' ORIGINAL ranges BEFORE updating them.
    // In TS, identifier.mutableRange shares the same object reference as scope.range.
    // When scope.range is updated, ALL identifiers referencing that range object
    // automatically see the new values — even identifiers whose scope was later set to null.
    // In Rust, we must explicitly find and update identifiers whose mutable_range matches
    // a root scope's original range.
    let mut original_root_ranges: HashMap<ScopeId, (EvaluationOrder, EvaluationOrder)> = HashMap::new();
    for (_, root_id) in &scope_groups {
        if !original_root_ranges.contains_key(root_id) {
            let range = &env.scopes[root_id.0 as usize].range;
            original_root_ranges.insert(*root_id, (range.start, range.end));
        }
    }

    // Update root scope ranges
    for (scope_id, root_id) in &scope_groups {
        let scope_start = env.scopes[scope_id.0 as usize].range.start;
        let scope_end = env.scopes[scope_id.0 as usize].range.end;
        let root_range = &mut env.scopes[root_id.0 as usize].range;
        root_range.start = EvaluationOrder(cmp::min(root_range.start.0, scope_start.0));
        root_range.end = EvaluationOrder(cmp::max(root_range.end.0, scope_end.0));
    }
    // Sync mutable_range for ALL identifiers whose mutable_range matches the ORIGINAL
    // range of a root scope that was updated. In TS, identifier.mutableRange shares the
    // same object reference as scope.range, so when scope.range is updated, all identifiers
    // referencing that range object automatically see the new values — even identifiers
    // whose scope was later set to null. In Rust, we must explicitly find and update these.
    for ident in &mut env.identifiers {
        for (root_id, (orig_start, orig_end)) in &original_root_ranges {
            if ident.mutable_range.start == *orig_start && ident.mutable_range.end == *orig_end {
                let new_range = &env.scopes[root_id.0 as usize].range;
                ident.mutable_range.start = new_range.start;
                ident.mutable_range.end = new_range.end;
                break;
            }
        }
    }

    // Rewrite all references: for each place that had a scope, point to the merged root.
    // Note: we intentionally do NOT update mutable_range for repointed identifiers,
    // matching TS behavior where identifier.mutableRange still references the old scope's
    // range object after scope repointing.
    for (identifier_id, original_scope) in &place_scopes {
        let next_scope = joined_scopes.find(*original_scope);
        if next_scope != *original_scope {
            env.identifiers[identifier_id.0 as usize].scope = Some(next_scope);
        }
    }
}

// =============================================================================
// Instruction visitor helpers
// =============================================================================

/// Collect lvalue IdentifierIds from an instruction.
fn each_instruction_lvalue_ids(instr: &react_compiler_hir::Instruction) -> Vec<IdentifierId> {
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

fn collect_pattern_ids(
    pattern: &react_compiler_hir::Pattern,
    result: &mut Vec<IdentifierId>,
) {
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

/// Collect operand IdentifierIds with their types from an instruction value.
/// Used to check for Primitive type on FunctionExpression/ObjectMethod operands.
fn each_instruction_operand_ids_with_types(
    instr: &react_compiler_hir::Instruction,
    env: &Environment,
) -> Vec<(IdentifierId, Type)> {
    let places = each_instruction_value_operand_places(&instr.value, env);
    places
        .iter()
        .map(|p| {
            let type_ = env.types[env.identifiers[p.identifier.0 as usize].type_.0 as usize].clone();
            (p.identifier, type_)
        })
        .collect()
}

/// Collect operand IdentifierIds from an instruction value.
fn each_instruction_operand_ids(
    instr: &react_compiler_hir::Instruction,
    env: &Environment,
) -> Vec<IdentifierId> {
    each_instruction_value_operand_places(&instr.value, env)
        .iter()
        .map(|p| p.identifier)
        .collect()
}

/// Collect all value-operand Places from an instruction value.
fn each_instruction_value_operand_places(
    value: &InstructionValue,
    env: &Environment,
) -> Vec<Place> {
    let mut result = Vec::new();
    match value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            result.push(place.clone());
        }
        InstructionValue::StoreLocal { value: val, .. } => {
            result.push(val.clone());
        }
        InstructionValue::StoreContext {
            lvalue,
            value: val,
            ..
        } => {
            result.push(lvalue.place.clone());
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
                    react_compiler_hir::PlaceOrSpread::Place(p) => result.push(p.clone()),
                    react_compiler_hir::PlaceOrSpread::Spread(s) => {
                        result.push(s.place.clone())
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
            result.push(receiver.clone());
            result.push(property.clone());
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(p) => result.push(p.clone()),
                    react_compiler_hir::PlaceOrSpread::Spread(s) => {
                        result.push(s.place.clone())
                    }
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
            tag,
            props,
            children,
            ..
        } => {
            if let react_compiler_hir::JsxTag::Place(p) = tag {
                result.push(p.clone());
            }
            for prop in props {
                match prop {
                    react_compiler_hir::JsxAttribute::Attribute { place, .. } => {
                        result.push(place.clone())
                    }
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                        result.push(argument.clone())
                    }
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
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } = &p.key {
                            result.push(name.clone());
                        }
                        result.push(p.place.clone());
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
        InstructionValue::PropertyStore {
            object, value: val, ..
        } => {
            result.push(object.clone());
            result.push(val.clone());
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value: val,
            ..
        } => {
            result.push(object.clone());
            result.push(property.clone());
            result.push(val.clone());
        }
        InstructionValue::PropertyLoad { object, .. } => {
            result.push(object.clone());
        }
        InstructionValue::ComputedLoad {
            object, property, ..
        } => {
            result.push(object.clone());
            result.push(property.clone());
        }
        InstructionValue::PropertyDelete { object, .. } => {
            result.push(object.clone());
        }
        InstructionValue::ComputedDelete {
            object, property, ..
        } => {
            result.push(object.clone());
            result.push(property.clone());
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
        InstructionValue::FunctionExpression { lowered_func, .. }
        | InstructionValue::ObjectMethod { lowered_func, .. } => {
            let inner_func = &env.functions[lowered_func.func.0 as usize];
            for ctx in &inner_func.context {
                result.push(ctx.clone());
            }
        }
        _ => {}
    }
    result
}

/// Collect operand IdentifierIds from a terminal.
fn each_terminal_operand_ids(terminal: &react_compiler_hir::Terminal) -> Vec<IdentifierId> {
    use react_compiler_hir::Terminal;
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
