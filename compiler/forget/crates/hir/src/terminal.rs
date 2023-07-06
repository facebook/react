use crate::{instruction::Place, BlockId, InstructionId};

/// Terminals represent statements or expressions that affect control flow,
/// such as for-of, if-else, return, logical (??), ternaries (?:), etc.
pub struct Terminal<'a> {
    pub id: InstructionId,
    pub value: TerminalValue<'a>,
}

pub enum TerminalValue<'a> {
    // BranchTerminal(BranchTerminal),
    // DoWhileTerminal(DoWhileTerminal),
    // ForOfTerminal(ForOfTerminal),
    // ForTerminal(ForTerminal),
    // GotoTerminal(GotoTerminal),
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

pub struct IfTerminal<'a> {
    pub test: Place<'a>,
    pub consequent: BlockId,
    pub alternate: BlockId,
    pub fallthrough: Option<BlockId>,
    pub id: InstructionId,
}

pub struct ReturnTerminal<'a> {
    pub value: Place<'a>,
    pub id: InstructionId,
}
