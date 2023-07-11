use std::cell::Cell;

use bumpalo::{boxed::Box, collections::Vec};
use indexmap::IndexMap;

use crate::{BasicBlock, BlockId, Instruction};

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
    pub blocks: IndexMap<BlockId, Box<'a, BasicBlock<'a>>>,

    /// All instructions for the block. This may contain unused items,
    pub instructions: Vec<'a, Instruction<'a>>,
}

impl<'a> HIR<'a> {
    pub fn block(&self, id: BlockId) -> &BasicBlock<'a> {
        self.blocks.get(&id).unwrap()
    }

    pub fn block_mut(&mut self, id: BlockId) -> &mut BasicBlock<'a> {
        self.blocks.get_mut(&id).unwrap()
    }
}
