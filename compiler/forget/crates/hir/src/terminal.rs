use crate::{instruction::Place, BlockId, InstructionId};

/// Terminals represent statements or expressions that affect control flow,
/// such as for-of, if-else, return, logical (??), ternaries (?:), etc.
#[derive(Debug)]
pub struct Terminal<'a> {
    pub id: InstructionId,
    pub value: TerminalValue<'a>,
}

#[derive(Debug)]
pub enum TerminalValue<'a> {
    // BranchTerminal(BranchTerminal),
    DoWhileTerminal(DoWhileTerminal),
    // ForOfTerminal(ForOfTerminal),
    ForTerminal(ForTerminal),
    GotoTerminal(GotoTerminal),
    IfTerminal(IfTerminal<'a>),
    // LabelTerminal(LabelTerminal),
    // LogicalTerminal(LogicalTerminal),
    // OptionalTerminal(OptionalTerminal),
    ReturnTerminal(ReturnTerminal<'a>),
    // SequenceTerminal(SequenceTerminal),
    // SwitchTerminal(SwitchTerminal),
    // TernaryTerminal(TernaryTerminal),
    // ThrowTerminal(ThrowTerminal),
    // UnsupportedTerminal(UnsupportedTerminal),
    // WhileTerminal(WhileTerminal),
}

impl<'a> TerminalValue<'a> {
    pub fn map_optional_fallthroughs<F>(&mut self, f: F) -> ()
    where
        F: Fn(BlockId) -> Option<BlockId>,
    {
        match self {
            Self::IfTerminal(terminal) => {
                terminal.fallthrough = match terminal.fallthrough {
                    Some(fallthrough) => f(fallthrough),
                    _ => None,
                }
            }
            Self::DoWhileTerminal(DoWhileTerminal { fallthrough, .. })
            | Self::ForTerminal(ForTerminal { fallthrough, .. }) => {
                // statically detect if fallthrough is changed to Option so
                // that we can update to map the fallthrough w f()
                let _: BlockId = *fallthrough;
            }
            Self::GotoTerminal(_) | Self::ReturnTerminal(_) => {}
        }
    }

    pub fn successors(&self) -> Vec<BlockId> {
        match self {
            Self::IfTerminal(terminal) => {
                vec![terminal.consequent, terminal.alternate]
            }
            Self::ForTerminal(terminal) => {
                vec![terminal.init]
            }
            Self::DoWhileTerminal(terminal) => {
                vec![terminal.body]
            }
            Self::GotoTerminal(terminal) => {
                vec![terminal.block]
            }
            Self::ReturnTerminal(_) => {
                vec![]
            }
        }
    }
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
pub struct IfTerminal<'a> {
    pub test: Place<'a>,
    pub consequent: BlockId,
    pub alternate: BlockId,
    pub fallthrough: Option<BlockId>,
}

#[derive(Debug)]
pub struct ReturnTerminal<'a> {
    pub value: Place<'a>,
}

#[derive(Debug)]
pub struct ForTerminal {
    pub init: BlockId,
    pub test: BlockId,
    pub update: Option<BlockId>,
    pub body: BlockId,
    pub fallthrough: BlockId,
}
