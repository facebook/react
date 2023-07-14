use crate::instruction::Operand;
use crate::{BlockId, InstructionId};

/// Terminals represent statements or expressions that affect control flow,
/// such as for-of, if-else, return, logical (??), ternaries (?:), etc.
#[derive(Debug)]
pub struct Terminal<'a> {
    pub id: InstructionId,
    pub value: TerminalValue<'a>,
}

#[derive(Debug)]
pub enum TerminalValue<'a> {
    Branch(BranchTerminal),
    DoWhile(DoWhileTerminal),
    // ForOf(ForOfTerminal),
    For(ForTerminal),
    Goto(GotoTerminal),
    If(IfTerminal),
    // Label(LabelTerminal),
    // Logical(LogicalTerminal),
    // Optional(OptionalTerminal),
    Return(ReturnTerminal),
    // Sequence(SequenceTerminal),
    // Switch(SwitchTerminal),
    // Ternary(TernaryTerminal),
    // Throw(ThrowTerminal),
    Unsupported(UnsupportedTerminal<'a>),
    // While(WhileTerminal),
}

impl<'a> TerminalValue<'a> {
    pub fn map_optional_fallthroughs<F>(&mut self, f: F) -> ()
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
            Self::Return(_) => {
                vec![]
            }
            Self::Unsupported(_) => panic!("Unexpected unsupported terminal"),
        }
    }
}

#[derive(Debug)]
pub struct UnsupportedTerminal<'a> {
    phantom: std::marker::PhantomData<&'a ()>,
}

#[derive(Debug)]
pub struct BranchTerminal {
    pub test: Operand,
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
    pub test: Operand,
    pub consequent: BlockId,
    pub alternate: BlockId,
    pub fallthrough: Option<BlockId>,
}

#[derive(Debug)]
pub struct ReturnTerminal {
    pub value: Operand,
}

#[derive(Debug)]
pub struct ForTerminal {
    pub init: BlockId,
    pub test: BlockId,
    pub update: Option<BlockId>,
    pub body: BlockId,
    pub fallthrough: BlockId,
}
