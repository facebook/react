use bumpalo::collections::{String, Vec};
use forget_diagnostics::Diagnostic;
use indexmap::IndexMap;

use crate::{BasicBlock, BlockId, FunctionExpression, IdentifierOperand, InstrIx, Instruction};

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

impl<'a> HIR<'a> {
    pub fn inline(&mut self, other: FunctionExpression<'a>) -> () {
        let offset = self.instructions.len();
        for mut instr in other.lowered_function.body.instructions.into_iter() {
            instr.each_operand(|operand| {
                operand.ix = InstrIx::new((offset + usize::from(operand.ix)) as u32);
            });
            self.instructions.push(instr);
        }
        for mut block in other.lowered_function.body.blocks.into_iter() {
            for ix in block.instructions.iter_mut() {
                *ix = InstrIx::new((offset + usize::from(*ix)) as u32);
            }
            block.terminal.value.each_operand(|operand| {
                operand.ix = InstrIx::new((offset + usize::from(operand.ix)) as u32);
            });
            self.blocks.insert(block);
        }
    }
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

    pub fn remove(&mut self, id: BlockId) -> Box<BasicBlock<'a>> {
        self.data.remove(&id).unwrap().unwrap()
    }

    pub fn extend(&mut self, other: Self) {
        self.data.extend(other.data);
    }

    pub fn into_iter(self) -> BlocksIntoIter<'a> {
        BlocksIntoIter::new(self.data.into_iter())
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
pub struct BlocksIntoIter<'a> {
    iter: indexmap::map::IntoIter<BlockId, Option<Box<BasicBlock<'a>>>>,
}

impl<'a> BlocksIntoIter<'a> {
    fn new(iter: indexmap::map::IntoIter<BlockId, Option<Box<BasicBlock<'a>>>>) -> Self {
        Self { iter }
    }
}

impl<'a> Iterator for BlocksIntoIter<'a> {
    type Item = Box<BasicBlock<'a>>;

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.iter.size_hint()
    }

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            match self.iter.next() {
                Some((_, Some(next))) => return Some(next),
                Some((_, None)) => continue,
                None => return None,
            }
        }
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
    new_blocks: std::vec::Vec<Box<BasicBlock<'a>>>,
}

impl<'blocks, 'a> BlockRewriter<'blocks, 'a> {
    pub fn new(blocks: &'blocks mut Blocks<'a>, entry: BlockId) -> Self {
        Self {
            blocks,
            current: entry,
            new_blocks: Default::default(),
        }
    }

    pub fn each_block<F>(&mut self, mut f: F) -> ()
    where
        F: FnMut(Box<BasicBlock<'a>>, &mut Self) -> BlockRewriterAction<'a>,
    {
        let mut keys = self.blocks.block_ids();
        loop {
            for block_id in keys {
                self.current = block_id;
                let block = self.blocks.data.get_mut(&block_id).unwrap().take().unwrap();
                match f(block, self) {
                    BlockRewriterAction::Keep(block) => {
                        self.blocks.data.insert(block_id, Some(block));
                    }
                    BlockRewriterAction::Remove => {
                        self.blocks.data.remove(&block_id);
                    }
                }
            }
            if !self.new_blocks.is_empty() {
                keys = self.new_blocks.iter().map(|block| block.id).collect();
                for block in self.new_blocks.drain(..) {
                    self.blocks.insert(block);
                }
                continue;
            } else {
                break;
            }
        }
    }

    pub fn try_each_block<F>(&mut self, mut f: F) -> Result<(), Diagnostic>
    where
        F: FnMut(Box<BasicBlock<'a>>, &mut Self) -> Result<BlockRewriterAction<'a>, Diagnostic>,
    {
        let mut keys = self.blocks.block_ids();
        loop {
            for block_id in keys {
                self.current = block_id;
                let block = self.blocks.data.get_mut(&block_id).unwrap().take().unwrap();
                match f(block, self)? {
                    BlockRewriterAction::Keep(block) => {
                        self.blocks.data.insert(block_id, Some(block));
                    }
                    BlockRewriterAction::Remove => {
                        self.blocks.data.remove(&block_id);
                    }
                }
            }
            if !self.new_blocks.is_empty() {
                keys = self.new_blocks.iter().map(|block| block.id).collect();
                for block in self.new_blocks.drain(..) {
                    self.blocks.insert(block);
                }
                continue;
            } else {
                break;
            }
        }
        Ok(())
    }

    pub fn contains(&self, block_id: BlockId) -> bool {
        assert_ne!(block_id, self.current);
        self.blocks.data.contains_key(&block_id)
    }

    pub fn block(&self, block_id: BlockId) -> &BasicBlock<'a> {
        assert_ne!(block_id, self.current);
        self.blocks.block(block_id)
    }

    pub fn block_mut(&mut self, block_id: BlockId) -> &mut BasicBlock<'a> {
        assert_ne!(block_id, self.current);
        self.blocks.block_mut(block_id)
    }

    pub fn add_block(&mut self, block: Box<BasicBlock<'a>>) {
        self.new_blocks.push(block);
    }
}

pub enum BlockRewriterAction<'a> {
    Keep(Box<BasicBlock<'a>>),
    Remove,
}
