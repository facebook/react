// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Infers which variables belong to reactive scopes.
//!
//! Ported from TypeScript `src/ReactiveScopes/InferReactiveScopeVariables.ts`.
//!
//! This is the 1st of 4 passes that determine how to break a function into
//! discrete reactive scopes (independently memoizable units of code):
//! 1. InferReactiveScopeVariables (this pass, on HIR) determines operands that
//!    mutate together and assigns them a unique reactive scope.
//! 2. AlignReactiveScopesToBlockScopes aligns reactive scopes to block scopes.
//! 3. MergeOverlappingReactiveScopes ensures scopes do not overlap.
//! 4. BuildReactiveBlocks groups the statements for each scope.

use std::collections::HashMap;

use indexmap::IndexMap;
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    ArrayElement, ArrayPatternElement, DeclarationId, EvaluationOrder, HirFunction, IdentifierId,
    InstructionValue, JsxAttribute, JsxTag, MutableRange, ObjectPropertyKey,
    ObjectPropertyOrSpread, Pattern, PlaceOrSpread, Position, SourceLocation,
};

// =============================================================================
// DisjointSet<IdentifierId>
// =============================================================================

/// A Union-Find data structure for grouping IdentifierIds into disjoint sets.
///
/// Corresponds to TS `DisjointSet<Identifier>` in `src/Utils/DisjointSet.ts`.
/// Uses IdentifierId (Copy) as the key instead of reference identity.
pub(crate) struct DisjointSet {
    /// Maps each item to its parent. A root points to itself.
    /// Uses IndexMap to preserve insertion order (matching TS Map behavior).
    pub(crate) entries: IndexMap<IdentifierId, IdentifierId>,
}

impl DisjointSet {
    pub(crate) fn new() -> Self {
        DisjointSet {
            entries: IndexMap::new(),
        }
    }

    /// Find the root of the set containing `item`, with path compression.
    pub(crate) fn find(&mut self, item: IdentifierId) -> IdentifierId {
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

    /// Union all items into one set.
    pub(crate) fn union(&mut self, items: &[IdentifierId]) {
        if items.is_empty() {
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

    /// Iterate over all (item, group_root) pairs.
    fn for_each<F>(&mut self, mut f: F)
    where
        F: FnMut(IdentifierId, IdentifierId),
    {
        // Collect keys first to avoid borrow issues during find()
        let keys: Vec<IdentifierId> = self.entries.keys().copied().collect();
        for item in keys {
            let group = self.find(item);
            f(item, group);
        }
    }
}

// =============================================================================
// Public API
// =============================================================================

/// Infer reactive scope variables for a function.
///
/// For each mutable variable, infers a reactive scope which will construct that
/// variable. Variables that co-mutate are assigned to the same reactive scope.
///
/// Corresponds to TS `inferReactiveScopeVariables(fn: HIRFunction): void`.
pub fn infer_reactive_scope_variables(func: &mut HirFunction, env: &mut Environment) {
    // Phase 1: find disjoint sets of co-mutating identifiers
    let mut scope_identifiers = find_disjoint_mutable_values(func, env);

    // Phase 2: assign scopes
    // Maps each group root identifier to the ScopeId assigned to that group.
    let mut scopes: HashMap<IdentifierId, ScopeState> = HashMap::new();

    scope_identifiers.for_each(|identifier_id, group_id| {
        let ident_range = env.identifiers[identifier_id.0 as usize].mutable_range.clone();
        let ident_loc = env.identifiers[identifier_id.0 as usize].loc;

        let state = scopes.entry(group_id).or_insert_with(|| {
            let scope_id = env.next_scope_id();
            // Initialize scope range from the first member
            let scope = &mut env.scopes[scope_id.0 as usize];
            scope.range = ident_range.clone();
            ScopeState {
                scope_id,
                loc: ident_loc,
            }
        });

        // Update scope range
        let scope = &mut env.scopes[state.scope_id.0 as usize];

        // If this is not the first identifier (scope was already created), merge ranges
        if scope.range.start != ident_range.start || scope.range.end != ident_range.end {
            if scope.range.start == EvaluationOrder(0) {
                scope.range.start = ident_range.start;
            } else if ident_range.start != EvaluationOrder(0) {
                scope.range.start =
                    EvaluationOrder(scope.range.start.0.min(ident_range.start.0));
            }
            scope.range.end = EvaluationOrder(scope.range.end.0.max(ident_range.end.0));
        }

        // Merge location
        state.loc = merge_location(state.loc, ident_loc);

        // Assign the scope to this identifier
        let scope_id = state.scope_id;
        env.identifiers[identifier_id.0 as usize].scope = Some(scope_id);
    });

    // Set loc on each scope
    for (_group_id, state) in &scopes {
        env.scopes[state.scope_id.0 as usize].loc = state.loc;
    }

    // Update each identifier's mutable_range to match its scope's range
    for (&_identifier_id, state) in &scopes {
        let scope_range = env.scopes[state.scope_id.0 as usize].range.clone();
        // Find all identifiers with this scope and update their mutable_range
        // We iterate through all identifiers and check their scope
        for ident in &mut env.identifiers {
            if ident.scope == Some(state.scope_id) {
                ident.mutable_range = scope_range.clone();
            }
        }
    }

    // Validate scope ranges
    let mut max_instruction = EvaluationOrder(0);
    for (_block_id, block) in &func.body.blocks {
        for instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            max_instruction = EvaluationOrder(max_instruction.0.max(instr.id.0));
        }
        max_instruction = EvaluationOrder(max_instruction.0.max(block.terminal.evaluation_order().0));
    }

    for (_group_id, state) in &scopes {
        let scope = &env.scopes[state.scope_id.0 as usize];
        if scope.range.start == EvaluationOrder(0)
            || scope.range.end == EvaluationOrder(0)
            || max_instruction == EvaluationOrder(0)
            || scope.range.end.0 > max_instruction.0 + 1
        {
            panic!(
                "Invalid mutable range for scope: Scope @{} has range [{}:{}] but the valid range is [1:{}]",
                scope.id.0,
                scope.range.start.0,
                scope.range.end.0,
                max_instruction.0 + 1,
            );
        }
    }
}

struct ScopeState {
    scope_id: react_compiler_hir::ScopeId,
    loc: Option<SourceLocation>,
}

/// Merge two source locations, preferring non-None values.
/// Corresponds to TS `mergeLocation`.
fn merge_location(
    l: Option<SourceLocation>,
    r: Option<SourceLocation>,
) -> Option<SourceLocation> {
    match (l, r) {
        (None, r) => r,
        (l, None) => l,
        (Some(l), Some(r)) => Some(SourceLocation {
            start: Position {
                line: l.start.line.min(r.start.line),
                column: l.start.column.min(r.start.column),
            },
            end: Position {
                line: l.end.line.max(r.end.line),
                column: l.end.column.max(r.end.column),
            },
        }),
    }
}

// =============================================================================
// is_mutable / in_range helpers
// =============================================================================

/// Check if a place is mutable at the given instruction.
/// Corresponds to TS `isMutable(instr, place)`.
pub(crate) fn is_mutable(instr_id: EvaluationOrder, range: &MutableRange) -> bool {
    in_range(instr_id, range)
}

/// Check if an evaluation order is within a mutable range.
/// Corresponds to TS `inRange({id}, range)`.
fn in_range(id: EvaluationOrder, range: &MutableRange) -> bool {
    id >= range.start && id < range.end
}

// =============================================================================
// may_allocate
// =============================================================================

/// Check if an instruction may allocate. Corresponds to TS `mayAllocate`.
fn may_allocate(value: &InstructionValue, lvalue_type_is_primitive: bool) -> bool {
    match value {
        InstructionValue::Destructure { lvalue, .. } => {
            does_pattern_contain_spread_element(&lvalue.pattern)
        }
        InstructionValue::PostfixUpdate { .. }
        | InstructionValue::PrefixUpdate { .. }
        | InstructionValue::Await { .. }
        | InstructionValue::DeclareLocal { .. }
        | InstructionValue::DeclareContext { .. }
        | InstructionValue::StoreLocal { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::TypeCastExpression { .. }
        | InstructionValue::LoadLocal { .. }
        | InstructionValue::LoadContext { .. }
        | InstructionValue::StoreContext { .. }
        | InstructionValue::PropertyDelete { .. }
        | InstructionValue::ComputedLoad { .. }
        | InstructionValue::ComputedDelete { .. }
        | InstructionValue::JSXText { .. }
        | InstructionValue::TemplateLiteral { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::GetIterator { .. }
        | InstructionValue::IteratorNext { .. }
        | InstructionValue::NextPropertyOf { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::StartMemoize { .. }
        | InstructionValue::FinishMemoize { .. }
        | InstructionValue::UnaryExpression { .. }
        | InstructionValue::BinaryExpression { .. }
        | InstructionValue::PropertyLoad { .. }
        | InstructionValue::StoreGlobal { .. } => false,

        InstructionValue::TaggedTemplateExpression { .. }
        | InstructionValue::CallExpression { .. }
        | InstructionValue::MethodCall { .. } => !lvalue_type_is_primitive,

        InstructionValue::RegExpLiteral { .. }
        | InstructionValue::PropertyStore { .. }
        | InstructionValue::ComputedStore { .. }
        | InstructionValue::ArrayExpression { .. }
        | InstructionValue::JsxExpression { .. }
        | InstructionValue::JsxFragment { .. }
        | InstructionValue::NewExpression { .. }
        | InstructionValue::ObjectExpression { .. }
        | InstructionValue::UnsupportedNode { .. }
        | InstructionValue::ObjectMethod { .. }
        | InstructionValue::FunctionExpression { .. } => true,
    }
}

// =============================================================================
// Pattern helpers
// =============================================================================

/// Check if a pattern contains a spread element.
/// Corresponds to TS `doesPatternContainSpreadElement`.
fn does_pattern_contain_spread_element(pattern: &Pattern) -> bool {
    match pattern {
        Pattern::Array(array) => {
            for item in &array.items {
                if matches!(item, ArrayPatternElement::Spread(_)) {
                    return true;
                }
            }
            false
        }
        Pattern::Object(obj) => {
            for prop in &obj.properties {
                if matches!(prop, ObjectPropertyOrSpread::Spread(_)) {
                    return true;
                }
            }
            false
        }
    }
}

/// Collect all Place identifiers from a destructure pattern.
/// Corresponds to TS `eachPatternOperand`.
fn each_pattern_operand(pattern: &Pattern) -> Vec<IdentifierId> {
    let mut result = Vec::new();
    match pattern {
        Pattern::Array(array) => {
            for item in &array.items {
                match item {
                    ArrayPatternElement::Place(place) => {
                        result.push(place.identifier);
                    }
                    ArrayPatternElement::Spread(spread) => {
                        result.push(spread.place.identifier);
                    }
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => {
                        result.push(p.place.identifier);
                    }
                    ObjectPropertyOrSpread::Spread(spread) => {
                        result.push(spread.place.identifier);
                    }
                }
            }
        }
    }
    result
}

/// Collect all operand identifiers from an instruction value.
/// Corresponds to TS `eachInstructionValueOperand`.
fn each_instruction_value_operand(
    value: &InstructionValue,
    env: &Environment,
) -> Vec<IdentifierId> {
    let mut result = Vec::new();
    match value {
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
        InstructionValue::BinaryExpression { left, right, .. } => {
            result.push(left.identifier);
            result.push(right.identifier);
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
        InstructionValue::DeclareContext { .. } | InstructionValue::DeclareLocal { .. } => {}
        InstructionValue::LoadLocal { place, .. } | InstructionValue::LoadContext { place, .. } => {
            result.push(place.identifier);
        }
        InstructionValue::StoreLocal { value: val, .. } => {
            result.push(val.identifier);
        }
        InstructionValue::StoreContext {
            lvalue, value: val, ..
        } => {
            result.push(lvalue.place.identifier);
            result.push(val.identifier);
        }
        InstructionValue::StoreGlobal { value: val, .. } => {
            result.push(val.identifier);
        }
        InstructionValue::Destructure { value: val, .. } => {
            result.push(val.identifier);
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::PropertyDelete { object, .. } => {
            result.push(object.identifier);
        }
        InstructionValue::PropertyStore {
            object, value: val, ..
        } => {
            result.push(object.identifier);
            result.push(val.identifier);
        }
        InstructionValue::ComputedLoad {
            object, property, ..
        }
        | InstructionValue::ComputedDelete {
            object, property, ..
        } => {
            result.push(object.identifier);
            result.push(property.identifier);
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value: val,
            ..
        } => {
            result.push(object.identifier);
            result.push(property.identifier);
            result.push(val.identifier);
        }
        InstructionValue::UnaryExpression { value: val, .. } => {
            result.push(val.identifier);
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
            for attr in props {
                match attr {
                    JsxAttribute::Attribute { place, .. } => {
                        result.push(place.identifier);
                    }
                    JsxAttribute::SpreadAttribute { argument } => {
                        result.push(argument.identifier);
                    }
                }
            }
            if let Some(children) = children {
                for child in children {
                    result.push(child.identifier);
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for child in children {
                result.push(child.identifier);
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => {
                        if let ObjectPropertyKey::Computed { name } = &p.key {
                            result.push(name.identifier);
                        }
                        result.push(p.place.identifier);
                    }
                    ObjectPropertyOrSpread::Spread(s) => {
                        result.push(s.place.identifier);
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for element in elements {
                match element {
                    ArrayElement::Place(p) => result.push(p.identifier),
                    ArrayElement::Spread(s) => result.push(s.place.identifier),
                    ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::ObjectMethod { lowered_func, .. }
        | InstructionValue::FunctionExpression { lowered_func, .. } => {
            let inner = &env.functions[lowered_func.func.0 as usize];
            for ctx in &inner.context {
                result.push(ctx.identifier);
            }
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            result.push(tag.identifier);
        }
        InstructionValue::TypeCastExpression { value: val, .. } => {
            result.push(val.identifier);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for subexpr in subexprs {
                result.push(subexpr.identifier);
            }
        }
        InstructionValue::Await { value: val, .. } => {
            result.push(val.identifier);
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
        InstructionValue::NextPropertyOf { value: val, .. } => {
            result.push(val.identifier);
        }
        InstructionValue::PostfixUpdate { value: val, .. }
        | InstructionValue::PrefixUpdate { value: val, .. } => {
            result.push(val.identifier);
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps {
                    if let react_compiler_hir::ManualMemoDependencyRoot::NamedLocal {
                        value, ..
                    } = &dep.root
                    {
                        result.push(value.identifier);
                    }
                }
            }
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            result.push(decl.identifier);
        }
        InstructionValue::Debugger { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::UnsupportedNode { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::JSXText { .. } => {}
    }
    result
}

// =============================================================================
// findDisjointMutableValues
// =============================================================================

/// Find disjoint sets of co-mutating identifier IDs.
///
/// Corresponds to TS `findDisjointMutableValues(fn: HIRFunction): DisjointSet<Identifier>`.
pub(crate) fn find_disjoint_mutable_values(func: &HirFunction, env: &Environment) -> DisjointSet {
    let mut scope_identifiers = DisjointSet::new();
    let mut declarations: HashMap<DeclarationId, IdentifierId> = HashMap::new();

    let enable_forest = env.config.enable_forest;

    for (_block_id, block) in &func.body.blocks {
        // Handle phi nodes
        for phi in &block.phis {
            let phi_id = phi.place.identifier;
            let phi_range = &env.identifiers[phi_id.0 as usize].mutable_range;
            let phi_decl_id = env.identifiers[phi_id.0 as usize].declaration_id;

            let first_instr_id = block
                .instructions
                .first()
                .map(|iid| func.instructions[iid.0 as usize].id)
                .unwrap_or(block.terminal.evaluation_order());

            if phi_range.start.0 + 1 != phi_range.end.0
                && phi_range.end > first_instr_id
            {
                let mut operands = vec![phi_id];
                if let Some(&decl_id) = declarations.get(&phi_decl_id) {
                    operands.push(decl_id);
                }
                for (_pred_id, phi_operand) in &phi.operands {
                    operands.push(phi_operand.identifier);
                }
                scope_identifiers.union(&operands);
            } else if enable_forest {
                for (_pred_id, phi_operand) in &phi.operands {
                    scope_identifiers.union(&[phi_id, phi_operand.identifier]);
                }
            }
        }

        // Handle instructions
        for instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            let mut operands: Vec<IdentifierId> = Vec::new();

            let lvalue_id = instr.lvalue.identifier;
            let lvalue_range = &env.identifiers[lvalue_id.0 as usize].mutable_range;
            let lvalue_type = &env.types[env.identifiers[lvalue_id.0 as usize].type_.0 as usize];
            let lvalue_type_is_primitive = react_compiler_hir::is_primitive_type(lvalue_type);

            if lvalue_range.end.0 > lvalue_range.start.0 + 1
                || may_allocate(&instr.value, lvalue_type_is_primitive)
            {
                operands.push(lvalue_id);
            }

            match &instr.value {
                InstructionValue::DeclareLocal { lvalue, .. }
                | InstructionValue::DeclareContext { lvalue, .. } => {
                    let place_id = lvalue.place.identifier;
                    let decl_id = env.identifiers[place_id.0 as usize].declaration_id;
                    declarations.entry(decl_id).or_insert(place_id);
                }
                InstructionValue::StoreLocal { lvalue, value, .. }
                | InstructionValue::StoreContext { lvalue, value, .. } => {
                    let place_id = lvalue.place.identifier;
                    let decl_id = env.identifiers[place_id.0 as usize].declaration_id;
                    declarations.entry(decl_id).or_insert(place_id);

                    let place_range =
                        &env.identifiers[place_id.0 as usize].mutable_range;
                    if place_range.end.0 > place_range.start.0 + 1 {
                        operands.push(place_id);
                    }

                    let value_range =
                        &env.identifiers[value.identifier.0 as usize].mutable_range;
                    if is_mutable(instr.id, value_range)
                        && value_range.start.0 > 0
                    {
                        operands.push(value.identifier);
                    }
                }
                InstructionValue::Destructure { lvalue, value, .. } => {
                    let pattern_places = each_pattern_operand(&lvalue.pattern);
                    for place_id in &pattern_places {
                        let decl_id = env.identifiers[place_id.0 as usize].declaration_id;
                        declarations.entry(decl_id).or_insert(*place_id);

                        let place_range =
                            &env.identifiers[place_id.0 as usize].mutable_range;
                        if place_range.end.0 > place_range.start.0 + 1 {
                            operands.push(*place_id);
                        }
                    }

                    let value_range =
                        &env.identifiers[value.identifier.0 as usize].mutable_range;
                    if is_mutable(instr.id, value_range)
                        && value_range.start.0 > 0
                    {
                        operands.push(value.identifier);
                    }
                }
                InstructionValue::MethodCall { property, .. } => {
                    // For MethodCall: include all mutable operands plus the computed property
                    let all_operands =
                        each_instruction_value_operand(&instr.value, env);
                    for op_id in &all_operands {
                        let op_range =
                            &env.identifiers[op_id.0 as usize].mutable_range;
                        if is_mutable(instr.id, op_range) && op_range.start.0 > 0 {
                            operands.push(*op_id);
                        }
                    }
                    // Ensure method property is in the same scope as the call
                    operands.push(property.identifier);
                }
                _ => {
                    // For all other instructions: include mutable operands
                    let all_operands =
                        each_instruction_value_operand(&instr.value, env);
                    for op_id in &all_operands {
                        let op_range =
                            &env.identifiers[op_id.0 as usize].mutable_range;
                        if is_mutable(instr.id, op_range) && op_range.start.0 > 0 {
                            operands.push(*op_id);
                        }
                    }
                }
            }

            if !operands.is_empty() {
                scope_identifiers.union(&operands);
            }
        }
    }
    scope_identifiers
}
