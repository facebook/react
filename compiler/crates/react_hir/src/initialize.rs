/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::collections::HashSet;

use react_diagnostics::{invariant, Diagnostic};
use thiserror::Error;

use crate::{
    BlockId, BlockRewriter, BlockRewriterAction, Blocks, GotoKind, GotoTerminal,
    InstructionIdGenerator, InstructionValue, TerminalValue, HIR,
};

/// Runs a variety of passes to put the HIR in canonical form. This should be called
/// after initial HIR construction and after any transformations that change the
/// shape of the control-flow graph.
pub fn initialize_hir(hir: &mut HIR) -> Result<(), Diagnostic> {
    prune_tombstones(hir);
    reverse_postorder_blocks(hir);
    remove_unreachable_for_updates(hir);
    remove_unreachable_fallthroughs(hir);
    remove_unreachable_do_while_statements(hir);
    mark_instruction_ids(hir)?;
    mark_predecessors(hir);
    Ok(())
}

pub fn prune_tombstones(hir: &mut HIR) {
    for block in hir.blocks.iter_mut() {
        block.instructions.retain(|ix| {
            let instr = &hir.instructions[usize::from(*ix)];
            // Retain all values that are not the tombstone
            !matches!(instr.value, InstructionValue::Tombstone)
        });
    }
}

/// Modifies the HIR to put the blocks in reverse postorder, with predecessors before
/// successors (except for the case of loops)
pub fn reverse_postorder_blocks(hir: &mut HIR) {
    let mut visited = HashSet::<BlockId>::with_capacity(hir.blocks.len());
    let mut postorder = std::vec::Vec::<BlockId>::with_capacity(hir.blocks.len());
    fn visit(
        block_id: BlockId,
        hir: &HIR,
        visited: &mut HashSet<BlockId>,
        postorder: &mut std::vec::Vec<BlockId>,
    ) {
        if !visited.insert(block_id) {
            // already visited
            return;
        }
        let block = hir.blocks.block(block_id);
        let terminal = &block.terminal;
        match &terminal.value {
            TerminalValue::Branch(terminal) => {
                visit(terminal.alternate, hir, visited, postorder);
                visit(terminal.consequent, hir, visited, postorder);
            }
            TerminalValue::If(terminal) => {
                visit(terminal.alternate, hir, visited, postorder);
                visit(terminal.consequent, hir, visited, postorder);
            }
            TerminalValue::For(terminal) => {
                visit(terminal.init, hir, visited, postorder);
            }
            TerminalValue::DoWhile(terminal) => {
                visit(terminal.body, hir, visited, postorder);
            }
            TerminalValue::Goto(terminal) => {
                visit(terminal.block, hir, visited, postorder);
            }
            TerminalValue::Label(terminal) => {
                visit(terminal.block, hir, visited, postorder);
            }
            TerminalValue::Return(..) => { /* no-op */ }
            TerminalValue::Unsupported(..) => {
                panic!("Unexpected unsupported terminal")
            }
        }
        postorder.push(block_id);
    }
    visit(hir.entry, &hir, &mut visited, &mut postorder);

    // NOTE: could consider sorting the blocks in-place by key
    let mut blocks = Blocks::with_capacity(hir.blocks.len());
    for id in postorder.iter().rev().cloned() {
        blocks.insert(hir.blocks.remove(id));
    }

    hir.blocks = blocks;
}

/// Prunes ForTerminal.update values (sets to None) if they are unreachable
pub fn remove_unreachable_for_updates(hir: &mut HIR) {
    BlockRewriter::new(&mut hir.blocks, hir.entry).each_block(|mut block, rewriter| {
        if let TerminalValue::For(terminal) = &mut block.terminal.value {
            if let Some(update) = terminal.update {
                if !rewriter.contains(update) {
                    terminal.update = None;
                }
            }
        }
        BlockRewriterAction::Keep(block)
    });
}

/// Prunes unreachable fallthrough values, setting them to None if the referenced
/// block was not otherwise reachable.
pub fn remove_unreachable_fallthroughs(hir: &mut HIR) {
    BlockRewriter::new(&mut hir.blocks, hir.entry).each_block(|mut block, rewriter| {
        block
            .terminal
            .value
            .map_optional_fallthroughs(|fallthrough| {
                if rewriter.contains(fallthrough) {
                    Some(fallthrough)
                } else {
                    None
                }
            });
        BlockRewriterAction::Keep(block)
    });
}

/// Rewrites DoWhile statements into Gotos if the test block is not reachable
pub fn remove_unreachable_do_while_statements(hir: &mut HIR) {
    BlockRewriter::new(&mut hir.blocks, hir.entry).each_block(|mut block, rewriter| {
        if let TerminalValue::DoWhile(terminal) = &mut block.terminal.value {
            if !rewriter.contains(terminal.test) {
                block.terminal.value = TerminalValue::Goto(GotoTerminal {
                    block: terminal.body,
                    kind: GotoKind::Break,
                });
            }
        }
        BlockRewriterAction::Keep(block)
    });
}

/// Updates the instruction ids for all instructions and blocks
/// Relies on the blocks being in reverse postorder to ensure that id ordering is correct
pub fn mark_instruction_ids(hir: &mut HIR) -> Result<(), Diagnostic> {
    let mut id_gen = InstructionIdGenerator::new();
    let mut visited = HashSet::<(usize, usize)>::new();
    for (ii, block) in hir.blocks.iter_mut().enumerate() {
        let block_id = block.id;
        for (jj, instr_ix) in block.instructions.iter_mut().enumerate() {
            invariant(visited.insert((ii, jj)), || {
                Diagnostic::invariant(BlockVisitedTwice { block: block_id }, None)
            })?;
            let instr = &mut hir.instructions[usize::from(*instr_ix)];
            instr.id = id_gen.next();
        }
        block.terminal.id = id_gen.next();
    }
    Ok(())
}

#[derive(Error, Debug)]
#[error("Invariant: Expected block {block} not to have been visited yet")]
pub struct BlockVisitedTwice {
    block: BlockId,
}

/// Updates the predecessors of each block
pub fn mark_predecessors(hir: &mut HIR) {
    for block in hir.blocks.iter_mut() {
        block.predecessors.clear();
    }
    let mut visited = HashSet::<BlockId>::with_capacity(hir.blocks.len());
    fn visit(
        block_id: BlockId,
        prev_id: Option<BlockId>,
        hir: &mut HIR,
        visited: &mut HashSet<BlockId>,
    ) {
        let block = hir.blocks.block_mut(block_id);
        if let Some(prev_id) = prev_id {
            block.predecessors.insert(prev_id);
        }
        if !visited.insert(block_id) {
            return;
        }
        for successor in block.terminal.value.successors() {
            visit(successor, Some(block_id), hir, visited)
        }
    }
    visit(hir.entry, None, hir, &mut visited);
}
