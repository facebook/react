use bumpalo::collections::{String, Vec};
use std::{cell::RefCell, collections::HashSet, rc::Rc};

use hir::{
    BasicBlock, BlockId, BlockKind, Environment, GotoKind, Identifier, IdentifierData, Instruction,
    InstructionIdGenerator, InstructionValue, Place, Terminal, TerminalValue, Type, HIR,
};
use indexmap::IndexMap;

use crate::{invariant, BuildDiagnostic, DiagnosticError, ErrorSeverity};

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

    scopes: Vec<'a, ControlFlowScope<'a>>,
}

pub(crate) struct WipBlock<'a> {
    pub id: BlockId,
    pub kind: BlockKind,
    pub instructions: Vec<'a, Instruction<'a>>,
}

pub(crate) enum Binding<'a> {
    Local(Identifier<'a>),
    Module(Identifier<'a>),
    Global,
}

#[derive(Clone, PartialEq, Eq, Debug)]
enum ControlFlowScope<'a> {
    Loop(LoopScope<'a>),

    // Switch(SwitchScope<'a>),
    #[allow(dead_code)]
    Label(LabelScope<'a>),
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub(crate) struct LoopScope<'a> {
    pub label: Option<String<'a>>,
    pub continue_block: BlockId,
    pub break_block: BlockId,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub(crate) struct LabelScope<'a> {
    pub label: String<'a>,
    pub block: BlockId,
}

impl<'a> ControlFlowScope<'a> {
    fn label(&self) -> Option<&String<'a>> {
        match self {
            Self::Loop(scope) => scope.label.as_ref(),
            Self::Label(scope) => Some(&scope.label),
        }
    }

    fn break_block(&self) -> BlockId {
        match self {
            Self::Loop(scope) => scope.break_block,
            Self::Label(scope) => scope.block,
        }
    }
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
            scopes: Vec::new_in(&environment.allocator),
        }
    }

    /// Completes the builder and returns the HIR if it was valid,
    /// or a Diagnostic if a validation error occured.
    ///
    /// TODO: refine the type, only invariants should be possible here,
    /// not other types of errors
    pub(crate) fn build(self) -> Result<HIR<'a>, BuildDiagnostic> {
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

    pub(crate) fn enter<F>(&mut self, kind: BlockKind, f: F) -> Result<BlockId, BuildDiagnostic>
    where
        F: FnOnce(&mut Self) -> Result<TerminalValue<'a>, BuildDiagnostic>,
    {
        let wip = self.reserve(kind);
        let id = wip.id;
        self.enter_reserved(wip, f)?;
        Ok(id)
    }

    fn enter_reserved<F>(&mut self, wip: WipBlock<'a>, f: F) -> Result<(), BuildDiagnostic>
    where
        F: FnOnce(&mut Self) -> Result<TerminalValue<'a>, BuildDiagnostic>,
    {
        let current = std::mem::replace(&mut self.wip, wip);

        let (result, terminal) = match f(self) {
            Ok(terminal) => (Ok(()), terminal),
            Err(error) => (
                Err(error),
                // TODO: add a `Terminal::Error` variant
                TerminalValue::Goto(hir::GotoTerminal {
                    block: current.id,
                    kind: GotoKind::Break,
                }),
            ),
        };

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
        result
    }

    pub(crate) fn enter_loop<F>(
        &mut self,
        scope: LoopScope<'a>,
        f: F,
    ) -> Result<TerminalValue<'a>, BuildDiagnostic>
    where
        F: FnOnce(&mut Self) -> Result<TerminalValue<'a>, BuildDiagnostic>,
    {
        self.scopes.push(ControlFlowScope::Loop(scope.clone()));
        let terminal = f(self);
        let last = self.scopes.pop().unwrap();
        assert_eq!(last, ControlFlowScope::Loop(scope));
        terminal
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
        label: Option<&estree::Identifier>,
    ) -> Result<BlockId, BuildDiagnostic> {
        for scope in self.scopes.iter().rev() {
            match (label, scope.label()) {
                // If this is an unlabeled break, return the most recent break target
                (None, _) => return Ok(scope.break_block()),
                // If the break is labeled and matches the current scope, return its break target
                (Some(label), Some(scope_label)) if &label.name == scope_label => {
                    return Ok(scope.break_block());
                }
                // Otherwise keep searching
                _ => continue,
            }
        }
        Err(BuildDiagnostic::new(
            DiagnosticError::UnresolvedBreakTarget,
            ErrorSeverity::InvalidSyntax,
            None,
        ))
    }

    /// Resolves the target for the given continue label (if present), or returns the default
    /// continue target given the current context. Returns a diagnostic if the label is
    /// provided but cannot be resolved.
    pub(crate) fn resolve_continue(
        &self,
        label: Option<&estree::Identifier>,
    ) -> Result<BlockId, BuildDiagnostic> {
        for scope in self.scopes.iter().rev() {
            match scope {
                ControlFlowScope::Loop(scope) => {
                    match (label, &scope.label) {
                        // If this is an unlabeled continue, return the first matching loop
                        (None, _) => return Ok(scope.continue_block),
                        // If the continue is labeled and matches the current scope, return its continue target
                        (Some(label), Some(scope_label))
                            if label.name.as_str() == scope_label.as_str() =>
                        {
                            return Ok(scope.continue_block);
                        }
                        // Otherwise keep searching
                        _ => continue,
                    }
                }
                _ => {
                    match (label, scope.label()) {
                        (Some(label), Some(scope_label)) if label.name.as_str() == scope_label => {
                            // Error, the continue referred to a label that is not a loop
                            return Err(BuildDiagnostic::new(
                                DiagnosticError::ContinueTargetIsNotALoop,
                                ErrorSeverity::InvalidSyntax,
                                None,
                            ));
                        }
                        _ => continue,
                    }
                }
            }
        }
        Err(BuildDiagnostic::new(
            DiagnosticError::UnresolvedContinueTarget,
            ErrorSeverity::InvalidSyntax,
            None,
        ))
    }

    pub(crate) fn resolve_binding(
        &mut self,
        identifier: &estree::Identifier,
    ) -> Result<Binding<'a>, BuildDiagnostic> {
        match &identifier.binding {
            Some(binding) => Ok(match binding {
                estree::Binding::Global => Binding::Global,
                estree::Binding::Local(id) => Binding::Local(
                    self.environment
                        .resolve_binding_identifier(&identifier.name, *id),
                ),
                estree::Binding::Module(id) => Binding::Module(
                    self.environment
                        .resolve_binding_identifier(&identifier.name, *id),
                ),
            }),
            _ => Err(BuildDiagnostic::new(
                DiagnosticError::UnknownIdentifier,
                ErrorSeverity::Invariant,
                identifier.range.clone(),
            )),
        }
    }
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
            TerminalValue::Return(..) => { /* no-op */ }
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
        if let TerminalValue::For(terminal) = &mut block.terminal.value {
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
        if let TerminalValue::DoWhile(terminal) = &mut block.terminal.value {
            if !block_ids.contains(&terminal.test) {
                block.terminal.value = TerminalValue::Goto(hir::GotoTerminal {
                    block: terminal.body,
                    kind: GotoKind::Break,
                });
            }
        }
    }
}

/// Updates the instruction ids for all instructions and blocks
/// Relies on the blocks being in reverse postorder to ensure that id ordering is correct
fn mark_instruction_ids<'a>(hir: &mut HIR<'a>) -> Result<(), BuildDiagnostic> {
    let mut id_gen = InstructionIdGenerator::new();
    let mut visited = HashSet::<(usize, usize)>::new();
    for (block_ix, block) in hir.blocks.values_mut().enumerate() {
        for (instr_ix, instr) in block.instructions.iter_mut().enumerate() {
            invariant(visited.insert((block_ix, instr_ix)), || {
                BuildDiagnostic::new(
                    DiagnosticError::BlockVisitedTwice { block: block.id },
                    ErrorSeverity::Invariant,
                    None,
                )
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
