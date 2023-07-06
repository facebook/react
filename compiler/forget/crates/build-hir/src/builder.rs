use std::collections::HashSet;

use hir::{BasicBlock, BlockId, Environment, GotoKind, InstructionIdGenerator, TerminalValue, HIR};
use indexmap::IndexMap;

/// Helper struct used when converting from ESTree to HIR. Includes:
/// - Variable resolution
/// - Label resolution (for labeled statements and break/continue)
/// - Access to the environment
///
/// As well as representing the incomplete form of the HIR. Usage
/// generally involves driving calls to enter/exit blocks, resolve
/// labels and variables, and then calling `build()` when the HIR
/// is complete.
pub struct Builder<'a> {
    #[allow(dead_code)]
    environment: &'a Environment<'a>,

    completed: IndexMap<BlockId, BasicBlock<'a>>,

    entry: BlockId,
}

impl<'a> Builder<'a> {
    pub(crate) fn new(environment: &'a Environment<'a>) -> Self {
        let entry = environment.next_block_id();
        Self {
            environment,
            completed: Default::default(),
            entry,
        }
    }

    /// Completes the builder and returns the HIR if it was valid,
    /// or a Diagnostic if a validation error occured.
    ///
    /// TODO: refine the type, only invariants should be possible here,
    /// not other types of errors
    pub(crate) fn build(self) -> Result<HIR<'a>, Diagnostic> {
        let mut hir = HIR {
            entry: self.entry,
            blocks: self.completed,
        };

        reverse_postorder_blocks(&mut hir);
        remove_unreachable_for_updates(&mut hir);
        remove_unreachable_fallthroughs(&mut hir);
        remove_unreachable_do_while_statements(&mut hir);
        mark_instruction_ids(&mut hir)?;
        mark_predecessors(&mut hir);

        Ok(hir)
    }
}

/// Modifies the HIR to put the blocks in reverse postorder, with predecessors before
/// successors (except for the case of loops)
fn reverse_postorder_blocks<'a>(hir: &mut HIR<'a>) {
    let mut visited = HashSet::<BlockId>::with_capacity(hir.blocks.len());
    let mut postorder = Vec::<BlockId>::with_capacity(hir.blocks.len());
    fn visit<'a>(
        block_id: BlockId,
        hir: &HIR<'a>,
        visited: &mut HashSet<BlockId>,
        postorder: &mut Vec<BlockId>,
    ) {
        if !visited.insert(block_id) {
            // already visited
            return;
        }
        let block = hir.block(block_id);
        let terminal = &block.terminal;
        match &terminal.value {
            TerminalValue::IfTerminal(terminal) => {
                visit(terminal.alternate, hir, visited, postorder);
                visit(terminal.consequent, hir, visited, postorder);
            }
            TerminalValue::ForTerminal(terminal) => {
                visit(terminal.init, hir, visited, postorder);
            }
            TerminalValue::DoWhileTerminal(terminal) => {
                visit(terminal.body, hir, visited, postorder);
            }
            TerminalValue::GotoTerminal(terminal) => {
                visit(terminal.block, hir, visited, postorder);
            }
            TerminalValue::ReturnTerminal(..) => { /* no-op */ }
        }
    }
    visit(hir.entry, &hir, &mut visited, &mut postorder);

    // NOTE: could consider sorting the blocks in-place by key
    let mut blocks = IndexMap::with_capacity(hir.blocks.len());
    for id in postorder.iter().rev().cloned() {
        blocks.insert(id, hir.blocks.remove(&id).unwrap());
    }

    hir.blocks = blocks;
}

/// Prunes ForTerminal.update values (sets to None) if they are unreachable
fn remove_unreachable_for_updates<'a>(hir: &mut HIR<'a>) {
    let block_ids: HashSet<BlockId> = hir.blocks.keys().cloned().collect();

    for block in hir.blocks.values_mut() {
        if let TerminalValue::ForTerminal(terminal) = &mut block.terminal.value {
            if let Some(update) = terminal.update {
                if !block_ids.contains(&update) {
                    terminal.update = None;
                }
            }
        }
    }
}

/// Prunes unreachable fallthrough values, setting them to None if the referenced
/// block was not otherwise reachable.
fn remove_unreachable_fallthroughs<'a>(hir: &mut HIR<'a>) {
    let block_ids: HashSet<BlockId> = hir.blocks.keys().cloned().collect();

    for block in hir.blocks.values_mut() {
        block
            .terminal
            .value
            .map_optional_fallthroughs(|fallthrough| {
                if block_ids.contains(&fallthrough) {
                    Some(fallthrough)
                } else {
                    None
                }
            })
    }
}

/// Rewrites DoWhile statements into Gotos if the test block is not reachable
fn remove_unreachable_do_while_statements<'a>(hir: &mut HIR<'a>) {
    let block_ids: HashSet<BlockId> = hir.blocks.keys().cloned().collect();

    for block in hir.blocks.values_mut() {
        if let TerminalValue::DoWhileTerminal(terminal) = &mut block.terminal.value {
            if !block_ids.contains(&terminal.test) {
                block.terminal.value = TerminalValue::GotoTerminal(hir::GotoTerminal {
                    block: terminal.body,
                    kind: GotoKind::Break,
                });
            }
        }
    }
}

/// Updates the instruction ids for all instructions and blocks
/// Relies on the blocks being in reverse postorder to ensure that id ordering is correct
fn mark_instruction_ids<'a>(hir: &mut HIR<'a>) -> Result<(), Diagnostic> {
    let mut id_gen = InstructionIdGenerator::new();
    let mut visited = HashSet::<(usize, usize)>::new();
    for (block_ix, block) in hir.blocks.values_mut().enumerate() {
        for (instr_ix, instr) in block.instructions.iter_mut().enumerate() {
            invariant(!visited.insert((block_ix, instr_ix)), || ())?;
            instr.id = id_gen.next();
        }
        block.terminal.id = id_gen.next();
    }
    Ok(())
}

/// Updates the predecessors of each block
fn mark_predecessors<'a>(hir: &mut HIR<'a>) {
    for block in hir.blocks.values_mut() {
        block.predecessors.clear();
    }
    let mut visited = HashSet::<BlockId>::with_capacity(hir.blocks.len());
    fn visit<'a>(
        block_id: BlockId,
        prev_id: Option<BlockId>,
        hir: &mut HIR<'a>,
        visited: &mut HashSet<BlockId>,
    ) {
        let block = hir.block_mut(block_id);
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

fn invariant<F>(cond: bool, _f: F) -> Result<(), Diagnostic>
where
    F: FnOnce() -> Diagnostic,
{
    if !cond {
        panic!("Oops invariant failed");
    }
    Ok(())
}

type Diagnostic = ();
