use std::collections::HashSet;

use crate::{id_types::BlockId, Instruction, Terminal};

/// Represents a sequence of instructions that will always[1] execute
/// consecutively. Concretely, a block may have zero or more instructions
/// and ends with a terminal node that describes where control flow may
/// continue.
///
/// [1] Assuming no exceptions are thrown.
pub struct BasicBlock<'a> {
    /// The identifier for the block
    pub id: BlockId,

    /// What kind of block this is. Used to distinguish basic blocks that
    /// correspond to a block scope in the input from basic blocks that
    /// represent control flow within statements or expressions, such as
    /// loops, logicals, ternaries, optionals, or sequences.
    pub kind: BlockKind,

    /// The ordered instructions in this block
    pub instructions: bumpalo::collections::Vec<'a, Instruction<'a>>,

    /// The terminal instruction for the block
    pub terminal: Terminal<'a>,

    /// The immediate predecessors of this block
    pub predecessors: HashSet<BlockId>,
}

pub enum BlockKind {
    Block,
    Value,
    Loop,
    Sequence,
}
