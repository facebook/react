// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! ExtractScopeDeclarationsFromDestructuring — handles destructuring patterns
//! where some bindings are scope declarations and others aren't.
//!
//! Corresponds to `src/ReactiveScopes/ExtractScopeDeclarationsFromDestructuring.ts`.

use std::collections::HashSet;

use react_compiler_hir::{
    ArrayPatternElement, DeclarationId, IdentifierId, IdentifierName,
    InstructionKind, InstructionValue, LValue, ObjectPropertyOrSpread, ParamPattern, Pattern,
    Place, ReactiveFunction, ReactiveInstruction, ReactiveStatement,
    ReactiveValue, ReactiveScopeBlock,
    environment::Environment,
};

use crate::visitors::{ReactiveFunctionTransform, Transformed, transform_reactive_function};

// =============================================================================
// Public entry point
// =============================================================================

/// Extracts scope declarations from destructuring patterns where some bindings
/// are scope declarations and others aren't.
/// TS: `extractScopeDeclarationsFromDestructuring`
pub fn extract_scope_declarations_from_destructuring(
    func: &mut ReactiveFunction,
    env: &mut Environment,
) {
    let mut declared: HashSet<DeclarationId> = HashSet::new();
    for param in &func.params {
        let place = match param {
            ParamPattern::Place(p) => p,
            ParamPattern::Spread(s) => &s.place,
        };
        let identifier = &env.identifiers[place.identifier.0 as usize];
        declared.insert(identifier.declaration_id);
    }
    let mut transform = Transform;
    let mut state = ExtractState { env_ptr: env as *mut Environment, declared };
    transform_reactive_function(func, &mut transform, &mut state);
}

struct ExtractState {
    /// We need raw pointer to Environment since the transform trait gives us
    /// &mut State and we need to call Environment methods. This is safe because
    /// we only access env through this pointer during transform callbacks.
    env_ptr: *mut Environment,
    declared: HashSet<DeclarationId>,
}

impl ExtractState {
    fn env(&self) -> &Environment {
        unsafe { &*self.env_ptr }
    }
    fn env_mut(&mut self) -> &mut Environment {
        unsafe { &mut *self.env_ptr }
    }
}

struct Transform;

impl ReactiveFunctionTransform for Transform {
    type State = ExtractState;

    fn visit_scope(&mut self, scope: &mut ReactiveScopeBlock, state: &mut ExtractState) {
        let scope_data = &state.env().scopes[scope.scope.0 as usize];
        let decl_ids: Vec<DeclarationId> = scope_data
            .declarations
            .iter()
            .map(|(_, d)| {
                let identifier = &state.env().identifiers[d.identifier.0 as usize];
                identifier.declaration_id
            })
            .collect();
        for decl_id in decl_ids {
            state.declared.insert(decl_id);
        }
        self.traverse_scope(scope, state);
    }

    fn transform_instruction(
        &mut self,
        instruction: &mut ReactiveInstruction,
        state: &mut ExtractState,
    ) -> Transformed<ReactiveStatement> {
        self.visit_instruction(instruction, state);

        let mut extra_instructions: Option<Vec<ReactiveInstruction>> = None;

        if let ReactiveValue::Instruction(InstructionValue::Destructure {
            lvalue,
            value: _destr_value,
            loc,
        }) = &mut instruction.value
        {
            // Check if this is a mixed destructuring (some declared, some not)
            let mut reassigned: HashSet<IdentifierId> = HashSet::new();
            let mut has_declaration = false;

            for place in each_pattern_operand(&lvalue.pattern) {
                let identifier = &state.env().identifiers[place.identifier.0 as usize];
                if state.declared.contains(&identifier.declaration_id) {
                    reassigned.insert(place.identifier);
                } else {
                    has_declaration = true;
                }
            }

            if !has_declaration {
                // All reassignments
                lvalue.kind = InstructionKind::Reassign;
            } else if !reassigned.is_empty() {
                // Mixed: replace reassigned items with temporaries and emit separate assignments
                let mut renamed: Vec<(Place, Place)> = Vec::new();
                let instr_loc = instruction.loc.clone();
                let destr_loc = loc.clone();

                map_pattern_operands(&mut lvalue.pattern, |place| {
                    if !reassigned.contains(&place.identifier) {
                        return;
                    }
                    // Create a temporary place
                    let temp_id = state.env_mut().next_identifier_id();
                    let decl_id =
                        state.env().identifiers[temp_id.0 as usize].declaration_id;
                    // Promote the temporary
                    state.env_mut().identifiers[temp_id.0 as usize].name =
                        Some(IdentifierName::Promoted(format!("#t{}", decl_id.0)));
                    let temporary = Place {
                        identifier: temp_id,
                        effect: place.effect,
                        reactive: place.reactive,
                        loc: place.loc.clone(),
                    };
                    let original = place.clone();
                    *place = temporary.clone();
                    renamed.push((original, temporary));
                });

                // Build extra StoreLocal instructions for each renamed place
                let mut extra = Vec::new();
                for (original, temporary) in renamed {
                    extra.push(ReactiveInstruction {
                        id: instruction.id,
                        lvalue: None,
                        value: ReactiveValue::Instruction(InstructionValue::StoreLocal {
                            lvalue: LValue {
                                kind: InstructionKind::Reassign,
                                place: original,
                            },
                            value: temporary,
                            type_annotation: None,
                            loc: destr_loc.clone(),
                        }),
                        effects: None,
                        loc: instr_loc.clone(),
                    });
                }
                extra_instructions = Some(extra);
            }
        }

        // Update state.declared with declarations from the instruction(s)
        if let Some(ref extras) = extra_instructions {
            // Process the original instruction
            update_declared_from_instruction(instruction, state);
            // Process extra instructions
            for extra_instr in extras {
                update_declared_from_instruction(extra_instr, state);
            }
        } else {
            update_declared_from_instruction(instruction, state);
        }

        if let Some(extras) = extra_instructions {
            // Clone the original instruction and build the replacement list
            let mut all_instructions = Vec::new();
            all_instructions.push(ReactiveStatement::Instruction(instruction.clone()));
            for extra in extras {
                all_instructions.push(ReactiveStatement::Instruction(extra));
            }
            Transformed::ReplaceMany(all_instructions)
        } else {
            Transformed::Keep
        }
    }
}

fn update_declared_from_instruction(instr: &ReactiveInstruction, state: &mut ExtractState) {
    if let ReactiveValue::Instruction(iv) = &instr.value {
        match iv {
            InstructionValue::DeclareContext { lvalue, .. }
            | InstructionValue::StoreContext { lvalue, .. }
            | InstructionValue::DeclareLocal { lvalue, .. }
            | InstructionValue::StoreLocal { lvalue, .. } => {
                if lvalue.kind != InstructionKind::Reassign {
                    let identifier = &state.env().identifiers[lvalue.place.identifier.0 as usize];
                    state.declared.insert(identifier.declaration_id);
                }
            }
            InstructionValue::Destructure { lvalue, .. } => {
                if lvalue.kind != InstructionKind::Reassign {
                    for place in each_pattern_operand(&lvalue.pattern) {
                        let identifier = &state.env().identifiers[place.identifier.0 as usize];
                        state.declared.insert(identifier.declaration_id);
                    }
                }
            }
            _ => {}
        }
    }
}

/// Yields all Place operands from a destructuring pattern.
fn each_pattern_operand(pattern: &Pattern) -> Vec<&Place> {
    let mut operands = Vec::new();
    match pattern {
        Pattern::Array(array_pat) => {
            for item in &array_pat.items {
                match item {
                    ArrayPatternElement::Place(place) => operands.push(place),
                    ArrayPatternElement::Spread(spread) => operands.push(&spread.place),
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(obj_pat) => {
            for prop in &obj_pat.properties {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => operands.push(&p.place),
                    ObjectPropertyOrSpread::Spread(spread) => operands.push(&spread.place),
                }
            }
        }
    }
    operands
}

/// Maps over pattern operands, allowing in-place mutation of Places.
fn map_pattern_operands(pattern: &mut Pattern, mut f: impl FnMut(&mut Place)) {
    match pattern {
        Pattern::Array(array_pat) => {
            for item in &mut array_pat.items {
                match item {
                    ArrayPatternElement::Place(place) => f(place),
                    ArrayPatternElement::Spread(spread) => f(&mut spread.place),
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(obj_pat) => {
            for prop in &mut obj_pat.properties {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => f(&mut p.place),
                    ObjectPropertyOrSpread::Spread(spread) => f(&mut spread.place),
                }
            }
        }
    }
}
