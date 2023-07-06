use indexmap::IndexMap;

use crate::{BasicBlock, BlockId};

/// Represents either a React function or a function expression
pub struct Function<'a> {
    pub body: HIR<'a>,
    pub is_async: bool,
    pub is_generator: bool,
}

/// Represents the body of a `Function` as a control-flow graph.
/// Blocks are stored in reverse postorder (predecessors before successors)
/// so that compiler passes can complete forward data flow analysis in a
/// single pass over the CFG in the case where there are no loops.
pub struct HIR<'a> {
    /// The id of the first block
    pub entry: BlockId,

    /// Blocks are stored in a map for easy retrieval by their id,
    /// but the blocks are in reverse postorder
    pub blocks: IndexMap<BlockId, BasicBlock<'a>>,
}
