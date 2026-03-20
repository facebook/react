// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Validates that useEffect is not used for derived computations which could/should
//! be performed in render.
//!
//! See https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state
//!
//! Port of ValidateNoDerivedComputationsInEffects_exp.ts.

use std::collections::{HashMap, HashSet};

use react_compiler_diagnostics::{
    CompilerDiagnostic, CompilerDiagnosticDetail, CompilerError, ErrorCategory,
};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    is_set_state_type, is_use_effect_hook_type, is_use_ref_type, is_use_state_type,
    ArrayElement, BlockId, Effect, EvaluationOrder, FunctionId, HirFunction,
    IdentifierId, IdentifierName, InstructionValue, ParamPattern,
    ReactFunctionType, ReturnVariant, SourceLocation,
};

const MAX_FIXPOINT_ITERATIONS: usize = 100;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TypeOfValue {
    Ignored,
    FromProps,
    FromState,
    FromPropsAndState,
}

#[derive(Debug, Clone)]
struct DerivationMetadata {
    type_of_value: TypeOfValue,
    place_identifier: IdentifierId,
    place_name: Option<IdentifierName>,
    source_ids: indexmap::IndexSet<IdentifierId>,
    is_state_source: bool,
}

/// Metadata about a useEffect call site.
struct EffectMetadata {
    effect_func_id: FunctionId,
    dep_elements: Vec<DepElement>,
}

#[derive(Debug, Clone)]
struct DepElement {
    identifier: IdentifierId,
    loc: Option<SourceLocation>,
}

struct ValidationContext {
    /// Map from lvalue identifier to the FunctionId of function expressions
    functions: HashMap<IdentifierId, FunctionId>,
    /// Map from lvalue identifier to ArrayExpression elements (candidate deps)
    candidate_dependencies: HashMap<IdentifierId, Vec<DepElement>>,
    derivation_cache: DerivationCache,
    effects_cache: HashMap<IdentifierId, EffectMetadata>,
    set_state_loads: HashMap<IdentifierId, Option<IdentifierId>>,
    set_state_usages: HashMap<IdentifierId, HashSet<LocKey>>,
}

/// A hashable key for SourceLocation to use in HashSet
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct LocKey {
    start_line: u32,
    start_col: u32,
    end_line: u32,
    end_col: u32,
}

impl LocKey {
    fn from_loc(loc: &Option<SourceLocation>) -> Self {
        match loc {
            Some(loc) => LocKey {
                start_line: loc.start.line,
                start_col: loc.start.column,
                end_line: loc.end.line,
                end_col: loc.end.column,
            },
            None => LocKey {
                start_line: 0,
                start_col: 0,
                end_line: 0,
                end_col: 0,
            },
        }
    }
}

#[derive(Debug, Clone)]
struct DerivationCache {
    has_changes: bool,
    cache: HashMap<IdentifierId, DerivationMetadata>,
    previous_cache: Option<HashMap<IdentifierId, DerivationMetadata>>,
}

impl DerivationCache {
    fn new() -> Self {
        DerivationCache {
            has_changes: false,
            cache: HashMap::new(),
            previous_cache: None,
        }
    }

    fn take_snapshot(&mut self) {
        let mut prev = HashMap::new();
        for (key, value) in &self.cache {
            prev.insert(
                *key,
                DerivationMetadata {
                    place_identifier: value.place_identifier,
                    place_name: value.place_name.clone(),
                    source_ids: value.source_ids.clone(),
                    type_of_value: value.type_of_value,
                    is_state_source: value.is_state_source,
                },
            );
        }
        self.previous_cache = Some(prev);
    }

    fn check_for_changes(&mut self) {
        let prev = match &self.previous_cache {
            Some(p) => p,
            None => {
                self.has_changes = true;
                return;
            }
        };

        for (key, value) in &self.cache {
            match prev.get(key) {
                None => {
                    self.has_changes = true;
                    return;
                }
                Some(prev_value) => {
                    if !is_derivation_equal(prev_value, value) {
                        self.has_changes = true;
                        return;
                    }
                }
            }
        }

        if self.cache.len() != prev.len() {
            self.has_changes = true;
            return;
        }

        self.has_changes = false;
    }

    fn snapshot(&mut self) -> bool {
        let has_changes = self.has_changes;
        self.has_changes = false;
        has_changes
    }

    fn add_derivation_entry(
        &mut self,
        derived_id: IdentifierId,
        derived_name: Option<IdentifierName>,
        source_ids: indexmap::IndexSet<IdentifierId>,
        type_of_value: TypeOfValue,
        is_state_source: bool,
    ) {
        let mut final_is_source = is_state_source;
        if !final_is_source {
            for source_id in &source_ids {
                if let Some(source_metadata) = self.cache.get(source_id) {
                    if source_metadata.is_state_source
                        && !matches!(&source_metadata.place_name, Some(IdentifierName::Named(_)))
                    {
                        final_is_source = true;
                        break;
                    }
                }
            }
        }

        self.cache.insert(
            derived_id,
            DerivationMetadata {
                place_identifier: derived_id,
                place_name: derived_name,
                source_ids,
                type_of_value,
                is_state_source: final_is_source,
            },
        );
    }
}

fn is_derivation_equal(a: &DerivationMetadata, b: &DerivationMetadata) -> bool {
    if a.type_of_value != b.type_of_value {
        return false;
    }
    if a.source_ids.len() != b.source_ids.len() {
        return false;
    }
    for id in &a.source_ids {
        if !b.source_ids.contains(id) {
            return false;
        }
    }
    true
}

fn join_value(lvalue_type: TypeOfValue, value_type: TypeOfValue) -> TypeOfValue {
    if lvalue_type == TypeOfValue::Ignored {
        return value_type;
    }
    if value_type == TypeOfValue::Ignored {
        return lvalue_type;
    }
    if lvalue_type == value_type {
        return lvalue_type;
    }
    TypeOfValue::FromPropsAndState
}

fn get_root_set_state(
    key: IdentifierId,
    loads: &HashMap<IdentifierId, Option<IdentifierId>>,
    visited: &mut HashSet<IdentifierId>,
) -> Option<IdentifierId> {
    if visited.contains(&key) {
        return None;
    }
    visited.insert(key);

    match loads.get(&key) {
        None => None,
        Some(None) => Some(key),
        Some(Some(parent_id)) => get_root_set_state(*parent_id, loads, visited),
    }
}

/// Collects all lvalue IdentifierIds for an instruction.
/// This corresponds to TS eachInstructionLValue, which yields:
/// - The instruction's own lvalue
/// - For StoreLocal/DeclareLocal/StoreContext/DeclareContext: the value.lvalue.place
/// - For Destructure: all pattern places
/// - For PrefixUpdate/PostfixUpdate: value.lvalue
fn each_instruction_lvalue(instr: &react_compiler_hir::Instruction) -> Vec<IdentifierId> {
    let mut lvalues = vec![instr.lvalue.identifier];
    match &instr.value {
        InstructionValue::StoreLocal { lvalue, .. }
        | InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::StoreContext { lvalue, .. }
        | InstructionValue::DeclareContext { lvalue, .. } => {
            lvalues.push(lvalue.place.identifier);
        }
        InstructionValue::Destructure { lvalue, .. } => {
            collect_pattern_places(&lvalue.pattern, &mut lvalues);
        }
        InstructionValue::PrefixUpdate { lvalue, .. }
        | InstructionValue::PostfixUpdate { lvalue, .. } => {
            lvalues.push(lvalue.identifier);
        }
        _ => {}
    }
    lvalues
}

/// Collect all Place identifiers from a destructure pattern.
fn collect_pattern_places(
    pattern: &react_compiler_hir::Pattern,
    out: &mut Vec<IdentifierId>,
) {
    match pattern {
        react_compiler_hir::Pattern::Array(arr) => {
            for item in &arr.items {
                match item {
                    react_compiler_hir::ArrayPatternElement::Place(p) => {
                        out.push(p.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(s) => {
                        out.push(s.place.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        out.push(p.place.identifier);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        out.push(s.place.identifier);
                    }
                }
            }
        }
    }
}

fn maybe_record_set_state_for_instr(
    instr: &react_compiler_hir::Instruction,
    env: &Environment,
    set_state_loads: &mut HashMap<IdentifierId, Option<IdentifierId>>,
    set_state_usages: &mut HashMap<IdentifierId, HashSet<LocKey>>,
) {
    let identifiers = &env.identifiers;
    let types = &env.types;

    let all_lvalues = each_instruction_lvalue(instr);
    for &lvalue_id in &all_lvalues {
        // Check if this is a LoadLocal from a known setState
        if let InstructionValue::LoadLocal { place, .. } = &instr.value {
            if set_state_loads.contains_key(&place.identifier) {
                set_state_loads.insert(lvalue_id, Some(place.identifier));
            } else {
                // Only check root setState if not a LoadLocal from a known chain
                let lvalue_ident = &identifiers[lvalue_id.0 as usize];
                let lvalue_ty = &types[lvalue_ident.type_.0 as usize];
                if is_set_state_type(lvalue_ty) {
                    set_state_loads.insert(lvalue_id, None);
                }
            }
        } else {
            // Check if lvalue is a setState type (root setState)
            let lvalue_ident = &identifiers[lvalue_id.0 as usize];
            let lvalue_ty = &types[lvalue_ident.type_.0 as usize];
            if is_set_state_type(lvalue_ty) {
                set_state_loads.insert(lvalue_id, None);
            }
        }

        let root = get_root_set_state(lvalue_id, set_state_loads, &mut HashSet::new());
        if let Some(root_id) = root {
            set_state_usages
                .entry(root_id)
                .or_insert_with(|| {
                    let mut set = HashSet::new();
                    set.insert(LocKey::from_loc(&instr.lvalue.loc));
                    set
                });
        }
    }
}

fn is_mutable_at(env: &Environment, eval_order: EvaluationOrder, identifier_id: IdentifierId) -> bool {
    let range = &env.identifiers[identifier_id.0 as usize].mutable_range;
    eval_order >= range.start && eval_order < range.end
}

pub fn validate_no_derived_computations_in_effects_exp(
    func: &HirFunction,
    env: &Environment,
) -> CompilerError {
    let identifiers = &env.identifiers;

    let mut context = ValidationContext {
        functions: HashMap::new(),
        candidate_dependencies: HashMap::new(),
        derivation_cache: DerivationCache::new(),
        effects_cache: HashMap::new(),
        set_state_loads: HashMap::new(),
        set_state_usages: HashMap::new(),
    };

    // Initialize derivation cache based on function type
    if func.fn_type == ReactFunctionType::Hook {
        for param in &func.params {
            if let ParamPattern::Place(place) = param {
                let name = identifiers[place.identifier.0 as usize].name.clone();
                context.derivation_cache.cache.insert(
                    place.identifier,
                    DerivationMetadata {
                        place_identifier: place.identifier,
                        place_name: name,
                        source_ids: indexmap::IndexSet::new(),
                        type_of_value: TypeOfValue::FromProps,
                        is_state_source: true,
                    },
                );
            }
        }
    } else if func.fn_type == ReactFunctionType::Component {
        if let Some(param) = func.params.first() {
            if let ParamPattern::Place(place) = param {
                let name = identifiers[place.identifier.0 as usize].name.clone();
                context.derivation_cache.cache.insert(
                    place.identifier,
                    DerivationMetadata {
                        place_identifier: place.identifier,
                        place_name: name,
                        source_ids: indexmap::IndexSet::new(),
                        type_of_value: TypeOfValue::FromProps,
                        is_state_source: true,
                    },
                );
            }
        }
    }

    // Fixpoint iteration
    let mut is_first_pass = true;
    let mut iteration_count = 0;
    loop {
        context.derivation_cache.take_snapshot();

        for (_block_id, block) in &func.body.blocks {
            record_phi_derivations(block, &mut context, env);
            for &instr_id in &block.instructions {
                let instr = &func.instructions[instr_id.0 as usize];
                record_instruction_derivations(instr, &mut context, is_first_pass, func, env);
            }
        }

        context.derivation_cache.check_for_changes();
        is_first_pass = false;
        iteration_count += 1;
        assert!(
            iteration_count < MAX_FIXPOINT_ITERATIONS,
            "[ValidateNoDerivedComputationsInEffects] Fixpoint iteration failed to converge."
        );

        if !context.derivation_cache.snapshot() {
            break;
        }
    }

    // Validate all effect sites
    let mut errors = CompilerError::new();
    let effects_cache: Vec<(IdentifierId, FunctionId, Vec<DepElement>)> = context
        .effects_cache
        .iter()
        .map(|(k, v)| (*k, v.effect_func_id, v.dep_elements.clone()))
        .collect();

    for (_key, effect_func_id, dep_elements) in &effects_cache {
        validate_effect(
            *effect_func_id,
            dep_elements,
            &mut context,
            func,
            env,
            &mut errors,
        );
    }

    errors
}

fn record_phi_derivations(
    block: &react_compiler_hir::BasicBlock,
    context: &mut ValidationContext,
    env: &Environment,
) {
    let identifiers = &env.identifiers;
    for phi in &block.phis {
        let mut type_of_value = TypeOfValue::Ignored;
        let mut source_ids: indexmap::IndexSet<IdentifierId> = indexmap::IndexSet::new();

        for (_block_id, operand) in &phi.operands {
            if let Some(operand_metadata) = context.derivation_cache.cache.get(&operand.identifier) {
                type_of_value = join_value(type_of_value, operand_metadata.type_of_value);
                source_ids.insert(operand.identifier);
            }
        }

        if type_of_value != TypeOfValue::Ignored {
            let name = identifiers[phi.place.identifier.0 as usize].name.clone();
            context.derivation_cache.add_derivation_entry(
                phi.place.identifier,
                name,
                source_ids,
                type_of_value,
                false,
            );
        }
    }
}

fn record_instruction_derivations(
    instr: &react_compiler_hir::Instruction,
    context: &mut ValidationContext,
    is_first_pass: bool,
    outer_func: &HirFunction,
    env: &Environment,
) {
    let identifiers = &env.identifiers;
    let types = &env.types;
    let functions = &env.functions;
    let lvalue_id = instr.lvalue.identifier;

    // maybeRecordSetState
    maybe_record_set_state_for_instr(
        instr,
        env,
        &mut context.set_state_loads,
        &mut context.set_state_usages,
    );

    let mut type_of_value = TypeOfValue::Ignored;
    let is_source = false;
    let mut sources: indexmap::IndexSet<IdentifierId> = indexmap::IndexSet::new();

    match &instr.value {
        InstructionValue::FunctionExpression { lowered_func, .. } => {
            context.functions.insert(lvalue_id, lowered_func.func);
            // Recurse into the inner function
            let inner_func = &functions[lowered_func.func.0 as usize];
            for (_block_id, block) in &inner_func.body.blocks {
                record_phi_derivations(block, context, env);
                for &inner_instr_id in &block.instructions {
                    let inner_instr = &inner_func.instructions[inner_instr_id.0 as usize];
                    record_instruction_derivations(inner_instr, context, is_first_pass, inner_func, env);
                }
            }
        }
        InstructionValue::CallExpression { callee, args, .. } => {
            let callee_type = &types[identifiers[callee.identifier.0 as usize].type_.0 as usize];
            if is_use_effect_hook_type(callee_type)
                && args.len() == 2
            {
                if let (
                    react_compiler_hir::PlaceOrSpread::Place(arg0),
                    react_compiler_hir::PlaceOrSpread::Place(arg1),
                ) = (&args[0], &args[1])
                {
                    let effect_function = context.functions.get(&arg0.identifier).copied();
                    let deps = context.candidate_dependencies.get(&arg1.identifier).cloned();
                    if let (Some(effect_func_id), Some(dep_elements)) = (effect_function, deps) {
                        context.effects_cache.insert(
                            arg0.identifier,
                            EffectMetadata {
                                effect_func_id,
                                dep_elements,
                            },
                        );
                    }
                }
            }

            // Check if lvalue is useState type
            let lvalue_type = &types[identifiers[lvalue_id.0 as usize].type_.0 as usize];
            if is_use_state_type(lvalue_type) {
                let name = identifiers[lvalue_id.0 as usize].name.clone();
                context.derivation_cache.add_derivation_entry(
                    lvalue_id,
                    name,
                    indexmap::IndexSet::new(),
                    TypeOfValue::FromState,
                    true,
                );
                return;
            }
        }
        InstructionValue::MethodCall { property, args, .. } => {
            let prop_type = &types[identifiers[property.identifier.0 as usize].type_.0 as usize];
            if is_use_effect_hook_type(prop_type)
                && args.len() == 2
            {
                if let (
                    react_compiler_hir::PlaceOrSpread::Place(arg0),
                    react_compiler_hir::PlaceOrSpread::Place(arg1),
                ) = (&args[0], &args[1])
                {
                    let effect_function = context.functions.get(&arg0.identifier).copied();
                    let deps = context.candidate_dependencies.get(&arg1.identifier).cloned();
                    if let (Some(effect_func_id), Some(dep_elements)) = (effect_function, deps) {
                        context.effects_cache.insert(
                            arg0.identifier,
                            EffectMetadata {
                                effect_func_id,
                                dep_elements,
                            },
                        );
                    }
                }
            }

            // Check if lvalue is useState type
            let lvalue_type = &types[identifiers[lvalue_id.0 as usize].type_.0 as usize];
            if is_use_state_type(lvalue_type) {
                let name = identifiers[lvalue_id.0 as usize].name.clone();
                context.derivation_cache.add_derivation_entry(
                    lvalue_id,
                    name,
                    indexmap::IndexSet::new(),
                    TypeOfValue::FromState,
                    true,
                );
                return;
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            let dep_elements: Vec<DepElement> = elements
                .iter()
                .filter_map(|el| match el {
                    ArrayElement::Place(p) => Some(DepElement {
                        identifier: p.identifier,
                        loc: p.loc,
                    }),
                    _ => None,
                })
                .collect();
            context.candidate_dependencies.insert(lvalue_id, dep_elements);
        }
        _ => {}
    }

    // Collect operand derivations
    for (operand_id, operand_loc) in each_instruction_operand(instr, outer_func, env) {
        // Track setState usages
        if context.set_state_loads.contains_key(&operand_id) {
            let root = get_root_set_state(operand_id, &context.set_state_loads, &mut HashSet::new());
            if let Some(root_id) = root {
                if let Some(usages) = context.set_state_usages.get_mut(&root_id) {
                    usages.insert(LocKey::from_loc(&operand_loc));
                }
            }
        }

        if let Some(operand_metadata) = context.derivation_cache.cache.get(&operand_id) {
            type_of_value = join_value(type_of_value, operand_metadata.type_of_value);
            sources.insert(operand_id);
        }
    }

    if type_of_value == TypeOfValue::Ignored {
        return;
    }

    // Record derivation for ALL lvalue places (including destructured variables)
    for &lv_id in &each_instruction_lvalue(instr) {
        let name = identifiers[lv_id.0 as usize].name.clone();
        context.derivation_cache.add_derivation_entry(
            lv_id,
            name,
            sources.clone(),
            type_of_value,
            is_source,
        );
    }

    if matches!(&instr.value, InstructionValue::FunctionExpression { .. }) {
        // Don't record mutation effects for FunctionExpressions
        return;
    }

    // Handle mutable operands
    for operand in each_instruction_operand_with_effect(instr, outer_func, env) {
        match operand.effect {
            Effect::Capture
            | Effect::Store
            | Effect::ConditionallyMutate
            | Effect::ConditionallyMutateIterator
            | Effect::Mutate => {
                if is_mutable_at(env, instr.id, operand.id) {
                    if let Some(existing) = context.derivation_cache.cache.get_mut(&operand.id) {
                        existing.type_of_value =
                            join_value(type_of_value, existing.type_of_value);
                    } else {
                        let name = identifiers[operand.id.0 as usize].name.clone();
                        context.derivation_cache.add_derivation_entry(
                            operand.id,
                            name,
                            sources.clone(),
                            type_of_value,
                            false,
                        );
                    }
                }
            }
            Effect::Freeze | Effect::Read => {}
            Effect::Unknown => {
                panic!("Unexpected unknown effect");
            }
        }
    }
}

struct OperandWithEffect {
    id: IdentifierId,
    effect: Effect,
}

/// Collects operand (IdentifierId, loc) pairs from an instruction (simplified eachInstructionOperand).
fn each_instruction_operand(
    instr: &react_compiler_hir::Instruction,
    _func: &HirFunction,
    env: &Environment,
) -> Vec<(IdentifierId, Option<SourceLocation>)> {
    let mut operands = Vec::new();
    match &instr.value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            operands.push((place.identifier, place.loc));
        }
        InstructionValue::StoreLocal { value, .. }
        | InstructionValue::StoreContext { value, .. } => {
            operands.push((value.identifier, value.loc));
        }
        InstructionValue::Destructure { value, .. } => {
            operands.push((value.identifier, value.loc));
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::ComputedLoad { object, .. } => {
            operands.push((object.identifier, object.loc));
        }
        InstructionValue::PropertyStore { object, value, .. } => {
            operands.push((object.identifier, object.loc));
            operands.push((value.identifier, value.loc));
        }
        InstructionValue::ComputedStore { object, property, value, .. } => {
            operands.push((object.identifier, object.loc));
            operands.push((property.identifier, property.loc));
            operands.push((value.identifier, value.loc));
        }
        InstructionValue::CallExpression { callee, args, .. } => {
            operands.push((callee.identifier, callee.loc));
            for arg in args {
                if let react_compiler_hir::PlaceOrSpread::Place(p) = arg {
                    operands.push((p.identifier, p.loc));
                }
            }
        }
        InstructionValue::MethodCall {
            receiver, property, args, ..
        } => {
            operands.push((receiver.identifier, receiver.loc));
            operands.push((property.identifier, property.loc));
            for arg in args {
                if let react_compiler_hir::PlaceOrSpread::Place(p) = arg {
                    operands.push((p.identifier, p.loc));
                }
            }
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            operands.push((left.identifier, left.loc));
            operands.push((right.identifier, right.loc));
        }
        InstructionValue::UnaryExpression { value, .. } => {
            operands.push((value.identifier, value.loc));
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        operands.push((p.place.identifier, p.place.loc));
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        operands.push((s.place.identifier, s.place.loc));
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for el in elements {
                match el {
                    ArrayElement::Place(p) => operands.push((p.identifier, p.loc)),
                    ArrayElement::Spread(s) => operands.push((s.place.identifier, s.place.loc)),
                    ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for sub in subexprs {
                operands.push((sub.identifier, sub.loc));
            }
        }
        InstructionValue::JsxExpression { tag, props, children, .. } => {
            if let react_compiler_hir::JsxTag::Place(p) = tag {
                operands.push((p.identifier, p.loc));
            }
            for prop in props {
                match prop {
                    react_compiler_hir::JsxAttribute::Attribute { place, .. } => {
                        operands.push((place.identifier, place.loc));
                    }
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                        operands.push((argument.identifier, argument.loc));
                    }
                }
            }
            if let Some(children) = children {
                for child in children {
                    operands.push((child.identifier, child.loc));
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for child in children {
                operands.push((child.identifier, child.loc));
            }
        }
        InstructionValue::TypeCastExpression { value, .. } => {
            operands.push((value.identifier, value.loc));
        }
        InstructionValue::FunctionExpression { lowered_func, .. } => {
            let inner = &env.functions[lowered_func.func.0 as usize];
            for ctx in &inner.context {
                operands.push((ctx.identifier, ctx.loc));
            }
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            operands.push((tag.identifier, tag.loc));
        }
        _ => {}
    }
    operands
}

/// Collects operands with their effects
fn each_instruction_operand_with_effect(
    instr: &react_compiler_hir::Instruction,
    _func: &HirFunction,
    env: &Environment,
) -> Vec<OperandWithEffect> {
    let mut operands = Vec::new();
    match &instr.value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            operands.push(OperandWithEffect { id: place.identifier, effect: place.effect });
        }
        InstructionValue::StoreLocal { value, .. }
        | InstructionValue::StoreContext { value, .. } => {
            operands.push(OperandWithEffect { id: value.identifier, effect: value.effect });
        }
        InstructionValue::Destructure { value, .. } => {
            operands.push(OperandWithEffect { id: value.identifier, effect: value.effect });
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::ComputedLoad { object, .. } => {
            operands.push(OperandWithEffect { id: object.identifier, effect: object.effect });
        }
        InstructionValue::PropertyStore { object, value, .. } => {
            operands.push(OperandWithEffect { id: object.identifier, effect: object.effect });
            operands.push(OperandWithEffect { id: value.identifier, effect: value.effect });
        }
        InstructionValue::ComputedStore { object, property, value, .. } => {
            operands.push(OperandWithEffect { id: object.identifier, effect: object.effect });
            operands.push(OperandWithEffect { id: property.identifier, effect: property.effect });
            operands.push(OperandWithEffect { id: value.identifier, effect: value.effect });
        }
        InstructionValue::CallExpression { callee, args, .. } => {
            operands.push(OperandWithEffect { id: callee.identifier, effect: callee.effect });
            for arg in args {
                if let react_compiler_hir::PlaceOrSpread::Place(p) = arg {
                    operands.push(OperandWithEffect { id: p.identifier, effect: p.effect });
                }
            }
        }
        InstructionValue::MethodCall {
            receiver, property, args, ..
        } => {
            operands.push(OperandWithEffect { id: receiver.identifier, effect: receiver.effect });
            operands.push(OperandWithEffect { id: property.identifier, effect: property.effect });
            for arg in args {
                if let react_compiler_hir::PlaceOrSpread::Place(p) = arg {
                    operands.push(OperandWithEffect { id: p.identifier, effect: p.effect });
                }
            }
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            operands.push(OperandWithEffect { id: left.identifier, effect: left.effect });
            operands.push(OperandWithEffect { id: right.identifier, effect: right.effect });
        }
        InstructionValue::UnaryExpression { value, .. } => {
            operands.push(OperandWithEffect { id: value.identifier, effect: value.effect });
        }
        InstructionValue::FunctionExpression { lowered_func, .. } => {
            let inner = &env.functions[lowered_func.func.0 as usize];
            for ctx in &inner.context {
                operands.push(OperandWithEffect { id: ctx.identifier, effect: ctx.effect });
            }
        }
        _ => {}
    }
    operands
}

// =============================================================================
// Tree building and rendering (for error messages)
// =============================================================================

struct TreeNode {
    name: String,
    type_of_value: TypeOfValue,
    is_source: bool,
    children: Vec<TreeNode>,
}

fn build_tree_node(
    source_id: IdentifierId,
    context: &ValidationContext,
    visited: &HashSet<String>,
) -> Vec<TreeNode> {
    let source_metadata = match context.derivation_cache.cache.get(&source_id) {
        Some(m) => m,
        None => return Vec::new(),
    };

    if source_metadata.is_state_source {
        if let Some(IdentifierName::Named(name)) = &source_metadata.place_name {
            return vec![TreeNode {
                name: name.clone(),
                type_of_value: source_metadata.type_of_value,
                is_source: true,
                children: Vec::new(),
            }];
        }
    }

    let mut children: Vec<TreeNode> = Vec::new();
    let mut named_siblings: indexmap::IndexSet<String> = indexmap::IndexSet::new();

    for child_id in &source_metadata.source_ids {
        assert_ne!(
            *child_id, source_id,
            "Unexpected self-reference: a value should not have itself as a source"
        );

        let mut new_visited = visited.clone();
        if let Some(IdentifierName::Named(name)) = &source_metadata.place_name {
            new_visited.insert(name.clone());
        }

        let child_nodes = build_tree_node(*child_id, context, &new_visited);
        for child_node in child_nodes {
            if !named_siblings.contains(&child_node.name) {
                named_siblings.insert(child_node.name.clone());
                children.push(child_node);
            }
        }
    }

    if let Some(IdentifierName::Named(name)) = &source_metadata.place_name {
        if !visited.contains(name) {
            return vec![TreeNode {
                name: name.clone(),
                type_of_value: source_metadata.type_of_value,
                is_source: source_metadata.is_state_source,
                children,
            }];
        }
    }

    children
}

fn render_tree(
    node: &TreeNode,
    indent: &str,
    is_last: bool,
    props_set: &mut indexmap::IndexSet<String>,
    state_set: &mut indexmap::IndexSet<String>,
) -> String {
    let prefix = format!("{}{}", indent, if is_last { "\u{2514}\u{2500}\u{2500} " } else { "\u{251c}\u{2500}\u{2500} " });
    let child_indent = format!("{}{}", indent, if is_last { "    " } else { "\u{2502}   " });

    let mut result = format!("{}{}", prefix, node.name);

    if node.is_source {
        let type_label = match node.type_of_value {
            TypeOfValue::FromProps => {
                props_set.insert(node.name.clone());
                "Prop"
            }
            TypeOfValue::FromState => {
                state_set.insert(node.name.clone());
                "State"
            }
            _ => {
                props_set.insert(node.name.clone());
                state_set.insert(node.name.clone());
                "Prop and State"
            }
        };
        result += &format!(" ({})", type_label);
    }

    if !node.children.is_empty() {
        result += "\n";
        for (index, child) in node.children.iter().enumerate() {
            let is_last_child = index == node.children.len() - 1;
            result += &render_tree(child, &child_indent, is_last_child, props_set, state_set);
            if index < node.children.len() - 1 {
                result += "\n";
            }
        }
    }

    result
}

fn get_fn_local_deps(
    func_id: Option<FunctionId>,
    env: &Environment,
) -> Option<HashSet<IdentifierId>> {
    let func_id = func_id?;
    let inner = &env.functions[func_id.0 as usize];
    let mut deps: HashSet<IdentifierId> = HashSet::new();

    for (_block_id, block) in &inner.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &inner.instructions[instr_id.0 as usize];
            if let InstructionValue::LoadLocal { place, .. } = &instr.value {
                deps.insert(place.identifier);
            }
        }
    }

    Some(deps)
}

fn validate_effect(
    effect_func_id: FunctionId,
    dependencies: &[DepElement],
    context: &mut ValidationContext,
    _outer_func: &HirFunction,
    env: &Environment,
    errors: &mut CompilerError,
) {
    let identifiers = &env.identifiers;
    let types = &env.types;
    let functions = &env.functions;
    let effect_function = &functions[effect_func_id.0 as usize];

    let mut seen_blocks: HashSet<BlockId> = HashSet::new();

    struct DerivedSetStateCall {
        callee_loc: Option<SourceLocation>,
        callee_id: IdentifierId,
        source_ids: indexmap::IndexSet<IdentifierId>,
    }

    let mut effect_derived_set_state_calls: Vec<DerivedSetStateCall> = Vec::new();
    let mut effect_set_state_usages: HashMap<IdentifierId, HashSet<LocKey>> = HashMap::new();

    // Consider setStates in the effect's dependency array as being part of effectSetStateUsages
    for dep in dependencies {
        let root = get_root_set_state(dep.identifier, &context.set_state_loads, &mut HashSet::new());
        if let Some(root_id) = root {
            let mut set = HashSet::new();
            set.insert(LocKey::from_loc(&dep.loc));
            effect_set_state_usages.insert(root_id, set);
        }
    }

    let mut cleanup_function_deps: Option<HashSet<IdentifierId>> = None;
    let mut globals: HashSet<IdentifierId> = HashSet::new();

    for (_block_id, block) in &effect_function.body.blocks {
        // Check for return -> cleanup function
        if let react_compiler_hir::Terminal::Return {
            value,
            return_variant: ReturnVariant::Explicit,
            ..
        } = &block.terminal
        {
            let func_id = context.functions.get(&value.identifier).copied();
            cleanup_function_deps = get_fn_local_deps(func_id, env);
        }

        // Skip if block has a back edge (pred not yet seen)
        let has_back_edge = block.preds.iter().any(|pred| !seen_blocks.contains(pred));
        if has_back_edge {
            return;
        }

        for &instr_id in &block.instructions {
            let instr = &effect_function.instructions[instr_id.0 as usize];

            // Early return if any instruction derives from a ref
            let lvalue_type = &types[identifiers[instr.lvalue.identifier.0 as usize].type_.0 as usize];
            if is_use_ref_type(lvalue_type) {
                return;
            }

            // maybeRecordSetState for effect instructions
            maybe_record_set_state_for_instr(
                instr,
                env,
                &mut context.set_state_loads,
                &mut effect_set_state_usages,
            );

            // Track setState usages for operands
            for (operand_id, operand_loc) in each_instruction_operand(instr, effect_function, env) {
                if context.set_state_loads.contains_key(&operand_id) {
                    let root = get_root_set_state(
                        operand_id,
                        &context.set_state_loads,
                        &mut HashSet::new(),
                    );
                    if let Some(root_id) = root {
                        if let Some(usages) = effect_set_state_usages.get_mut(&root_id) {
                            usages.insert(LocKey::from_loc(&operand_loc));
                        }
                    }
                }
            }

            match &instr.value {
                InstructionValue::CallExpression { callee, args, .. } => {
                    let callee_type =
                        &types[identifiers[callee.identifier.0 as usize].type_.0 as usize];
                    if is_set_state_type(callee_type)
                        && args.len() == 1
                    {
                        if let react_compiler_hir::PlaceOrSpread::Place(arg0) = &args[0] {
                            let callee_metadata =
                                context.derivation_cache.cache.get(&callee.identifier);

                            // If the setState comes from a source other than local state, skip
                            if let Some(cm) = callee_metadata {
                                if cm.type_of_value != TypeOfValue::FromState {
                                    continue;
                                }
                            } else {
                                continue;
                            }

                            let arg_metadata =
                                context.derivation_cache.cache.get(&arg0.identifier);
                            if let Some(am) = arg_metadata {
                                effect_derived_set_state_calls.push(DerivedSetStateCall {
                                    callee_loc: callee.loc,
                                    callee_id: callee.identifier,
                                    source_ids: am.source_ids.clone(),
                                });
                            }
                        }
                    } else {
                        // Check if callee is from props/propsAndState -> bail
                        let callee_metadata =
                            context.derivation_cache.cache.get(&callee.identifier);
                        if let Some(cm) = callee_metadata {
                            if cm.type_of_value == TypeOfValue::FromProps
                                || cm.type_of_value == TypeOfValue::FromPropsAndState
                            {
                                return;
                            }
                        }

                        if globals.contains(&callee.identifier) {
                            return;
                        }
                    }
                }
                InstructionValue::LoadGlobal { .. } => {
                    globals.insert(instr.lvalue.identifier);
                    for (operand_id, _) in each_instruction_operand(instr, effect_function, env) {
                        globals.insert(operand_id);
                    }
                }
                _ => {}
            }
        }
        seen_blocks.insert(block.id);
    }

    // Emit errors for derived setState calls
    for derived in &effect_derived_set_state_calls {
        let root_set_state_call = get_root_set_state(
            derived.callee_id,
            &context.set_state_loads,
            &mut HashSet::new(),
        );
        if let Some(root_id) = root_set_state_call {
            let effect_usage_count = effect_set_state_usages
                .get(&root_id)
                .map(|s| s.len())
                .unwrap_or(0);
            let total_usage_count = context
                .set_state_usages
                .get(&root_id)
                .map(|s| s.len())
                .unwrap_or(0);
            if effect_set_state_usages.contains_key(&root_id)
                && context.set_state_usages.contains_key(&root_id)
                && effect_usage_count == total_usage_count - 1
            {
                let mut props_set: indexmap::IndexSet<String> = indexmap::IndexSet::new();
                let mut state_set: indexmap::IndexSet<String> = indexmap::IndexSet::new();

                let mut root_nodes_map: indexmap::IndexMap<String, TreeNode> =
                    indexmap::IndexMap::new();
                for id in &derived.source_ids {
                    let nodes = build_tree_node(*id, context, &HashSet::new());
                    for node in nodes {
                        if !root_nodes_map.contains_key(&node.name) {
                            root_nodes_map.insert(node.name.clone(), node);
                        }
                    }
                }
                let root_nodes: Vec<&TreeNode> = root_nodes_map.values().collect();

                let trees: Vec<String> = root_nodes
                    .iter()
                    .enumerate()
                    .map(|(index, node)| {
                        render_tree(
                            node,
                            "",
                            index == root_nodes.len() - 1,
                            &mut props_set,
                            &mut state_set,
                        )
                    })
                    .collect();

                // Check cleanup function dependencies
                let should_skip = if let Some(ref cleanup_deps) = cleanup_function_deps {
                    derived.source_ids.iter().any(|dep| cleanup_deps.contains(dep))
                } else {
                    false
                };
                if should_skip {
                    return;
                }

                let mut root_sources = String::new();
                if !props_set.is_empty() {
                    let props_list: Vec<&str> = props_set.iter().map(|s| s.as_str()).collect();
                    root_sources += &format!("Props: [{}]", props_list.join(", "));
                }
                if !state_set.is_empty() {
                    if !root_sources.is_empty() {
                        root_sources += "\n";
                    }
                    let state_list: Vec<&str> = state_set.iter().map(|s| s.as_str()).collect();
                    root_sources += &format!("State: [{}]", state_list.join(", "));
                }

                let description = format!(
                    "Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\n\
                     This setState call is setting a derived value that depends on the following reactive sources:\n\n\
                     {}\n\n\
                     Data Flow Tree:\n\
                     {}\n\n\
                     See: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state",
                    root_sources,
                    trees.join("\n"),
                );

                errors.push_diagnostic(
                    CompilerDiagnostic::new(
                        ErrorCategory::EffectDerivationsOfState,
                        "You might not need an effect. Derive values in render, not effects.",
                        Some(description),
                    )
                    .with_detail(CompilerDiagnosticDetail::Error {
                        loc: derived.callee_loc,
                        message: Some(
                            "This should be computed during render, not in an effect".to_string(),
                        ),
                    }),
                );
            }
        }
    }
}

