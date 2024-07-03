/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use crate::instruction::IdentifierOperand;
use crate::{BlockId, InstructionId};

/// Terminals represent statements or expressions that affect control flow,
/// such as for-of, if-else, return, logical (??), ternaries (?:), etc.
#[derive(Debug)]
pub struct Terminal {
    pub id: InstructionId,
    pub value: TerminalValue,
}

#[derive(Debug)]
pub enum TerminalValue {
    Branch(BranchTerminal),
    DoWhile(DoWhileTerminal),
    // ForOf(ForOfTerminal),
    For(ForTerminal),
    Goto(GotoTerminal),
    If(IfTerminal),
    Label(LabelTerminal),
    // Logical(LogicalTerminal),
    // Optional(OptionalTerminal),
    Return(ReturnTerminal),
    // Sequence(SequenceTerminal),
    // Switch(SwitchTerminal),
    // Ternary(TernaryTerminal),
    // Throw(ThrowTerminal),
    Unsupported(UnsupportedTerminal),
    // While(WhileTerminal),
}

impl TerminalValue {
    pub fn map_optional_fallthroughs<F>(&mut self, f: F)
    where
        F: Fn(BlockId) -> Option<BlockId>,
    {
        match self {
            Self::If(terminal) => {
                terminal.fallthrough = match terminal.fallthrough {
                    Some(fallthrough) => f(fallthrough),
                    _ => None,
                }
            }
            Self::Label(terminal) => {
                terminal.fallthrough = match terminal.fallthrough {
                    Some(fallthrough) => f(fallthrough),
                    _ => None,
                }
            }
            Self::DoWhile(DoWhileTerminal { fallthrough, .. })
            | Self::For(ForTerminal { fallthrough, .. }) => {
                // statically detect if fallthrough is changed to Option so
                // that we can update to map the fallthrough w f()
                let _: BlockId = *fallthrough;
            }
            Self::Branch(_) | Self::Goto(_) | Self::Return(_) => {}
            Self::Unsupported(_) => panic!("Unexpected unsupported terminal"),
        }
    }

    pub fn successors(&self) -> Vec<BlockId> {
        match self {
            Self::If(terminal) => {
                vec![terminal.consequent, terminal.alternate]
            }
            Self::Branch(terminal) => {
                vec![terminal.consequent, terminal.alternate]
            }
            Self::For(terminal) => {
                vec![terminal.init]
            }
            Self::DoWhile(terminal) => {
                vec![terminal.body]
            }
            Self::Goto(terminal) => {
                vec![terminal.block]
            }
            Self::Label(terminal) => {
                vec![terminal.block]
            }
            Self::Return(_) => {
                vec![]
            }
            Self::Unsupported(_) => panic!("Unexpected unsupported terminal"),
        }
    }

    pub fn each_operand<F>(&mut self, mut f: F)
    where
        F: FnMut(&mut IdentifierOperand),
    {
        match self {
            TerminalValue::Branch(terminal) => f(&mut terminal.test),
            TerminalValue::If(terminal) => f(&mut terminal.test),
            TerminalValue::Return(terminal) => f(&mut terminal.value),
            TerminalValue::DoWhile(_)
            | TerminalValue::For(_)
            | TerminalValue::Label(_)
            | TerminalValue::Goto(_)
            | TerminalValue::Unsupported(_) => {}
        }
    }
}

#[derive(Debug)]
pub struct UnsupportedTerminal {}

#[derive(Debug)]
pub struct BranchTerminal {
    pub test: IdentifierOperand,
    pub consequent: BlockId,
    pub alternate: BlockId,
}

#[derive(Debug)]
pub struct GotoTerminal {
    pub block: BlockId,
    pub kind: GotoKind,
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
pub enum GotoKind {
    Break,
    Continue,
}

#[derive(Debug)]
pub struct DoWhileTerminal {
    pub body: BlockId,
    pub test: BlockId,
    pub fallthrough: BlockId,
}

#[derive(Debug)]
pub struct IfTerminal {
    pub test: IdentifierOperand,
    pub consequent: BlockId,
    pub alternate: BlockId,
    pub fallthrough: Option<BlockId>,
}

#[derive(Debug)]
pub struct ReturnTerminal {
    pub value: IdentifierOperand,
}

#[derive(Debug)]
pub struct ForTerminal {
    pub init: BlockId,
    pub test: BlockId,
    pub update: Option<BlockId>,
    pub body: BlockId,
    pub fallthrough: BlockId,
}

#[derive(Debug)]
pub struct LabelTerminal {
    pub block: BlockId,
    pub fallthrough: Option<BlockId>,
}
