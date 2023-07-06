use bumpalo::collections::Vec;
use std::{cell::RefCell, collections::HashSet, rc::Rc};

use hir::{
    BasicBlock, BlockId, BlockKind, Environment, GotoKind, Identifier, IdentifierData, Instruction,
    InstructionIdGenerator, InstructionValue, Place, Terminal, TerminalValue, Type, HIR,
};
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
pub(crate) struct Builder<'a> {
    #[allow(dead_code)]
    environment: &'a Environment<'a>,

    completed: IndexMap<BlockId, BasicBlock<'a>>,

    entry: BlockId,

    wip: WipBlock<'a>,

    id_gen: InstructionIdGenerator,
}

pub(crate) struct WipBlock<'a> {
    pub id: BlockId,
    pub kind: BlockKind,
    pub instructions: Vec<'a, Instruction<'a>>,
}

impl<'a> Builder<'a> {
    pub(crate) fn new(environment: &'a Environment<'a>) -> Self {
        let entry = environment.next_block_id();
        let current = WipBlock {
            id: entry,
            kind: BlockKind::Block,
            instructions: Vec::new_in(&environment.allocator),
        };
        Self {
            environment,
            completed: Default::default(),
            entry,
            wip: current,
            id_gen: InstructionIdGenerator::new(),
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

    /// Adds a new instruction to the end of the work in progress block
    pub(crate) fn push(&mut self, lvalue: Place<'a>, value: InstructionValue<'a>) {
        let instr = Instruction {
            id: self.id_gen.next(),
            lvalue,
            value,
        };
        self.wip.instructions.push(instr);
    }

    /// Terminates the work in progress block with the given terminal, and starts a new
    /// work in progress block with the given kind
    pub(crate) fn terminate(&mut self, terminal: TerminalValue<'a>, next_kind: BlockKind) {
        let next_wip = WipBlock {
            id: self.environment.next_block_id(),
            kind: next_kind,
            instructions: Vec::new_in(&self.environment.allocator),
        };
        self.terminate_with_fallthrough(terminal, next_wip)
    }

    pub(crate) fn terminate_with_fallthrough(
        &mut self,
        terminal: TerminalValue<'a>,
        fallthrough: WipBlock<'a>,
    ) {
        let prev_wip = std::mem::replace(&mut self.wip, fallthrough);
        self.completed.insert(
            prev_wip.id,
            BasicBlock {
                id: prev_wip.id,
                kind: prev_wip.kind,
                instructions: prev_wip.instructions,
                terminal: Terminal {
                    id: self.id_gen.next(),
                    value: terminal,
                },
                predecessors: Default::default(),
            },
        );
    }

    pub(crate) fn reserve(&mut self, kind: BlockKind) -> WipBlock<'a> {
        WipBlock {
            id: self.environment.next_block_id(),
            kind,
            instructions: Vec::new_in(&self.environment.allocator),
        }
    }

    pub(crate) fn enter<F>(&mut self, kind: BlockKind, f: F) -> BlockId
    where
        F: FnOnce(&mut Self) -> TerminalValue<'a>,
    {
        let wip = self.reserve(kind);
        let id = wip.id;
        self.enter_reserved(wip, f);
        id
    }

    fn enter_reserved<F>(&mut self, wip: WipBlock<'a>, f: F)
    where
        F: FnOnce(&mut Self) -> TerminalValue<'a>,
    {
        let current = std::mem::replace(&mut self.wip, wip);
        let terminal = f(self);
        let completed = std::mem::replace(&mut self.wip, current);
        self.completed.insert(
            completed.id,
            BasicBlock {
                id: completed.id,
                kind: completed.kind,
                instructions: completed.instructions,
                terminal: Terminal {
                    id: self.id_gen.next(),
                    value: terminal,
                },
                predecessors: Default::default(),
            },
        );
    }

    /// Returns a new temporary identifier
    pub(crate) fn make_temporary(&self) -> hir::Identifier<'a> {
        hir::Identifier {
            id: self.environment.next_identifier_id(),
            name: None,
            data: Rc::new(RefCell::new(IdentifierData {
                mutable_range: Default::default(),
                scope: None,
                type_: Type::Var(self.environment.next_type_var_id()),
            })),
        }
    }

    /// Resolves the target for the given break label (if present), or returns the default
    /// break target given the current context. Returns a diagnostic if the label is
    /// provided but cannot be resolved.
    pub(crate) fn resolve_break(
        &self,
        _label: Option<&estree::Identifier>,
    ) -> Result<BlockId, Diagnostic> {
        todo!()
    }

    /// Resolves the target for the given continue label (if present), or returns the default
    /// continue target given the current context. Returns a diagnostic if the label is
    /// provided but cannot be resolved.
    pub(crate) fn resolve_continue(
        &self,
        _label: Option<&estree::Identifier>,
    ) -> Result<BlockId, Diagnostic> {
        todo!()
    }

    pub(crate) fn resolve_binding(
        &mut self,
        identifier: &estree::Identifier,
    ) -> Option<Binding<'a>> {
        identifier.binding.as_ref().map(|binding| match binding {
            estree::Binding::Global => Binding::Global,
            estree::Binding::Local(id) => Binding::Local(
                self.environment
                    .resolve_binding_identifier(&identifier.name, *id),
            ),
            estree::Binding::Module(id) => Binding::Module(
                self.environment
                    .resolve_binding_identifier(&identifier.name, *id),
            ),
        })
    }
}

pub(crate) enum Binding<'a> {
    Local(Identifier<'a>),
    Module(Identifier<'a>),
    Global,
}

/// Modifies the HIR to put the blocks in reverse postorder, with predecessors before
/// successors (except for the case of loops)
fn reverse_postorder_blocks<'a>(hir: &mut HIR<'a>) {
    let mut visited = HashSet::<BlockId>::with_capacity(hir.blocks.len());
    let mut postorder = std::vec::Vec::<BlockId>::with_capacity(hir.blocks.len());
    fn visit<'a>(
        block_id: BlockId,
        hir: &HIR<'a>,
        visited: &mut HashSet<BlockId>,
        postorder: &mut std::vec::Vec<BlockId>,
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
        postorder.push(block_id);
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
            invariant(visited.insert((block_ix, instr_ix)), || {
                format!("Expected bb{block_ix} i{instr_ix} not to have been visited yet")
            })?;
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

fn invariant<F>(cond: bool, f: F) -> Result<(), Diagnostic>
where
    F: FnOnce() -> String,
{
    if !cond {
        let msg = f();
        panic!("Invariant: {msg}");
    }
    Ok(())
}

type Diagnostic = ();
