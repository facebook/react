use bumpalo::collections::{String, Vec};
use forget_diagnostics::Diagnostic;
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

#[derive(Default, Debug)]
pub struct Blocks<'a> {
    data: IndexMap<BlockId, Option<Box<BasicBlock<'a>>>>,
}

impl<'a> Blocks<'a> {
    pub fn new() -> Self {
        Self {
            data: Default::default(),
        }
    }

    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            data: IndexMap::with_capacity(capacity),
        }
    }

    pub fn len(&self) -> usize {
        self.data.len()
    }

    pub fn insert(&mut self, block: Box<BasicBlock<'a>>) -> Option<Option<Box<BasicBlock<'a>>>> {
        self.data.insert(block.id, Some(block))
    }

    pub fn block_ids(&self) -> std::vec::Vec<BlockId> {
        self.data.keys().cloned().collect()
    }

    pub fn take(&mut self, id: BlockId) -> Box<BasicBlock<'a>> {
        self.data.remove(&id).unwrap().unwrap()
    }

    pub fn block(&self, id: BlockId) -> &BasicBlock<'a> {
        self.data.get(&id).unwrap().as_ref().unwrap()
    }

    pub fn block_mut(&mut self, id: BlockId) -> &mut BasicBlock<'a> {
        self.data.get_mut(&id).unwrap().as_mut().unwrap()
    }

    pub fn iter(&self) -> BlocksIter<'_, 'a> {
        BlocksIter::new(self.data.iter())
    }

    pub fn iter_mut(&mut self) -> BlocksIterMut<'_, 'a> {
        BlocksIterMut::new(self.data.iter_mut())
    }
}

pub struct BlocksIter<'b, 'a> {
    iter: indexmap::map::Iter<'b, BlockId, Option<Box<BasicBlock<'a>>>>,
}

impl<'b, 'a> BlocksIter<'b, 'a> {
    fn new(iter: indexmap::map::Iter<'b, BlockId, Option<Box<BasicBlock<'a>>>>) -> Self {
        Self { iter }
    }
}

impl<'b, 'a> Iterator for BlocksIter<'b, 'a> {
    type Item = &'b BasicBlock<'a>;

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.iter.size_hint()
    }

    fn next(&mut self) -> Option<Self::Item> {
        self.iter
            .next()
            .and_then(|(_, block)| block.as_ref())
            .map(|block| block.as_ref())
    }
}

pub struct BlocksIterMut<'b, 'a> {
    iter: indexmap::map::IterMut<'b, BlockId, Option<Box<BasicBlock<'a>>>>,
}

impl<'b, 'a> BlocksIterMut<'b, 'a> {
    fn new(iter: indexmap::map::IterMut<'b, BlockId, Option<Box<BasicBlock<'a>>>>) -> Self {
        Self { iter }
    }
}

impl<'b, 'a> Iterator for BlocksIterMut<'b, 'a> {
    type Item = &'b mut BasicBlock<'a>;

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.iter.size_hint()
    }

    fn next(&mut self) -> Option<Self::Item> {
        self.iter
            .next()
            .and_then(|(_, block)| block.as_mut())
            .map(|block| block.as_mut())
    }
}

pub struct BlockRewriter<'blocks, 'a> {
    blocks: &'blocks mut Blocks<'a>,
    current: BlockId,
}

impl<'blocks, 'a> BlockRewriter<'blocks, 'a> {
    pub fn new(blocks: &'blocks mut Blocks<'a>, entry: BlockId) -> Self {
        Self {
            blocks,
            current: entry,
        }
    }

    pub fn each_block<F>(&mut self, mut f: F) -> Result<(), Diagnostic>
    where
        F: FnMut(Box<BasicBlock<'a>>, &mut Self) -> Result<BlockRewriterAction<'a>, Diagnostic>,
    {
        let keys = self.blocks.block_ids();
        for block_id in keys {
            self.current = block_id;
            let block = self.blocks.data.get_mut(&block_id).unwrap().take().unwrap();
            match f(block, self)? {
                BlockRewriterAction::Keep(block) => {
                    self.blocks.data.insert(block_id, Some(block));
                }
                BlockRewriterAction::Remove => {
                    // nothing to do, already removed from the blocks
                }
            }
        }
        Ok(())
    }

    pub fn block(&self, block_id: BlockId) -> &BasicBlock<'a> {
        assert_ne!(block_id, self.current);
        self.blocks.block(block_id)
    }

    pub fn block_mut(&mut self, block_id: BlockId) -> &mut BasicBlock<'a> {
        assert_ne!(block_id, self.current);
        self.blocks.block_mut(block_id)
    }
}

pub enum BlockRewriterAction<'a> {
    Keep(Box<BasicBlock<'a>>),
    Remove,
}
