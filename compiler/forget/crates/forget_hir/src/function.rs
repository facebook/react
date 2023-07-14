use bumpalo::boxed::Box;
use bumpalo::collections::{String, Vec};
use indexmap::IndexMap;

use crate::{BasicBlock, BlockId, IdentifierOperand, Instruction};

/// Represents either a React function or a function expression
#[derive(Debug)]
pub struct Function<'a> {
    pub id: Option<String<'a>>,
    pub body: HIR<'a>,
    pub params: Vec<'a, IdentifierOperand<'a>>,
    pub context: Vec<'a, IdentifierOperand<'a>>,
    pub is_async: bool,
    pub is_generator: bool,
}

/// Represents the body of a `Function` as a control-flow graph.
/// Blocks are stored in reverse postorder (predecessors before successors)
/// so that compiler passes can complete forward data flow analysis in a
/// single pass over the CFG in the case where there are no loops.
#[derive(Debug)]
pub struct HIR<'a> {
    /// The id of the first block
    pub entry: BlockId,

    /// Blocks are stored in a map for easy retrieval by their id,
    /// but the blocks are in reverse postorder
    pub blocks: Blocks<'a>,

    /// All instructions for the block. This may contain unused items,
    pub instructions: Vec<'a, Instruction<'a>>,
}

pub type Blocks<'a> = IndexMap<BlockId, Box<'a, BasicBlock<'a>>>;

impl<'a> HIR<'a> {
    pub fn block(&self, id: BlockId) -> &BasicBlock<'a> {
        self.blocks.get(&id).unwrap()
    }

    pub fn block_mut(&mut self, id: BlockId) -> &mut BasicBlock<'a> {
        self.blocks.get_mut(&id).unwrap()
    }
}
