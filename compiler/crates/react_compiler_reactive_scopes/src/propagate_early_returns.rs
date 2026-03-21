// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! PropagateEarlyReturns — ensures reactive blocks honor early return semantics.
//!
//! When a scope contains an early return, creates a sentinel-based check so that
//! cached scopes can properly replay the early return behavior.
//!
//! Corresponds to `src/ReactiveScopes/PropagateEarlyReturns.ts`.

use react_compiler_hir::{
    BlockId, Effect, EvaluationOrder, IdentifierId, IdentifierName, InstructionKind,
    InstructionValue, LValue, NonLocalBinding, Place, PlaceOrSpread, PrimitiveValue,
    PropertyLiteral, ReactiveBlock, ReactiveFunction, ReactiveInstruction, ReactiveLabel,
    ReactiveStatement, ReactiveTerminal, ReactiveTerminalStatement, ReactiveTerminalTargetKind,
    ReactiveValue, ReactiveScopeBlock, ReactiveScopeDeclaration, ReactiveScopeEarlyReturn, ScopeId,
    environment::Environment,
};

/// The sentinel string used to detect early returns.
/// TS: `EARLY_RETURN_SENTINEL` from CodegenReactiveFunction.
const EARLY_RETURN_SENTINEL: &str = "react.early_return_sentinel";

// =============================================================================
// Public entry point
// =============================================================================

/// Propagate early return semantics through reactive scopes.
/// TS: `propagateEarlyReturns`
pub fn propagate_early_returns(func: &mut ReactiveFunction, env: &mut Environment) {
    let mut state = State {
        within_reactive_scope: false,
        early_return_value: None,
    };
    transform_block(&mut func.body, env, &mut state);
}

// =============================================================================
// State
// =============================================================================

#[derive(Debug, Clone)]
struct EarlyReturnInfo {
    value: IdentifierId,
    loc: Option<react_compiler_diagnostics::SourceLocation>,
    label: BlockId,
}

struct State {
    within_reactive_scope: bool,
    early_return_value: Option<EarlyReturnInfo>,
}

// =============================================================================
// Transform implementation (direct recursion)
// =============================================================================

fn transform_block(block: &mut ReactiveBlock, env: &mut Environment, state: &mut State) {
    let mut next_block: Option<Vec<ReactiveStatement>> = None;
    let len = block.len();

    for i in 0..len {
        // Take the statement out temporarily
        let mut stmt = std::mem::replace(
            &mut block[i],
            // Placeholder
            ReactiveStatement::Instruction(ReactiveInstruction {
                id: EvaluationOrder(0),
                lvalue: None,
                value: ReactiveValue::Instruction(InstructionValue::Debugger { loc: None }),
                effects: None,
                loc: None,
            }),
        );

        let transformed = match &mut stmt {
            ReactiveStatement::Instruction(_) => TransformResult::Keep,
            ReactiveStatement::PrunedScope(_) => TransformResult::Keep,
            ReactiveStatement::Scope(scope_block) => transform_scope(scope_block, env, state),
            ReactiveStatement::Terminal(terminal) => {
                transform_terminal(terminal, env, state)
            }
        };

        match transformed {
            TransformResult::Keep => {
                if let Some(ref mut nb) = next_block {
                    nb.push(stmt);
                } else {
                    block[i] = stmt;
                }
            }
            TransformResult::ReplaceMany(replacements) => {
                if next_block.is_none() {
                    next_block = Some(block[..i].to_vec());
                }
                next_block.as_mut().unwrap().extend(replacements);
            }
        }
    }

    if let Some(nb) = next_block {
        *block = nb;
    }
}

enum TransformResult {
    Keep,
    ReplaceMany(Vec<ReactiveStatement>),
}

fn transform_scope(
    scope_block: &mut ReactiveScopeBlock,
    env: &mut Environment,
    parent_state: &mut State,
) -> TransformResult {
    let scope_id = scope_block.scope;

    // Exit early if an earlier pass has already created an early return
    if env.scopes[scope_id.0 as usize].early_return_value.is_some() {
        return TransformResult::Keep;
    }

    let mut inner_state = State {
        within_reactive_scope: true,
        early_return_value: parent_state.early_return_value.clone(),
    };
    transform_block(&mut scope_block.instructions, env, &mut inner_state);

    if let Some(early_return_value) = inner_state.early_return_value {
        if !parent_state.within_reactive_scope {
            // This is the outermost scope wrapping an early return
            apply_early_return_to_scope(scope_block, env, &early_return_value);
        } else {
            // Not outermost — bubble up
            parent_state.early_return_value = Some(early_return_value);
        }
    }

    TransformResult::Keep
}

fn transform_terminal(
    stmt: &mut ReactiveTerminalStatement,
    env: &mut Environment,
    state: &mut State,
) -> TransformResult {
    if state.within_reactive_scope {
        if let ReactiveTerminal::Return { value, .. } = &stmt.terminal {
            let loc = value.loc;

            let early_return_value = if let Some(ref existing) = state.early_return_value {
                existing.clone()
            } else {
                // Create a new early return identifier
                let identifier_id = create_temporary_place_id(env, loc);
                promote_temporary(env, identifier_id);
                let label = env.next_block_id();
                EarlyReturnInfo {
                    value: identifier_id,
                    loc,
                    label,
                }
            };

            state.early_return_value = Some(early_return_value.clone());

            let return_value = value.clone();

            return TransformResult::ReplaceMany(vec![
                // StoreLocal: reassign the early return value
                ReactiveStatement::Instruction(ReactiveInstruction {
                    id: EvaluationOrder(0),
                    lvalue: None,
                    value: ReactiveValue::Instruction(InstructionValue::StoreLocal {
                        lvalue: LValue {
                            kind: InstructionKind::Reassign,
                            place: Place {
                                identifier: early_return_value.value,
                                effect: Effect::Capture,
                                reactive: true,
                                loc,
                            },
                        },
                        value: return_value,
                        type_annotation: None,
                        loc,
                    }),
                    effects: None,
                    loc,
                }),
                // Break to the label
                ReactiveStatement::Terminal(ReactiveTerminalStatement {
                    terminal: ReactiveTerminal::Break {
                        target: early_return_value.label,
                        id: EvaluationOrder(0),
                        target_kind: ReactiveTerminalTargetKind::Labeled,
                        loc,
                    },
                    label: None,
                }),
            ]);
        }
    }

    // Default: traverse into the terminal's sub-blocks
    traverse_terminal(stmt, env, state);
    TransformResult::Keep
}

fn traverse_terminal(
    stmt: &mut ReactiveTerminalStatement,
    env: &mut Environment,
    state: &mut State,
) {
    match &mut stmt.terminal {
        ReactiveTerminal::Break { .. } | ReactiveTerminal::Continue { .. } => {}
        ReactiveTerminal::Return { .. } | ReactiveTerminal::Throw { .. } => {}
        ReactiveTerminal::For { loop_block, .. }
        | ReactiveTerminal::ForOf { loop_block, .. }
        | ReactiveTerminal::ForIn { loop_block, .. }
        | ReactiveTerminal::DoWhile { loop_block, .. }
        | ReactiveTerminal::While { loop_block, .. } => {
            transform_block(loop_block, env, state);
        }
        ReactiveTerminal::If {
            consequent,
            alternate,
            ..
        } => {
            transform_block(consequent, env, state);
            if let Some(alt) = alternate {
                transform_block(alt, env, state);
            }
        }
        ReactiveTerminal::Switch { cases, .. } => {
            for case in cases.iter_mut() {
                if let Some(block) = &mut case.block {
                    transform_block(block, env, state);
                }
            }
        }
        ReactiveTerminal::Label { block, .. } => {
            transform_block(block, env, state);
        }
        ReactiveTerminal::Try {
            block, handler, ..
        } => {
            transform_block(block, env, state);
            transform_block(handler, env, state);
        }
    }
}

// =============================================================================
// Apply early return transformation to the outermost scope
// =============================================================================

fn apply_early_return_to_scope(
    scope_block: &mut ReactiveScopeBlock,
    env: &mut Environment,
    early_return: &EarlyReturnInfo,
) {
    let scope_id = scope_block.scope;
    let loc = early_return.loc;

    // Set early return value on the scope
    env.scopes[scope_id.0 as usize].early_return_value = Some(ReactiveScopeEarlyReturn {
        value: early_return.value,
        loc: early_return.loc,
        label: early_return.label,
    });

    // Add the early return identifier as a scope declaration
    env.scopes[scope_id.0 as usize]
        .declarations
        .push((early_return.value, ReactiveScopeDeclaration {
            identifier: early_return.value,
            scope: scope_id,
        }));

    // Create temporary places for the sentinel initialization
    let sentinel_temp = create_temporary_place_id(env, loc);
    let symbol_temp = create_temporary_place_id(env, loc);
    let for_temp = create_temporary_place_id(env, loc);
    let arg_temp = create_temporary_place_id(env, loc);

    let original_instructions = std::mem::take(&mut scope_block.instructions);

    scope_block.instructions = vec![
        // LoadGlobal Symbol
        ReactiveStatement::Instruction(ReactiveInstruction {
            id: EvaluationOrder(0),
            lvalue: Some(Place {
                identifier: symbol_temp,
                effect: Effect::Unknown,
                reactive: false,
                loc: None, // GeneratedSource
            }),
            value: ReactiveValue::Instruction(InstructionValue::LoadGlobal {
                binding: NonLocalBinding::Global {
                    name: "Symbol".to_string(),
                },
                loc,
            }),
            effects: None,
            loc,
        }),
        // PropertyLoad Symbol.for
        ReactiveStatement::Instruction(ReactiveInstruction {
            id: EvaluationOrder(0),
            lvalue: Some(Place {
                identifier: for_temp,
                effect: Effect::Unknown,
                reactive: false,
                loc: None, // GeneratedSource
            }),
            value: ReactiveValue::Instruction(InstructionValue::PropertyLoad {
                object: Place {
                    identifier: symbol_temp,
                    effect: Effect::Unknown,
                    reactive: false,
                    loc: None, // GeneratedSource
                },
                property: PropertyLiteral::String("for".to_string()),
                loc,
            }),
            effects: None,
            loc,
        }),
        // Primitive: the sentinel string
        ReactiveStatement::Instruction(ReactiveInstruction {
            id: EvaluationOrder(0),
            lvalue: Some(Place {
                identifier: arg_temp,
                effect: Effect::Unknown,
                reactive: false,
                loc: None, // GeneratedSource
            }),
            value: ReactiveValue::Instruction(InstructionValue::Primitive {
                value: PrimitiveValue::String(EARLY_RETURN_SENTINEL.to_string()),
                loc,
            }),
            effects: None,
            loc,
        }),
        // MethodCall: Symbol.for("react.early_return_sentinel")
        ReactiveStatement::Instruction(ReactiveInstruction {
            id: EvaluationOrder(0),
            lvalue: Some(Place {
                identifier: sentinel_temp,
                effect: Effect::Unknown,
                reactive: false,
                loc: None, // GeneratedSource
            }),
            value: ReactiveValue::Instruction(InstructionValue::MethodCall {
                receiver: Place {
                    identifier: symbol_temp,
                    effect: Effect::Unknown,
                    reactive: false,
                    loc: None, // GeneratedSource
                },
                property: Place {
                    identifier: for_temp,
                    effect: Effect::Unknown,
                    reactive: false,
                    loc: None, // GeneratedSource
                },
                args: vec![PlaceOrSpread::Place(Place {
                    identifier: arg_temp,
                    effect: Effect::Unknown,
                    reactive: false,
                    loc: None, // GeneratedSource
                })],
                loc,
            }),
            effects: None,
            loc,
        }),
        // StoreLocal: let earlyReturnValue = sentinel
        ReactiveStatement::Instruction(ReactiveInstruction {
            id: EvaluationOrder(0),
            lvalue: None,
            value: ReactiveValue::Instruction(InstructionValue::StoreLocal {
                lvalue: LValue {
                    kind: InstructionKind::Let,
                    place: Place {
                        identifier: early_return.value,
                        effect: Effect::ConditionallyMutate,
                        reactive: true,
                        loc,
                    },
                },
                value: Place {
                    identifier: sentinel_temp,
                    effect: Effect::Unknown,
                    reactive: false,
                    loc: None, // GeneratedSource
                },
                type_annotation: None,
                loc,
            }),
            effects: None,
            loc,
        }),
        // Label terminal wrapping the original instructions
        ReactiveStatement::Terminal(ReactiveTerminalStatement {
            label: Some(ReactiveLabel {
                id: early_return.label,
                implicit: false,
            }),
            terminal: ReactiveTerminal::Label {
                block: original_instructions,
                id: EvaluationOrder(0),
                loc: None, // GeneratedSource
            },
        }),
    ];
}

// =============================================================================
// Helper: create a temporary place identifier
// =============================================================================

fn create_temporary_place_id(
    env: &mut Environment,
    loc: Option<react_compiler_diagnostics::SourceLocation>,
) -> IdentifierId {
    let id = env.next_identifier_id();
    env.identifiers[id.0 as usize].loc = loc;
    id
}

fn promote_temporary(env: &mut Environment, identifier_id: IdentifierId) {
    let decl_id = env.identifiers[identifier_id.0 as usize].declaration_id;
    env.identifiers[identifier_id.0 as usize].name =
        Some(IdentifierName::Promoted(format!("#t{}", decl_id.0)));
}
