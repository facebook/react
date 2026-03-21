// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! PruneHoistedContexts — removes hoisted context variable declarations
//! and transforms references to their original instruction kinds.
//!
//! Corresponds to `src/ReactiveScopes/PruneHoistedContexts.ts`.

use std::collections::HashMap;

use react_compiler_hir::{
    EvaluationOrder, IdentifierId, InstructionKind, InstructionValue, Place,
    ReactiveFunction, ReactiveInstruction, ReactiveStatement,
    ReactiveValue, ReactiveScopeBlock,
    environment::Environment,
};
use react_compiler_diagnostics::{CompilerErrorDetail, ErrorCategory};

use crate::visitors::{ReactiveFunctionTransform, Transformed, transform_reactive_function};

// =============================================================================
// Public entry point
// =============================================================================

/// Prunes DeclareContexts lowered for HoistedConsts and transforms any
/// references back to their original instruction kind.
/// TS: `pruneHoistedContexts`
pub fn prune_hoisted_contexts(func: &mut ReactiveFunction, env: &mut Environment) {
    let mut transform = Transform { env_ptr: env as *mut Environment };
    let mut state = VisitorState {
        active_scopes: Vec::new(),
        uninitialized: HashMap::new(),
    };
    transform_reactive_function(func, &mut transform, &mut state);
}

// =============================================================================
// State
// =============================================================================

#[derive(Debug, Clone)]
enum UninitializedKind {
    UnknownKind,
    Func { definition: Option<IdentifierId> },
}

struct VisitorState {
    active_scopes: Vec<std::collections::HashSet<IdentifierId>>,
    uninitialized: HashMap<IdentifierId, UninitializedKind>,
}

impl VisitorState {
    fn find_in_active_scopes(&self, id: IdentifierId) -> bool {
        for scope in &self.active_scopes {
            if scope.contains(&id) {
                return true;
            }
        }
        false
    }
}

struct Transform {
    env_ptr: *mut Environment,
}

impl Transform {
    fn env(&self) -> &Environment {
        unsafe { &*self.env_ptr }
    }
    fn env_mut(&mut self) -> &mut Environment {
        unsafe { &mut *self.env_ptr }
    }
}

impl ReactiveFunctionTransform for Transform {
    type State = VisitorState;

    fn visit_scope(&mut self, scope: &mut ReactiveScopeBlock, state: &mut VisitorState) {
        let scope_data = &self.env().scopes[scope.scope.0 as usize];
        let decl_ids: std::collections::HashSet<IdentifierId> = scope_data
            .declarations
            .iter()
            .map(|(id, _)| *id)
            .collect();

        // Add declared but not initialized variables
        for (_, decl) in &scope_data.declarations {
            state
                .uninitialized
                .insert(decl.identifier, UninitializedKind::UnknownKind);
        }

        state.active_scopes.push(decl_ids);
        self.traverse_scope(scope, state);
        state.active_scopes.pop();

        // Clean up uninitialized after scope
        let scope_data = &self.env().scopes[scope.scope.0 as usize];
        for (_, decl) in &scope_data.declarations {
            state.uninitialized.remove(&decl.identifier);
        }
    }

    fn visit_place(
        &mut self,
        _id: EvaluationOrder,
        place: &Place,
        state: &mut VisitorState,
    ) {
        if let Some(kind) = state.uninitialized.get(&place.identifier) {
            if let UninitializedKind::Func { definition } = kind {
                if *definition != Some(place.identifier) {
                    // In TS this is CompilerError.throwTodo() which aborts compilation.
                    // Record as a Todo error on env.
                    self.env_mut().record_error(CompilerErrorDetail {
                        category: ErrorCategory::Todo,
                        reason: "[PruneHoistedContexts] Rewrite hoisted function references".to_string(),
                        description: None,
                        loc: place.loc.clone(),
                        suggestions: None,
                    });
                }
            }
        }
    }

    fn transform_instruction(
        &mut self,
        instruction: &mut ReactiveInstruction,
        state: &mut VisitorState,
    ) -> Transformed<ReactiveStatement> {
        // Remove hoisted declarations to preserve TDZ
        if let ReactiveValue::Instruction(InstructionValue::DeclareContext {
            lvalue, ..
        }) = &instruction.value
        {
            let maybe_non_hoisted = convert_hoisted_lvalue_kind(lvalue.kind);
            if let Some(non_hoisted) = maybe_non_hoisted {
                if non_hoisted == InstructionKind::Function
                    && state.uninitialized.contains_key(&lvalue.place.identifier)
                {
                    state.uninitialized.insert(
                        lvalue.place.identifier,
                        UninitializedKind::Func { definition: None },
                    );
                }
                return Transformed::Remove;
            }
        }

        if let ReactiveValue::Instruction(InstructionValue::StoreContext {
            lvalue, ..
        }) = &mut instruction.value
        {
            if lvalue.kind != InstructionKind::Reassign {
                let lvalue_id = lvalue.place.identifier;
                let is_declared_by_scope = state.find_in_active_scopes(lvalue_id);
                if is_declared_by_scope {
                    if lvalue.kind == InstructionKind::Let
                        || lvalue.kind == InstructionKind::Const
                    {
                        lvalue.kind = InstructionKind::Reassign;
                    } else if lvalue.kind == InstructionKind::Function {
                        if let Some(kind) = state.uninitialized.get(&lvalue_id) {
                            assert!(
                                matches!(kind, UninitializedKind::Func { .. }),
                                "[PruneHoistedContexts] Unexpected hoisted function"
                            );
                            // Mark as having a definition — references are now safe
                            state.uninitialized.insert(
                                lvalue_id,
                                UninitializedKind::Func {
                                    definition: Some(lvalue.place.identifier),
                                },
                            );
                            state.uninitialized.remove(&lvalue_id);
                        }
                    } else {
                        // In TS this is CompilerError.throwTodo() which aborts.
                        self.env_mut().record_error(CompilerErrorDetail {
                            category: ErrorCategory::Todo,
                            reason: "[PruneHoistedContexts] Unexpected kind".to_string(),
                            description: Some(format!("{:?}", lvalue.kind)),
                            loc: instruction.loc.clone(),
                            suggestions: None,
                        });
                    }
                }
            }
        }

        self.visit_instruction(instruction, state);
        Transformed::Keep
    }
}

/// Corresponds to TS `convertHoistedLValueKind` — returns None for non-hoisted kinds.
fn convert_hoisted_lvalue_kind(kind: InstructionKind) -> Option<InstructionKind> {
    match kind {
        InstructionKind::HoistedLet => Some(InstructionKind::Let),
        InstructionKind::HoistedConst => Some(InstructionKind::Const),
        InstructionKind::HoistedFunction => Some(InstructionKind::Function),
        _ => None,
    }
}
