/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::cell::RefCell;
use std::rc::Rc;

use react_diagnostics::Diagnostic;
use react_hir::{
    initialize_hir, BasicBlock, BlockId, BlockKind, Blocks, Environment, GotoKind, IdentifierData,
    IdentifierOperand, InstrIx, Instruction, InstructionIdGenerator, InstructionValue, Terminal,
    TerminalValue, Type, HIR,
};

use crate::BuildHIRError;

/// Helper struct used when converting from ESTree to HIR. Includes:
/// - Variable resolution
/// - Label resolution (for labeled statements and break/continue)
/// - Access to the environment
///
/// As well as representing the incomplete form of the HIR. Usage
/// generally involves driving calls to enter/exit blocks, resolve
/// labels and variables, and then calling `build()` when the HIR
/// is complete.
pub(crate) struct Builder<'e> {
    #[allow(dead_code)]
    environment: &'e Environment,

    completed: Blocks,

    instructions: Vec<Instruction>,

    entry: BlockId,

    wip: WipBlock,

    id_gen: InstructionIdGenerator,

    scopes: Vec<ControlFlowScope>,
}

pub(crate) struct WipBlock {
    pub id: BlockId,
    pub kind: BlockKind,
    pub instructions: Vec<InstrIx>,
}

#[derive(Clone, PartialEq, Eq, Debug)]
enum ControlFlowScope {
    Loop(LoopScope),

    // Switch(SwitchScope),
    #[allow(dead_code)]
    Label(LabelScope),
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub(crate) struct LoopScope {
    pub label: Option<String>,
    pub continue_block: BlockId,
    pub break_block: BlockId,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub(crate) struct LabelScope {
    pub label: String,
    pub block: BlockId,
}

impl ControlFlowScope {
    fn label(&self) -> Option<&String> {
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

impl<'e> Builder<'e> {
    pub(crate) fn new(environment: &'e Environment) -> Self {
        let entry = environment.next_block_id();
        let current = WipBlock {
            id: entry,
            kind: BlockKind::Block,
            instructions: Default::default(),
        };
        Self {
            environment,
            completed: Default::default(),
            instructions: Default::default(),
            entry,
            wip: current,
            id_gen: InstructionIdGenerator::new(),
            scopes: Default::default(),
        }
    }

    /// Completes the builder and returns the HIR if it was valid,
    /// or a Diagnostic if a validation error occured.
    ///
    /// TODO: refine the type, only invariants should be possible here,
    /// not other types of errors
    pub(crate) fn build(self) -> Result<HIR, Diagnostic> {
        let mut hir = HIR {
            entry: self.entry,
            blocks: self.completed,
            instructions: self.instructions,
        };
        // Run all the initialization passes
        initialize_hir(&mut hir)?;
        Ok(hir)
    }

    /// Adds a new instruction to the end of the work in progress block
    pub(crate) fn push(&mut self, value: InstructionValue) -> IdentifierOperand {
        let lvalue = IdentifierOperand {
            identifier: self.environment.new_temporary(),
            effect: None,
        };
        let instr = Instruction {
            id: self.id_gen.next(),
            lvalue: lvalue.clone(),
            value,
        };
        let ix = InstrIx::new(self.instructions.len() as u32);
        self.instructions.push(instr);
        self.wip.instructions.push(ix);
        lvalue
    }

    /// Terminates the work in progress block with the given terminal, and starts a new
    /// work in progress block with the given kind
    pub(crate) fn terminate(&mut self, terminal: TerminalValue, next_kind: BlockKind) {
        let next_wip = WipBlock {
            id: self.environment.next_block_id(),
            kind: next_kind,
            instructions: Default::default(),
        };
        self.terminate_with_fallthrough(terminal, next_wip)
    }

    pub(crate) fn terminate_with_fallthrough(
        &mut self,
        terminal: TerminalValue,
        fallthrough: WipBlock,
    ) {
        let prev_wip = std::mem::replace(&mut self.wip, fallthrough);
        self.completed.insert(Box::new(BasicBlock {
            id: prev_wip.id,
            kind: prev_wip.kind,
            instructions: prev_wip.instructions,
            terminal: Terminal {
                id: self.id_gen.next(),
                value: terminal,
            },
            predecessors: Default::default(),
            phis: Default::default(),
        }));
    }

    pub(crate) fn reserve(&mut self, kind: BlockKind) -> WipBlock {
        WipBlock {
            id: self.environment.next_block_id(),
            kind,
            instructions: Default::default(),
        }
    }

    pub(crate) fn enter<F>(&mut self, kind: BlockKind, f: F) -> Result<BlockId, Diagnostic>
    where
        F: FnOnce(&mut Self) -> Result<TerminalValue, Diagnostic>,
    {
        let wip = self.reserve(kind);
        let id = wip.id;
        self.enter_reserved(wip, f)?;
        Ok(id)
    }

    fn enter_reserved<F>(&mut self, wip: WipBlock, f: F) -> Result<(), Diagnostic>
    where
        F: FnOnce(&mut Self) -> Result<TerminalValue, Diagnostic>,
    {
        let current = std::mem::replace(&mut self.wip, wip);

        let (result, terminal) = match f(self) {
            Ok(terminal) => (Ok(()), terminal),
            Err(error) => (
                Err(error),
                // TODO: add a `Terminal::Error` variant
                TerminalValue::Goto(react_hir::GotoTerminal {
                    block: current.id,
                    kind: GotoKind::Break,
                }),
            ),
        };

        let completed = std::mem::replace(&mut self.wip, current);
        self.completed.insert(Box::new(BasicBlock {
            id: completed.id,
            kind: completed.kind,
            instructions: completed.instructions,
            terminal: Terminal {
                id: self.id_gen.next(),
                value: terminal,
            },
            predecessors: Default::default(),
            phis: Default::default(),
        }));
        result
    }

    pub(crate) fn enter_loop<F>(
        &mut self,
        scope: LoopScope,
        f: F,
    ) -> Result<TerminalValue, Diagnostic>
    where
        F: FnOnce(&mut Self) -> Result<TerminalValue, Diagnostic>,
    {
        self.scopes.push(ControlFlowScope::Loop(scope.clone()));
        let terminal = f(self);
        let last = self.scopes.pop().unwrap();
        assert_eq!(last, ControlFlowScope::Loop(scope));
        terminal
    }

    /// Returns a new temporary identifier
    /// This may be necessary for destructuring with default values. there
    /// we synthesize a temporary identifier to store the possibly-missing value
    /// into, and emit a later StoreLocal for the original identifier
    #[allow(dead_code)]
    pub(crate) fn make_temporary(&self) -> react_hir::Identifier {
        react_hir::Identifier {
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
        label: Option<&react_estree::Identifier>,
    ) -> Result<BlockId, Diagnostic> {
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
        Err(Diagnostic::invalid_syntax(
            BuildHIRError::UnresolvedBreakTarget,
            None,
        ))
    }

    /// Resolves the target for the given continue label (if present), or returns the default
    /// continue target given the current context. Returns a diagnostic if the label is
    /// provided but cannot be resolved.
    pub(crate) fn resolve_continue(
        &self,
        label: Option<&react_estree::Identifier>,
    ) -> Result<BlockId, Diagnostic> {
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
                            return Err(Diagnostic::invalid_syntax(
                                BuildHIRError::ContinueTargetIsNotALoop,
                                None,
                            ));
                        }
                        _ => continue,
                    }
                }
            }
        }
        Err(Diagnostic::invalid_syntax(
            BuildHIRError::UnresolvedContinueTarget,
            None,
        ))
    }
}
