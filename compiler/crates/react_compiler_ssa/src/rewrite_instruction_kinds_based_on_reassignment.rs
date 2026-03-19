// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Rewrites InstructionKind of instructions which declare/assign variables,
//! converting the first declaration to Const/Let depending on whether it is
//! subsequently reassigned, and ensuring that subsequent reassignments are
//! marked as Reassign.
//!
//! Ported from TypeScript `src/SSA/RewriteInstructionKindsBasedOnReassignment.ts`.
//!
//! Note that declarations which were const in the original program cannot become
//! `let`, but the inverse is not true: a `let` which was reassigned in the source
//! may be converted to a `const` if the reassignment is not used and was removed
//! by dead code elimination.

use std::collections::HashMap;

use react_compiler_hir::{
    BlockKind, DeclarationId, HirFunction, InstructionKind, InstructionValue, ParamPattern,
    Pattern, Place,
    ArrayPatternElement, ObjectPropertyOrSpread,
};

use react_compiler_hir::environment::Environment;

/// Index into a collected list of declaration mutations to apply.
///
/// We use a two-phase approach: first collect which declarations exist,
/// then apply mutations. This is because in the TS code, `declarations`
/// map stores references to LValue/LValuePattern and mutates `kind` through them.
/// In Rust, we track instruction indices and apply changes in a second pass.
enum DeclarationLoc {
    /// An LValue from DeclareLocal or StoreLocal — identified by (block_index, instr_index_in_block)
    Instruction {
        block_index: usize,
        instr_local_index: usize,
    },
    /// A parameter or context variable (seeded as Let, may be upgraded to Let on reassignment — already Let)
    ParamOrContext,
}

pub fn rewrite_instruction_kinds_based_on_reassignment(
    func: &mut HirFunction,
    env: &Environment,
) {
    // Phase 1: Collect all information about which declarations need updates.
    //
    // Track: for each DeclarationId, the location of its first declaration,
    // and whether it needs to be changed to Let (because of reassignment).
    let mut declarations: HashMap<DeclarationId, DeclarationLoc> = HashMap::new();
    // Track which (block_index, instr_local_index) should have their lvalue.kind set to Reassign
    let mut reassign_locs: Vec<(usize, usize)> = Vec::new();
    // Track which declaration locations need to be set to Let
    let mut let_locs: Vec<(usize, usize)> = Vec::new();
    // Track which (block_index, instr_local_index) should have their lvalue.kind set to Const
    let mut const_locs: Vec<(usize, usize)> = Vec::new();
    // Track which (block_index, instr_local_index) Destructure instructions get a specific kind
    let mut destructure_kind_locs: Vec<(usize, usize, InstructionKind)> = Vec::new();

    // Seed with parameters
    for param in &func.params {
        let place: &Place = match param {
            ParamPattern::Place(p) => p,
            ParamPattern::Spread(s) => &s.place,
        };
        let ident = &env.identifiers[place.identifier.0 as usize];
        if ident.name.is_some() {
            declarations.insert(ident.declaration_id, DeclarationLoc::ParamOrContext);
        }
    }

    // Seed with context variables
    for place in &func.context {
        let ident = &env.identifiers[place.identifier.0 as usize];
        if ident.name.is_some() {
            declarations.insert(ident.declaration_id, DeclarationLoc::ParamOrContext);
        }
    }

    // Process all blocks
    let block_keys: Vec<_> = func.body.blocks.keys().cloned().collect();
    for (block_index, block_id) in block_keys.iter().enumerate() {
        let block = &func.body.blocks[block_id];
        let block_kind = block.kind;
        for (local_idx, instr_id) in block.instructions.iter().enumerate() {
            let instr = &func.instructions[instr_id.0 as usize];
            match &instr.value {
                InstructionValue::DeclareLocal { lvalue, .. } => {
                    let decl_id = env.identifiers[lvalue.place.identifier.0 as usize].declaration_id;
                    // Invariant: variable should not be defined prior to declaration
                    // (using debug_assert to avoid aborting in NAPI context)
                    debug_assert!(
                        !declarations.contains_key(&decl_id),
                        "Expected variable not to be defined prior to declaration"
                    );
                    declarations.insert(
                        decl_id,
                        DeclarationLoc::Instruction {
                            block_index,
                            instr_local_index: local_idx,
                        },
                    );
                }
                InstructionValue::StoreLocal { lvalue, .. } => {
                    let ident = &env.identifiers[lvalue.place.identifier.0 as usize];
                    if ident.name.is_some() {
                        let decl_id = ident.declaration_id;
                        if let Some(existing) = declarations.get(&decl_id) {
                            // Reassignment: mark existing declaration as Let, current as Reassign
                            match existing {
                                DeclarationLoc::Instruction {
                                    block_index: bi,
                                    instr_local_index: ili,
                                } => {
                                    let_locs.push((*bi, *ili));
                                }
                                DeclarationLoc::ParamOrContext => {
                                    // Already Let, no-op
                                }
                            }
                            reassign_locs.push((block_index, local_idx));
                        } else {
                            // First store — mark as Const
                            declarations.insert(
                                decl_id,
                                DeclarationLoc::Instruction {
                                    block_index,
                                    instr_local_index: local_idx,
                                },
                            );
                            const_locs.push((block_index, local_idx));
                        }
                    }
                }
                InstructionValue::Destructure { lvalue, .. } => {
                    let mut kind: Option<InstructionKind> = None;
                    for place in each_pattern_operands(&lvalue.pattern) {
                        let ident = &env.identifiers[place.identifier.0 as usize];
                        if ident.name.is_none() {
                            if !(kind.is_none() || kind == Some(InstructionKind::Const)) {
                                eprintln!(
                                    "[RewriteInstructionKinds] Inconsistent destructure: unnamed place {:?} has kind {:?}",
                                    place.identifier, kind
                                );
                            }
                            kind = Some(InstructionKind::Const);
                        } else {
                            let decl_id = ident.declaration_id;
                            if let Some(existing) = declarations.get(&decl_id) {
                                // Reassignment
                                if !(kind.is_none() || kind == Some(InstructionKind::Reassign)) {
                                    eprintln!(
                                        "[RewriteInstructionKinds] Inconsistent destructure: named reassigned place {:?} (name={:?}, decl={:?}) has kind {:?}",
                                        place.identifier, ident.name, decl_id, kind
                                    );
                                }
                                kind = Some(InstructionKind::Reassign);
                                match existing {
                                    DeclarationLoc::Instruction {
                                        block_index: bi,
                                        instr_local_index: ili,
                                    } => {
                                        let_locs.push((*bi, *ili));
                                    }
                                    DeclarationLoc::ParamOrContext => {
                                        // Already Let
                                    }
                                }
                            } else {
                                // New declaration
                                if block_kind == BlockKind::Value {
                                    eprintln!(
                                        "[RewriteInstructionKinds] TODO: Handle reassignment in value block for {:?}",
                                        place.identifier
                                    );
                                }
                                declarations.insert(
                                    decl_id,
                                    DeclarationLoc::Instruction {
                                        block_index,
                                        instr_local_index: local_idx,
                                    },
                                );
                                if !(kind.is_none() || kind == Some(InstructionKind::Const)) {
                                    eprintln!(
                                        "[RewriteInstructionKinds] Inconsistent destructure: new decl place {:?} (name={:?}, decl={:?}) has kind {:?}",
                                        place.identifier, ident.name, decl_id, kind
                                    );
                                }
                                kind = Some(InstructionKind::Const);
                            }
                        }
                    }
                    let kind = kind.unwrap_or(InstructionKind::Const);
                    destructure_kind_locs.push((block_index, local_idx, kind));
                }
                InstructionValue::PostfixUpdate { lvalue, .. }
                | InstructionValue::PrefixUpdate { lvalue, .. } => {
                    let ident = &env.identifiers[lvalue.identifier.0 as usize];
                    let decl_id = ident.declaration_id;
                    let Some(existing) = declarations.get(&decl_id) else {
                        // Variable should have been defined — skip if not found
                        continue;
                    };
                    match existing {
                        DeclarationLoc::Instruction {
                            block_index: bi,
                            instr_local_index: ili,
                        } => {
                            let_locs.push((*bi, *ili));
                        }
                        DeclarationLoc::ParamOrContext => {
                            // Already Let
                        }
                    }
                }
                _ => {}
            }
        }
    }

    // Phase 2: Apply all collected mutations.

    // Helper: given (block_index, instr_local_index), get the InstructionId
    // and mutate the instruction's lvalue kind.
    for (bi, ili) in const_locs {
        let block_id = &block_keys[bi];
        let instr_id = func.body.blocks[block_id].instructions[ili];
        let instr = &mut func.instructions[instr_id.0 as usize];
        match &mut instr.value {
            InstructionValue::StoreLocal { lvalue, .. } => {
                lvalue.kind = InstructionKind::Const;
            }
            _ => {}
        }
    }

    for (bi, ili) in reassign_locs {
        let block_id = &block_keys[bi];
        let instr_id = func.body.blocks[block_id].instructions[ili];
        let instr = &mut func.instructions[instr_id.0 as usize];
        match &mut instr.value {
            InstructionValue::StoreLocal { lvalue, .. } => {
                lvalue.kind = InstructionKind::Reassign;
            }
            _ => {}
        }
    }

    for (bi, ili) in let_locs {
        let block_id = &block_keys[bi];
        let instr_id = func.body.blocks[block_id].instructions[ili];
        let instr = &mut func.instructions[instr_id.0 as usize];
        match &mut instr.value {
            InstructionValue::DeclareLocal { lvalue, .. }
            | InstructionValue::StoreLocal { lvalue, .. } => {
                lvalue.kind = InstructionKind::Let;
            }
            InstructionValue::Destructure { lvalue, .. } => {
                lvalue.kind = InstructionKind::Let;
            }
            _ => {}
        }
    }

    for (bi, ili, kind) in destructure_kind_locs {
        let block_id = &block_keys[bi];
        let instr_id = func.body.blocks[block_id].instructions[ili];
        let instr = &mut func.instructions[instr_id.0 as usize];
        match &mut instr.value {
            InstructionValue::Destructure { lvalue, .. } => {
                lvalue.kind = kind;
            }
            _ => {}
        }
    }
}

/// Collect all operand places from a pattern (array or object destructuring).
fn each_pattern_operands(pattern: &Pattern) -> Vec<Place> {
    let mut result = Vec::new();
    match pattern {
        Pattern::Array(arr) => {
            for item in &arr.items {
                match item {
                    ArrayPatternElement::Place(p) => result.push(p.clone()),
                    ArrayPatternElement::Spread(s) => result.push(s.place.clone()),
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => result.push(p.place.clone()),
                    ObjectPropertyOrSpread::Spread(s) => result.push(s.place.clone()),
                }
            }
        }
    }
    result
}
